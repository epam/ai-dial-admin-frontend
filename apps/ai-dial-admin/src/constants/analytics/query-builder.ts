import { SelectOption } from '@epam/ai-dial-ui-kit';

import {
  QueryAggregateFn,
  QueryBucketUnit,
  QueryLogicalOperator,
  QueryOperator,
  QueryPageType,
  QuerySortDirection,
  QuerySortNulls,
  QueryValueType,
} from '@/src/models/analytics/query';

const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const toOptions = (values: string[]): SelectOption[] => values.map((value) => ({ value, label: capitalize(value) }));

export const OPERATOR_OPTIONS: SelectOption[] = toOptions(Object.values(QueryOperator));

export const VALUE_TYPE_OPTIONS: SelectOption[] = toOptions(
  Object.values(QueryValueType).filter((t) => t !== QueryValueType.Null),
);

export const LOGICAL_OPERATOR_OPTIONS: SelectOption[] = [
  { value: QueryLogicalOperator.And, label: 'AND' },
  { value: QueryLogicalOperator.Or, label: 'OR' },
  { value: QueryLogicalOperator.Not, label: 'NOT' },
];

export const AGGREGATE_FN_OPTIONS: SelectOption[] = toOptions(Object.values(QueryAggregateFn));

export const BUCKET_UNIT_OPTIONS: SelectOption[] = toOptions(Object.values(QueryBucketUnit));

export const SORT_DIRECTION_OPTIONS: SelectOption[] = [
  { value: QuerySortDirection.Asc, label: 'Asc' },
  { value: QuerySortDirection.Desc, label: 'Desc' },
];

export const SORT_NULLS_DEFAULT = QuerySortNulls.Default;
export const SORT_NULLS_OPTIONS: SelectOption[] = [
  { value: QuerySortNulls.Default, label: 'Default' },
  { value: QuerySortNulls.First, label: 'First' },
  { value: QuerySortNulls.Last, label: 'Last' },
];

export const PAGE_TYPE_OPTIONS: SelectOption[] = [
  { value: QueryPageType.Offset, label: 'Offset' },
  { value: QueryPageType.Cursor, label: 'Cursor' },
];

export const DEFAULT_PAGE_LIMIT = 25;
export const DEFAULT_CURSOR_LIMIT = 100;
export const DEFAULT_BUCKET_AMOUNT = 5;

export const UNTAGGED_KEY = 'untagged';

export const DATE_BIN_FN = 'date_bin';
