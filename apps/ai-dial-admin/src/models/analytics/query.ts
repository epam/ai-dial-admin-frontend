// Analytics 2.0 — structured query DSL envelope and result.
// Mirrors the request built by the analytics-data-access-service Query Builder demo
// and posted to `/v1/queries/execute`.

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

// Expression tree (discriminated on `type`).
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

// Filter / having node: a comparison predicate or a logical group of nodes.
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
  nulls?: string;
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

export interface StructuredQueryResult {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  total?: number | null;
  cursor?: string | null;
}
