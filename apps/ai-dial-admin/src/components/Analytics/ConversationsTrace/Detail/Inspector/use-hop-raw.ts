'use client';

import { useCallback, useRef, useState } from 'react';

import { getConversationHopRawBody } from '@/src/app/[lang]/conversations-trace/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { HopInspectorSide, HopRawBody, HopReadState, SessionScope } from '@/src/models/analytics/conversations-trace';
import { NO_CLAMP } from '@/src/utils/analytics/hop-inspector/envelope';

const FAILED: HopRawBody = {
  state: HopReadState.LoadFailed,
  text: null,
  clamp: NO_CLAMP,
};

interface Params {
  scope: SessionScope;
  traceId: string;
  coreSpanId: string;
  requestTime: number | string | null;
  side: HopInspectorSide;
}

// Tier 3, and issued only when the reader asks for it: the raw response averages 52.8 KB against 1 511
// characters for the assembled form, so opening every hop on the raw body would pay 35x for a view most
// readers never select.
export const useHopRaw = ({ scope, traceId, coreSpanId, requestTime, side }: Params) => {
  const [body, setBody] = useState<HopRawBody | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const getReqRef = useRef(useProtectedRequest());

  const onRequestRaw = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await getReqRef.current(getConversationHopRawBody, scope, traceId, coreSpanId, requestTime, side);
      setBody((result?.response as HopRawBody) ?? FAILED);
    } catch {
      setBody(FAILED);
    } finally {
      setIsLoading(false);
    }
  }, [scope, traceId, coreSpanId, requestTime, side]);

  return { body, isLoading, onRequestRaw };
};
