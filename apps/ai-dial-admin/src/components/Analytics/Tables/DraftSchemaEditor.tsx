'use client';

import { FC } from 'react';

import { DialSelectField } from '@epam/ai-dial-ui-kit';

import ColumnRowsEditor from '@/src/components/Analytics/Tables/ColumnRowsEditor';
import KeyFieldLabel from '@/src/components/Analytics/Tables/KeyFieldLabel';
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
  const {
    form,
    update,
    columnOptions,
    temporalNames,
    identityNames,
    versionNames,
    grainOptions,
    columnErrors,
    scanPairRequired,
    scanPairIncomplete,
  } = draft;

  // The pair is all-or-nothing: mark whichever half is still empty, so the disabled Save has a visible cause.
  // Once the table stores a pair, clearing both is not an escape route either — hence the separate message.
  const pairError = scanPairIncomplete
    ? t(scanPairRequired ? AnalyticsTablesI18nKey.ScanPairRequired : AnalyticsTablesI18nKey.ScanPairIncomplete)
    : '';
  const identityError = !form.identityColumn ? pairError : '';
  const versionError = !form.versionColumn ? pairError : '';

  return (
    <div className="flex flex-col gap-4">
      {table.status === TableStatus.Failed && (
        <p className="dial-small-text text-error">{t(AnalyticsTablesI18nKey.ActivationFailedHint)}</p>
      )}

      <div className="flex flex-col gap-2">
        <span className="dial-small-semi text-primary">{t(AnalyticsTablesI18nKey.Columns)}</span>
        <ColumnRowsEditor rows={form.columns} errors={columnErrors} onChange={(rows) => update('columns', rows)} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="dial-small-semi text-primary">{t(AnalyticsTablesI18nKey.Keys)}</span>
        {/* The one sentence every key shares — stated here so no individual hint has to carry it. */}
        <p className="dial-small-text text-secondary">{t(AnalyticsTablesI18nKey.KeysNote)}</p>
      </div>

      {isSource ? (
        <>
          <DialSelectField
            id="draft-ordering-key"
            multiple
            containerClassName={STANDARD_CONTROL_WIDTH}
            label={
              <KeyFieldLabel
                label={t(AnalyticsTablesI18nKey.OrderingKey)}
                hint={t(AnalyticsTablesI18nKey.OrderingKeyHint)}
              />
            }
            required
            options={columnOptions}
            value={form.orderingKey}
            onChange={(v) => update('orderingKey', v as string[])}
          />
          <DialSelectField
            id="draft-partition-col"
            containerClassName={STANDARD_CONTROL_WIDTH}
            label={
              <KeyFieldLabel
                label={t(AnalyticsTablesI18nKey.PartitionColumn)}
                hint={t(AnalyticsTablesI18nKey.PartitionColumnHint)}
              />
            }
            options={[
              { value: '', label: t(AnalyticsTablesI18nKey.PartitionNone) },
              ...temporalNames.map((s) => ({ value: s, label: s })),
            ]}
            value={form.partitionColumn}
            onChange={(v) => update('partitionColumn', v as string)}
          />
          {form.partitionColumn && (
            <DialSelectField
              id="draft-partition-gran"
              containerClassName={STANDARD_CONTROL_WIDTH}
              label={
                <KeyFieldLabel
                  label={t(AnalyticsTablesI18nKey.Granularity)}
                  hint={t(AnalyticsTablesI18nKey.GranularityHint)}
                />
              }
              options={PARTITION_GRANULARITY_OPTIONS}
              value={form.granularity}
              onChange={(v) => update('granularity', v as PartitionGranularity | '')}
            />
          )}
          <DialSelectField
            id="draft-identity-col"
            containerClassName={STANDARD_CONTROL_WIDTH}
            label={
              <KeyFieldLabel
                label={t(AnalyticsTablesI18nKey.IdentityColumn)}
                hint={t(AnalyticsTablesI18nKey.IdentityColumnHint)}
              />
            }
            required={scanPairRequired}
            options={[
              { value: '', label: t(AnalyticsTablesI18nKey.PartitionNone) },
              ...identityNames.map((s) => ({ value: s, label: s })),
            ]}
            value={form.identityColumn}
            error={identityError}
            invalid={Boolean(identityError)}
            onChange={(v) => update('identityColumn', v as string)}
          />
          <DialSelectField
            id="draft-version-col"
            containerClassName={STANDARD_CONTROL_WIDTH}
            label={
              <KeyFieldLabel
                label={t(AnalyticsTablesI18nKey.VersionColumn)}
                hint={t(AnalyticsTablesI18nKey.VersionColumnHint)}
              />
            }
            required={scanPairRequired}
            options={[
              { value: '', label: t(AnalyticsTablesI18nKey.PartitionNone) },
              ...versionNames.map((s) => ({ value: s, label: s })),
            ]}
            value={form.versionColumn}
            error={versionError}
            invalid={Boolean(versionError)}
            onChange={(v) => update('versionColumn', v as string)}
          />
        </>
      ) : (
        <DialSelectField
          id="draft-grain-key"
          containerClassName={STANDARD_CONTROL_WIDTH}
          label={
            <KeyFieldLabel label={t(AnalyticsTablesI18nKey.GrainKey)} hint={t(AnalyticsTablesI18nKey.GrainKeyHint)} />
          }
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
