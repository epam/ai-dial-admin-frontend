import { DEFAULT_CURSOR_LIMIT, DEFAULT_PAGE_LIMIT, SORT_NULLS_DEFAULT } from '@/src/constants/analytics/query-builder';
import {
  AggregateRow,
  FilterGroupNode,
  FilterNodeKind,
  FilterPredicateNode,
  FnArgValue,
  GroupByRow,
  PageState,
  QueryBuilderState,
  SortRow,
} from '@/src/models/analytics/query-builder';
import {
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  QuerySortDirection,
} from '@/src/models/analytics/query';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { emptyArgs } from './functions';
import { defaultValueType } from './fields';

let counter = 0;
export const nextId = (): string => `qb-${++counter}`;

export const createGroup = (op: QueryLogicalOperator = QueryLogicalOperator.And): FilterGroupNode => ({
  id: nextId(),
  kind: FilterNodeKind.Group,
  op,
  children: [],
});

export const createPredicate = (fieldType?: string): FilterPredicateNode => ({
  id: nextId(),
  kind: FilterNodeKind.Predicate,
  field: '',
  op: QueryOperator.Eq,
  valueType: defaultValueType(fieldType),
  value: '',
  isNull: false,
});

export const createGroupByColumn = (field: string): GroupByRow => ({
  id: nextId(),
  fn: null,
  field,
  alias: '',
  args: [],
});

// A scalar-function Group by row: one empty arg slot per catalog argument (or pre-filled slots when
// deserializing an existing query). The alias is left to the user (the section warns until set).
export const createGroupByFn = (fn: QueryFunction, args?: FnArgValue[]): GroupByRow => ({
  id: nextId(),
  fn: fn.name,
  field: '',
  alias: '',
  args: args ?? emptyArgs(fn),
});

// An aggregate metric row over a catalog function: one arg slot per catalog argument.
export const createAggregate = (fn: QueryFunction, args?: FnArgValue[]): AggregateRow => ({
  id: nextId(),
  fn: fn.name,
  distinct: false,
  alias: '',
  args: args ?? emptyArgs(fn),
});

export const createSort = (): SortRow => ({
  id: nextId(),
  field: '',
  dir: QuerySortDirection.Asc,
  nulls: SORT_NULLS_DEFAULT,
});

export const createInitialPage = (): PageState => ({
  enabled: true,
  type: QueryPageType.Offset,
  offset: 0,
  limit: DEFAULT_PAGE_LIMIT,
  includeTotal: false,
  cursor: '',
  cursorLimit: DEFAULT_CURSOR_LIMIT,
});

export const createInitialState = (functions: QueryFunction[] = []): QueryBuilderState => ({
  entityName: '',
  fields: [],
  functions,
  mode: QueryMode.Row,
  distinct: false,
  filter: createGroup(),
  select: [],
  groupBy: [],
  aggregates: [],
  having: createGroup(),
  sort: [],
  page: createInitialPage(),
});
