'use client';

import { useCallback, useRef, useState } from 'react';

import { getConversationSpans } from '@/src/app/[lang]/conversations-trace/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { ConversationSpanRow, ConversationTraceFigures } from '@/src/models/analytics/conversations-trace';

/**
 * The span a trace opens on: its entry hop, and the earliest hop otherwise.
 *
 * The entry hop is the one whose `core_parent_span_id` is null — what the client sent to DIAL — and its
 * request body is the only one carrying the user-visible exchange with no system prompt and no internal
 * planning. So it is the span whose Chat tab answers "what was this conversation", which is what a reader
 * opening a trace is asking before they have picked a hop.
 *
 * Ordering alone does not find it. The spans arrive by ascending `request_time`, and a Core-internal root can
 * fire long after the hop it belongs to — measured at 36 s on one trace — while some traces record no root at
 * all. Selecting the earliest therefore lands on the conversation *usually*, and this makes it reliable.
 */
const openingSpanOf = (spans: ConversationSpanRow[]): ConversationSpanRow | undefined =>
  spans.find(({ core_parent_span_id }) => core_parent_span_id == null) ?? spans[0];

interface TraceState {
  figures: ConversationTraceFigures;
  title?: string;
  spans: ConversationSpanRow[];
  hasLoadError: boolean;
}

// Takes no session scope: the trace read is predicated on the trace id alone, which is one of the hop log's
// bloom-filtered columns.
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
      setSelectedSpanId(openingSpanOf(spans)?.core_span_id ?? null);
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
