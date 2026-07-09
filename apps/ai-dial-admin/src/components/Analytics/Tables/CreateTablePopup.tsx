'use client';

import { FC, useMemo, useState } from 'react';

import { DialFormPopup, DialInput, DialSelectField, PopupSize } from '@epam/ai-dial-ui-kit';

import { createTable } from '@/src/app/[lang]/tables/actions';
import ColumnRowsEditor from '@/src/components/Analytics/Tables/ColumnRowsEditor';
import { createTableForm, toTableColumns } from '@/src/components/Analytics/Tables/utils';
import { PARTITION_GRANULARITY_OPTIONS } from '@/src/constants/analytics/tables';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableType, CreateTableDto, PartitionGranularity } from '@/src/models/analytics/table';
import { TableForm } from '@/src/models/analytics/tables-ui';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  tableType: AnalyticsTableType;
  tables: AnalyticsTable[];
  onClose: () => void;
  onCreated: () => void;
}

const CreateTablePopup: FC<Props> = ({ tableType, tables, onClose, onCreated }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const isSource = tableType === AnalyticsTableType.Source;

  const [form, setForm] = useState<TableForm>(() => createTableForm(tables));

  const update = <K extends keyof TableForm>(key: K, value: TableForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const sourceOptions = tables
    .filter((tbl) => tbl.type === AnalyticsTableType.Source)
    .map((tbl) => ({ value: tbl.name, label: tbl.name }));

  const grainOptions = (tables.find((tbl) => tbl.name === form.sourceTable)?.ordering_key ?? []).map((k) => ({
    value: k,
    label: k,
  }));

  const temporalNames = useMemo(() => {
    const seen = new Set<string>();
    form.columns.forEach((c) => {
      const s = c.source_name.trim();
      if (s && (c.type === AnalyticsFieldType.Date || c.type === AnalyticsFieldType.Timestamp)) seen.add(s);
    });
    return [...seen];
  }, [form.columns]);

  const onChangeSourceTable = (next: string) =>
    setForm((prev) => ({
      ...prev,
      sourceTable: next,
      grainKey: tables.find((tbl) => tbl.name === next)?.ordering_key?.[0] ?? '',
    }));

  const sourceNames = useMemo(() => {
    const seen = new Set<string>();
    form.columns.forEach((c) => {
      const s = c.source_name.trim();
      if (s) seen.add(s);
    });
    return [...seen];
  }, [form.columns]);
  const columnOptions = sourceNames.map((s) => ({ value: s, label: s }));

  const onSubmit = async () => {
    const trimmed = form.name.trim();
    if (!trimmed) return;

    const validOrdering = form.orderingKey.filter((k) => sourceNames.includes(k));
    const dto: CreateTableDto = isSource
      ? {
          name: trimmed,
          type: AnalyticsTableType.Source,
          columns: toTableColumns(form.columns),
          ...(validOrdering.length ? { ordering_key: validOrdering } : {}),
          ...(form.description.trim() ? { description: form.description.trim() } : {}),
          ...(form.partitionColumn && form.granularity && temporalNames.includes(form.partitionColumn)
            ? { partition_by: { column: form.partitionColumn, granularity: form.granularity } }
            : {}),
        }
      : {
          name: trimmed,
          type: AnalyticsTableType.Enrichment,
          source_table: form.sourceTable,
          grain_key: form.grainKey.trim(),
          ...(form.description.trim() ? { description: form.description.trim() } : {}),
        };

    const res = await createTable(dto);
    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.Created)));
      onCreated();
      onClose();
    } else {
      showNotification(
        getErrorNotification(
          res.errorHeader || t(AnalyticsTablesI18nKey.ActionFailed),
          res.errorMessage,
          res.requestId,
        ),
      );
    }
  };

  return (
    <DialFormPopup
      open
      onClose={onClose}
      portalId="qb-create-table"
      size={PopupSize.Lg}
      header={t(isSource ? AnalyticsTablesI18nKey.CreateSourceTitle : AnalyticsTablesI18nKey.CreateEnrichmentTitle)}
      submitLabel={t(isSource ? AnalyticsTablesI18nKey.CreateSource : AnalyticsTablesI18nKey.CreateEnrichment)}
      disableSubmitButton={!form.name.trim()}
      onSubmit={onSubmit}
    >
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-auto p-6">
        <DialInput
          id="table-name"
          labelProps={{ label: t(AnalyticsTablesI18nKey.Name), required: true }}
          value={form.name}
          onChange={(v) => update('name', v ?? '')}
        />
        <DialInput
          id="table-description"
          labelProps={{ label: t(AnalyticsTablesI18nKey.Description) }}
          value={form.description}
          onChange={(v) => update('description', v ?? '')}
        />

        {isSource ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="dial-small-semi text-primary">{t(AnalyticsTablesI18nKey.Columns)}</span>
              <ColumnRowsEditor rows={form.columns} onChange={(rows) => update('columns', rows)} />
            </div>
            <DialSelectField
              id="table-ordering-key"
              multiple
              label={t(AnalyticsTablesI18nKey.OrderingKey)}
              options={columnOptions}
              value={form.orderingKey}
              onChange={(v) => update('orderingKey', v as string[])}
            />
            <div className="flex items-end gap-2">
              <DialSelectField
                id="table-partition-col"
                containerClassName="flex-1"
                label={t(AnalyticsTablesI18nKey.PartitionColumn)}
                options={[
                  { value: '', label: t(AnalyticsTablesI18nKey.PartitionNone) },
                  ...temporalNames.map((s) => ({ value: s, label: s })),
                ]}
                value={form.partitionColumn}
                onChange={(v) => update('partitionColumn', v as string)}
              />
              <DialSelectField
                id="table-partition-gran"
                containerClassName="w-[140px] shrink-0"
                label={t(AnalyticsTablesI18nKey.Granularity)}
                options={PARTITION_GRANULARITY_OPTIONS}
                value={form.granularity}
                onChange={(v) => update('granularity', v as PartitionGranularity | '')}
              />
            </div>
          </>
        ) : (
          <>
            <DialSelectField
              id="table-source"
              label={t(AnalyticsTablesI18nKey.SourceTable)}
              options={sourceOptions}
              value={form.sourceTable}
              onChange={(v) => onChangeSourceTable(v as string)}
            />
            <DialSelectField
              id="table-grain-key"
              label={t(AnalyticsTablesI18nKey.GrainKey)}
              options={grainOptions}
              value={form.grainKey}
              onChange={(v) => update('grainKey', v as string)}
            />
          </>
        )}
      </div>
    </DialFormPopup>
  );
};

export default CreateTablePopup;
