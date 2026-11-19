'use client';

import { Notification, NotificationType, NotificationVariant, RadioGroup, Select } from '@epam/ai-dial-ui-kit';
import { FC, useMemo } from 'react';

import { LIMIT_STEP_HEADING } from '@/src/components/Analytics/Tables/access/constants';
import { ColumnsMode } from '@/src/components/Analytics/Tables/access/models';
import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsTable, AnalyticsTableColumn } from '@/src/models/analytics/table';

interface Props {
  stepNumber: number;
  columns: AnalyticsTableColumn[];
  enrichments: AnalyticsTable[];
  hasEnrichmentsFailed: boolean;
  mode: ColumnsMode;
  value: string[];
  isDisabled: boolean;
  onChangeMode: (mode: ColumnsMode) => void;
  onChange: (value: string[]) => void;
}

const ColumnLimitStep: FC<Props> = ({
  stepNumber,
  columns,
  enrichments,
  hasEnrichmentsFailed,
  mode,
  value,
  isDisabled,
  onChangeMode,
  onChange,
}) => {
  const t = useI18n();
  const heading = t(AnalyticsTableAccessI18nKey.StepColumns, { number: stepNumber });

  const options = useMemo(() => {
    const own = columns.map((column) => ({
      value: column.name,
      label: column.name,
      description: column.sensitive ? t(AnalyticsTableAccessI18nKey.ColumnSensitive) : undefined,
    }));
    const enriched = enrichments.flatMap((enrichment) =>
      (enrichment.columns ?? []).map((column) => ({
        value: `${enrichment.name}.${column.name}`,
        label: `${enrichment.name}.${column.name}`,
      })),
    );
    const known = new Set([...own, ...enriched].map((option) => option.value));
    const kept = value.filter((name) => !known.has(name)).map((name) => ({ value: name, label: name }));

    return [...own, ...enriched, ...kept];
  }, [columns, enrichments, value, t]);

  return (
    <section className="flex flex-col gap-2">
      <h3 className={LIMIT_STEP_HEADING}>{heading}</h3>
      <RadioGroup
        ariaLabel={heading}
        value={mode}
        items={[
          { value: ColumnsMode.All, label: t(AnalyticsTableAccessI18nKey.ColumnsAll) },
          { value: ColumnsMode.Some, label: t(AnalyticsTableAccessI18nKey.ColumnsSome) },
        ]}
        onChange={(next) => onChangeMode(next as ColumnsMode)}
      />
      <p className="dial-tiny-text text-secondary">{t(AnalyticsTableAccessI18nKey.ColumnsScope)}</p>
      {mode === ColumnsMode.Some && (
        <>
          <Select
            ariaLabel={heading}
            placeholder={t(AnalyticsTableAccessI18nKey.ColumnsPlaceholder)}
            options={options}
            value={value}
            multiple
            searchable
            disabled={isDisabled}
            onChange={(next) => onChange(next as string[])}
          />
          {hasEnrichmentsFailed && (
            <Notification
              type={NotificationType.SectionMessage}
              variant={NotificationVariant.Warning}
              message={t(AnalyticsTableAccessI18nKey.ColumnsEnrichmentsFailed)}
            />
          )}
          <p className="dial-tiny-text text-secondary">{t(AnalyticsTableAccessI18nKey.DerivedTablesNote)}</p>
        </>
      )}
    </section>
  );
};

export default ColumnLimitStep;
