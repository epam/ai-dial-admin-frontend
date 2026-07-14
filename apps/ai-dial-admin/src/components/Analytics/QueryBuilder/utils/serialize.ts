import { IMPLICIT_COUNT_ALIAS, SORT_NULLS_DEFAULT } from '@/src/constants/analytics/query-builder';
import { withTimeBound } from '@/src/components/Analytics/QueryBuilder/utils/time';
import {
  FilterNode,
  FilterNodeKind,
  GroupByRow,
  QueryBuilderState,
  QueryBuilderWarning,
  QueryTimeBound,
} from '@/src/models/analytics/query-builder';
import {
  QueryAggregateFn,
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
  QueryScalarFn,
  QuerySortItem,
  QueryValueExpr,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';

// date_bin takes (amount, unit, timestamp); every other scalar function takes the column alone.
const groupByFnExpr = (g: GroupByRow): QueryFnExpr => {
  if (g.fn === QueryScalarFn.DateBin) {
    return {
      type: QueryExprType.Fn,
      name: QueryScalarFn.DateBin,
      args: [
        { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: String(g.amount) },
        { type: QueryExprType.Value, value_type: QueryValueType.String, value: g.unit },
        { type: QueryExprType.Field, name: g.field },
      ],
    };
  }
  return { type: QueryExprType.Fn, name: g.fn as string, args: [{ type: QueryExprType.Field, name: g.field }] };
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
    // A function entry is addressable in group_by only through its alias; plain columns by name.
    const activeGroupBy = state.groupBy.filter((g) => g.field);
    const groupNames = activeGroupBy.map((g) => (g.fn ? g.alias : g.field)).filter(Boolean);
    if (groupNames.length) q.group_by = groupNames;

    const selectEntries: QueryOutputColumn[] = [];
    activeGroupBy.forEach((g) => {
      if (!g.fn) {
        selectEntries.push({ expr: { type: QueryExprType.Field, name: g.field } });
        return;
      }
      selectEntries.push({ expr: groupByFnExpr(g), as: g.alias || '' });
    });
    state.aggregates.forEach((a) => {
      const fnExpr: QueryFnExpr = {
        type: QueryExprType.Fn,
        name: a.fn,
        args: a.field ? [{ type: QueryExprType.Field, name: a.field }] : [],
      };
      if (a.distinct) fnExpr.distinct = true;
      selectEntries.push({ expr: fnExpr, as: a.alias || '' });
    });
    // Aggregate mode without aggregates counts the group rows: bare group tuples are useless and
    // charts need at least one value column, so count() is the implicit measure.
    if (!state.aggregates.length) {
      selectEntries.push({
        expr: { type: QueryExprType.Fn, name: QueryAggregateFn.Count, args: [] },
        as: IMPLICIT_COUNT_ALIAS,
      });
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
  if (state.aggregates.some((a) => !a.alias)) warnings.push(QueryBuilderWarning.MissingAggregateAlias);
  if (fnRows.some((g) => !g.field)) warnings.push(QueryBuilderWarning.MissingGroupByField);
  if (fnRows.some((g) => g.field && !g.alias)) warnings.push(QueryBuilderWarning.MissingGroupByAlias);
  if (!state.groupBy.length && !state.aggregates.length) {
    warnings.push(QueryBuilderWarning.EmptyAggregate);
  }
  return warnings;
};
