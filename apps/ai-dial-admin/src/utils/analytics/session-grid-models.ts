import { SortModelItem } from 'ag-grid-community';

import {
  FILTERABLE_SESSION_FIELDS,
  GRID_FILTER_TYPE_OPERATOR,
  SORTABLE_SESSION_FIELDS,
} from '@/src/constants/analytics/sessions-trace';
import {
  SessionColumnFilter,
  SessionFilterOperator,
  SessionProjectableFields,
  SessionSortKey,
} from '@/src/models/analytics/sessions-trace';
import { QuerySortDirection, QueryValueType } from '@/src/models/analytics/query';
import { GridFilterType } from '@/src/types/grid-filter';

const IN_RANGE = 'inRange';

interface GridColumnFilter {
  type?: string;
  filter?: string | number | null;
  filterTo?: string | number | null;
  values?: string[];
}

export type SessionGridFilterModel = Record<string, GridColumnFilter>;

export interface SessionModelScope {
  sortableFields?: string[];
  filterableFields?: string[];
  valueTypes?: Record<string, QueryValueType>;
  projectableFields?: SessionProjectableFields;
}

const asDirection = (sort: string): QuerySortDirection =>
  sort === QuerySortDirection.Asc ? QuerySortDirection.Asc : QuerySortDirection.Desc;

const isBlank = (val: string | number | null | undefined): boolean => val == null || `${val}`.trim() === '';

export const translateSessionSortModel = (
  sortModel: SortModelItem[] | undefined,
  { sortableFields = SORTABLE_SESSION_FIELDS }: SessionModelScope = {},
): SessionSortKey[] => {
  if (!sortModel?.length) {
    return [];
  }

  return sortModel.reduce<SessionSortKey[]>((keys, item) => {
    if (!sortableFields.includes(item.colId)) {
      return keys;
    }
    keys.push({ field: item.colId, direction: asDirection(item.sort) });
    return keys;
  }, []);
};

const toColumnFilter = (
  fieldName: string,
  entry: GridColumnFilter,
  valueType?: QueryValueType,
): SessionColumnFilter | null => {
  // An empty selection deliberately has no branch of its own: the text path below already returns `null` for
  // a blank value.
  if (entry.values?.length) {
    return {
      field: fieldName,
      operator: SessionFilterOperator.In,
      values: entry.values,
      ...(valueType ? { valueType } : {}),
    };
  }

  if (entry.type === IN_RANGE) {
    if (isBlank(entry.filter) || isBlank(entry.filterTo)) {
      return null;
    }
    return {
      field: fieldName,
      operator: SessionFilterOperator.Range,
      value: `${entry.filter}`,
      valueTo: `${entry.filterTo}`,
      ...(valueType ? { valueType } : {}),
    };
  }

  const operator = entry.type ? GRID_FILTER_TYPE_OPERATOR[entry.type as GridFilterType] : undefined;
  if (!operator || isBlank(entry.filter)) {
    return null;
  }

  return { field: fieldName, operator, value: `${entry.filter}`.trim(), ...(valueType ? { valueType } : {}) };
};

export const translateSessionFilterModel = (
  filterModel: SessionGridFilterModel | undefined | null,
  { filterableFields = FILTERABLE_SESSION_FIELDS, valueTypes }: SessionModelScope = {},
): SessionColumnFilter[] => {
  if (!filterModel) {
    return [];
  }

  return Object.entries(filterModel).reduce<SessionColumnFilter[]>((filters, [colId, entry]) => {
    if (!filterableFields.includes(colId)) {
      return filters;
    }
    const filter = toColumnFilter(colId, entry, valueTypes?.[colId]);
    if (filter) {
      filters.push(filter);
    }
    return filters;
  }, []);
};
