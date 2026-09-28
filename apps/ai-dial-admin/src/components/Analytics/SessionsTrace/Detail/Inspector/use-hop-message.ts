'use client';

import { useCallback, useRef, useState } from 'react';

import { getSessionHopMessage } from '@/src/app/[lang]/sessions/actions';
import { useHopReadReport } from '@/src/components/Analytics/SessionsTrace/Detail/Inspector/use-hop-read-report';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { HopMessageValue, HopReadState, SessionScope } from '@/src/models/analytics/sessions-trace';

interface Params {
  scope: SessionScope;
  traceId: string;
  coreSpanId: string;
  requestTime: number | string | null;
}

// Tier 2, one message at a time. The messages already opened are held for the hop on screen and dropped with
// it, so opening five costs five reads rather than the whole body on every hop selection — the trade the
// tiering exists to make.
export const useHopMessage = ({ scope, traceId, coreSpanId, requestTime }: Params) => {
  const [messages, setMessages] = useState<Record<number, HopMessageValue>>({});
  const [loadingIndexes, setLoadingIndexes] = useState<number[]>([]);
  const getReqRef = useRef(useProtectedRequest());
  const onReadFailed = useHopReadReport();

  const onOpen = useCallback(
    async (messageIndex: number) => {
      setLoadingIndexes((current) => [...current, messageIndex]);

      try {
        const result = await getReqRef.current(
          getSessionHopMessage,
          scope,
          traceId,
          coreSpanId,
          requestTime,
          messageIndex,
        );
        const value = result?.response as HopMessageValue | undefined;

        if (result && !result.success) {
          onReadFailed(result);
        }

        setMessages((current) => ({
          ...current,
          [messageIndex]: value ?? { state: HopReadState.LoadFailed, text: null, toolCalls: [] },
        }));
      } finally {
        setLoadingIndexes((current) => current.filter((held) => held !== messageIndex));
      }
    },
    [scope, traceId, coreSpanId, requestTime, onReadFailed],
  );

  const onClose = useCallback(
    (messageIndex: number) =>
      setMessages((current) =>
        Object.fromEntries(Object.entries(current).filter(([key]) => Number(key) !== messageIndex)),
      ),
    [],
  );

  return { messages, loadingIndexes, onOpen, onClose };
};
