'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import HopPanelLoader from '@/src/components/Analytics/SessionsTrace/Detail/Inspector/HopPanelLoader';
import HopChatBubble from '@/src/components/Analytics/SessionsTrace/Detail/Inspector/HopChatBubble';
import HopChatTurn from '@/src/components/Analytics/SessionsTrace/Detail/Inspector/HopChatTurn';
import HopStateNote from '@/src/components/Analytics/SessionsTrace/Detail/Inspector/HopStateNote';
import { useHopMessage } from '@/src/components/Analytics/SessionsTrace/Detail/Inspector/use-hop-message';
import { INSPECTOR_LOADER_SIZE } from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  SessionSpanRow,
  HopMessageEntry,
  HopReadState,
  HopRequestEnvelope,
  HopResponseEnvelope,
  MessageRole,
  SessionScope,
} from '@/src/models/analytics/sessions-trace';

interface Props {
  scope: SessionScope;
  traceId: string;
  span: SessionSpanRow;
  request: HopRequestEnvelope | null;
  isRequestLoading: boolean;
  response: HopResponseEnvelope | null;
  isResponseLoading: boolean;
  isResponseGranted: boolean;
  hasFailed: boolean;
}

const sessionTurnsOf = (messages: HopMessageEntry[]): HopMessageEntry[] =>
  messages.filter(
    ({ role, text, answers }) =>
      (role === MessageRole.User || role === MessageRole.Assistant) &&
      !answers.length &&
      (text ?? '').trim().length > 0,
  );

const HopChatPanel: FC<Props> = ({
  scope,
  traceId,
  span,
  request,
  isRequestLoading,
  response,
  isResponseLoading,
  isResponseGranted,
  hasFailed,
}) => {
  const t = useI18n();
  const { messages, loadingIndexes, onOpen, onClose } = useHopMessage({
    scope,
    traceId,
    coreSpanId: span.core_span_id,
    requestTime: span.request_time,
  });

  if (isRequestLoading || request === null) {
    return <HopPanelLoader />;
  }

  // A dialect no parser claims has no session to lay out. The raw body is the Request tab's answer, and
  // sending the reader there beats rendering an empty session as though the span received one.
  if (request.state !== HopReadState.Available) {
    return <HopStateNote state={request.state} />;
  }

  // A hop whose history is all machinery — a retrieval prompt, a tool loop with nothing said in it — has no
  // session to state. Saying so is the answer; 50 bubbles of tool traffic is not.
  const turns = sessionTurnsOf(request.messages);

  if (!turns.length) {
    return <HopStateNote messageKey={SessionsTraceI18nKey.InspectorChatNoMessages} />;
  }

  const answer = response?.state === HopReadState.Available ? response.text : null;
  // A response whose text is blank put its output somewhere else — commonly in tool calls — so it adds no
  // turn rather than an empty bubble.
  const hasAnswer = (answer ?? '').trim().length > 0;
  // What the caller actually received, and the one thing a reader opens a failed hop to see. Stated in place
  // of the answer the hop never produced, and only once the response has been read — a failure announced
  // while the read is still in flight would be a guess.
  // Stated only in place of an answer the hop never produced: a hop recorded as failed can still carry a
  // readable answer — a 200 that reported `success: false` is one — and replacing that answer with "go read
  // the bytes" would withhold the very thing the reader opened the tab for. Gated on the read having
  // finished, since a failure announced mid-flight is a guess.
  const isFailureStated = hasFailed && !hasAnswer && isResponseGranted && !isResponseLoading && response !== null;

  return (
    <div
      role="group"
      aria-label={t(SessionsTraceI18nKey.InspectorChatLabel)}
      className="mx-auto flex w-[800px] max-w-full flex-col gap-6"
    >
      {/* The envelope's own budget, not a per-message clamp: a session short of what was recorded says
          so, rather than stating a shorter exchange than the span received. Counted over the whole history,
          because that is what the budget clamped — not over the turns that survived the filter. */}
      {request.isClamped && (
        <p role="status" aria-live="polite" className="text-secondary dial-caption-text">
          {t(SessionsTraceI18nKey.InspectorEnvelopeClamped, {
            shown: request.messages.filter(({ text }) => text !== null).length,
            total: request.messages.length,
          })}
        </p>
      )}
      {turns.map((message) => (
        <HopChatTurn
          key={message.index}
          message={message}
          opened={messages[message.index]}
          isLoading={loadingIndexes.includes(message.index)}
          onOpen={onOpen}
          onClose={onClose}
        />
      ))}
      {!isResponseGranted && <HopStateNote messageKey={SessionsTraceI18nKey.InspectorChatAnswerWithheld} />}
      {isResponseGranted && isResponseLoading && (
        <div className="flex items-center justify-center">
          <DialLoader size={INSPECTOR_LOADER_SIZE} ariaLabel={t(SessionsTraceI18nKey.InspectorLoading)} />
        </div>
      )}
      {hasAnswer && (
        <HopChatBubble role={MessageRole.Assistant}>
          <p className="whitespace-pre-wrap break-words text-primary dial-small-text">{answer}</p>
        </HopChatBubble>
      )}
      {/* Never in the bubble that says who spoke: the hop said nothing, something refused it, and a refusal
          wearing the assistant's label reports an outage as speech. A body stating no readable error falls
          through to the key, which sends the reader to the recorded bytes rather than to a fragment. */}
      {isFailureStated && (
        <HopStateNote
          message={response.errorText ?? undefined}
          messageKey={SessionsTraceI18nKey.InspectorChatHopFailed}
          isFailure
        />
      )}
    </div>
  );
};

export default HopChatPanel;
