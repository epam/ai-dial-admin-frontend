import { describe, expect, test } from 'vitest';

import { isBuilderRepresentable, parseQuery } from '@/src/components/Analytics/QueryBuilder/utils/deserialize';
import { buildQuery } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import {
  createAggregate,
  createGroup,
  createGroupByColumn,
  createGroupByFn,
  createInitialState,
  createPredicate,
  createSort,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';
import {
  QueryExprType,
  QueryFilterNode,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  QueryPredicate,
  QuerySortDirection,
  QuerySortNulls,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { fnFixture, TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';

const roundTrips = (state: QueryBuilderState) => {
  const original = buildQuery(state);
  const reparsed = buildQuery(parseQuery(original, [], TEST_FUNCTIONS));
  expect(reparsed).toEqual(original);
};

const base = (): QueryBuilderState => {
  const s = createInitialState(TEST_FUNCTIONS);
  s.entityName = 'dial_usage_log';
  return s;
};

describe('parseQuery round-trip', () => {
  test('row query with filter, projection, sort and offset page', () => {
    const s = base();
    s.distinct = true;
    s.select = ['project_id', 'chat_id'];

    const eq = createPredicate();
    eq.field = 'event_kind';
    eq.value = 'chat';
    eq.valueType = QueryValueType.String;
    const inPred = createPredicate();
    inPred.field = 'deployment';
    inPred.op = QueryOperator.In;
    inPred.value = 'gpt-4, gpt-4o';
    inPred.valueType = QueryValueType.String;
    s.filter.children = [eq, inPred];

    const sort = createSort();
    sort.field = 'request_time';
    sort.dir = QuerySortDirection.Desc;
    sort.nulls = QuerySortNulls.Last;
    s.sort = [sort];

    roundTrips(s);
  });

  test('is-null predicate', () => {
    const s = base();
    const pred = createPredicate();
    pred.field = 'chat_id';
    pred.isNull = true;
    s.filter.children = [pred];
    roundTrips(s);
  });

  test('a case-sensitive contains (co) from a translated/authored query deserializes and is not coerced to ico', () => {
    const query: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Row,
      filter: {
        op: QueryOperator.Co,
        args: [
          { type: QueryExprType.Field, name: 'event_kind' },
          { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'Chat' },
        ],
      },
    };
    const state = parseQuery(query, []);
    expect(state.filter.children[0]).toMatchObject({ field: 'event_kind', op: QueryOperator.Co });
    // The operator survives re-serialization — it is preserved, not silently switched to ico.
    const rebuilt = buildQuery(state).filter as { args: QueryPredicate[] };
    expect(rebuilt.args[0].op).toBe(QueryOperator.Co);
  });

  test('NOT group with multiple children', () => {
    const s = base();
    const not = createGroup(QueryLogicalOperator.Not);
    const a = createPredicate();
    a.field = 'success';
    a.value = 'true';
    const b = createPredicate();
    b.field = 'event_kind';
    b.value = 'chat';
    not.children = [a, b];
    s.filter.children = [not];
    roundTrips(s);
  });

  test('aggregate query with group-by, date_bin, aggregate and having', () => {
    const s = base();
    s.mode = QueryMode.Aggregate;

    const bucket = createGroupByFn(fnFixture('date_bin'), [
      { literal: '5' },
      { literal: 'hour' },
      { field: 'request_time' },
    ]);
    bucket.alias = 'bucket';
    s.groupBy = [createGroupByColumn('deployment'), bucket];

    const agg = createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }]);
    agg.alias = 'sum_tokens';
    s.aggregates = [agg];

    const having = createPredicate();
    having.field = 'sum_tokens';
    having.op = QueryOperator.Gt;
    having.value = '100';
    having.valueType = QueryValueType.Long;
    s.having.children = [having];

    roundTrips(s);
  });

  test('aggregate query with a scalar-function group-by entry', () => {
    const s = base();
    s.mode = QueryMode.Aggregate;
    const row = createGroupByFn(fnFixture('lower'), [{ field: 'deployment' }]);
    row.alias = 'dep';
    s.groupBy = [row];
    roundTrips(s);
  });

  test('aggregate query with an ordered-set aggregate (percentile_cont) round-trips', () => {
    const s = base();
    s.mode = QueryMode.Aggregate;
    s.groupBy = [createGroupByColumn('deployment')];
    const agg = createAggregate(fnFixture('percentile_cont'), [{ literal: '0.5' }, { field: 'latency' }]);
    agg.alias = 'p50';
    s.aggregates = [agg];
    roundTrips(s);
  });

  test('scalar-function select entries parse back as group-by rows, not aggregates', () => {
    const q: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Aggregate,
      select: [
        {
          expr: {
            type: QueryExprType.Fn,
            name: 'upper',
            args: [{ type: QueryExprType.Field, name: 'deployment' }],
          },
          as: 'dep',
        },
      ],
      group_by: ['dep'],
    };
    const parsed = parseQuery(q, [], TEST_FUNCTIONS);
    expect(parsed.groupBy).toHaveLength(1);
    expect(parsed.groupBy[0].fn).toBe('upper');
    expect(parsed.groupBy[0].args[0].field).toBe('deployment');
    expect(parsed.groupBy[0].alias).toBe('dep');
    expect(parsed.aggregates).toHaveLength(0);
  });

  test('a function absent from the catalog is skipped (not builder-representable)', () => {
    const q: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Aggregate,
      select: [
        {
          expr: { type: QueryExprType.Fn, name: 'stddev', args: [{ type: QueryExprType.Field, name: 'latency' }] },
          as: 'sd',
        },
      ],
    };
    const parsed = parseQuery(q, [], TEST_FUNCTIONS);
    expect(parsed.groupBy).toHaveLength(0);
    expect(parsed.aggregates).toHaveLength(0);
  });

  test('cursor paging', () => {
    const s = base();
    s.page.type = QueryPageType.Cursor;
    s.page.cursor = 'abc';
    s.page.cursorLimit = 50;
    roundTrips(s);
  });

  test('parses entity and mode onto the state', () => {
    const parsed = parseQuery({ entity: 'rate_analytics', mode: QueryMode.Aggregate }, [], TEST_FUNCTIONS);
    expect(parsed.entityName).toBe('rate_analytics');
    expect(parsed.mode).toBe(QueryMode.Aggregate);
  });
});

describe('isBuilderRepresentable', () => {
  const pred = {
    op: QueryOperator.Eq,
    args: [
      { type: QueryExprType.Field, name: 'deployment' },
      { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'gpt-4o' },
    ],
  } as QueryPredicate;
  const base: StructuredQuery = { entity: 'dial_usage_log', mode: QueryMode.Row };

  test('no filter, a bare predicate, and a flat group are representable', () => {
    expect(isBuilderRepresentable(base)).toBe(true);
    expect(isBuilderRepresentable({ ...base, filter: pred })).toBe(true);
    expect(isBuilderRepresentable({ ...base, filter: { op: QueryLogicalOperator.And, args: [pred, pred] } })).toBe(
      true,
    );
  });

  test('root group + one nested group level is representable', () => {
    const filter: QueryFilterNode = {
      op: QueryLogicalOperator.And,
      args: [pred, { op: QueryLogicalOperator.Or, args: [pred, pred] }],
    };
    expect(isBuilderRepresentable({ ...base, filter })).toBe(true);
  });

  test('a group nested inside a nested group is not representable', () => {
    const filter: QueryFilterNode = {
      op: QueryLogicalOperator.And,
      args: [{ op: QueryLogicalOperator.Or, args: [pred, { op: QueryLogicalOperator.And, args: [pred] }] }],
    };
    expect(isBuilderRepresentable({ ...base, filter })).toBe(false);
  });

  test('the having tree follows the same rule', () => {
    const deep: QueryFilterNode = {
      op: QueryLogicalOperator.And,
      args: [{ op: QueryLogicalOperator.Or, args: [{ op: QueryLogicalOperator.And, args: [pred] }] }],
    };
    expect(isBuilderRepresentable({ ...base, mode: QueryMode.Aggregate, having: deep })).toBe(false);
    expect(isBuilderRepresentable({ ...base, mode: QueryMode.Aggregate, having: pred })).toBe(true);
  });
});
