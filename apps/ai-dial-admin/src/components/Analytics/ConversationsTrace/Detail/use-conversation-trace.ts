'use client';

import { useCallback, useRef, useState } from 'react';

import { getConversationSpans } from '@/src/app/[lang]/conversations-trace/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { ConversationSpanRow, ConversationTraceFigures } from '@/src/models/analytics/conversations-trace';

interface TraceState {
  figures: ConversationTraceFigures;
  // What names the trace on screen: the listing supplies the card's own name, the transcript the trace id.
  // There is no ordinal fallback — the data records no turn index, so nothing here counts turns.
  title?: string;
  spans: ConversationSpanRow[];
  hasLoadError: boolean;
}

// Takes no session scope: the trace read is predicated on the trace id alone, which is one of the hop log's
// bloom-filtered columns. The scope was needed only by the model-body read that the tree no longer makes.
export const useConversationTrace = () => {
  const [trace, setTrace] = useState<TraceState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const getReqRef = useRef(useProtectedRequest());

  const onOpenTrace = useCallback(async (figures: ConversationTraceFigures, title?: string) => {
    setIsLoading(true);
    setSelectedSpanId(null);

    try {
      const result = await getReqRef.current(getConversationSpans, figures.traceId);
      const spans = result?.response?.spans ?? [];

      setTrace({
        figures,
        title,
        spans,
        hasLoadError: !result?.success,
      });
      setSelectedSpanId(spans[0]?.core_span_id ?? null);
    } catch {
      setTrace({ figures, title, spans: [], hasLoadError: true });
      setSelectedSpanId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onCloseTrace = useCallback(() => {
    setTrace(null);
    setSelectedSpanId(null);
  }, []);

  return { trace, isLoading, selectedSpanId, onSelectSpan: setSelectedSpanId, onOpenTrace, onCloseTrace };
};
