'use client';

import { useEffect, useRef, useState } from 'react';

import { getConversationHopBodies } from '@/src/app/[lang]/conversations-trace/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { ConversationHopBodies, ConversationSpanRow, HopTextsState } from '@/src/models/analytics/conversations-trace';
import { hopTextSuppressionOf } from '@/src/utils/analytics/conversation-spans';

const FAILED: ConversationHopBodies = {
  state: HopTextsState.LoadFailed,
  sent: null,
  received: null,
  toolCalls: [],
};

export const useHopBodies = (chatId: string, traceId: string, span: ConversationSpanRow | null) => {
  const [bodies, setBodies] = useState<ConversationHopBodies | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const getReqRef = useRef(useProtectedRequest());
  const heldKeyRef = useRef<string | null>(null);

  const suppression = span ? hopTextSuppressionOf(span) : null;
  const spanId = span && suppression === null ? span.core_span_id : null;
  const requestTime = span?.request_time ?? null;
  const heldKey = spanId === null ? null : `${chatId}:${traceId}:${spanId}`;

  useEffect(() => {
    if (heldKey === heldKeyRef.current) {
      return;
    }

    heldKeyRef.current = heldKey;

    if (spanId === null) {
      setBodies(null);
      setIsLoading(false);
      return;
    }

    setBodies(null);
    setIsLoading(true);

    const read = async () => {
      try {
        const result = await getReqRef.current(getConversationHopBodies, chatId, traceId, spanId, requestTime);

        if (heldKeyRef.current !== heldKey) {
          return;
        }

        setBodies((result?.response as ConversationHopBodies) ?? FAILED);
      } catch {
        if (heldKeyRef.current === heldKey) {
          setBodies(FAILED);
        }
      } finally {
        if (heldKeyRef.current === heldKey) {
          setIsLoading(false);
        }
      }
    };

    void read();
  }, [chatId, traceId, spanId, requestTime, heldKey]);

  return { bodies, isLoading, suppression };
};
