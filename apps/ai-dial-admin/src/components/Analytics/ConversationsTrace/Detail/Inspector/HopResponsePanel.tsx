'use client';

import { DialSegmentedControl, SegmentedControlOption } from '@epam/ai-dial-ui-kit';
import { FC, useMemo, useState } from 'react';

import HopClampNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopClampNote';
import HopRawView from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopRawView';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { unansweredToolNamesOf } from '@/src/utils/analytics/conversation-spans';
import {
  HopInspectorSide,
  HopReadState,
  HopResponseEnvelope,
  HopResponseMode,
  McpToolCallTally,
  SessionScope,
} from '@/src/models/analytics/conversations-trace';

interface Props {
  envelope: HopResponseEnvelope;
  scope: SessionScope;
  traceId: string;
  coreSpanId: string;
  requestTime: number | string | null;
  mcpToolCalls: McpToolCallTally;
}

const HopResponsePanel: FC<Props> = ({ envelope, scope, traceId, coreSpanId, requestTime, mcpToolCalls }) => {
  const t = useI18n();
  const [mode, setMode] = useState(HopResponseMode.Assembled);

  // Which of the tools this response asked for the turn recorded no MCP call of. Resolved by count per name,
  // because the log pairs no request to a result.
  const unansweredToolNames = useMemo(
    () => unansweredToolNamesOf(envelope.toolCalls, mcpToolCalls),
    [envelope.toolCalls, mcpToolCalls],
  );

  const options: SegmentedControlOption<HopResponseMode>[] = useMemo(
    () => [
      { value: HopResponseMode.Assembled, label: t(ConversationsTraceI18nKey.InspectorModeAssembled) },
      { value: HopResponseMode.Raw, label: t(ConversationsTraceI18nKey.InspectorModeRaw) },
    ],
    [t],
  );

  return (
    // Same shape as the request panel: no row gap between the pinned control and the content, because a gap
    // below a sticky element is a transparent band inside the scroll port.
    <div className="flex min-w-0 flex-col">
      {/* Pinned for the same reason the role filter is: it chooses what the pane below shows, and a raw body
          scrolls far past this height — leaving no way back to Assembled without scrolling to the top.
          `bg-layer-2` is the rail's own ground, so the body passes behind it rather than through it. */}
      <div className="sticky top-0 z-10 shrink-0 bg-layer-2 pb-3">
        {/* The 1.0 control, deliberately, and not because 2.0 was overlooked. The 2.0 `SegmentedControl` is
            styled with ui-kit's own `bg-control-*` utilities, which resolve to CSS properties the themes
            service never defines — so its selected segment renders on a light fallback and its label is
            unreadable on this theme. The 1.0 control uses the `--controls-bg-*` family the service does
            define, and it is what `ConversationViewSwitch` and `FeedbackFilterControl` already render
            correctly. */}
        <DialSegmentedControl
          ariaLabel={t(ConversationsTraceI18nKey.InspectorModeLabel)}
          options={options}
          value={mode}
          onChange={setMode}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        {mode === HopResponseMode.Raw ? (
          <HopRawView
            scope={scope}
            traceId={traceId}
            coreSpanId={coreSpanId}
            requestTime={requestTime}
            side={HopInspectorSide.Response}
          />
        ) : (
          <>
            {/* Stated as its own block, never merged into the answer: 54% of Responses hops record a reasoning
                summary, and reading it as the reply would misattribute the model's scratch work. */}
            {envelope.reasoningText !== null && (
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-secondary dial-tiny-text">{t(ConversationsTraceI18nKey.InspectorReasoning)}</span>
                <p className="whitespace-pre-wrap break-words rounded border border-primary bg-layer-1 p-2 text-secondary dial-tiny-text">
                  {envelope.reasoningText}
                </p>
              </div>
            )}
            {envelope.state === HopReadState.Available && envelope.text !== null ? (
              <p className="whitespace-pre-wrap break-words rounded border border-primary bg-layer-1 p-2 text-primary dial-tiny-text">
                {envelope.text}
              </p>
            ) : (
              <HopStateNote state={envelope.state} />
            )}
            <HopClampNote clamp={envelope.textClamp} />
            <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-secondary dial-caption-text">
              {envelope.finishReason && (
                <div className="flex items-center gap-1">
                  <dt>{t(ConversationsTraceI18nKey.InspectorFinishReason)}</dt>
                  <dd className="text-primary">{envelope.finishReason}</dd>
                </div>
              )}
              {envelope.toolCalls.length > 0 && (
                <div className="flex min-w-0 items-center gap-1">
                  <dt>{t(ConversationsTraceI18nKey.InspectorToolCalls)}</dt>
                  <dd className="truncate text-primary">{envelope.toolCalls.join(', ')}</dd>
                </div>
              )}
            </dl>
            {/* States the cause, not just the absence. A tool the calling application implements itself never
                crosses Core, so no hop exists to record — reporting that as a missing result would send the
                reader looking for data that was never meant to be there. */}
            {unansweredToolNames.length > 0 && (
              <p className="text-secondary dial-caption-text">
                {t(ConversationsTraceI18nKey.InspectorToolNotRecorded)}{' '}
                <span className="font-mono text-primary">{unansweredToolNames.join(', ')}</span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HopResponsePanel;
