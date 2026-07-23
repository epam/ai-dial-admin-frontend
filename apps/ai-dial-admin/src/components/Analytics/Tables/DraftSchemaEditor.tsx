'use client';

import { FC } from 'react';

import { DialSelectField } from '@epam/ai-dial-ui-kit';

import ColumnRowsEditor from '@/src/components/Analytics/Tables/ColumnRowsEditor';
import { useDraftSchemaForm } from '@/src/components/Analytics/Tables/use-draft-schema-form';
import { PARTITION_GRANULARITY_OPTIONS } from '@/src/constants/analytics/tables';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { AnalyticsTable, AnalyticsTableType, PartitionGranularity, TableStatus } from '@/src/models/analytics/table';

interface Props {
  table: AnalyticsTable;
  draft: ReturnType<typeof useDraftSchemaForm>;
}

// No submit control here — Save lives in TableDetailView's header, driven by the same `draft`.
const DraftSchemaEditor: FC<Props> = ({ table, draft }) => {
  const t = useI18n();
  const isSource = table.type === AnalyticsTableType.Source;
  const { form, update, columnOptions, temporalNames, grainOptions, columnErrors } = draft;

  return (
    <div className="flex flex-col gap-4">
      {table.status === TableStatus.Failed && (
        <p className="dial-small-text text-error">{t(AnalyticsTablesI18nKey.ActivationFailedHint)}</p>
      )}

      <div className="flex flex-col gap-2">
        <span className="dial-small-semi text-primary">{t(AnalyticsTablesI18nKey.Columns)}</span>
        <ColumnRowsEditor rows={form.columns} errors={columnErrors} onChange={(rows) => update('columns', rows)} />
      </div>

      {isSource ? (
        <>
          <DialSelectField
            id="draft-ordering-key"
            multiple
            containerClassName={STANDARD_CONTROL_WIDTH}
            label={t(AnalyticsTablesI18nKey.OrderingKey)}
            required
            options={columnOptions}
            value={form.orderingKey}
            onChange={(v) => update('orderingKey', v as string[])}
          />
          <DialSelectField
            id="draft-partition-col"
            containerClassName={STANDARD_CONTROL_WIDTH}
            label={t(AnalyticsTablesI18nKey.PartitionColumn)}
            options={[
              { value: '', label: t(AnalyticsTablesI18nKey.PartitionNone) },
              ...temporalNames.map((s) => ({ value: s, label: s })),
            ]}
            value={form.partitionColumn}
            onChange={(v) => update('partitionColumn', v as string)}
          />
          <DialSelectField
            id="draft-partition-gran"
            containerClassName={STANDARD_CONTROL_WIDTH}
            label={t(AnalyticsTablesI18nKey.Granularity)}
            options={PARTITION_GRANULARITY_OPTIONS}
            value={form.granularity}
            onChange={(v) => update('granularity', v as PartitionGranularity | '')}
          />
        </>
      ) : (
        <DialSelectField
          id="draft-grain-key"
          containerClassName={STANDARD_CONTROL_WIDTH}
          label={t(AnalyticsTablesI18nKey.GrainKey)}
          required
          options={grainOptions}
          value={form.grainKey}
          onChange={(v) => update('grainKey', v as string)}
        />
      )}
    </div>
  );
};

export default DraftSchemaEditor;
