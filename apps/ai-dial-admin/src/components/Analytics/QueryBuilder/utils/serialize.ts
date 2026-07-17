import { IMPLICIT_COUNT_ALIAS, SORT_NULLS_DEFAULT } from '@/src/constants/analytics/query-builder';
import { withTimeBound } from '@/src/components/Analytics/QueryBuilder/utils/time';
import {
  functionByName,
  implicitMeasureFunction,
  isArgFilled,
  isExpressionArg,
  requiredArgsFilled,
  valueTypeForArgKind,
} from '@/src/components/Analytics/QueryBuilder/utils/functions';
import {
  FilterNode,
  FilterNodeKind,
  FnArgValue,
  QueryBuilderState,
  QueryBuilderWarning,
  QueryTimeBound,
} from '@/src/models/analytics/query-builder';
import { QueryFunction } from '@/src/models/analytics/query-function';
import {
  QueryExpr,
  QueryExprType,
  QueryFieldExpr,
  QueryFilterNode,
  QueryFnExpr,
  QueryGroup,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryOutputColumn,
  QueryPageType,
  QuerySortItem,
  QueryValueExpr,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';

// Build a function-call expression by walking the catalog function's ordered args against the row's
// arg-value slots: an `expression` arg serializes as a field reference, a literal arg as a value of
// the kind's type. An empty optional arg (e.g. count's) is omitted entirely.
const fnExpr = (fn: QueryFunction, args: FnArgValue[]): QueryFnExpr => {
  const exprArgs: QueryExpr[] = [];
  fn.args.forEach((argDef, i) => {
    const value = args[i] ?? {};
    if (argDef.optional && !isArgFilled(argDef, value)) return;
    if (isExpressionArg(argDef)) {
      exprArgs.push({ type: QueryExprType.Field, name: value.field ?? '' });
    } else {
      exprArgs.push({
        type: QueryExprType.Value,
        value_type: valueTypeForArgKind(argDef.kind),
        value: value.literal ?? '',
      });
    }
  });
  return { type: QueryExprType.Fn, name: fn.name, args: exprArgs };
};

export const serializeNode = (node: FilterNode): QueryFilterNode | null => {
  if (node.kind === FilterNodeKind.Group) {
    const args = node.children.map(serializeNode).filter((n): n is QueryFilterNode => n !== null);
    if (node.op === QueryLogicalOperator.Not) {
      if (!args.length) return null;
      const inner: QueryFilterNode = args.length === 1 ? args[0] : { op: QueryLogicalOperator.And, args };
      return { op: QueryLogicalOperator.Not, args: [inner] };
    }
    if (!args.length) return null;
    const group: QueryGroup = { op: node.op, args };
    return group;
  }

  if (!node.field) return null;
  const left: QueryFieldExpr = { type: QueryExprType.Field, name: node.field };
  let right: QueryExpr;
  if (node.isNull) {
    right = { type: QueryExprType.Value, value_type: QueryValueType.Null, value: null };
  } else if (node.op === QueryOperator.In) {
    const items: QueryValueExpr[] = node.value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length)
      .map((v) => ({ type: QueryExprType.Value, value_type: node.valueType, value: v }));
    right = { type: QueryExprType.Array, items };
  } else {
    right = { type: QueryExprType.Value, value_type: node.valueType, value: node.value };
  }
  return { op: node.op, args: [left, right] };
};

// The optional time bound comes from the toolbar time filter: it serializes into the query filter
// as visible ge/le predicates, so the JSON view, Copy, and Run all carry the same time bound.
export const buildQuery = (state: QueryBuilderState, timeBound?: QueryTimeBound | null): StructuredQuery => {
  const q: StructuredQuery = { entity: state.entityName, mode: state.mode };

  if (state.distinct) q.distinct = true;

  let filter = serializeNode(state.filter);
  if (timeBound) filter = withTimeBound(filter, timeBound);
  if (filter) q.filter = filter;

  if (state.mode === QueryMode.Row) {
    if (state.select.length) {
      q.select = state.select.map((name) => ({ expr: { type: QueryExprType.Field, name } }));
    }
  } else {
    // A plain column is active once named; a function row once its required args are filled. In
    // group_by a function entry is addressable only through its alias, a plain column by name.
    const activeGroupBy = state.groupBy.filter((g) => {
      if (!g.fn) return !!g.field;
      const fn = functionByName(state.functions, g.fn);
      return fn ? requiredArgsFilled(fn, g.args) : false;
    });
    const groupNames = activeGroupBy.map((g) => (g.fn ? g.alias : g.field)).filter(Boolean);
    if (groupNames.length) q.group_by = groupNames;

    const selectEntries: QueryOutputColumn[] = [];
    activeGroupBy.forEach((g) => {
      if (!g.fn) {
        selectEntries.push({ expr: { type: QueryExprType.Field, name: g.field } });
        return;
      }
      const fn = functionByName(state.functions, g.fn);
      if (fn) selectEntries.push({ expr: fnExpr(fn, g.args), as: g.alias || '' });
    });
    state.aggregates.forEach((a) => {
      const fn = functionByName(state.functions, a.fn);
      if (!fn) return;
      const expr = fnExpr(fn, a.args);
      if (a.distinct) expr.distinct = true;
      selectEntries.push({ expr, as: a.alias || '' });
    });
    // Aggregate mode without aggregates counts the group rows: bare group tuples are useless and
    // charts need at least one value column. The implicit measure is drawn from the catalog (the
    // first aggregate-group function whose args are all optional — count), never a hardcoded name.
    if (!state.aggregates.length) {
      const measure = implicitMeasureFunction(state.functions);
      if (measure) {
        selectEntries.push({
          expr: { type: QueryExprType.Fn, name: measure.name, args: [] },
          as: IMPLICIT_COUNT_ALIAS,
        });
      }
    }
    if (selectEntries.length) q.select = selectEntries;

    const having = serializeNode(state.having);
    if (having) q.having = having;
  }

  const sortItems: QuerySortItem[] = state.sort
    .filter((s) => s.field)
    .map((s) => {
      const item: QuerySortItem = { field: s.field, dir: s.dir };
      if (s.nulls && s.nulls !== SORT_NULLS_DEFAULT) item.nulls = s.nulls;
      return item;
    });
  if (sortItems.length) q.sort = sortItems;

  if (state.page.enabled) {
    if (state.page.type === QueryPageType.Offset) {
      q.page = {
        type: QueryPageType.Offset,
        offset: state.page.offset,
        limit: state.page.limit,
        include_total: state.page.includeTotal,
      };
    } else {
      const cursor = state.page.cursor.trim();
      q.page = { type: QueryPageType.Cursor, cursor: cursor || null, limit: state.page.cursorLimit };
    }
  }

  return q;
};

export const getAggregateWarnings = (state: QueryBuilderState): QueryBuilderWarning[] => {
  if (state.mode !== QueryMode.Aggregate) return [];
  const warnings: QueryBuilderWarning[] = [];
  const fnRows = state.groupBy.filter((g) => g.fn);
  const rowComplete = (g: (typeof fnRows)[number]): boolean => {
    const fn = functionByName(state.functions, g.fn);
    return !!fn && requiredArgsFilled(fn, g.args);
  };
  if (state.aggregates.some((a) => !a.alias)) warnings.push(QueryBuilderWarning.MissingAggregateAlias);
  // A function row with an unfilled required arg warns; once complete it warns for a missing alias.
  if (fnRows.some((g) => !rowComplete(g))) warnings.push(QueryBuilderWarning.MissingGroupByField);
  if (fnRows.some((g) => rowComplete(g) && !g.alias)) warnings.push(QueryBuilderWarning.MissingGroupByAlias);
  if (!state.groupBy.length && !state.aggregates.length) {
    warnings.push(QueryBuilderWarning.EmptyAggregate);
  }
  return warnings;
};
