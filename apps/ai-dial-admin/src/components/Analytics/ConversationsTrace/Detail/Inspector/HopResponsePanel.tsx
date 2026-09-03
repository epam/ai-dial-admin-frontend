'use client';

import { Switch } from '@epam/ai-dial-ui-kit';
import { FC, useMemo, useState } from 'react';

import HopClampNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopClampNote';
import HopMessageCard from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMessageCard';
import HopResponseFactsLine from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopResponseFactsLine';
import HopToolCalls from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopToolCalls';
import HopRawView from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopRawView';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import { RAW_LABEL_CLASS } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { unansweredToolNamesOf } from '@/src/utils/analytics/conversation-spans';
import {
  HopInspectorSide,
  HopReadState,
  HopResponseEnvelope,
  McpToolCallTally,
  MessageRole,
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
  const [isRaw, setIsRaw] = useState(false);
  // Text or a call: a response that only called a tool said exactly that, and it is a message either way.
  const hasMessage = envelope.text !== null || envelope.toolCalls.length > 0;

  // Which of the tools this response asked for the turn recorded no MCP call of. Resolved by count per name,
  // because the log pairs no request to a result.
  const unansweredToolNames = useMemo(
    () =>
      unansweredToolNamesOf(
        envelope.toolCalls.map(({ name }) => name),
        mcpToolCalls,
      ),
    [envelope.toolCalls, mcpToolCalls],
  );

  return (
    // Same shape as the request panel: no row gap between the pinned control and the content, because a gap
    // below a sticky element is a transparent band inside the scroll port.
    <div className="flex min-w-0 flex-col">
      {/* Pinned for the same reason the role filter is: it chooses what the pane below shows, and a raw body
          scrolls far past this height — leaving no way back without scrolling to the top. `bg-layer-1` is
          the section's own ground — `bg-layer-2` was the rail's, and this panel left the rail — so the body
          passes behind it rather than through it.
          One switch, not two modes: "assembled" was never something a reader picked, it is simply what the
          tab shows when it is not showing bytes — and the same switch says the same thing on the request
          side. */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-end bg-layer-1 pb-3">
        <Switch
          labelProps={{ label: t(ConversationsTraceI18nKey.InspectorRaw), className: RAW_LABEL_CLASS }}
          isOn={isRaw}
          onChange={setIsRaw}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        {isRaw ? (
          <HopRawView
            scope={scope}
            traceId={traceId}
            coreSpanId={coreSpanId}
            requestTime={requestTime}
            side={HopInspectorSide.Response}
          />
        ) : (
          <>
            {/* Facts about the response rather than about the message it carried, so they are not inside the
                card — and above it rather than after it, because this tab holds exactly one answer: what
                answered and at what cost heads the reply instead of trailing a card the reader has to scroll
                past. */}
            <HopResponseFactsLine facts={envelope.facts} finishReason={envelope.finishReason} />
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
            {/* The response is one assistant message, so it is stated in the card the request's own history
                uses: a reader moving between the two tabs reads one shape rather than two. Its calls carry
                their arguments and their ids here, which names alone could not. */}
            {envelope.state === HopReadState.Available && hasMessage ? (
              <HopMessageCard as="div" role={MessageRole.Assistant} bytes={envelope.recordedBytes ?? undefined}>
                {envelope.text !== null && (
                  <p className="whitespace-pre-wrap break-words text-primary dial-tiny-text">{envelope.text}</p>
                )}
                <HopToolCalls calls={envelope.toolCalls} />
              </HopMessageCard>
            ) : (
              <HopStateNote state={envelope.state} />
            )}
            <HopClampNote clamp={envelope.textClamp} />
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
