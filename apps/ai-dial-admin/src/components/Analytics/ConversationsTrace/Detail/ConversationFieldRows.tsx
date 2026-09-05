'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC } from 'react';

import ConversationTermList from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTermList';
import FieldCaveat from '@/src/components/Analytics/ConversationsTrace/FieldCaveat';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationFieldState,
  ConversationPanelLayout,
  ResolvedConversationField,
} from '@/src/models/analytics/conversations-trace';

interface ValueProps {
  field: ResolvedConversationField;
  className?: string;
  // Headline figures share their row with a second column, so a long one is clamped here. A field in the
  // rail's label-and-value register is clamped by the register itself — see `ConversationTermList`.
  isClamped?: boolean;
}

const FieldValue: FC<ValueProps> = ({ field: { state, text }, className, isClamped }) => {
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
              {field.hintKey && <FieldCaveat caveat={t(field.hintKey)} />}
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
    <ConversationTermList
      terms={fields.map((field) => ({
        key: field.labelKey,
        label: t(field.labelKey),
        hint: field.hintKey ? t(field.hintKey) : undefined,
        value: <FieldValue field={field} className={field.accentClassName} />,
      }))}
    />
  );
};

export default ConversationFieldRows;
