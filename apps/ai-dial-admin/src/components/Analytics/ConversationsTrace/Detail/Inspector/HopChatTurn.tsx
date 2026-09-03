'use client';

import { ElementSize, LinkButton } from '@epam/ai-dial-ui-kit';
import { FC, useId } from 'react';

import HopChatBubble from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopChatBubble';
import HopToolCalls from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopToolCalls';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopMessageEntry, HopMessageValue } from '@/src/models/analytics/conversations-trace';

interface Props {
  message: HopMessageEntry;
  opened?: HopMessageValue;
  isLoading: boolean;
  onOpen: (messageIndex: number) => void;
  onClose: (messageIndex: number) => void;
}

// One turn of the history the span received. The full-text read is the same tier-2 read the request's own
// list offers, so opening a turn here and opening that message there share one path — a conversation view
// that silently truncates is worse than a list that admits it.
const HopChatTurn: FC<Props> = ({ message, opened, isLoading, onOpen, onClose }) => {
  const t = useI18n();
  const bodyId = useId();

  const isOpen = opened !== undefined;
  const text = opened?.text ?? message.text;
  const toolCalls = opened?.toolCalls ?? message.toolCalls;
  const hasText = (text ?? '').trim().length > 0;

  return (
    <HopChatBubble
      role={message.role}
      position={message.index + 1}
      bodyId={bodyId}
      footer={
        (message.isTextClamped || isOpen) && (
          <LinkButton
            size={ElementSize.Small}
            aria-expanded={isOpen}
            aria-controls={bodyId}
            disabled={isLoading}
            label={t(
              isOpen
                ? ConversationsTraceI18nKey.InspectorHideFullMessage
                : ConversationsTraceI18nKey.InspectorShowFullMessage,
            )}
            onClick={() => (isOpen ? onClose(message.index) : onOpen(message.index))}
            // A link button rather than an outlined one: no border to nest inside the bubble, and no fill,
            // so the `--bg-control-*` gap that forces a hover override elsewhere does not apply here.
            textClassName="dial-caption-text"
          />
        )
      }
    >
      {hasText && <p className="whitespace-pre-wrap break-words text-primary dial-small-text">{text}</p>}
      <HopToolCalls calls={toolCalls} />
      {/* Neither text nor a call: `content` was recorded empty and nothing was asked for either, which is a
          fact about the turn rather than a blank bubble. */}
      {!hasText && !toolCalls.length && <p className="italic text-secondary dial-small-text">{UNAVAILABLE_VALUE}</p>}
    </HopChatBubble>
  );
};

export default HopChatTurn;
