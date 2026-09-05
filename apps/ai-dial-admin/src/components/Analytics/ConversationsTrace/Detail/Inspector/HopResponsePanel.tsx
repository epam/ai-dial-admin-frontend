'use client';

import { FC, useMemo } from 'react';

import HopClampNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopClampNote';
import HopMessageCard from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMessageCard';
import HopToolCalls from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopToolCalls';
import HopRawView from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopRawView';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
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
  isRaw: boolean;
  scope: SessionScope;
  traceId: string;
  coreSpanId: string;
  requestTime: number | string | null;
  mcpToolCalls: McpToolCallTally;
}

const HopResponsePanel: FC<Props> = ({ envelope, isRaw, scope, traceId, coreSpanId, requestTime, mcpToolCalls }) => {
  const t = useI18n();
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
    <div className="flex min-h-0 min-w-0 flex-col">
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
