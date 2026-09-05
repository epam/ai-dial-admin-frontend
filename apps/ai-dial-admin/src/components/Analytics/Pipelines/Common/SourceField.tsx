'use client';

import { FC, useState } from 'react';

import { DialRadioGroup, DialSelectField, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SourceMode } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';
import { getSourceMode } from '@/src/utils/analytics/pipeline-dto';

interface Props {
  className?: string;
  input?: string;
  sourceTable?: string;
  tables: AnalyticsTable[];
  onChange: (input?: string) => void;
}

/**
 * Follow-vs-pin is inferred, not stored (see `getSourceMode`). The inference is rendered rather than applied
 * silently, so an operator can see it and correct it.
 */
const SourceField: FC<Props> = ({ className, input, sourceTable, tables, onChange }) => {
  const t = useI18n();

  // Seeded from the inference, then owned by the operator. Deriving it from the value on every render made
  // "pin" unreachable: any table they picked that equalled the followed one read back as "follow", so the
  // radio snapped back. The value cannot express the choice, so the choice is held here.
  const [mode, setMode] = useState(() => getSourceMode(input ? [input] : undefined, sourceTable));

  const options = tables
    .filter((table) => table.type === AnalyticsTableType.Source)
    .map((table) => ({ value: table.name, label: table.name }));

  const radios: RadioButtonWithContent[] = [
    {
      id: SourceMode.Follow,
      name: t(AnalyticsPipelinesI18nKey.SourceFollow),
      content: (
        <span className="text-secondary dial-tiny-text">
          {sourceTable
            ? `${t(AnalyticsPipelinesI18nKey.SourceFollowCaption)} ${sourceTable}`
            : t(AnalyticsPipelinesI18nKey.SourceFollowUnresolved)}
        </span>
      ),
    },
    {
      id: SourceMode.Pin,
      name: t(AnalyticsPipelinesI18nKey.SourcePin),
      content: <span className="text-secondary dial-tiny-text">{t(AnalyticsPipelinesI18nKey.SourcePinCaption)}</span>,
    },
  ];

  const onChangeMode = (next: string) => {
    setMode(next as SourceMode);
    if (next === SourceMode.Follow) {
      onChange(undefined);
    }
  };

  return (
    <div className={classNames('flex flex-col gap-3', className)}>
      <DialRadioGroup
        elementId="pipeline-source-mode"
        fieldTitle={t(AnalyticsPipelinesI18nKey.Source)}
        orientation={RadioGroupOrientation.Column}
        radioButtons={radios}
        activeRadioButton={mode}
        onChange={onChangeMode}
      />

      {mode === SourceMode.Pin && (
        <DialSelectField
          id="pipeline-input"
          label={t(AnalyticsPipelinesI18nKey.SourceTable)}
          options={options}
          value={input ?? ''}
          onChange={(v) => onChange(v as string)}
        />
      )}
    </div>
  );
};

export default SourceField;
