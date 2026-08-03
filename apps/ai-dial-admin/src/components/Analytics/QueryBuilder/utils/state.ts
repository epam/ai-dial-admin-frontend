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
  aliasEdited: false,
  args: [],
});

// A scalar-function Group by row: one empty arg slot per catalog argument (or pre-filled slots when
// deserializing an existing query).
export const createGroupByFn = (fn: QueryFunction, args?: FnArgValue[], alias = ''): GroupByRow => ({
  id: nextId(),
  fn: fn.name,
  field: '',
  alias,
  aliasEdited: false,
  args: args ?? emptyArgs(fn),
});

// An aggregate metric row over a catalog function: one arg slot per catalog argument.
export const createAggregate = (fn: QueryFunction, args?: FnArgValue[], alias = ''): AggregateRow => ({
  id: nextId(),
  fn: fn.name,
  distinct: false,
  alias,
  aliasEdited: false,
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

// Rewrites every sort key naming `prev` to `next`. A computed column's name changes whenever its
// row's function or arguments change, and a sort key holds that name as a string — left alone it
// would order by a column the query no longer emits, which the backend rejects.
export const renamedSortKeys = (sort: SortRow[], prev: string, next: string): SortRow[] =>
  sort.map((key) => (key.field === prev ? { ...key, field: next } : key));

// The same rename across a filter/having tree, at any nesting depth.
export const renamedFilterFields = (node: FilterGroupNode, prev: string, next: string): FilterGroupNode => ({
  ...node,
  children: node.children.map((child) =>
    child.kind === FilterNodeKind.Group
      ? renamedFilterFields(child, prev, next)
      : child.field === prev
        ? { ...child, field: next }
        : child,
  ),
});
