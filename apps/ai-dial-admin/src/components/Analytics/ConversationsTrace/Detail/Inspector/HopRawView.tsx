'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC, useEffect } from 'react';

import HopClampNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopClampNote';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import { useHopRaw } from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/use-hop-raw';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopInspectorSide, HopReadState, SessionScope } from '@/src/models/analytics/conversations-trace';

const LOADER_SIZE = 18;

interface Props {
  scope: SessionScope;
  traceId: string;
  coreSpanId: string;
  requestTime: number | string | null;
  side: HopInspectorSide;
}

const HopRawView: FC<Props> = ({ scope, traceId, coreSpanId, requestTime, side }) => {
  const t = useI18n();
  const { body, isLoading, onRequestRaw } = useHopRaw({ scope, traceId, coreSpanId, requestTime, side });

  useEffect(() => {
    void onRequestRaw();
  }, [onRequestRaw]);

  if (isLoading || body === null) {
    return (
      <div className="flex items-center justify-center rounded border border-primary bg-layer-3 p-3">
        <DialLoader size={LOADER_SIZE} ariaLabel={t(ConversationsTraceI18nKey.InspectorLoading)} />
      </div>
    );
  }

  if (body.state !== HopReadState.Available || body.text === null) {
    return <HopStateNote state={body.state} />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <HopClampNote clamp={body.clamp} />
      <pre className="whitespace-pre-wrap break-words rounded border border-primary bg-layer-1 p-2 font-mono text-primary dial-caption-text">
        {body.text}
      </pre>
    </div>
  );
};

export default HopRawView;
