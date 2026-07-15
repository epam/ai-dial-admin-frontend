import { FC } from 'react';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import ChipRow from '@/src/components/Analytics/QueryBuilder/Common/ChipRow';
import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import FieldChip from '@/src/components/Analytics/QueryBuilder/Common/FieldChip';
import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import {
  bucketFieldOptions,
  fieldDisplayName,
  fieldsToOptions,
} from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { getAggregateWarnings } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { createGroupByColumn, createGroupByFn } from '@/src/components/Analytics/QueryBuilder/utils/state';
import {
  BUCKET_UNIT_OPTIONS,
  GROUP_BY_FUNCTION_HINTS,
  GROUP_BY_SECTION_WARNINGS,
  WARNING_I18N,
} from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryBucketUnit, QueryScalarFn } from '@/src/models/analytics/query';
import { FunctionOption, GroupByRow, QueryBuilderColor } from '@/src/models/analytics/query-builder';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';

const summaryOf = (row: GroupByRow, fields: AnalyticsEntityField[]): string => {
  const field = row.field ? fieldDisplayName(fields, row.field) : '…';
  const args = row.fn === QueryScalarFn.DateBin ? `${row.amount} ${row.unit}, ${field}` : field;
  return `${row.fn}(${args})${row.alias ? ` AS ${row.alias}` : ''}`;
};

const GroupBySection: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  const pickedColumns = new Set(state.groupBy.filter((g) => !g.fn).map((g) => g.field));
  const addOptions = fieldsToOptions(state.fields).filter((f) => !pickedColumns.has(f.name));
  const functionOptions: FunctionOption[] = Object.values(QueryScalarFn).map((fn) => ({
    name: fn,
    hint: t(GROUP_BY_FUNCTION_HINTS[fn]),
  }));

  const warnings = getAggregateWarnings(state).filter((w) => GROUP_BY_SECTION_WARNINGS.includes(w));
  const warning = warnings.length ? warnings.map((w) => t(WARNING_I18N[w])).join(' ') : undefined;

  const columnRows = state.groupBy.filter((g) => !g.fn);
  const fnRows = state.groupBy.filter((g) => g.fn);

  const addColumn = (name: string) => {
    state.groupBy.push(createGroupByColumn(name));
    refresh();
  };

  const addFunction = (name: string) => {
    const fn = name as QueryScalarFn;
    // date_bin only makes sense over a temporal column, so it starts on the first one available.
    const field = fn === QueryScalarFn.DateBin ? bucketFieldOptions(state.fields)[0]?.name || '' : '';
    state.groupBy.push(createGroupByFn(fn, field));
    refresh();
  };

  const removeRow = (row: GroupByRow) => {
    state.groupBy = state.groupBy.filter((g) => g !== row);
    refresh();
  };

  return (
    <SectionBlock
      title={t(QueryBuilderI18nKey.GroupBy)}
      markerClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Dimension].marker}
      warning={warning}
      action={
        <CategorizedFieldDropdown
          id="qb-groupby-add"
          options={addOptions}
          functions={functionOptions}
          onSelect={addColumn}
          onSelectFunction={addFunction}
          addLabel={t(QueryBuilderI18nKey.AddField)}
          ariaLabel={`${t(QueryBuilderI18nKey.GroupBy)}: ${t(QueryBuilderI18nKey.AddField)}`}
        />
      }
    >
      <div className="flex flex-col gap-1.5">
        {!!columnRows.length && (
          <div className="flex flex-wrap gap-1.5">
            {columnRows.map((row) => (
              <FieldChip
                key={row.id}
                label={fieldDisplayName(state.fields, row.field)}
                onRemove={() => removeRow(row)}
              />
            ))}
          </div>
        )}
        {fnRows.map((row) => (
          <ChipRow
            key={row.id}
            inline
            color={QueryBuilderColor.Dimension}
            summary={summaryOf(row, state.fields)}
            onRemove={() => removeRow(row)}
          >
            {row.fn === QueryScalarFn.DateBin && (
              <>
                <CompactInput
                  ariaLabel={t(QueryBuilderI18nKey.Every)}
                  className="w-[44px] shrink-0"
                  numeric
                  value={String(row.amount)}
                  onChange={(value) => {
                    row.amount = Number(value || 0);
                    refresh();
                  }}
                />
                <div className="w-[92px] shrink-0">
                  <CompactSelect
                    ariaLabel={t(QueryBuilderI18nKey.Unit)}
                    options={BUCKET_UNIT_OPTIONS}
                    value={row.unit}
                    onChange={(v) => {
                      row.unit = v as QueryBucketUnit;
                      refresh();
                    }}
                  />
                </div>
              </>
            )}
            <div className="min-w-0 flex-1">
              <CategorizedFieldDropdown
                id={`qb-groupby-field-${row.id}`}
                options={
                  row.fn === QueryScalarFn.DateBin
                    ? fieldsToOptions(bucketFieldOptions(state.fields))
                    : fieldsToOptions(state.fields)
                }
                value={row.field}
                placeholder={
                  row.fn === QueryScalarFn.DateBin
                    ? t(QueryBuilderI18nKey.TimestampFieldPlaceholder)
                    : t(QueryBuilderI18nKey.FieldPlaceholder)
                }
                ariaLabel={t(QueryBuilderI18nKey.Field)}
                onSelect={(name) => {
                  row.field = name;
                  refresh();
                }}
              />
            </div>
            <CompactInput
              ariaLabel={t(QueryBuilderI18nKey.AliasPlaceholder)}
              className="w-[72px] shrink-0"
              value={row.alias}
              placeholder={t(QueryBuilderI18nKey.AliasPlaceholder)}
              onChange={(value) => {
                row.alias = value;
                refresh();
              }}
            />
          </ChipRow>
        ))}
        {!state.groupBy.length && (
          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoFields)}</span>
        )}
      </div>
    </SectionBlock>
  );
};

export default GroupBySection;
