'use client';

import { ElementSize, LinkButton } from '@epam/ai-dial-ui-kit';
import { FC, useId } from 'react';

import HopMessageCard from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMessageCard';
import HopToolAnswerLine from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopToolAnswerLine';
import HopToolCalls from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopToolCalls';
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

// One message of the request's history, in the same card the assembled response is stated in.
const HopMessageRow: FC<Props> = ({ message, opened, isLoading, onOpen, onClose }) => {
  const t = useI18n();
  const bodyId = useId();

  const isOpen = opened !== undefined;
  const text = opened?.text ?? message.text;
  const toolCalls = opened?.toolCalls ?? message.toolCalls;
  const hasText = (text ?? '').trim().length > 0;

  return (
    <HopMessageCard
      role={message.role}
      position={message.index + 1}
      bytes={message.bytes}
      bodyId={bodyId}
      aside={<HopToolAnswerLine answers={message.answers} isError={message.isError} />}
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
            // A link button rather than an outlined one: the control sits inside a bordered card, and a
            // second border around it read as a nested panel. It carries no fill either, so the
            // `--bg-control-*` gap that forces a hover override on the filled 2.0 buttons does not apply.
            textClassName="dial-caption-text text-accent-primary"
            className="self-start"
          />
        )
      }
    >
      {hasText && <p className="whitespace-pre-wrap break-words text-primary dial-tiny-text">{text}</p>}
      <HopToolCalls calls={toolCalls} />
      {/* Neither text nor a call: `content` was recorded empty and nothing was asked for either, which is a
          fact about the message rather than a blank card. */}
      {!hasText && !toolCalls.length && (
        <p className="text-secondary dial-tiny-text">{t(ConversationsTraceI18nKey.InspectorNoText)}</p>
      )}
    </HopMessageCard>
  );
};

export default HopMessageRow;
