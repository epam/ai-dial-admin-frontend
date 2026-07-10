import { DATE_BIN_FN, SORT_NULLS_DEFAULT } from '@/src/constants/analytics/query-builder';
import {
  FilterNode,
  FilterNodeKind,
  QueryBuilderState,
  QueryBuilderWarning,
} from '@/src/models/analytics/query-builder';
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

export const buildQuery = (state: QueryBuilderState): StructuredQuery => {
  const q: StructuredQuery = { entity: state.entityName, mode: state.mode };

  if (state.distinct) q.distinct = true;

  const filter = serializeNode(state.filter);
  if (filter) q.filter = filter;

  if (state.mode === QueryMode.Row) {
    if (state.select.length) {
      q.select = state.select.map((name) => ({ expr: { type: QueryExprType.Field, name } }));
    }
  } else {
    const activeBuckets = state.buckets.filter((b) => b.field && b.alias);
    const groupBy = [...state.groupBy, ...activeBuckets.map((b) => b.alias)];
    if (groupBy.length) q.group_by = groupBy;

    const selectEntries: QueryOutputColumn[] = [];
    state.groupBy.forEach((name) => selectEntries.push({ expr: { type: QueryExprType.Field, name } }));
    state.buckets.forEach((b) => {
      if (!b.field) return;
      const fnExpr: QueryFnExpr = {
        type: QueryExprType.Fn,
        name: DATE_BIN_FN,
        args: [
          { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: String(b.amount) },
          { type: QueryExprType.Value, value_type: QueryValueType.String, value: b.unit },
          { type: QueryExprType.Field, name: b.field },
        ],
      };
      selectEntries.push({ expr: fnExpr, as: b.alias || '' });
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
  if (state.aggregates.some((a) => !a.alias)) warnings.push(QueryBuilderWarning.MissingAggregateAlias);
  if (state.buckets.some((b) => !b.field)) warnings.push(QueryBuilderWarning.MissingBucketField);
  if (state.buckets.some((b) => b.field && !b.alias)) warnings.push(QueryBuilderWarning.MissingBucketAlias);
  if (!state.groupBy.length && !state.buckets.length && !state.aggregates.length) {
    warnings.push(QueryBuilderWarning.EmptyAggregate);
  }
  return warnings;
};
