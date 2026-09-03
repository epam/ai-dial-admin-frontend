'use client';

import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import { MESSAGE_ROLE_LABEL_KEY } from '@/src/constants/analytics/conversations-trace';
import { useI18n } from '@/src/locales/client';
import { MessageRole } from '@/src/models/analytics/conversations-trace';
import { formatBytes } from '@/src/utils/analytics/conversation-formatting';

const ROLE_CLASS: Record<MessageRole, string> = {
  [MessageRole.System]: 'text-accent-tertiary',
  [MessageRole.User]: 'text-accent-primary',
  [MessageRole.Assistant]: 'text-accent-secondary',
  [MessageRole.Tool]: 'text-warning',
  [MessageRole.Other]: 'text-secondary',
};

interface Props {
  role: MessageRole;
  // Its place in the request's history, where it has one. A response is not in the history it answers.
  position?: number;
  bytes?: number;
  bodyId?: string;
  // What the message is rather than what it said — the calls it answers, and whether they failed.
  aside?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  as?: 'li' | 'div';
}

/**
 * One recorded message, presented the same way wherever it is read.
 *
 * Shared by the request's history and by the assembled response, because a response **is** one assistant
 * message: it has a role, a size, text and the calls it asked for. Rendering it as bare text instead would
 * make the two tabs look like two different tools reading two different things.
 *
 * Every message is labelled with its own role, which is what makes rendering a system prompt safe here:
 * nothing can read as something a person typed.
 */
const HopMessageCard: FC<Props> = ({ role, position, bytes, bodyId, aside, children, footer, as = 'li' }) => {
  const t = useI18n();
  const Wrapper = as;
  const label =
    position === undefined ? t(MESSAGE_ROLE_LABEL_KEY[role]) : `${t(MESSAGE_ROLE_LABEL_KEY[role])} #${position}`;

  return (
    <Wrapper
      role="group"
      aria-label={label}
      className="flex min-w-0 flex-col gap-2 rounded border border-primary bg-layer-3 p-3"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className={classNames('font-mono uppercase dial-tiny-semi-text', ROLE_CLASS[role])}>
          {t(MESSAGE_ROLE_LABEL_KEY[role])}
        </span>
        {bytes !== undefined && (
          <span className="ml-auto font-mono text-secondary dial-caption-text">{formatBytes(bytes)}</span>
        )}
        {position !== undefined && <span className="font-mono text-secondary dial-caption-text">#{position}</span>}
      </div>
      {aside}
      <div id={bodyId} className="flex min-w-0 flex-col gap-2">
        {children}
      </div>
      {footer}
    </Wrapper>
  );
};

export default HopMessageCard;
