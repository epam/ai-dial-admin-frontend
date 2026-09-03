'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC, useEffect } from 'react';

import HopClampNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopClampNote';
import CodeViewer from '@/src/components/Common/CodeViewer/CodeViewer';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import { useHopRaw } from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/use-hop-raw';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopInspectorSide, HopReadState, SessionScope } from '@/src/models/analytics/conversations-trace';

const LOADER_SIZE = 18;

// Named by the side it holds, so the two viewers of one hop are told apart when both are open.
const TITLE_KEY: Record<HopInspectorSide, string> = {
  [HopInspectorSide.Request]: ConversationsTraceI18nKey.InspectorRequest,
  [HopInspectorSide.Response]: ConversationsTraceI18nKey.InspectorResponse,
};

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
      {/* The app's own readable-JSON surface rather than a `<pre>`: a recorded body is one unwrapped line of
          up to half a megabyte, and pretty-printing, highlighting, folding and a copy control are the
          difference between a body a reader can read and a wall of characters. A body that does not parse is
          shown as it was recorded — the viewer falls back to the raw string. */}
      <CodeViewer title={t(TITLE_KEY[side])} content={body.text} defaultOpen />
    </div>
  );
};

export default HopRawView;
