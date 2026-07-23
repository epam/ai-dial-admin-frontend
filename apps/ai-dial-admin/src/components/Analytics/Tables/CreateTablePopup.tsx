'use client';

import { FC, useState } from 'react';

import { useRouter } from 'next/navigation';

import { DialFormPopup, DialInput, DialSelectField, PopupSize } from '@epam/ai-dial-ui-kit';

import { createTable } from '@/src/app/[lang]/tables/actions';
import { createTableForm, tableDetailHref } from '@/src/components/Analytics/Tables/utils';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AnalyticsTable, AnalyticsTableType, CreateTableDto } from '@/src/models/analytics/table';
import { CreateTableForm } from '@/src/models/analytics/tables-ui';
import { getAnalyticsIdentifierError } from '@/src/utils/validation/analytics-table-error';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  tableType: AnalyticsTableType;
  tables: AnalyticsTable[];
  onClose: () => void;
  onCreated: () => void;
}

const CreateTablePopup: FC<Props> = ({ tableType, tables, onClose, onCreated }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const isSource = tableType === AnalyticsTableType.Source;

  const [form, setForm] = useState<CreateTableForm>(() => createTableForm(tables));

  const update = <K extends keyof CreateTableForm>(key: K, value: CreateTableForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const sourceOptions = tables
    .filter((tbl) => tbl.type === AnalyticsTableType.Source)
    .map((tbl) => ({ value: tbl.name, label: tbl.name }));

  const existingNames = tables.map((tbl) => tbl.name);
  const nameError = getAnalyticsIdentifierError(form.name, existingNames, t);

  const canSubmit = Boolean(form.name.trim()) && !nameError && (isSource || Boolean(form.sourceTable));

  const onSubmit = async () => {
    const trimmed = form.name.trim();
    if (!canSubmit) return;

    const dto: CreateTableDto = isSource
      ? {
          name: trimmed,
          type: AnalyticsTableType.Source,
          ...(form.description.trim() ? { description: form.description.trim() } : {}),
        }
      : {
          name: trimmed,
          type: AnalyticsTableType.Enrichment,
          source_table: form.sourceTable,
          ...(form.description.trim() ? { description: form.description.trim() } : {}),
        };

    const res = await createTable(dto);
    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.Created)));
      onCreated();
      onClose();
      router.push(tableDetailHref(trimmed));
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
      size={PopupSize.Sm}
      header={t(isSource ? AnalyticsTablesI18nKey.CreateSourceTitle : AnalyticsTablesI18nKey.CreateEnrichmentTitle)}
      submitLabel={t(isSource ? AnalyticsTablesI18nKey.CreateSource : AnalyticsTablesI18nKey.CreateEnrichment)}
      disableSubmitButton={!canSubmit}
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-4 p-6">
        <DialInput
          id="table-name"
          labelProps={{ label: t(AnalyticsTablesI18nKey.Name), required: true }}
          value={form.name}
          error={nameError?.text}
          invalid={Boolean(nameError)}
          onChange={(v) => update('name', v ?? '')}
        />
        <DialInput
          id="table-description"
          labelProps={{ label: t(AnalyticsTablesI18nKey.Description) }}
          value={form.description}
          onChange={(v) => update('description', v ?? '')}
        />
        {!isSource && (
          <DialSelectField
            id="table-source"
            required
            label={t(AnalyticsTablesI18nKey.SourceTable)}
            options={sourceOptions}
            value={form.sourceTable}
            onChange={(v) => update('sourceTable', v as string)}
          />
        )}
      </div>
    </DialFormPopup>
  );
};

export default CreateTablePopup;
