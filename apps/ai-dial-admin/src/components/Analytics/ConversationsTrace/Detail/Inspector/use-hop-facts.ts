'use client';

import { useEffect, useRef, useState } from 'react';

import { getConversationHopEmbedding, getConversationHopMcp } from '@/src/app/[lang]/conversations-trace/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import {
  ConversationSpanRow,
  HopEmbeddingFacts,
  HopMcpFacts,
  HopReadState,
  SessionScope,
} from '@/src/models/analytics/conversations-trace';
import { NO_CLAMP } from '@/src/utils/analytics/hop-inspector/envelope';

interface Params {
  scope: SessionScope;
  traceId: string;
  span: ConversationSpanRow | null;
  isEnabled: boolean;
}

// Every value a read is issued against is an argument, never a capture. A runner defined in the hook body and
// frozen with `useRef(async …).current` holds the *first* render's `scope` and `traceId` for the life of the
// component, while the held key is built from the current ones — so a scope change re-fired the effect and
// committed an answer read against the old scope under the new key, which is the exact confusion the key
// discipline exists to prevent. `use-hop-envelope.ts` passes both as arguments for the same reason.
type FactsRunner<T> = (
  scope: SessionScope,
  traceId: string,
  span: ConversationSpanRow,
  request: ReturnType<typeof useProtectedRequest>,
) => Promise<T>;

// Held per hop with the same key discipline as the envelope reads, so an answer for a hop the reader has left
// can never appear under the hop they moved to.
const useHeldFacts = <T>({ scope, traceId, span, isEnabled }: Params, run: FactsRunner<T>, onFailure: T) => {
  const [facts, setFacts] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const getReqRef = useRef(useProtectedRequest());
  const heldKeyRef = useRef<string | null>(null);

  const spanId = span && isEnabled ? span.core_span_id : null;
  const heldKey = spanId === null ? null : `${scope.id}:${traceId}:${spanId}`;

  useEffect(() => {
    if (heldKey === heldKeyRef.current) {
      return;
    }

    heldKeyRef.current = heldKey;

    if (span === null || spanId === null) {
      setFacts(null);
      setIsLoading(false);
      return;
    }

    setFacts(null);
    setIsLoading(true);

    const read = async () => {
      try {
        const value = await run(scope, traceId, span, getReqRef.current);

        if (heldKeyRef.current === heldKey) {
          setFacts(value);
        }
      } catch {
        if (heldKeyRef.current === heldKey) {
          setFacts(onFailure);
        }
      } finally {
        if (heldKeyRef.current === heldKey) {
          setIsLoading(false);
        }
      }
    };

    void read();
  }, [heldKey, scope, traceId, span, spanId, run, onFailure]);

  return { facts, isLoading };
};

const FAILED_MCP: HopMcpFacts = {
  state: HopReadState.LoadFailed,
  method: null,
  toolName: null,
  toolset: null,
  argumentsText: null,
  resultText: null,
  resultClamp: NO_CLAMP,
  argumentsState: HopReadState.LoadFailed,
  resultState: HopReadState.LoadFailed,
};

const FAILED_EMBEDDING: HopEmbeddingFacts = {
  state: HopReadState.LoadFailed,
  model: null,
  inputCount: null,
  dimensions: null,
  inputText: null,
  inputClamp: NO_CLAMP,
  isDimensionsWithheld: false,
};

// Module scope, so the runner is referentially stable without freezing anything render-scoped inside it.
const runMcp: FactsRunner<HopMcpFacts> = async (scope, traceId, span, request) => {
  const result = await request(
    getConversationHopMcp,
    scope,
    traceId,
    span.core_span_id,
    span.request_time,
    span.mcp_method ?? null,
    span.mcp_tool_call_name ?? null,
    span.deployment,
  );

  return (result?.response as HopMcpFacts) ?? FAILED_MCP;
};

const runEmbedding: FactsRunner<HopEmbeddingFacts> = async (scope, traceId, span, request) => {
  const result = await request(getConversationHopEmbedding, scope, traceId, span.core_span_id, span.request_time);

  return (result?.response as HopEmbeddingFacts) ?? FAILED_EMBEDDING;
};

export const useHopMcpFacts = (params: Params) => useHeldFacts<HopMcpFacts>(params, runMcp, FAILED_MCP);

export const useHopEmbeddingFacts = (params: Params) =>
  useHeldFacts<HopEmbeddingFacts>(params, runEmbedding, FAILED_EMBEDDING);
