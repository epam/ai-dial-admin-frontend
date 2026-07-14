export enum QueryMode {
  Row = 'row',
  Aggregate = 'aggregate',
}

export enum QueryOperator {
  Eq = 'eq',
  Ne = 'ne',
  Co = 'co',
  Nc = 'nc',
  Lt = 'lt',
  Gt = 'gt',
  Le = 'le',
  Ge = 'ge',
  In = 'in',
}

export enum QueryLogicalOperator {
  And = 'and',
  Or = 'or',
  Not = 'not',
}

export enum QueryValueType {
  String = 'string',
  Integer = 'integer',
  Long = 'long',
  Decimal = 'decimal',
  Boolean = 'boolean',
  Date = 'date',
  Timestamp = 'timestamp',
  Uuid = 'uuid',
  Null = 'null',
}

export enum QueryAggregateFn {
  Count = 'count',
  Sum = 'sum',
  Avg = 'avg',
  Min = 'min',
  Max = 'max',
}

export enum QueryBucketUnit {
  Second = 'second',
  Minute = 'minute',
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
}

export enum QueryExprType {
  Field = 'field',
  Value = 'value',
  Fn = 'fn',
  Array = 'array',
}

export enum QuerySortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum QueryPageType {
  Offset = 'offset',
  Cursor = 'cursor',
}

export enum QuerySortNulls {
  Default = 'default',
  First = 'first',
  Last = 'last',
}

export interface QueryFieldExpr {
  type: QueryExprType.Field;
  name: string;
}

export interface QueryValueExpr {
  type: QueryExprType.Value;
  value_type: QueryValueType;
  value: string | null;
}

export interface QueryFnExpr {
  type: QueryExprType.Fn;
  name: string;
  args: QueryExpr[];
  distinct?: boolean;
}

export interface QueryArrayExpr {
  type: QueryExprType.Array;
  items: QueryValueExpr[];
}

export type QueryExpr = QueryFieldExpr | QueryValueExpr | QueryFnExpr | QueryArrayExpr;

export interface QueryPredicate {
  op: QueryOperator;
  args: QueryExpr[];
}

export interface QueryGroup {
  op: QueryLogicalOperator;
  args: QueryFilterNode[];
}

export type QueryFilterNode = QueryPredicate | QueryGroup;

export interface QueryOutputColumn {
  expr: QueryExpr;
  as?: string;
}

export interface QuerySortItem {
  field: string;
  dir: QuerySortDirection;
  nulls?: QuerySortNulls;
}

export interface QueryOffsetPage {
  type: QueryPageType.Offset;
  offset: number;
  limit: number;
  include_total: boolean;
}

export interface QueryCursorPage {
  type: QueryPageType.Cursor;
  cursor: string | null;
  limit: number;
}

export type QueryPage = QueryOffsetPage | QueryCursorPage;

export interface StructuredQuery {
  entity: string;
  mode: QueryMode;
  distinct?: boolean;
  filter?: QueryFilterNode;
  select?: QueryOutputColumn[];
  group_by?: string[];
  having?: QueryFilterNode;
  sort?: QuerySortItem[];
  page?: QueryPage;
}

// Mirrors the service's StructuredQueryResultDto: rows as field-name → value maps (columns are
// derived client-side from row keys), plus totalCount — set ONLY for row-mode offset paging with
// include_total=true; aggregate and SQL runs never carry a total.
export interface StructuredQueryResult {
  columns?: string[];
  rows: Array<Record<string, unknown>>;
  totalCount?: number | null;
  cursor?: string | null;
}

// Body for `POST /v1/queries/execute-sql`: a single read-only SQL SELECT. An object (not a bare
// string) so the backend can add fields (e.g. a total-count opt-in) without breaking clients.
// The response reuses `StructuredQueryResult`; on this path `totalCount` is never populated.
export interface SqlQueryRequest {
  sql: string;
}
