'use client';

import { FC, useState } from 'react';

import { DialRadioGroup, DialSelectField, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SourceMode } from '@/src/models/analytics/enrichment-rules-ui';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';
import { getSourceMode } from '@/src/utils/analytics/rule-dto';

interface Props {
  className?: string;
  source?: string;
  sourceTable?: string;
  tables: AnalyticsTable[];
  onChange: (source?: string) => void;
}

/**
 * Follow-vs-pin is inferred, not stored (see `getSourceMode`). The inference is rendered rather than applied
 * silently, so an operator can see it and correct it.
 */
const SourceField: FC<Props> = ({ className, source, sourceTable, tables, onChange }) => {
  const t = useI18n();

  // Seeded from the inference, then owned by the operator. Deriving it from the value on every render made
  // "pin" unreachable: any table they picked that equalled the followed one read back as "follow", so the
  // radio snapped back. The value cannot express the choice, so the choice is held here.
  const [mode, setMode] = useState(() => getSourceMode(source, sourceTable));

  const options = tables
    .filter((table) => table.type === AnalyticsTableType.Source)
    .map((table) => ({ value: table.name, label: table.name }));

  const radios: RadioButtonWithContent[] = [
    {
      id: SourceMode.Follow,
      name: t(AnalyticsEnrichmentRulesI18nKey.SourceFollow),
      content: (
        <span className="text-secondary dial-tiny-text">
          {sourceTable
            ? `${t(AnalyticsEnrichmentRulesI18nKey.SourceFollowCaption)} ${sourceTable}`
            : t(AnalyticsEnrichmentRulesI18nKey.SourceFollowUnresolved)}
        </span>
      ),
    },
    {
      id: SourceMode.Pin,
      name: t(AnalyticsEnrichmentRulesI18nKey.SourcePin),
      content: (
        <span className="text-secondary dial-tiny-text">{t(AnalyticsEnrichmentRulesI18nKey.SourcePinCaption)}</span>
      ),
    },
  ];

  const onChangeMode = (next: string) => {
    setMode(next as SourceMode);
    // Following is the absence of a source; pinning leaves the table to be chosen below.
    if (next === SourceMode.Follow) {
      onChange(undefined);
    }
  };

  return (
    <div className={classNames('flex flex-col gap-3', className)}>
      <DialRadioGroup
        elementId="rule-source-mode"
        fieldTitle={t(AnalyticsEnrichmentRulesI18nKey.Source)}
        orientation={RadioGroupOrientation.Column}
        radioButtons={radios}
        activeRadioButton={mode}
        onChange={onChangeMode}
      />

      {mode === SourceMode.Pin && (
        <DialSelectField
          id="rule-source"
          label={t(AnalyticsEnrichmentRulesI18nKey.SourceTable)}
          options={options}
          value={source ?? ''}
          onChange={(v) => onChange(v as string)}
        />
      )}
    </div>
  );
};

export default SourceField;
