'use client';

import { useEffect, useRef, useState } from 'react';

import { getConversationHopRequest, getConversationHopResponse } from '@/src/app/[lang]/conversations-trace/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { ServerActionResponse } from '@/src/models/server-action';
import { NO_CLAMP } from '@/src/utils/analytics/hop-inspector/envelope';
import { NO_FACTS } from '@/src/utils/analytics/hop-inspector/response';
import {
  ConversationSpanRow,
  HopDialect,
  HopReadState,
  HopRequestEnvelope,
  HopResponseEnvelope,
  SessionScope,
} from '@/src/models/analytics/conversations-trace';

const FAILED_REQUEST: HopRequestEnvelope = {
  state: HopReadState.LoadFailed,
  dialect: HopDialect.Unknown,
  params: { stated: [] },
  messages: [],
  roleCounts: [],
  recordedBytes: null,
  isClamped: false,
};

const FAILED_RESPONSE: HopResponseEnvelope = {
  state: HopReadState.LoadFailed,
  text: null,
  textClamp: NO_CLAMP,
  reasoningText: null,
  finishReason: null,
  toolCalls: [],
  facts: NO_FACTS,
  recordedBytes: null,
};

interface Params {
  scope: SessionScope;
  traceId: string;
  span: ConversationSpanRow | null;
  // False where the hop row already settles the side — a protocol envelope, a zero-byte response — so no read
  // is issued for a question the row has already answered.
  isEnabled: boolean;
}

// One hop's answer is held, and only one. A cache keyed by hop was rejected upstream for the same reason it
// would be rejected here: a reader walking a 384-hop chain would accumulate the whole trace in memory. The
// held key is `session:trace:span:side` — a span id is unique within its trace, not across the table — and it
// also settles the late-answer race, so an earlier hop's body can never appear under a later hop's heading.
const useHeldRead = <T extends object>(
  { scope, traceId, span, isEnabled }: Params,
  side: string,
  read: (
    scope: SessionScope,
    traceId: string,
    coreSpanId: string,
    requestTime: number | string | null,
  ) => Promise<ServerActionResponse<T>>,
  onFailure: T,
) => {
  const [value, setValue] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const getReqRef = useRef(useProtectedRequest());
  const heldKeyRef = useRef<string | null>(null);

  const spanId = span && isEnabled ? span.core_span_id : null;
  const requestTime = span?.request_time ?? null;
  const heldKey = spanId === null ? null : `${scope.id}:${traceId}:${spanId}:${side}`;

  useEffect(() => {
    if (heldKey === heldKeyRef.current) {
      return;
    }

    heldKeyRef.current = heldKey;

    if (spanId === null) {
      setValue(null);
      setIsLoading(false);
      return;
    }

    setValue(null);
    setIsLoading(true);

    const run = async () => {
      try {
        const result = await getReqRef.current(read, scope, traceId, spanId, requestTime);

        if (heldKeyRef.current !== heldKey) {
          return;
        }

        setValue((result?.response as T) ?? onFailure);
      } catch {
        if (heldKeyRef.current === heldKey) {
          setValue(onFailure);
        }
      } finally {
        if (heldKeyRef.current === heldKey) {
          setIsLoading(false);
        }
      }
    };

    void run();
  }, [scope, traceId, spanId, requestTime, heldKey, read, onFailure, side]);

  return { value, isLoading };
};

export const useHopRequest = (params: Params) =>
  useHeldRead<HopRequestEnvelope>(params, 'request', getConversationHopRequest, FAILED_REQUEST);

export const useHopResponse = (params: Params) =>
  useHeldRead<HopResponseEnvelope>(params, 'response', getConversationHopResponse, FAILED_RESPONSE);
