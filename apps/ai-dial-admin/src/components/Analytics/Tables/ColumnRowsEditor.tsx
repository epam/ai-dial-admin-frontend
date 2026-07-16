import { FC } from 'react';

import { DialGhostButton, DialInput, DialRemoveButton, DialSelectField, DialSwitch } from '@epam/ai-dial-ui-kit';

import { COLUMN_TYPE_OPTIONS } from '@/src/constants/analytics/tables';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { createColumnRow } from '@/src/components/Analytics/Tables/utils';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { ColumnRow } from '@/src/models/analytics/tables-ui';

interface Props {
  rows: ColumnRow[];
  onChange: (rows: ColumnRow[]) => void;
}

const ColumnRowsEditor: FC<Props> = ({ rows, onChange }) => {
  const t = useI18n();

  const update = (id: string, patch: Partial<ColumnRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => {
        const first = index === 0;
        return (
          <div key={row.id} className="flex items-end gap-2">
            <DialInput
              id={`col-source-${row.id}`}
              containerClassName="flex-1 min-w-[120px]"
              labelProps={first ? { label: t(AnalyticsTablesI18nKey.SourceName) } : undefined}
              value={row.source_name}
              onChange={(v) => update(row.id, { source_name: v ?? '' })}
            />
            <DialInput
              id={`col-name-${row.id}`}
              containerClassName="flex-1 min-w-[120px]"
              labelProps={first ? { label: t(AnalyticsTablesI18nKey.ColumnName) } : undefined}
              value={row.name}
              onChange={(v) => update(row.id, { name: v ?? '' })}
            />
            <DialSelectField
              id={`col-type-${row.id}`}
              containerClassName="w-[120px] shrink-0"
              label={first ? t(AnalyticsTablesI18nKey.Type) : undefined}
              options={COLUMN_TYPE_OPTIONS}
              value={row.type}
              onChange={(v) => update(row.id, { type: v as AnalyticsFieldType })}
            />
            <DialInput
              id={`col-tag-${row.id}`}
              containerClassName="w-[120px] shrink-0"
              labelProps={first ? { label: t(AnalyticsTablesI18nKey.Tag) } : undefined}
              value={row.tag}
              onChange={(v) => update(row.id, { tag: v ?? '' })}
            />
            <div className="flex h-[38px] items-center gap-2">
              <DialSwitch
                switchId={`col-nullable-${row.id}`}
                label={t(AnalyticsTablesI18nKey.Nullable)}
                isOn={row.nullable}
                onChange={(value) => update(row.id, { nullable: value })}
              />
              <DialSwitch
                switchId={`col-sensitive-${row.id}`}
                label={t(AnalyticsTablesI18nKey.Sensitive)}
                isOn={row.sensitive}
                onChange={(value) => update(row.id, { sensitive: value })}
              />
              <DialRemoveButton onClick={() => onChange(rows.filter((r) => r.id !== row.id))} />
            </div>
          </div>
        );
      })}
      <div>
        <DialGhostButton
          label={t(AnalyticsTablesI18nKey.AddColumn)}
          onClick={() => onChange([...rows, createColumnRow()])}
        />
      </div>
    </div>
  );
};

export default ColumnRowsEditor;
