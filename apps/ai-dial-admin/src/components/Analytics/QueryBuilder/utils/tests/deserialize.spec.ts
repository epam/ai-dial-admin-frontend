import { describe, expect, test } from 'vitest';

import { parseQuery } from '@/src/components/Analytics/QueryBuilder/utils/deserialize';
import { buildQuery } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import {
  createAggregate,
  createBucket,
  createGroup,
  createInitialState,
  createPredicate,
  createSort,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { QueryBuilderState } from '@/src/models/analytics/query-builder';
import {
  QueryBucketUnit,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  QuerySortDirection,
  QuerySortNulls,
  QueryValueType,
} from '@/src/models/analytics/query';

const roundTrips = (state: QueryBuilderState) => {
  const original = buildQuery(state);
  const reparsed = buildQuery(parseQuery(original, []));
  expect(reparsed).toEqual(original);
};

const base = (): QueryBuilderState => {
  const s = createInitialState();
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

  test('aggregate query with group-by, time bucket, aggregate and having', () => {
    const s = base();
    s.mode = QueryMode.Aggregate;
    s.groupBy = ['deployment'];

    const bucket = createBucket('request_time');
    bucket.amount = 5;
    bucket.unit = QueryBucketUnit.Hour;
    bucket.alias = 'bucket';
    s.buckets = [bucket];

    const agg = createAggregate();
    agg.field = 'total_tokens';
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

  test('cursor paging', () => {
    const s = base();
    s.page.type = QueryPageType.Cursor;
    s.page.cursor = 'abc';
    s.page.cursorLimit = 50;
    roundTrips(s);
  });

  test('parses entity and mode onto the state', () => {
    const parsed = parseQuery({ entity: 'rate_analytics', mode: QueryMode.Aggregate }, []);
    expect(parsed.entityName).toBe('rate_analytics');
    expect(parsed.mode).toBe(QueryMode.Aggregate);
  });
});
