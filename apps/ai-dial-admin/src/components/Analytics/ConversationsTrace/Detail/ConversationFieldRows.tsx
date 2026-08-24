'use client';

import { DialEllipsisTooltip, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationFieldState,
  ConversationPanelLayout,
  ResolvedConversationField,
} from '@/src/models/analytics/conversations-trace';

const HINT_ICON_SIZE = 14;

// A caveat on a figure has to reach a keyboard, and a `<dt>` takes no focus — so the hint hangs off a real
// control whose accessible name *is* the caveat, with the icon hidden so it does not compete with that name.
// Focus-visible mirrors hover, so a keyboard gets the same feedback a pointer does.
const FieldHint: FC<{ hint: string }> = ({ hint }) => (
  <DialTooltip tooltip={<span>{hint}</span>}>
    <button
      type="button"
      aria-label={hint}
      className="flex shrink-0 items-center text-secondary hover:text-accent-primary focus-visible:text-accent-primary"
    >
      <IconInfoCircle size={HINT_ICON_SIZE} aria-hidden />
    </button>
  </DialTooltip>
);

interface ValueProps {
  field: ResolvedConversationField;
  className?: string;
}

const FieldValue: FC<ValueProps> = ({ field: { state, text }, className }) => {
  const t = useI18n();

  if (state === ConversationFieldState.Unavailable) {
    return (
      <span className="text-secondary" title={t(ConversationsTraceI18nKey.DetailNotRecorded)}>
        {UNAVAILABLE_VALUE}
      </span>
    );
  }

  if (state === ConversationFieldState.Empty) {
    return <span className="italic text-secondary">{t(ConversationsTraceI18nKey.DetailEmptyValue)}</span>;
  }

  return (
    <span className={classNames('min-w-0', className)}>
      <DialEllipsisTooltip text={text} contentClassName="break-all" />
    </span>
  );
};

interface Props {
  fields: ResolvedConversationField[];
  layout: ConversationPanelLayout;
}

const ConversationFieldRows: FC<Props> = ({ fields, layout }) => {
  const t = useI18n();

  if (layout === ConversationPanelLayout.Grid) {
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((field) => (
          <div key={field.labelKey} className="flex min-w-0 flex-col gap-0.5">
            <dt className="flex items-center gap-1 text-secondary dial-tiny-text">
              {t(field.labelKey)}
              {field.hintKey && <FieldHint hint={t(field.hintKey)} />}
            </dt>
            <dd className="min-w-0 text-primary dial-base-semi-text">
              <FieldValue field={field} className={field.accentClassName} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className="flex flex-col divide-y divide-tertiary dial-small-text">
      {fields.map((field) => (
        <div
          key={field.labelKey}
          className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 py-1.5 first:pt-0 last:pb-0"
        >
          <dt className="flex items-center gap-1 font-mono text-secondary dial-tiny-text">
            {t(field.labelKey)}
            {field.hintKey && <FieldHint hint={t(field.hintKey)} />}
          </dt>
          <dd className="min-w-0 text-right font-mono text-primary dial-tiny-text">
            <FieldValue field={field} className={field.accentClassName} />
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default ConversationFieldRows;
