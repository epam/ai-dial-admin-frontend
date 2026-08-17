'use client';

import { useCallback, useRef, useState } from 'react';

import { getConversationSpans } from '@/src/app/[lang]/conversations-trace/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { ConversationSpanRow, ConversationTurnRow } from '@/src/models/analytics/conversations-trace';

interface TraceState {
  turn: ConversationTurnRow;
  turnNumber: number;
  spans: ConversationSpanRow[];
  total: number | null;
  hasLoadError: boolean;
}

export const useConversationTrace = (chatId: string) => {
  const [trace, setTrace] = useState<TraceState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const getReqRef = useRef(useProtectedRequest());

  const onOpenTrace = useCallback(
    async (turn: ConversationTurnRow, turnNumber: number) => {
      setIsLoading(true);
      setSelectedSpanId(null);

      const result = await getReqRef.current(getConversationSpans, chatId, turn.trace_id);
      const spans = result?.response?.spans ?? [];

      setTrace({
        turn,
        turnNumber,
        spans,
        total: result?.response?.total ?? null,
        hasLoadError: !result?.success,
      });
      setSelectedSpanId(spans[0]?.core_span_id ?? null);
      setIsLoading(false);
    },
    [chatId],
  );

  const onCloseTrace = useCallback(() => {
    setTrace(null);
    setSelectedSpanId(null);
  }, []);

  return { trace, isLoading, selectedSpanId, onSelectSpan: setSelectedSpanId, onOpenTrace, onCloseTrace };
};
