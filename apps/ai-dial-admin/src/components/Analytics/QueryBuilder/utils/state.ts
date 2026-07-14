import {
  DEFAULT_BUCKET_AMOUNT,
  DEFAULT_CURSOR_LIMIT,
  DEFAULT_PAGE_LIMIT,
  SORT_NULLS_DEFAULT,
} from '@/src/constants/analytics/query-builder';
import {
  AggregateRow,
  FilterGroupNode,
  FilterNodeKind,
  FilterPredicateNode,
  GroupByRow,
  PageState,
  QueryBuilderState,
  SortRow,
} from '@/src/models/analytics/query-builder';
import {
  QueryAggregateFn,
  QueryBucketUnit,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  QueryScalarFn,
  QuerySortDirection,
} from '@/src/models/analytics/query';
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
  amount: DEFAULT_BUCKET_AMOUNT,
  unit: QueryBucketUnit.Minute,
});

// date_bin keeps its historical default alias so the generated group_by stays self-explanatory;
// other functions leave the alias to the user (the section warns until it is set).
export const createGroupByFn = (fn: QueryScalarFn, field = ''): GroupByRow => ({
  id: nextId(),
  fn,
  field,
  alias: fn === QueryScalarFn.DateBin ? 'bucket' : '',
  amount: DEFAULT_BUCKET_AMOUNT,
  unit: QueryBucketUnit.Minute,
});

export const createAggregate = (): AggregateRow => ({
  id: nextId(),
  fn: QueryAggregateFn.Count,
  field: '',
  distinct: false,
  alias: '',
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

export const createInitialState = (): QueryBuilderState => ({
  entityName: '',
  fields: [],
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
