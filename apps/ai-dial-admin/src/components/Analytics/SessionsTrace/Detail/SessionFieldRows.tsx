'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC } from 'react';

import SessionTermList from '@/src/components/Analytics/SessionsTrace/Detail/SessionTermList';
import FieldCaveat from '@/src/components/Common/FieldCaveat/FieldCaveat';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionFieldState, SessionPanelLayout, ResolvedSessionField } from '@/src/models/analytics/sessions-trace';

interface ValueProps {
  field: ResolvedSessionField;
  className?: string;
  // Headline figures share their row with a second column, so a long one is clamped here. A field in the
  // rail's label-and-value register is clamped by the register itself — see `SessionTermList`.
  isClamped?: boolean;
}

const FieldValue: FC<ValueProps> = ({ field: { state, text }, className, isClamped }) => {
  const t = useI18n();

  if (state === SessionFieldState.Unavailable) {
    return (
      <span className="text-secondary" title={t(SessionsTraceI18nKey.DetailNotRecorded)}>
        {UNAVAILABLE_VALUE}
      </span>
    );
  }

  if (state === SessionFieldState.Empty) {
    return <span className="italic text-secondary">{t(SessionsTraceI18nKey.DetailEmptyValue)}</span>;
  }

  if (isClamped) {
    return (
      <span className={classNames('min-w-0', className)}>
        <DialEllipsisTooltip text={text} contentClassName="break-all" />
      </span>
    );
  }

  return <span className={className}>{text}</span>;
};

interface Props {
  fields: ResolvedSessionField[];
  layout: SessionPanelLayout;
}

const SessionFieldRows: FC<Props> = ({ fields, layout }) => {
  const t = useI18n();

  if (layout === SessionPanelLayout.Grid) {
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((field) => (
          <div key={field.labelKey} className="flex min-w-0 flex-col gap-0.5">
            <dt className="flex items-center gap-1 text-secondary dial-tiny-text">
              {t(field.labelKey)}
              {field.hintKey && <FieldCaveat hint={t(field.hintKey)} />}
            </dt>
            <dd className="min-w-0 text-primary dial-base-semi-text">
              <FieldValue field={field} className={field.accentClassName} isClamped />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <SessionTermList
      terms={fields.map((field) => ({
        key: field.labelKey,
        label: t(field.labelKey),
        hint: field.hintKey ? t(field.hintKey) : undefined,
        value: <FieldValue field={field} className={field.accentClassName} />,
      }))}
    />
  );
};

export default SessionFieldRows;
