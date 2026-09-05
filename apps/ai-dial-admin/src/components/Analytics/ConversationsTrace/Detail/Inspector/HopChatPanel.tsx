'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import HopPanelLoader from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopPanelLoader';
import HopChatBubble from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopChatBubble';
import HopChatTurn from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopChatTurn';
import HopStateNote from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopStateNote';
import { useHopMessage } from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/use-hop-message';
import { INSPECTOR_LOADER_SIZE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationSpanRow,
  HopMessageEntry,
  HopReadState,
  HopRequestEnvelope,
  HopResponseEnvelope,
  MessageRole,
  SessionScope,
} from '@/src/models/analytics/conversations-trace';

interface Props {
  scope: SessionScope;
  traceId: string;
  span: ConversationSpanRow;
  request: HopRequestEnvelope | null;
  isRequestLoading: boolean;
  response: HopResponseEnvelope | null;
  isResponseLoading: boolean;
  // The history is gated by the request column and is what this tab is made of; the answer is gated by its
  // own, and its absence is a statement rather than a missing turn.
  isResponseGranted: boolean;
}

// What was actually said, in the order it was said. A turn qualifies when its role is user or assistant and
// it carries text: everything else in a hop's history is machinery — a system prompt, a tool result, an
// assistant turn that only called a tool — and the Request tab states all of it, in full, with its sizes.
//
// Without this filter the tab is the Request tab in different clothes: on a nested model call, 50 messages
// render as 50 bubbles, most of them tool traffic, and the exchange is not findable among them. The point of
// this tab is the exchange.
//
// The role alone is not enough. The messages dialect feeds a tool result back as a **user** message carrying
// `tool_result` blocks, so filtering by role would let machinery through wearing the user's role — the one
// thing this tab must never do. A message that answers a call is a result whatever role it arrived under.
const conversationTurnsOf = (messages: HopMessageEntry[]): HopMessageEntry[] =>
  messages.filter(
    ({ role, text, answers }) =>
      (role === MessageRole.User || role === MessageRole.Assistant) &&
      !answers.length &&
      (text ?? '').trim().length > 0,
  );

/**
 * The state of the conversation this span was given, followed by the answer it produced.
 *
 * Reads nothing of its own. Both envelopes are the ones the Request and Response tabs already state, so a
 * second presentation of a body costs no second read — and a clamped turn opens through the same tier-2 read
 * the request's history offers.
 */
const HopChatPanel: FC<Props> = ({
  scope,
  traceId,
  span,
  request,
  isRequestLoading,
  response,
  isResponseLoading,
  isResponseGranted,
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

  // A dialect no parser claims has no conversation to lay out. The raw body is the Request tab's answer, and
  // sending the reader there beats rendering an empty conversation as though the span received one.
  if (request.state !== HopReadState.Available) {
    return <HopStateNote state={request.state} />;
  }

  // A hop whose history is all machinery — a retrieval prompt, a tool loop with nothing said in it — has no
  // conversation to state. Saying so is the answer; 50 bubbles of tool traffic is not.
  const turns = conversationTurnsOf(request.messages);

  if (!turns.length) {
    return <HopStateNote messageKey={ConversationsTraceI18nKey.InspectorChatNoMessages} />;
  }

  const answer = response?.state === HopReadState.Available ? response.text : null;
  // A response whose text is blank put its output somewhere else — commonly in tool calls — so it adds no
  // turn rather than an empty bubble.
  const hasAnswer = (answer ?? '').trim().length > 0;

  return (
    <div
      role="group"
      aria-label={t(ConversationsTraceI18nKey.InspectorChatLabel)}
      className="mx-auto flex w-[800px] max-w-full flex-col gap-6"
    >
      {/* The envelope's own budget, not a per-message clamp: a conversation short of what was recorded says
          so, rather than stating a shorter exchange than the span received. Counted over the whole history,
          because that is what the budget clamped — not over the turns that survived the filter. */}
      {request.isClamped && (
        <p role="status" aria-live="polite" className="text-secondary dial-caption-text">
          {t(ConversationsTraceI18nKey.InspectorEnvelopeClamped, {
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
      {!isResponseGranted && <HopStateNote messageKey={ConversationsTraceI18nKey.InspectorChatAnswerWithheld} />}
      {isResponseGranted && isResponseLoading && (
        <div className="flex items-center justify-center">
          <DialLoader size={INSPECTOR_LOADER_SIZE} ariaLabel={t(ConversationsTraceI18nKey.InspectorLoading)} />
        </div>
      )}
      {/* Omitted rather than faked where the response yielded nothing: a response with no text put its output
          somewhere else, commonly in tool calls, and an empty trailing bubble would read as an answer. The
          reasoning summary is never merged in — it is the model's scratch work, not its reply. */}
      {hasAnswer && (
        <HopChatBubble role={MessageRole.Assistant}>
          <p className="whitespace-pre-wrap break-words text-primary dial-small-text">{answer}</p>
        </HopChatBubble>
      )}
    </div>
  );
};

export default HopChatPanel;
