'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopParams } from '@/src/models/analytics/conversations-trace';

// Named parameters get a short label; the rest print their recorded key, because a parameter this frontend
// does not name is still better read under the name the body gave it.
const PARAM_LABEL_KEY: Record<string, string> = {
  temperature: ConversationsTraceI18nKey.InspectorParamTemperature,
  max_tokens: ConversationsTraceI18nKey.InspectorParamMaxTokens,
  tools: ConversationsTraceI18nKey.InspectorParamTools,
  stream: ConversationsTraceI18nKey.InspectorParamStream,
};

interface Props {
  params: HopParams;
  // From `number_request_messages`, a plain column — so it is right before any body is read and stays right
  // when a read is clamped or withheld. It states itself here rather than in the tab's count badge, whose
  // accent styling ui-kit owns and reads as a link.
  messageCount: number | null;
}

const HopParamsLine: FC<Props> = ({ params, messageCount }) => {
  const t = useI18n();

  if (!params.stated.length && messageCount === null) {
    return null;
  }

  return (
    // A `group`, not a paragraph: ARIA prohibits a name on `role="paragraph"`, so the `aria-label` that makes
    // this line addressable was being dropped on the floor by the very readers it was for.
    <div
      role="group"
      aria-label={t(ConversationsTraceI18nKey.InspectorParamsLabel)}
      className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-secondary dial-caption-text"
    >
      {params.stated.map(({ name, value }) => (
        <span key={name} className="flex min-w-0 items-center gap-1 whitespace-nowrap">
          {PARAM_LABEL_KEY[name] ? t(PARAM_LABEL_KEY[name]) : name}
          {/* An absent parameter is stated rather than omitted: the call ran at the deployment's default, and
              a line that silently drops it cannot be told apart from one nobody read carefully. */}
          {value === null ? (
            <span className="text-secondary">{UNAVAILABLE_VALUE}</span>
          ) : (
            /* Bounded, because the length of a recorded value is not this line's to choose. The list is no
               longer an allow-list, so any member of the body reaches here under its own key, and a scalar
               is stringified whole — one long value inside `whitespace-nowrap` gave the whole bodies pane a
               horizontal scrollbar. Truncated with the tooltip rather than by hand, so what the call was
               actually made with stays readable. */
            <DialEllipsisTooltip text={value} className="max-w-[14rem] text-primary" />
          )}
        </span>
      ))}
      {messageCount !== null && (
        <span className="whitespace-nowrap">
          {t(ConversationsTraceI18nKey.InspectorParamMessages)} <span className="text-primary">{messageCount}</span>
        </span>
      )}
    </div>
  );
};

export default HopParamsLine;
