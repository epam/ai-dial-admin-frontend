import { FC } from 'react';

import classNames from 'classnames';
import { DialGhostButton, DialInput, DialRemoveButton, DialSelectField, DialSwitch } from '@epam/ai-dial-ui-kit';

import { COLUMN_TYPE_OPTIONS, ELEMENT_TYPE_OPTIONS } from '@/src/constants/analytics/tables';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { createColumnRow } from '@/src/components/Analytics/Tables/utils';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { ColumnRow, ColumnRowError } from '@/src/models/analytics/tables-ui';

interface Props {
  rows: ColumnRow[];
  onChange: (rows: ColumnRow[]) => void;
  // Per-row validation messages, aligned by index with `rows`.
  errors?: ColumnRowError[];
}

// Vertical offset for the trailing (label-less) Nullable/Sensitive/remove-button group on the first row
// when it has an error: with items-start (see rowHasError below), that group would otherwise sit flush
// with the OTHER fields' labels instead of their inputs. The value matches DialLabel's rendered height
// (text line + its bottom margin) — same offset as the equivalent fix in Routes/Paths/Path.tsx.
const LABEL_ROW_OFFSET_CLASS = 'mt-[22px]';

const ColumnRowsEditor: FC<Props> = ({ rows, onChange, errors }) => {
  const t = useI18n();

  const update = (id: string, patch: Partial<ColumnRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => {
        const first = index === 0;
        const rowError = errors?.[index];
        const isArray = row.type === AnalyticsFieldType.Array;
        const onTypeChange = (v: string | string[]) => {
          const type = v as AnalyticsFieldType;
          update(row.id, { type, ...(type !== AnalyticsFieldType.Array ? { element_type: '' } : {}) });
        };
        // A validation error makes that field's column taller (label + input + error text). With
        // items-end (the normal bottom-aligned layout) that drags the erroring column's label out of
        // line with its error-free siblings, so switch to top alignment whenever this row has any error.
        const rowHasError = Boolean(rowError?.source_name || rowError?.name || rowError?.tag || rowError?.element_type);
        return (
          <div key={row.id} className={classNames('flex gap-2', rowHasError ? 'items-start' : 'items-end')}>
            <DialInput
              id={`col-name-${row.id}`}
              containerClassName="flex-[2] min-w-[160px]"
              labelProps={first ? { label: t(AnalyticsTablesI18nKey.ColumnName), required: true } : undefined}
              value={row.name}
              error={rowError?.source_name || rowError?.name}
              invalid={Boolean(rowError?.source_name || rowError?.name)}
              // Source name and name are always identical for a newly-defined column (a column can only
              // diverge from its source name via a later rename, done in the grid on an active table —
              // see TableDetailView's onRenameCell) — so one control fills both DTO fields.
              onChange={(v) => update(row.id, { source_name: v ?? '', name: v ?? '' })}
            />
            <DialSelectField
              id={`col-type-${row.id}`}
              containerClassName="flex-1 min-w-[140px]"
              label={first ? t(AnalyticsTablesI18nKey.Type) : undefined}
              options={COLUMN_TYPE_OPTIONS}
              value={row.type}
              onChange={onTypeChange}
            />
            {isArray && (
              <DialSelectField
                id={`col-element-type-${row.id}`}
                containerClassName="flex-1 min-w-[140px]"
                label={first ? t(AnalyticsTablesI18nKey.ElementType) : undefined}
                required
                options={ELEMENT_TYPE_OPTIONS}
                value={row.element_type}
                error={rowError?.element_type}
                invalid={Boolean(rowError?.element_type)}
                onChange={(v) => update(row.id, { element_type: v as AnalyticsFieldType })}
              />
            )}
            <DialInput
              id={`col-tag-${row.id}`}
              containerClassName="flex-1 min-w-[120px]"
              labelProps={first ? { label: t(AnalyticsTablesI18nKey.Tag) } : undefined}
              value={row.tag}
              error={rowError?.tag}
              invalid={Boolean(rowError?.tag)}
              onChange={(v) => update(row.id, { tag: v ?? '' })}
            />
            <div
              className={classNames('flex h-[38px] items-center gap-2', rowHasError && first && LABEL_ROW_OFFSET_CLASS)}
            >
              <DialSwitch
                switchId={`col-nullable-${row.id}`}
                label={t(AnalyticsTablesI18nKey.Nullable)}
                isOn={!isArray && row.nullable}
                disabled={isArray}
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
