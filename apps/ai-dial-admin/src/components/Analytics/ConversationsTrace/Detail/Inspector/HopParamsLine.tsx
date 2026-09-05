'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC } from 'react';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopParams } from '@/src/models/analytics/conversations-trace';

// The model heads the line rather than taking a label: the call was made to it, and the rest is how.
const PARAM_LABEL_KEY: Record<string, string> = {
  temperature: ConversationsTraceI18nKey.InspectorParamTemperature,
  max_tokens: ConversationsTraceI18nKey.InspectorParamMaxTokens,
  tools: ConversationsTraceI18nKey.InspectorParamTools,
  stream: ConversationsTraceI18nKey.InspectorParamStream,
};

const MODEL = 'model';

// A boolean is a state, not a measurement: `stream true` should not read as another number on the line.
const BOOLEANS = new Set(['true', 'false']);

interface Props {
  params: HopParams;
  // Passed only where no message list states it: the role filter below opens with `all 18`, and the same
  // number twice over two adjacent lines is noise.
  messageCount: number | null;
}

const HopParamsLine: FC<Props> = ({ params, messageCount }) => {
  const t = useI18n();

  const model = params.stated.find(({ name }) => name === MODEL)?.value ?? null;
  const stated = params.stated.filter(({ name }) => name !== MODEL);

  if (!stated.length && model === null && messageCount === null) {
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
      {model !== null && (
        <>
          <DialEllipsisTooltip text={model} className="max-w-[18rem] font-semibold text-primary" />
          <span aria-hidden className="text-secondary">
            |
          </span>
        </>
      )}
      {stated.map(({ name, value }) => (
        <span key={name} className="flex min-w-0 items-center gap-1 whitespace-nowrap">
          {PARAM_LABEL_KEY[name] ? t(PARAM_LABEL_KEY[name]) : name}
          {/* An absent parameter is stated rather than omitted: the call ran at the deployment's default, and
              a line that silently drops it cannot be told apart from one nobody read carefully. */}
          {value === null ? (
            <span className="text-secondary">{UNAVAILABLE_VALUE}</span>
          ) : (
            /* Bounded, because the length of a recorded value is not this line's to choose. Truncated with
               the tooltip rather than by hand, so what the call was actually made with stays readable. */
            <DialEllipsisTooltip
              text={value}
              className={classNames('max-w-[14rem]', BOOLEANS.has(value) ? 'text-accent-secondary' : 'text-primary')}
            />
          )}
        </span>
      ))}
      {messageCount !== null && (
        <span className="whitespace-nowrap">
          {t(ConversationsTraceI18nKey.InspectorParamMessages)} <span className="text-primary">{messageCount}</span>
        </span>
      )}
      {params.rest.length > 0 && (
        <span className="whitespace-nowrap text-secondary">
          +{params.rest.length}
          {/* Spoken, not labelled: ARIA prohibits a name on a generic element, so an `aria-label` here reached
              the DOM and no reader. The names are text, held out of the visual line. */}
          <span className="sr-only">
            {t(ConversationsTraceI18nKey.InspectorParamsRest, {
              count: params.rest.length,
              names: params.rest.join(', '),
            })}
          </span>
        </span>
      )}
    </div>
  );
};

export default HopParamsLine;
