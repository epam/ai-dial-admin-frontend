import {
  QueryExpr,
  QueryExprType,
  QueryFieldExpr,
  QueryFilterNode,
  QueryFnExpr,
  QueryGroup,
  QueryLogicalOperator,
  QueryMode,
  QueryOffsetPage,
  QueryOperator,
  QueryOutputColumn,
  QueryPageType,
  QueryPredicate,
  QuerySortDirection,
  QuerySortItem,
  QueryValueExpr,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';

export const field = (name: string): QueryFieldExpr => ({ type: QueryExprType.Field, name });

export const value = (valueType: QueryValueType, val: string | null): QueryValueExpr => ({
  type: QueryExprType.Value,
  value_type: valueType,
  value: val,
});

export const fn = (name: string, args: QueryExpr[] = [], distinct?: boolean): QueryFnExpr => ({
  type: QueryExprType.Fn,
  name,
  args,
  ...(distinct ? { distinct: true } : {}),
});

export const col = (expr: QueryExpr, as?: string): QueryOutputColumn => ({ expr, ...(as ? { as } : {}) });

const predicate = (op: QueryOperator, fieldName: string, val: QueryValueExpr): QueryPredicate => ({
  op,
  args: [field(fieldName), val],
});

export const eq = (fieldName: string, val: QueryValueExpr): QueryPredicate =>
  predicate(QueryOperator.Eq, fieldName, val);

export const le = (fieldName: string, val: QueryValueExpr): QueryPredicate =>
  predicate(QueryOperator.Le, fieldName, val);

export const ne = (fieldName: string, val: QueryValueExpr): QueryPredicate =>
  predicate(QueryOperator.Ne, fieldName, val);

export const gt = (fieldName: string, val: QueryValueExpr): QueryPredicate =>
  predicate(QueryOperator.Gt, fieldName, val);

export const isNotNull = (fieldName: string): QueryPredicate =>
  predicate(QueryOperator.Ne, fieldName, value(QueryValueType.Null, null));

export const inValues = (fieldName: string, valueType: QueryValueType, values: string[]): QueryPredicate => ({
  op: QueryOperator.In,
  args: [field(fieldName), { type: QueryExprType.Array, items: values.map((val) => value(valueType, val)) }],
});

export const ico = (fieldName: string, term: string): QueryPredicate =>
  predicate(QueryOperator.Ico, fieldName, value(QueryValueType.String, term));

export const and = (args: QueryFilterNode[]): QueryGroup => ({ op: QueryLogicalOperator.And, args });

export const or = (args: QueryFilterNode[]): QueryGroup => ({ op: QueryLogicalOperator.Or, args });

export const sortItem = (fieldName: string, dir: QuerySortDirection): QuerySortItem => ({ field: fieldName, dir });

// `include_total` is the caller's to choose: the service populates `totalCount` for row-mode queries
// and never for aggregate mode, so requesting one is a property of the query being built.
export const offsetPage = (offset: number, limit: number, includeTotal = false): QueryOffsetPage => ({
  type: QueryPageType.Offset,
  offset,
  limit,
  include_total: includeTotal,
});

interface QueryParams {
  entity: string;
  select: QueryOutputColumn[];
  filter?: QueryFilterNode;
  sort?: QuerySortItem[];
  page?: QueryOffsetPage;
}

interface AggregateQueryParams extends QueryParams {
  groupBy?: string[];
}

export const aggregateQuery = ({
  entity,
  groupBy,
  select,
  filter,
  sort,
  page,
}: AggregateQueryParams): StructuredQuery => ({
  entity,
  mode: QueryMode.Aggregate,
  ...(filter ? { filter } : {}),
  select,
  ...(groupBy?.length ? { group_by: groupBy } : {}),
  ...(sort?.length ? { sort } : {}),
  ...(page ? { page } : {}),
});

export const rowQuery = ({ entity, select, filter, sort, page }: QueryParams): StructuredQuery => ({
  entity,
  mode: QueryMode.Row,
  ...(filter ? { filter } : {}),
  select,
  ...(sort?.length ? { sort } : {}),
  ...(page ? { page } : {}),
});
