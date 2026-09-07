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
import { hasDroppedProjectionColumn } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { createColumnRow, createFnRow, renamedSortKeys } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { WARNING_I18N } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import {
  FieldDropdownMode,
  QueryBuilderColor,
  QueryBuilderWarning,
  SelectRow,
} from '@/src/models/analytics/query-builder';

// Row-mode projection: entries added in selection order become the query's output columns; no entry
// means the backend's default projection. A function entry is carried under the alias naming its
// output column.
const SelectProjection: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  const options = fieldsToOptions(state.fields);
  const functionOptions = scalarFunctionOptions(state.functions);

  const warning = hasDroppedProjectionColumn(state)
    ? t(WARNING_I18N[QueryBuilderWarning.DroppedProjectionColumn])
    : undefined;

  const columnRows = state.select.filter((s) => !s.fn);
  const fnRows = state.select.filter((s) => s.fn);
  // Picked columns stay listed so the dropdown can show them as selected and toggle them back off.
  const pickedColumns = columnRows.map((s) => s.field);

  const toggleField = (name: string) => {
    const picked = state.select.find((s) => !s.fn && s.field === name);
    if (picked) state.select = state.select.filter((s) => s !== picked);
    else state.select.push(createColumnRow(name));
    refresh();
  };

  const addFunction = (name: string) => {
    const fn = functionByName(state.functions, name);
    if (!fn) return;
    const args = emptyArgs(fn);
    state.select.push(createFnRow(fn, args, prefilledAlias(state, fn, args, false)));
    refresh();
  };

  // A function column is addressable only by its alias, so a rederived alias takes the sort keys
  // naming it along with it. Row mode has no Having — the other list Group by has to rewrite.
  const syncAlias = (row: SelectRow) => {
    const fn = functionByName(state.functions, row.fn);
    if (!fn || row.aliasEdited) return;
    const next = prefilledAlias(state, fn, row.args, false, row.id);
    if (next === row.alias) return;
    state.sort = renamedSortKeys(state.sort, row.alias, next);
    row.alias = next;
  };

  const removeRow = (row: SelectRow) => {
    state.select = state.select.filter((s) => s !== row);
    refresh();
  };

  return (
    <SectionBlock
      title={t(QueryBuilderI18nKey.Select)}
      markerClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Dimension].marker}
      warning={warning}
      action={
        <CategorizedFieldDropdown
          id="qb-select-add"
          mode={FieldDropdownMode.MultiAdd}
          options={options}
          selected={pickedColumns}
          functions={functionOptions}
          onSelect={toggleField}
          onSelectFunction={addFunction}
          addLabel={t(QueryBuilderI18nKey.AddField)}
          ariaLabel={`${t(QueryBuilderI18nKey.Select)}: ${t(QueryBuilderI18nKey.AddField)}`}
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
            id={`qb-select-${row.id}`}
            row={row}
            fn={functionByName(state.functions, row.fn)}
            fields={state.fields}
            fieldOptions={options}
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
        {!state.select.length && (
          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoFields)}</span>
        )}
      </div>
    </SectionBlock>
  );
};

export default SelectProjection;
