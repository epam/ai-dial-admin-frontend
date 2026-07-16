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
  SortRow,
} from '@/src/models/analytics/query-builder';
import { QueryFunction, QueryFunctionGroup } from '@/src/models/analytics/query-function';
import {
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
import {
  createAggregate,
  createGroup,
  createGroupByColumn,
  createGroupByFn,
  createInitialPage,
  createInitialState,
  nextId,
} from './state';

const LOGICAL_OPS = new Set<string>([QueryLogicalOperator.And, QueryLogicalOperator.Or, QueryLogicalOperator.Not]);

const isGroup = (node: QueryFilterNode): node is QueryGroup => LOGICAL_OPS.has((node as QueryGroup).op);

const parseFilterNode = (node: QueryFilterNode): FilterNode => {
  if (isGroup(node)) {
    const children = (node.args || []).map(parseFilterNode);
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
    op: pred.op,
    valueType: QueryValueType.String,
    value: '',
    isNull: false,
  };

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

// The visual builder shows at most two filter levels: the root group plus one level of nested
// groups holding only conditions. `depth` is the group nesting level of `node`'s parent.
const groupDepthOk = (node: QueryFilterNode, depth: number): boolean => {
  if (!isGroup(node)) return true;
  if (depth >= 2) return false;
  return (node.args || []).every((child) => groupDepthOk(child, depth + 1));
};

// The sole representability rule: filter (and having) trees deeper than root + one group level
// cannot be displayed in the visual builder — such queries stay editable/runnable in written modes.
export const isBuilderRepresentable = (query: StructuredQuery): boolean => {
  const filterOk = !query.filter || groupDepthOk(query.filter, 0);
  const havingOk = !query.having || groupDepthOk(query.having, 0);
  return filterOk && havingOk;
};

const parseFilterRoot = (node?: QueryFilterNode): FilterGroupNode => {
  if (!node) return createGroup();
  const parsed = parseFilterNode(node);
  if (parsed.kind === FilterNodeKind.Group) return parsed;
  const root = createGroup();
  root.children = [parsed];
  return root;
};

// Reverse a serialized function call's ordered args into row arg-value slots, matched positionally
// against the catalog function's argument list.
const argsToSlots = (fn: QueryFunction, exprArgs: QueryOutputColumn['expr'][]): FnArgValue[] =>
  fn.args.map((argDef, i) => {
    const argExpr = exprArgs[i];
    if (isExpressionArg(argDef)) {
      return { field: argExpr?.type === QueryExprType.Field ? argExpr.name : '' };
    }
    return { literal: argExpr?.type === QueryExprType.Value ? (argExpr.value ?? '') : '' };
  });

const parseAggregateSelect = (
  select: QueryOutputColumn[],
  functions: QueryFunction[],
): { groupBy: GroupByRow[]; aggregates: AggregateRow[] } => {
  const groupBy: GroupByRow[] = [];
  const aggregates: AggregateRow[] = [];

  select.forEach((col) => {
    const expr = col.expr;
    if (expr.type === QueryExprType.Field) {
      groupBy.push({ ...createGroupByColumn(expr.name), alias: col.as ?? '' });
      return;
    }
    if (expr.type !== QueryExprType.Fn) return;
    // A function absent from the served catalog cannot be shown in the builder — the query stays
    // editable in the JSON/SQL views; here we simply skip it.
    const fn = functionByName(functions, expr.name);
    if (!fn) return;
    const slots = argsToSlots(fn, expr.args);
    if (fn.group === QueryFunctionGroup.Scalar) {
      groupBy.push({ ...createGroupByFn(fn, slots), alias: col.as ?? '' });
    } else {
      aggregates.push({ ...createAggregate(fn, slots), distinct: !!expr.distinct, alias: col.as ?? '' });
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
  state.filter = parseFilterRoot(query.filter);
  state.having = parseFilterRoot(query.having);

  if (state.mode === QueryMode.Aggregate) {
    const { groupBy, aggregates } = parseAggregateSelect(query.select || [], functions);
    state.groupBy = groupBy;
    state.aggregates = aggregates;
  } else {
    state.select = (query.select || [])
      .map((col) => (col.expr.type === QueryExprType.Field ? col.expr.name : ''))
      .filter(Boolean);
  }

  state.sort = (query.sort || []).map(
    (s): SortRow => ({ id: nextId(), field: s.field, dir: s.dir, nulls: s.nulls ?? SORT_NULLS_DEFAULT }),
  );
  state.page = parsePage(query.page);

  return state;
};
