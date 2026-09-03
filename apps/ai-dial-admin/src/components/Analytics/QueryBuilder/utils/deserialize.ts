import { SORT_NULLS_DEFAULT } from '@/src/constants/analytics/query-builder';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import {
  AggregateRow,
  FilterGroupNode,
  FilterNode,
  FilterNodeKind,
  FilterPredicateNode,
  FnArgValue,
  GroupByRow,
  PageState,
  QueryBuilderState,
  SelectRow,
  SortRow,
} from '@/src/models/analytics/query-builder';
import { QueryFunction, QueryFunctionArg, QueryFunctionGroup } from '@/src/models/analytics/query-function';
import {
  QueryExpr,
  QueryFilterNode,
  QueryGroup,
  QueryLogicalOperator,
  QueryMode,
  QueryOutputColumn,
  QueryPage,
  QueryPageType,
  QueryPredicate,
  QueryExprType,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { functionByName, isExpressionArg } from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { deriveAlias, uniqueAlias } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import {
  createAggregate,
  createGroup,
  createColumnRow,
  createFnRow,
  createInitialPage,
  createInitialState,
  nextId,
} from './state';

const LOGICAL_OPS = new Set<string>([QueryLogicalOperator.And, QueryLogicalOperator.Or, QueryLogicalOperator.Not]);

const isGroup = (node: QueryFilterNode): node is QueryGroup => LOGICAL_OPS.has((node as QueryGroup).op);

const parseFilterNode = (node: QueryFilterNode, functions: QueryFunction[]): FilterNode => {
  if (isGroup(node)) {
    const children = (node.args || []).map((child) => parseFilterNode(child, functions));
    if (
      node.op === QueryLogicalOperator.Not &&
      children.length === 1 &&
      children[0].kind === FilterNodeKind.Group &&
      (children[0] as FilterGroupNode).op === QueryLogicalOperator.And
    ) {
      return {
        id: nextId(),
        kind: FilterNodeKind.Group,
        op: QueryLogicalOperator.Not,
        children: (children[0] as FilterGroupNode).children,
      };
    }
    return { id: nextId(), kind: FilterNodeKind.Group, op: node.op, children };
  }

  const pred = node as QueryPredicate;
  const [left, right] = pred.args || [];
  const predicate: FilterPredicateNode = {
    id: nextId(),
    kind: FilterNodeKind.Predicate,
    field: left && left.type === QueryExprType.Field ? left.name : '',
    fn: null,
    args: [],
    op: pred.op,
    valueType: QueryValueType.String,
    value: '',
    isNull: false,
  };

  // A function left operand is shown as the call it is. One the catalog does not name cannot be
  // shown at all — such a query is not builder-representable, so it never reaches here.
  if (left?.type === QueryExprType.Fn) {
    const fn = functionByName(functions, left.name);
    if (fn) {
      predicate.fn = fn.name;
      predicate.args = argsToSlots(fn, left.args);
    }
  }

  if (right?.type === QueryExprType.Array) {
    const items = right.items || [];
    predicate.value = items.map((i) => i.value ?? '').join(', ');
    predicate.valueType = items[0]?.value_type ?? QueryValueType.String;
  } else if (right?.type === QueryExprType.Value) {
    if (right.value_type === QueryValueType.Null) {
      predicate.isNull = true;
    } else {
      predicate.value = right.value ?? '';
      predicate.valueType = right.value_type;
    }
  }

  return predicate;
};

// One function argument as the builder holds it: a field reference for an `expression` argument, a
// literal for a literal one. Anything else — a constant where a column belongs, a call nested inside
// a call — has no editor, so the row would come back missing that argument.
const isArgRepresentable = (argDef: QueryFunctionArg, expr: QueryExpr): boolean =>
  isExpressionArg(argDef) ? expr.type === QueryExprType.Field : expr.type === QueryExprType.Value;

// An expression the builder can hold: a field reference, or a call to a served catalog function whose
// arguments line up with the ones that function declares — none beyond them (a variadic call carries
// more), and each of the kind its position expects.
const isExprRepresentable = (expr: QueryExpr, functions: QueryFunction[] | null): boolean => {
  if (expr.type === QueryExprType.Field) return true;
  if (expr.type !== QueryExprType.Fn) return false;
  // No catalog to check against — the caller is judging structure alone (see isBuilderRepresentable).
  if (!functions) return true;
  const fn = functionByName(functions, expr.name);
  if (!fn) return false;
  const args = expr.args || [];
  return args.length <= fn.args.length && args.every((arg, i) => isArgRepresentable(fn.args[i], arg));
};

// A condition the builder can hold: an expression on the left, a literal — one value, or an array of
// them for `in` — on the right, which is the only right-hand shape its editor produces.
const isPredicateRepresentable = (pred: QueryPredicate, functions: QueryFunction[] | null): boolean => {
  const [left, right] = pred.args || [];
  if (!left || !isExprRepresentable(left, functions)) return false;
  return !right || right.type === QueryExprType.Value || right.type === QueryExprType.Array;
};

// The visual builder shows at most two filter levels: the root group plus one level of nested groups
// holding only conditions. `depth` is the group nesting level of `node`'s parent.
const isFilterRepresentable = (node: QueryFilterNode, depth: number, functions: QueryFunction[] | null): boolean => {
  if (!isGroup(node)) return isPredicateRepresentable(node as QueryPredicate, functions);
  if (depth >= 2) return false;
  return (node.args || []).every((child) => isFilterRepresentable(child, depth + 1, functions));
};

// Aggregate mode rebuilds its group-by keys from the select entries — a plain column key from a field
// entry, a function key from its alias — because that is the only shape a builder-authored query takes.
// A key naming something the select does not carry has nowhere to land, and hydrating would drop the
// grouping; projecting it instead would add a result column the author did not ask for. In `row` mode
// there is no group-by section at all, so any key is unholdable.
const isGroupByRepresentable = (query: StructuredQuery): boolean => {
  const keys = query.group_by ?? [];
  if (!keys.length) return true;
  if (query.mode !== QueryMode.Aggregate) return false;

  const provided = new Set<string>();
  (query.select ?? []).forEach((col) => {
    const alias = col.as?.trim();
    if (alias) provided.add(alias);
    if (col.expr.type === QueryExprType.Field) provided.add(col.expr.name);
  });
  return keys.every((key) => provided.has(key));
};

// Whether the visual builder can show a query without losing part of it: filter (and having) trees no
// deeper than root + one group level, and every expression it would have to hold — projection entries
// and condition operands — one it has an editor for. A query it cannot show stays editable and
// runnable in the written views instead of being hydrated with pieces missing.
//
// `functions` is nullable because one caller has no catalog: the saved-queries grid labels which
// editor a query would open in without loading one. Passing null checks structure alone and takes a
// function call at face value — the grid can therefore label a query "Builder" that will open in
// JSON. The page that actually opens it passes the catalog and decides again with it.
export const isBuilderRepresentable = (query: StructuredQuery, functions: QueryFunction[] | null): boolean => {
  const filterOk = !query.filter || isFilterRepresentable(query.filter, 0, functions);
  const havingOk = !query.having || isFilterRepresentable(query.having, 0, functions);
  const selectOk = (query.select || []).every((col) => isExprRepresentable(col.expr, functions));
  return filterOk && havingOk && selectOk && isGroupByRepresentable(query);
};

const parseFilterRoot = (node?: QueryFilterNode, functions: QueryFunction[] = []): FilterGroupNode => {
  if (!node) return createGroup();
  const parsed = parseFilterNode(node, functions);
  if (parsed.kind === FilterNodeKind.Group) return parsed;
  const root = createGroup();
  root.children = [parsed];
  return root;
};

// Reverse a serialized function call's ordered args into row arg-value slots, matched positionally
// against the catalog function's argument list. `args` is typed as required but a hand-authored JSON
// call can omit it entirely — every slot is then simply empty.
const argsToSlots = (fn: QueryFunction, exprArgs: QueryExpr[] = []): FnArgValue[] =>
  fn.args.map((argDef, i) => {
    const argExpr = exprArgs[i];
    if (isExpressionArg(argDef)) {
      return { field: argExpr?.type === QueryExprType.Field ? argExpr.name : '' };
    }
    return { literal: argExpr?.type === QueryExprType.Value ? (argExpr.value ?? '') : '' };
  });

// An authored alias belongs to whoever wrote the query: it is kept as-is and marked user-owned so
// the builder never rederives over it. A column that arrives without one is prefilled exactly as a
// freshly added row would be, so it is addressable from Sort (and Having) straight away. `assigned`
// accumulates the names already taken, so a derived one stays unique within the query.
const aliasFor = (
  fn: QueryFunction,
  slots: FnArgValue[],
  as: string | undefined,
  distinct: boolean,
  fields: AnalyticsEntityField[],
  assigned: string[],
): { alias: string; aliasEdited: boolean } => {
  const authored = (as ?? '').trim();
  const alias = authored || uniqueAlias(deriveAlias(fn, slots, distinct, fields), assigned);
  assigned.push(alias);
  return { alias, aliasEdited: !!authored };
};

// Row-mode projection entries: a field expression becomes a column row, a served scalar function a
// function row under its alias. A function the catalog does not name cannot be shown at all — such a
// query is not builder-representable, so it never reaches here.
const parseRowSelect = (
  select: QueryOutputColumn[],
  functions: QueryFunction[],
  fields: AnalyticsEntityField[],
): SelectRow[] => {
  const rows: SelectRow[] = [];
  const assigned: string[] = [];

  select.forEach((col) => {
    const expr = col.expr;
    if (expr.type === QueryExprType.Field) {
      rows.push(createColumnRow(expr.name));
      assigned.push(expr.name);
      return;
    }
    if (expr.type !== QueryExprType.Fn) return;
    const fn = functionByName(functions, expr.name);
    if (!fn) return;
    const slots = argsToSlots(fn, expr.args);
    const { alias, aliasEdited } = aliasFor(fn, slots, col.as, false, fields, assigned);
    rows.push({ ...createFnRow(fn, slots, alias), aliasEdited });
  });

  return rows;
};

const parseAggregateSelect = (
  select: QueryOutputColumn[],
  functions: QueryFunction[],
  fields: AnalyticsEntityField[],
): { groupBy: GroupByRow[]; aggregates: AggregateRow[] } => {
  const groupBy: GroupByRow[] = [];
  const aggregates: AggregateRow[] = [];
  const assigned: string[] = [];

  select.forEach((col) => {
    const expr = col.expr;
    if (expr.type === QueryExprType.Field) {
      groupBy.push({ ...createColumnRow(expr.name), alias: col.as ?? '' });
      return;
    }
    if (expr.type !== QueryExprType.Fn) return;
    // A function absent from the served catalog cannot be shown in the builder — the query stays
    // editable in the JSON/SQL views; here we simply skip it.
    const fn = functionByName(functions, expr.name);
    if (!fn) return;
    const slots = argsToSlots(fn, expr.args);
    const distinct = !!expr.distinct;
    const { alias, aliasEdited } = aliasFor(fn, slots, col.as, distinct, fields, assigned);
    if (fn.group === QueryFunctionGroup.Scalar) {
      groupBy.push({ ...createFnRow(fn, slots, alias), aliasEdited });
    } else {
      aggregates.push({ ...createAggregate(fn, slots, alias), distinct, aliasEdited });
    }
  });

  return { groupBy, aggregates };
};

const parsePage = (page?: QueryPage): PageState => {
  const base = createInitialPage();
  if (!page) return { ...base, enabled: false };
  if (page.type === QueryPageType.Offset) {
    return {
      ...base,
      enabled: true,
      type: QueryPageType.Offset,
      offset: page.offset,
      limit: page.limit,
      includeTotal: page.include_total,
    };
  }
  return { ...base, enabled: true, type: QueryPageType.Cursor, cursor: page.cursor ?? '', cursorLimit: page.limit };
};

export const parseQuery = (
  query: StructuredQuery,
  fields: AnalyticsEntityField[],
  functions: QueryFunction[] = [],
): QueryBuilderState => {
  const state = createInitialState(functions);
  state.entityName = query.entity ?? '';
  state.fields = fields;
  state.mode = query.mode === QueryMode.Aggregate ? QueryMode.Aggregate : QueryMode.Row;
  state.distinct = !!query.distinct;
  state.filter = parseFilterRoot(query.filter, functions);
  state.having = parseFilterRoot(query.having, functions);

  if (state.mode === QueryMode.Aggregate) {
    const { groupBy, aggregates } = parseAggregateSelect(query.select || [], functions, fields);
    state.groupBy = groupBy;
    state.aggregates = aggregates;
  } else {
    state.select = parseRowSelect(query.select || [], functions, fields);
  }

  state.sort = (query.sort || []).map(
    (s): SortRow => ({ id: nextId(), field: s.field, dir: s.dir, nulls: s.nulls ?? SORT_NULLS_DEFAULT }),
  );
  state.page = parsePage(query.page);

  return state;
};
