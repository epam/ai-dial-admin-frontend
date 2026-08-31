import { SortModelItem } from 'ag-grid-community';

import {
  FILTERABLE_CONVERSATION_FIELDS,
  GRID_FILTER_TYPE_OPERATOR,
  SORTABLE_CONVERSATION_FIELDS,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationColumnFilter,
  ConversationFilterOperator,
  ConversationProjectableFields,
  ConversationSortKey,
} from '@/src/models/analytics/conversations-trace';
import { QuerySortDirection, QueryValueType } from '@/src/models/analytics/query';
import { GridFilterType } from '@/src/types/grid-filter';

const IN_RANGE = 'inRange';

interface GridColumnFilter {
  type?: string;
  filter?: string | number | null;
  filterTo?: string | number | null;
  values?: string[];
}

export type ConversationGridFilterModel = Record<string, GridColumnFilter>;

export interface ConversationModelScope {
  sortableFields?: string[];
  filterableFields?: string[];
  valueTypes?: Record<string, QueryValueType>;
  projectableFields?: ConversationProjectableFields;
}

const asDirection = (sort: string): QuerySortDirection =>
  sort === QuerySortDirection.Asc ? QuerySortDirection.Asc : QuerySortDirection.Desc;

const isBlank = (val: string | number | null | undefined): boolean => val == null || `${val}`.trim() === '';

export const translateConversationSortModel = (
  sortModel: SortModelItem[] | undefined,
  { sortableFields = SORTABLE_CONVERSATION_FIELDS }: ConversationModelScope = {},
): ConversationSortKey[] => {
  if (!sortModel?.length) {
    return [];
  }

  return sortModel.reduce<ConversationSortKey[]>((keys, item) => {
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
): ConversationColumnFilter | null => {
  // An empty selection deliberately has no branch of its own: the text path below already returns `null` for
  // a blank value.
  if (entry.values?.length) {
    return {
      field: fieldName,
      operator: ConversationFilterOperator.In,
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
      operator: ConversationFilterOperator.Range,
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

export const translateConversationFilterModel = (
  filterModel: ConversationGridFilterModel | undefined | null,
  { filterableFields = FILTERABLE_CONVERSATION_FIELDS, valueTypes }: ConversationModelScope = {},
): ConversationColumnFilter[] => {
  if (!filterModel) {
    return [];
  }

  return Object.entries(filterModel).reduce<ConversationColumnFilter[]>((filters, [colId, entry]) => {
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
