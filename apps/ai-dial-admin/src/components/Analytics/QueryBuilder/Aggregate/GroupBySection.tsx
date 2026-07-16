import { FC } from 'react';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import ChipRow from '@/src/components/Analytics/QueryBuilder/Common/ChipRow';
import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import FieldChip from '@/src/components/Analytics/QueryBuilder/Common/FieldChip';
import FnArgEditor from '@/src/components/Analytics/QueryBuilder/Aggregate/FnArgEditor';
import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { fieldDisplayName, fieldsToOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import {
  functionArgSummary,
  functionByName,
  scalarFunctions,
} from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { getAggregateWarnings } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { createGroupByColumn, createGroupByFn } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { GROUP_BY_SECTION_WARNINGS, WARNING_I18N } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { FunctionOption, GroupByRow, QueryBuilderColor } from '@/src/models/analytics/query-builder';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';

const summaryOf = (row: GroupByRow, functions: QueryFunction[], fields: AnalyticsEntityField[]): string => {
  const fn = functionByName(functions, row.fn);
  const inner = fn ? functionArgSummary(fn, row.args, (name) => fieldDisplayName(fields, name)) : '';
  return `${row.fn}(${inner})${row.alias ? ` AS ${row.alias}` : ''}`;
};

const GroupBySection: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  const pickedColumns = new Set(state.groupBy.filter((g) => !g.fn).map((g) => g.field));
  const addOptions = fieldsToOptions(state.fields).filter((f) => !pickedColumns.has(f.name));
  // The Functions group is sourced entirely from the served catalog's scalar functions.
  const functionOptions: FunctionOption[] = scalarFunctions(state.functions).map((fn) => ({
    name: fn.name,
    hint: fn.description,
  }));

  const warnings = getAggregateWarnings(state).filter((w) => GROUP_BY_SECTION_WARNINGS.includes(w));
  const warning = warnings.length ? warnings.map((w) => t(WARNING_I18N[w])).join(' ') : undefined;

  const columnRows = state.groupBy.filter((g) => !g.fn);
  const fnRows = state.groupBy.filter((g) => g.fn);
  const fieldOptions = fieldsToOptions(state.fields);

  const addColumn = (name: string) => {
    state.groupBy.push(createGroupByColumn(name));
    refresh();
  };

  const addFunction = (name: string) => {
    const fn = functionByName(state.functions, name);
    if (!fn) return;
    state.groupBy.push(createGroupByFn(fn));
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
        {fnRows.map((row) => {
          const fn = functionByName(state.functions, row.fn);
          return (
            <ChipRow
              key={row.id}
              inline
              color={QueryBuilderColor.Dimension}
              summary={summaryOf(row, state.functions, state.fields)}
              onRemove={() => removeRow(row)}
            >
              {fn?.args.map((arg, i) => (
                <FnArgEditor
                  key={`${row.id}-${i}`}
                  id={`qb-groupby-${row.id}-arg-${i}`}
                  arg={arg}
                  value={row.args[i] ?? {}}
                  fieldOptions={fieldOptions}
                  onChange={(value) => {
                    row.args[i] = value;
                    refresh();
                  }}
                />
              ))}
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
          );
        })}
        {!state.groupBy.length && (
          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoFields)}</span>
        )}
      </div>
    </SectionBlock>
  );
};

export default GroupBySection;
