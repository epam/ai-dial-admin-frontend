'use client';

import { ElementSize, OutlinedButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, useId } from 'react';

import HopToolCalls from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopToolCalls';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopMessageEntry, HopMessageValue, MessageRole } from '@/src/models/analytics/conversations-trace';
import { formatBytes } from '@/src/utils/analytics/conversation-formatting';

export const ROLE_LABEL_KEY: Record<MessageRole, string> = {
  [MessageRole.System]: ConversationsTraceI18nKey.InspectorRoleSystem,
  [MessageRole.User]: ConversationsTraceI18nKey.InspectorRoleUser,
  [MessageRole.Assistant]: ConversationsTraceI18nKey.InspectorRoleAssistant,
  [MessageRole.Tool]: ConversationsTraceI18nKey.InspectorRoleTool,
  [MessageRole.Other]: ConversationsTraceI18nKey.InspectorRoleOther,
};

const ROLE_CLASS: Record<MessageRole, string> = {
  [MessageRole.System]: 'text-accent-tertiary',
  [MessageRole.User]: 'text-accent-primary',
  [MessageRole.Assistant]: 'text-accent-secondary',
  [MessageRole.Tool]: 'text-warning',
  [MessageRole.Other]: 'text-secondary',
};

interface Props {
  message: HopMessageEntry;
  opened?: HopMessageValue;
  isLoading: boolean;
  onOpen: (messageIndex: number) => void;
  onClose: (messageIndex: number) => void;
}

// Every message is labelled with its own role, which is what makes rendering a system prompt here safe in a
// way the transcript's role filter exists to prevent: nothing can read as something a person typed.
const HopMessageRow: FC<Props> = ({ message, opened, isLoading, onOpen, onClose }) => {
  const t = useI18n();
  const bodyId = useId();

  const isOpen = opened !== undefined;
  const text = opened?.text ?? message.text;
  const toolCalls = opened?.toolCalls ?? message.toolCalls;
  const hasText = (text ?? '').trim().length > 0;

  return (
    <li
      role="group"
      aria-label={`${t(ROLE_LABEL_KEY[message.role])} #${message.index + 1}`}
      className={classNames(
        'flex min-w-0 flex-col gap-2 rounded border bg-layer-3 p-3',
        message.isLarge ? 'border-warning' : 'border-primary',
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className={classNames('font-mono uppercase dial-tiny-semi-text', ROLE_CLASS[message.role])}>
          {t(ROLE_LABEL_KEY[message.role])}
        </span>
        {/* Stated in words as well as by the border: colour alone carries nothing to a reader who cannot
            perceive it, and this is a row-like collection. */}
        {message.isLarge && (
          <span className="rounded border border-warning px-1.5 py-0.5 text-warning dial-caption-text">
            {t(ConversationsTraceI18nKey.InspectorMessageLarge)}
          </span>
        )}
        <span className="ml-auto font-mono text-secondary dial-caption-text">{formatBytes(message.bytes)}</span>
        <span className="font-mono text-secondary dial-caption-text">#{message.index + 1}</span>
      </div>
      <div id={bodyId} className="flex min-w-0 flex-col gap-2">
        {hasText && <p className="whitespace-pre-wrap break-words text-primary dial-tiny-text">{text}</p>}
        <HopToolCalls calls={toolCalls} />
        {/* Neither text nor a call: `content` was recorded empty and nothing was asked for either, which is a
            fact about the message rather than a blank card. */}
        {!hasText && !toolCalls.length && (
          <p className="text-secondary dial-tiny-text">{t(ConversationsTraceI18nKey.InspectorNoText)}</p>
        )}
      </div>
      {(message.isTextClamped || isOpen) && (
        <OutlinedButton
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
          textClassName="dial-caption-text"
          // ui-kit's 2.0 buttons hover on the `--bg-control-*` family, which the themes service does not
          // define — both fallbacks miss and it lands on a light `#e0e6f0`, so light theme text on a light
          // hover fill made the label unreadable. `bg-controls-neutral-hover` is the app's own key for
          // `--controls-bg-neutral-hover`, which the service *does* define. Same class of gap as the Assets
          // grid (#4108), and the same shape of workaround: reach for a token that exists.
          className="self-start hover:!bg-controls-neutral-hover"
        />
      )}
    </li>
  );
};

export default HopMessageRow;
