/**
 * TypeScript model of the backend experimental structured-query DSL
 * (`POST api/v1/queries/execute`). Wire field names match the Java records exactly
 * (`value_type`, `include_total`, `group_by`, `as`) — the backend mapper does not
 * apply a snake_case strategy, so these are declared verbatim.
 */

export enum QueryMode {
  Row = 'row',
  Aggregate = 'aggregate',
}

/** Discriminator for the {@link Expr} union. */
export enum ExprType {
  Field = 'field',
  Value = 'value',
  Fn = 'fn',
  Array = 'array',
}

/** Allowlisted literal types governing how a {@link ValueExpr} string value is parsed. */
export enum ValueType {
  String = 'string',
  Integer = 'integer',
  Long = 'long',
  Decimal = 'decimal',
  Boolean = 'boolean',
  Uuid = 'uuid',
  Null = 'null',
}

export enum ComparisonOp {
  Eq = 'eq',
  Ne = 'ne',
  Gt = 'gt',
  Lt = 'lt',
  Ge = 'ge',
  Le = 'le',
  In = 'in',
}

export enum LogicalOp {
  And = 'and',
  Or = 'or',
  Not = 'not',
}

export enum PageType {
  Offset = 'offset',
  Cursor = 'cursor',
}

export enum SortDir {
  Asc = 'asc',
  Desc = 'desc',
}

export enum NullsOrder {
  First = 'first',
  Last = 'last',
}

export interface SortItem {
  field: string;
  dir: SortDir;
  nulls?: NullsOrder | null;
}

export interface FieldExpr {
  type: ExprType.Field;
  name: string;
}

export interface ValueExpr {
  type: ExprType.Value;
  value_type: ValueType;
  value: string | null;
}

export interface FnExpr {
  type: ExprType.Fn;
  name: string;
  args: Expr[];
}

export interface ArrayExpr {
  type: ExprType.Array;
  items: Expr[];
}

export type Expr = FieldExpr | ValueExpr | FnExpr | ArrayExpr;

export interface ComparisonNode {
  op: ComparisonOp;
  args: Expr[];
}

export interface LogicalNode {
  op: LogicalOp;
  args: FilterNode[];
}

export type FilterNode = ComparisonNode | LogicalNode;

export interface OutputColumn {
  expr: Expr;
  as?: string;
}

export interface OffsetPage {
  type: PageType.Offset;
  offset: number;
  limit: number;
  include_total: boolean;
}

export interface StructuredQuery {
  entity: string;
  mode: QueryMode;
  filter?: FilterNode;
  select?: OutputColumn[];
  group_by?: string[];
  having?: FilterNode;
  sort?: SortItem[];
  page?: OffsetPage;
}

export interface StructuredQueryResult {
  rows: Record<string, unknown>[];
  totalCount?: number;
}
