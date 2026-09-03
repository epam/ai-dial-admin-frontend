'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import { MESSAGE_ROLE_LABEL_KEY } from '@/src/constants/analytics/conversations-trace';
import { useI18n } from '@/src/locales/client';
import { MessageRole } from '@/src/models/analytics/conversations-trace';

// User and assistant take the familiar chat bubble — opposed tails, narrower than the column — so the two
// sides of the exchange are told apart without reading the labels. Everything else — a system prompt, a tool
// result, a role this frontend does not recognise — is machinery the hop received rather than speech, and
// takes the full width under its own label so it can never be read as something either party said.
const BUBBLE_CLASS: Record<MessageRole, string> = {
  [MessageRole.User]: 'max-w-[85%] rounded-2xl rounded-br-none bg-layer-4',
  [MessageRole.Assistant]: 'max-w-[85%] rounded-2xl rounded-bl-none bg-layer-3',
  [MessageRole.System]: 'w-full rounded border border-primary bg-layer-1',
  [MessageRole.Tool]: 'w-full rounded border border-primary bg-layer-1',
  [MessageRole.Other]: 'w-full rounded border border-primary bg-layer-1',
};

const ROLE_TEXT_CLASS: Record<MessageRole, string> = {
  [MessageRole.User]: 'text-secondary',
  [MessageRole.Assistant]: 'text-accent-secondary',
  [MessageRole.System]: 'text-accent-tertiary',
  [MessageRole.Tool]: 'text-warning',
  [MessageRole.Other]: 'text-secondary',
};

interface Props {
  role: MessageRole;
  // The turn's place in the history, where it has one. Labelled by role alone, every user turn of a long
  // conversation announces identically — the same reason the request history's rows carry theirs. The span's
  // own answer has no position in the history it answered, so it states its role alone.
  position?: number;
  bodyId?: string;
  children: ReactNode;
  // Rendered inside the bubble, under what the turn said: a control for this turn, not for the conversation.
  footer?: ReactNode;
}

// One bubble for every turn of a span's conversation, whether it came from the request's history or from the
// span's own answer. Shared rather than duplicated: the role treatment is what keeps a system prompt from
// reading as a question, and two copies of it could diverge.
const HopChatBubble: FC<Props> = ({ role, position, bodyId, children, footer }) => {
  const t = useI18n();
  const isUser = role === MessageRole.User;
  const label = t(MESSAGE_ROLE_LABEL_KEY[role]);

  return (
    // Grouped and named by role: the treatment is what tells a system prompt from a question for a reader who
    // can see it, and this is what tells them apart for a reader who cannot.
    <div
      role="group"
      aria-label={position === undefined ? label : `${label} #${position}`}
      className={classNames('flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start')}
    >
      <span className={classNames('font-mono uppercase dial-tiny-semi-text', ROLE_TEXT_CLASS[role])}>{label}</span>
      <div className={classNames('flex min-w-0 flex-col gap-2 px-4 py-3', BUBBLE_CLASS[role])}>
        <div id={bodyId} className="flex min-w-0 flex-col gap-2">
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
};

export default HopChatBubble;
