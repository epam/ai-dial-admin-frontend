/**
 * Small builder helpers for constructing backend structured queries
 * (`POST api/v1/queries/execute`). Pure functions that assemble the DSL node tree,
 * so feature code stays readable instead of hand-writing nested object literals.
 */
import {
  ComparisonNode,
  ComparisonOp,
  Expr,
  ExprType,
  FieldExpr,
  FilterNode,
  FnExpr,
  LogicalNode,
  LogicalOp,
  NullsOrder,
  OffsetPage,
  OutputColumn,
  PageType,
  ParamExpr,
  QueryMode,
  SortDir,
  SortItem,
  StructuredQuery,
  SubqueryExpr,
  ValueExpr,
  ValueType,
} from '@/src/models/evaluation/structured-query';

export const field = (name: string): FieldExpr => ({ type: ExprType.Field, name });

export const param = (name: string): ParamExpr => ({ type: ExprType.Param, name });

export const value = (valueType: ValueType, val: string | null): ValueExpr => ({
  type: ExprType.Value,
  value_type: valueType,
  value: val,
});

export const fn = (name: string, args: Expr[] = []): FnExpr => ({ type: ExprType.Fn, name, args });

export const subquery = (query: StructuredQuery): SubqueryExpr => ({ type: ExprType.Subquery, query });

export const col = (expr: Expr, as?: string): OutputColumn => ({ expr, ...(as ? { as } : {}) });

/** Comparison between a field and a typed literal value. */
export const compare = (op: ComparisonOp, fieldName: string, valueType: ValueType, val: string): ComparisonNode => ({
  op,
  args: [field(fieldName), value(valueType, val)],
});

/** Equality comparison between a field and a typed literal value. */
export const eq = (fieldName: string, valueType: ValueType, val: string): ComparisonNode =>
  compare(ComparisonOp.Eq, fieldName, valueType, val);

export const ne = (fieldName: string, valueType: ValueType, val: string): ComparisonNode =>
  compare(ComparisonOp.Ne, fieldName, valueType, val);

export const co = (fieldName: string, valueType: ValueType, val: string): ComparisonNode =>
  compare(ComparisonOp.Co, fieldName, valueType, val);

export const nc = (fieldName: string, valueType: ValueType, val: string): ComparisonNode =>
  compare(ComparisonOp.Nc, fieldName, valueType, val);

export const gt = (fieldName: string, valueType: ValueType, val: string): ComparisonNode =>
  compare(ComparisonOp.Gt, fieldName, valueType, val);

export const ge = (fieldName: string, valueType: ValueType, val: string): ComparisonNode =>
  compare(ComparisonOp.Ge, fieldName, valueType, val);

export const lt = (fieldName: string, valueType: ValueType, val: string): ComparisonNode =>
  compare(ComparisonOp.Lt, fieldName, valueType, val);

export const le = (fieldName: string, valueType: ValueType, val: string): ComparisonNode =>
  compare(ComparisonOp.Le, fieldName, valueType, val);

export const and = (nodes: LogicalNode['args']): LogicalNode => ({ op: LogicalOp.And, args: nodes });

export const or = (nodes: LogicalNode['args']): LogicalNode => ({ op: LogicalOp.Or, args: nodes });

export const not = (node: FilterNode): LogicalNode => ({ op: LogicalOp.Not, args: [node] });

export const inValues = (fieldName: string, valueType: ValueType, values: string[]): ComparisonNode => ({
  op: ComparisonOp.In,
  args: [field(fieldName), { type: ExprType.Array, items: values.map((val) => value(valueType, val)) }],
});

/** Set-membership comparison whose right operand is a nested structured query. */
export const inSubquery = (fieldName: string, query: StructuredQuery): ComparisonNode => ({
  op: ComparisonOp.In,
  args: [field(fieldName), subquery(query)],
});

export const offsetPage = (offset: number, limit: number, includeTotal = false): OffsetPage => ({
  type: PageType.Offset,
  offset,
  limit,
  include_total: includeTotal,
});

export const sortItem = (field: string, dir: SortDir, nulls: NullsOrder | null = null): SortItem => ({
  field,
  dir,
  nulls,
});

interface AggregateQueryParams {
  entity: string;
  select: OutputColumn[];
  filter?: StructuredQuery['filter'];
  groupBy?: string[];
  sort?: SortItem[];
  page?: OffsetPage;
}

/** Assembles an aggregate-mode query, defaulting to a single 100-row page. */
export const aggregateQuery = ({
  entity,
  select,
  filter,
  groupBy,
  sort,
  page,
}: AggregateQueryParams): StructuredQuery => ({
  entity,
  mode: QueryMode.Aggregate,
  select,
  ...(filter ? { filter } : {}),
  ...(groupBy ? { group_by: groupBy } : {}),
  ...(sort ? { sort } : {}),
  page: page ?? offsetPage(0, 100),
});

interface RowQueryParams {
  entity: string;
  select: OutputColumn[];
  filter?: StructuredQuery['filter'];
  sort?: SortItem[];
  page?: OffsetPage;
}

/** Assembles a row-mode query, defaulting to a 1000-row page. */
export const rowQuery = ({ entity, select, filter, sort, page }: RowQueryParams): StructuredQuery => ({
  entity,
  mode: QueryMode.Row,
  select,
  ...(filter ? { filter } : {}),
  ...(sort ? { sort } : {}),
  page: page ?? offsetPage(0, 1000),
});
