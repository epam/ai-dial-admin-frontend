'use client';

import { FC } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopToolCall } from '@/src/models/analytics/conversations-trace';
import { shortCallId } from '@/src/utils/analytics/conversation-formatting';

interface Props {
  calls: HopToolCall[];
}

// A tool call renders as content, not as metadata about content. An assistant message that only called a tool
// records `content` as an empty string, so the call is the whole of what that message said — stating it as a
// size pill left a card that read as blank.
const HopToolCalls: FC<Props> = ({ calls }) => {
  const t = useI18n();

  if (!calls.length) {
    return null;
  }

  return (
    <ul className="flex min-w-0 flex-col gap-2">
      {calls.map(({ name, args, id }, index) => (
        <li key={id ?? `${name}-${index}`} className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-secondary dial-caption-text">
            {t(ConversationsTraceI18nKey.InspectorToolCall)} <span className="text-primary">{name}</span>
            {/* The tail of the id the answering message quotes back. Without it a turn that called one tool
                three times is answered by three results nothing on screen can tell apart. */}
            {id != null && <span className="pl-1.5">#{shortCallId(id)}</span>}
          </span>
          {args !== null && (
            <pre className="whitespace-pre-wrap break-words rounded border border-primary bg-layer-1 p-2 font-mono text-primary dial-caption-text">
              {args}
            </pre>
          )}
        </li>
      ))}
    </ul>
  );
};

export default HopToolCalls;
