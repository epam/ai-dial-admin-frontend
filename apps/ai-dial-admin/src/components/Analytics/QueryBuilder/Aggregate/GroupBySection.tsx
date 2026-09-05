import { FC } from 'react';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import FieldChip from '@/src/components/Analytics/QueryBuilder/Common/FieldChip';
import FunctionRow from '@/src/components/Analytics/QueryBuilder/Common/FunctionRow';
import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import {
  fieldDisplayName,
  fieldsToOptions,
  prefilledAlias,
} from '@/src/components/Analytics/QueryBuilder/utils/fields';
import {
  emptyArgs,
  functionByName,
  scalarFunctionOptions,
} from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { getAggregateWarnings } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import {
  createColumnRow,
  createFnRow,
  renamedFilterFields,
  renamedSortKeys,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { GROUP_BY_SECTION_WARNINGS, WARNING_I18N } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FieldDropdownMode, GroupByRow, QueryBuilderColor } from '@/src/models/analytics/query-builder';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';

const GroupBySection: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  // Picked columns stay listed so the dropdown can show them as selected and toggle them back off.
  const pickedColumns = state.groupBy.filter((g) => !g.fn).map((g) => g.field);
  const addOptions = fieldsToOptions(state.fields);
  // The Functions group is sourced entirely from the served catalog's scalar functions.
  const functionOptions = scalarFunctionOptions(state.functions);

  const warnings = getAggregateWarnings(state).filter((w) => GROUP_BY_SECTION_WARNINGS.includes(w));
  const warning = warnings.length ? warnings.map((w) => t(WARNING_I18N[w])).join(' ') : undefined;

  const columnRows = state.groupBy.filter((g) => !g.fn);
  const fnRows = state.groupBy.filter((g) => g.fn);
  const fieldOptions = fieldsToOptions(state.fields);

  const toggleColumn = (name: string) => {
    const picked = state.groupBy.find((g) => !g.fn && g.field === name);
    if (picked) state.groupBy = state.groupBy.filter((g) => g !== picked);
    else state.groupBy.push(createColumnRow(name));
    refresh();
  };

  const addFunction = (name: string) => {
    const fn = functionByName(state.functions, name);
    if (!fn) return;
    const args = emptyArgs(fn);
    state.groupBy.push(createFnRow(fn, args, prefilledAlias(state, fn, args, false)));
    refresh();
  };

  const syncAlias = (row: GroupByRow) => {
    const fn = functionByName(state.functions, row.fn);
    if (!fn || row.aliasEdited) return;
    const next = prefilledAlias(state, fn, row.args, false, row.id);
    if (next === row.alias) return;
    state.sort = renamedSortKeys(state.sort, row.alias, next);
    state.having = renamedFilterFields(state.having, row.alias, next);
    row.alias = next;
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
          mode={FieldDropdownMode.MultiAdd}
          options={addOptions}
          selected={pickedColumns}
          functions={functionOptions}
          onSelect={toggleColumn}
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
          <FunctionRow
            key={row.id}
            id={`qb-groupby-${row.id}`}
            row={row}
            fn={functionByName(state.functions, row.fn)}
            fields={state.fields}
            fieldOptions={fieldOptions}
            color={QueryBuilderColor.Dimension}
            onChangeArg={(index, value) => {
              row.args[index] = value;
              syncAlias(row);
              refresh();
            }}
            onChangeAlias={(alias) => {
              row.alias = alias;
              row.aliasEdited = true;
              refresh();
            }}
            onRemove={() => removeRow(row)}
          />
        ))}
        {!state.groupBy.length && (
          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoFields)}</span>
        )}
      </div>
    </SectionBlock>
  );
};

export default GroupBySection;
