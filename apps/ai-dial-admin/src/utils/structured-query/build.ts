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
  FnExpr,
  LogicalNode,
  LogicalOp,
  NullsOrder,
  OffsetPage,
  OutputColumn,
  PageType,
  QueryMode,
  SortDir,
  SortItem,
  StructuredQuery,
  ValueExpr,
  ValueType,
} from '@/src/models/evaluation/structured-query';

export const field = (name: string): FieldExpr => ({ type: ExprType.Field, name });

export const value = (valueType: ValueType, val: string | null): ValueExpr => ({
  type: ExprType.Value,
  value_type: valueType,
  value: val,
});

export const fn = (name: string, args: Expr[] = []): FnExpr => ({ type: ExprType.Fn, name, args });

export const col = (expr: Expr, as?: string): OutputColumn => ({ expr, ...(as ? { as } : {}) });

/** Equality comparison between a field and a typed literal value. */
export const eq = (fieldName: string, valueType: ValueType, val: string): ComparisonNode => ({
  op: ComparisonOp.Eq,
  args: [field(fieldName), value(valueType, val)],
});

export const and = (nodes: LogicalNode['args']): LogicalNode => ({ op: LogicalOp.And, args: nodes });

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
