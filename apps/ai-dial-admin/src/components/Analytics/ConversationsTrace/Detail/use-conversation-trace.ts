'use client';

import { useCallback, useRef, useState } from 'react';

import { getConversationSpans } from '@/src/app/[lang]/conversations-trace/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import {
  ConversationSpanRow,
  ConversationTraceFigures,
  ModelCallOutput,
  SessionScope,
} from '@/src/models/analytics/conversations-trace';

interface TraceState {
  figures: ConversationTraceFigures;
  // What names the trace on screen: the listing supplies the card's own name, the transcript the trace id.
  // There is no ordinal fallback — the data records no turn index, so nothing here counts turns.
  title?: string;
  spans: ConversationSpanRow[];
  modelOutputs: ModelCallOutput[];
  hasLoadError: boolean;
}

export const useConversationTrace = (scope: SessionScope) => {
  const [trace, setTrace] = useState<TraceState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const getReqRef = useRef(useProtectedRequest());

  const onOpenTrace = useCallback(
    async (figures: ConversationTraceFigures, title?: string) => {
      setIsLoading(true);
      setSelectedSpanId(null);

      try {
        const result = await getReqRef.current(getConversationSpans, scope, figures.traceId);
        const spans = result?.response?.spans ?? [];

        setTrace({
          figures,
          title,
          spans,
          modelOutputs: result?.response?.modelOutputs ?? [],
          hasLoadError: !result?.success,
        });
        setSelectedSpanId(spans[0]?.core_span_id ?? null);
      } catch {
        setTrace({ figures, title, spans: [], modelOutputs: [], hasLoadError: true });
        setSelectedSpanId(null);
      } finally {
        setIsLoading(false);
      }
    },
    [scope],
  );

  const onCloseTrace = useCallback(() => {
    setTrace(null);
    setSelectedSpanId(null);
  }, []);

  return { trace, isLoading, selectedSpanId, onSelectSpan: setSelectedSpanId, onOpenTrace, onCloseTrace };
};
