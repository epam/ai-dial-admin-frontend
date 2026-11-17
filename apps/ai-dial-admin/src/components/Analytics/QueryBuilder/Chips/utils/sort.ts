import { SortChipForm } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { sortFieldOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { createSort } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { QuerySortDirection } from '@/src/models/analytics/query';
import { FieldOption, QueryBuilderState, SortRow } from '@/src/models/analytics/query-builder';

export const sortChipFieldOptions = (state: QueryBuilderState, exceptRowId?: string): FieldOption[] => {
  const used = new Set(state.sort.filter((row) => row.id !== exceptRowId).map((row) => row.field));
  return sortFieldOptions(state).filter((option) => !used.has(option.name));
};

export const prunedSort = (state: QueryBuilderState): SortRow[] => {
  const offered = new Set(sortFieldOptions(state).map((option) => option.name));
  return state.sort.filter((row) => offered.has(row.field));
};

export const createSortForm = (): SortChipForm => ({ field: '', dir: QuerySortDirection.Asc });

export const toSortForm = (row: SortRow): SortChipForm => ({ field: row.field, dir: row.dir });

export const toSortRow = (form: SortChipForm, id?: string): SortRow => {
  const base = createSort();
  return { ...base, id: id ?? base.id, field: form.field, dir: form.dir as QuerySortDirection };
};
