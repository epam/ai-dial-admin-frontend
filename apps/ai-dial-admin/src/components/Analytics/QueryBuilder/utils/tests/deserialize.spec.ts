import { describe, expect, test } from 'vitest';

import { isChipRepresentable, parseQuery } from '@/src/components/Analytics/QueryBuilder/utils/deserialize';
import { buildQuery } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import {
  createAggregate,
  createGroup,
  createColumnRow,
  createFnRow,
  createInitialState,
  createPredicate,
  createSort,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { FilterOperandKind, FilterPredicateNode, QueryBuilderState } from '@/src/models/analytics/query-builder';
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
  QueryExpr,
  QueryFnExpr,
  QueryOutputColumn,
  QueryPage,
  QueryValueExpr,
} from '@/src/models/analytics/query';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
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
    s.select = [createColumnRow('project_id'), createColumnRow('chat_id')];

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

    const bucket = createFnRow(fnFixture('date_bin'), [
      { literal: '5' },
      { literal: 'hour' },
      { field: 'request_time' },
    ]);
    bucket.alias = 'bucket';
    s.groupBy = [createColumnRow('deployment'), bucket];

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
    const row = createFnRow(fnFixture('lower'), [{ field: 'deployment' }]);
    row.alias = 'dep';
    s.groupBy = [row];
    roundTrips(s);
  });

  test('aggregate query with an ordered-set aggregate (percentile_cont) round-trips', () => {
    const s = base();
    s.mode = QueryMode.Aggregate;
    s.groupBy = [createColumnRow('deployment')];
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

  // An authored alias belongs to whoever wrote the query, so it is marked user-owned and the builder
  // never rederives over it.
  test('an authored alias is kept and marked as user-edited', () => {
    const q: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Aggregate,
      select: [
        {
          expr: { type: QueryExprType.Fn, name: 'sum', args: [{ type: QueryExprType.Field, name: 'total_tokens' }] },
          as: 'total',
        },
        {
          expr: { type: QueryExprType.Fn, name: 'upper', args: [{ type: QueryExprType.Field, name: 'deployment' }] },
          as: 'dep',
        },
      ],
      group_by: ['dep'],
    };
    const parsed = parseQuery(q, [], TEST_FUNCTIONS);
    expect(parsed.aggregates[0]).toMatchObject({ alias: 'total', aliasEdited: true });
    expect(parsed.groupBy[0]).toMatchObject({ alias: 'dep', aliasEdited: true });
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

describe('parseQuery — row-mode function columns', () => {
  const extractExpr: QueryFnExpr = {
    type: QueryExprType.Fn,
    name: 'json_extract_string',
    args: [
      { type: QueryExprType.Field, name: 'request_tags' },
      { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'baggage' },
    ],
  };

  const rowQuery = (as?: string): StructuredQuery => ({
    entity: 'dial_usage_log',
    mode: QueryMode.Row,
    select: [{ expr: { type: QueryExprType.Field, name: 'project_id' } }, { expr: extractExpr, ...(as ? { as } : {}) }],
  });

  test('an fn select entry becomes a function row with its arguments filled', () => {
    const state = parseQuery(rowQuery('baggage'), [], TEST_FUNCTIONS);

    expect(state.select.map((row) => row.fn)).toEqual([null, 'json_extract_string']);
    expect(state.select[1].args).toEqual([{ field: 'request_tags' }, { literal: 'baggage' }]);
  });

  test('an authored alias is kept and marked user-owned', () => {
    const state = parseQuery(rowQuery('baggage'), [], TEST_FUNCTIONS);

    expect(state.select[1]).toMatchObject({ alias: 'baggage', aliasEdited: true });
  });

  test('an entry with no alias is prefilled with the derived one', () => {
    const state = parseQuery(rowQuery(), [], TEST_FUNCTIONS);

    expect(state.select[1]).toMatchObject({ alias: 'request_tags (Json extract string)', aliasEdited: false });
  });

  // A hand-authored call can omit `args` while the JSON is still syntactically valid — reached by
  // typing in the JSON view, where every keystroke is parsed.
  test('a call with no args at all parses to empty slots rather than throwing', () => {
    const bare: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Row,
      select: [{ expr: { type: QueryExprType.Fn, name: 'lower' } as never }],
    };

    expect(parseQuery(bare, [], TEST_FUNCTIONS).select[0].args).toEqual([{ field: '' }]);
  });

  test('the projection round-trips instead of losing the function column', () => {
    const original = rowQuery('baggage');

    expect(buildQuery(parseQuery(original, [], TEST_FUNCTIONS))).toMatchObject({ select: original.select });
  });
});

describe('parseQuery — function filter operands', () => {
  const filter = {
    op: QueryOperator.Ico,
    args: [
      {
        type: QueryExprType.Fn,
        name: 'json_extract_string',
        args: [
          { type: QueryExprType.Field, name: 'request_tags' },
          { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'baggage' },
        ],
      },
      { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'eval.run.id' },
    ],
  } as QueryPredicate;

  const withFilter: StructuredQuery = { entity: 'dial_usage_log', mode: QueryMode.Row, filter };

  test("a function left operand becomes the condition's function and arguments", () => {
    const state = parseQuery(withFilter, [], TEST_FUNCTIONS);

    expect(state.filter.children[0]).toMatchObject({
      fn: 'json_extract_string',
      field: '',
      args: [{ field: 'request_tags' }, { literal: 'baggage' }],
      value: 'eval.run.id',
    });
  });

  test('the predicate round-trips instead of being dropped', () => {
    expect(buildQuery(parseQuery(withFilter, [], TEST_FUNCTIONS))).toMatchObject({
      filter: { op: QueryLogicalOperator.And, args: [filter] },
    });
  });
});

describe('function right operands and nested calls', () => {
  const nowCall: QueryFnExpr = { type: QueryExprType.Fn, name: 'now', args: [] };

  const relativeCall = (unit: string, amount: string, inner: QueryExpr = nowCall): QueryFnExpr => ({
    type: QueryExprType.Fn,
    name: 'date_sub',
    args: [
      { type: QueryExprType.Value, value_type: QueryValueType.String, value: unit },
      { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: amount },
      inner,
    ],
  });

  // Wrapped in the root AND group the builder always holds, so a round trip compares like for like.
  const relativeQuery = (right: QueryExpr): StructuredQuery => ({
    entity: 'dial_usage_log',
    mode: QueryMode.Row,
    filter: {
      op: QueryLogicalOperator.And,
      args: [{ op: QueryOperator.Ge, args: [{ type: QueryExprType.Field, name: 'request_time' }, right] }],
    },
  });

  test('a relative bound hydrates into the condition with both calls intact', () => {
    const state = parseQuery(relativeQuery(relativeCall('minute', '30')), [], TEST_FUNCTIONS);
    const condition = state.filter.children[0] as FilterPredicateNode;

    expect(condition.field).toBe('request_time');
    expect(condition.rightKind).toBe(FilterOperandKind.Function);
    expect(condition.rightFn).toBe('date_sub');
    expect(condition.rightArgs).toEqual([{ literal: 'minute' }, { literal: '30' }, { call: { fn: 'now', args: [] } }]);
  });

  test('a relative bound round-trips through the builder unchanged', () => {
    const original = relativeQuery(relativeCall('day', '2'));
    const reparsed = buildQuery(parseQuery(original, [], TEST_FUNCTIONS));

    expect(reparsed.filter).toEqual(original.filter);
  });

  test('a nested call in a projected column hydrates too', () => {
    const query: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Row,
      select: [{ expr: { type: QueryExprType.Fn, name: 'length', args: [relativeCall('hour', '1')] }, as: 'since' }],
    };
    const state = parseQuery(query, [], TEST_FUNCTIONS);

    expect(state.select[0].args).toEqual([
      { call: { fn: 'date_sub', args: [{ literal: 'hour' }, { literal: '1' }, { call: { fn: 'now', args: [] } }] } },
    ]);
  });
});

// Each shape here passed the check before and then hydrated with part of it gone. The representable
// neighbours prove the check is not simply wider: they come back from the builder unchanged.
describe('parseQuery — references to an unaliased call', () => {
  const field = (name: string): QueryExpr => ({ type: QueryExprType.Field, name });
  const countAll: QueryExpr = { type: QueryExprType.Fn, name: 'count', args: [] };

  // The query sorts by the service's name for the column; the builder names it itself, so the sort
  // key has to follow or the rebuilt query orders by a column it no longer emits.
  test('a sort key naming the service name of an unaliased call follows the alias the builder gives it', () => {
    const query: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Aggregate,
      select: [{ expr: field('model') }, { expr: countAll }],
      group_by: ['model'],
      sort: [{ field: 'count', dir: QuerySortDirection.Desc }],
    };

    const rebuilt = buildQuery(parseQuery(query, [], TEST_FUNCTIONS));

    expect(rebuilt.sort).toEqual([{ field: rebuilt.select?.[1].as, dir: QuerySortDirection.Desc }]);
  });

  test('a having condition on it follows the alias too, while a plain column keeps its name', () => {
    const query: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Aggregate,
      select: [{ expr: field('model') }, { expr: countAll }],
      group_by: ['model'],
      having: {
        op: QueryLogicalOperator.And,
        args: [
          {
            op: QueryOperator.Gt,
            args: [field('count'), { type: QueryExprType.Value, value_type: QueryValueType.Long, value: '5' }],
          },
        ],
      },
      sort: [{ field: 'model', dir: QuerySortDirection.Asc }],
    };

    const rebuilt = buildQuery(parseQuery(query, [], TEST_FUNCTIONS));
    const condition = (rebuilt.having as { args: QueryPredicate[] }).args[0];

    expect(condition.args[0]).toEqual(field(rebuilt.select?.[1].as ?? ''));
    expect(rebuilt.sort).toEqual([{ field: 'model', dir: QuerySortDirection.Asc }]);
  });

  test('a repeated function takes the service suffix, so each reference follows its own column', () => {
    const lower = (name: string): QueryExpr => ({ type: QueryExprType.Fn, name: 'lower', args: [field(name)] });
    const query: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Row,
      select: [{ expr: lower('model') }, { expr: lower('project_id') }],
      sort: [{ field: 'lower_1', dir: QuerySortDirection.Asc }],
    };

    const rebuilt = buildQuery(parseQuery(query, [], TEST_FUNCTIONS));

    expect(rebuilt.sort).toEqual([{ field: rebuilt.select?.[1].as, dir: QuerySortDirection.Asc }]);
  });

  // The service reserves explicit aliases first, so an unaliased `count` yields its name to an alias
  // spelled `count` and takes `count_1` — the name a sort written against the query uses.
  test('an explicit alias claims its name before a derived one, as the service assigns them', () => {
    const query: StructuredQuery = {
      entity: 'dial_usage_log',
      mode: QueryMode.Aggregate,
      select: [
        { expr: field('model') },
        { expr: countAll },
        { expr: { type: QueryExprType.Fn, name: 'sum', args: [field('total_tokens')] }, as: 'count' },
      ],
      group_by: ['model'],
      sort: [
        { field: 'count_1', dir: QuerySortDirection.Desc },
        { field: 'count', dir: QuerySortDirection.Asc },
      ],
    };

    const rebuilt = buildQuery(parseQuery(query, [], TEST_FUNCTIONS));

    expect(rebuilt.sort).toEqual([
      { field: rebuilt.select?.[1].as, dir: QuerySortDirection.Desc },
      { field: 'count', dir: QuerySortDirection.Asc },
    ]);
  });
});

describe('isChipRepresentable', () => {
  const FIELDS: AnalyticsEntityField[] = [
    { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time' },
    { name: 'model', type: AnalyticsFieldType.String, source: 'model' },
    { name: 'cost', type: AnalyticsFieldType.Decimal, source: 'cost' },
  ];
  const page: QueryPage = { type: QueryPageType.Offset, limit: 25, offset: 0, include_total: false };
  const field = (name: string): QueryExpr => ({ type: QueryExprType.Field, name });
  const text = (value: string): QueryValueExpr => ({
    type: QueryExprType.Value,
    value_type: QueryValueType.String,
    value,
  });
  const eq = (name: string, value: string): QueryPredicate => ({
    op: QueryOperator.Eq,
    args: [field(name), text(value)],
  });
  const row = (overrides?: Partial<StructuredQuery>): StructuredQuery => ({
    entity: 'e',
    mode: QueryMode.Row,
    page,
    ...overrides,
  });
  const avgOfCost: QueryOutputColumn = {
    expr: { type: QueryExprType.Fn, name: 'avg', args: [field('cost')] },
    as: 'avg',
  };
  const aggregate = (overrides?: Partial<StructuredQuery>): StructuredQuery => ({
    entity: 'e',
    mode: QueryMode.Aggregate,
    select: [{ expr: field('model') }, avgOfCost],
    group_by: ['model'],
    page,
    ...overrides,
  });
  const check = (query: StructuredQuery) => isChipRepresentable(query, TEST_FUNCTIONS, FIELDS);

  test('accepts a row query of plain columns, flat AND conditions, sort keys and offset paging', () => {
    const query = row({
      select: [{ expr: field('model') }],
      filter: { op: QueryLogicalOperator.And, args: [eq('model', 'a'), eq('model', 'b')] },
      sort: [{ field: 'model', dir: QuerySortDirection.Desc }],
    });

    expect(check(query)).toBe(true);
    expect(check(row({ filter: eq('model', 'a') }))).toBe(true);
  });

  test('rejects a query that is distinct, carries having, or sorts nulls out of the default order', () => {
    expect(check(row({ distinct: true }))).toBe(false);
    expect(check(aggregate({ having: eq('avg', '1') }))).toBe(false);
    expect(check(row({ sort: [{ field: 'model', dir: QuerySortDirection.Asc, nulls: QuerySortNulls.First }] }))).toBe(
      false,
    );
  });

  test('rejects a query without a page, with cursor paging, or with a requested total', () => {
    expect(check(row({ page: void 0 }))).toBe(false);
    expect(check(row({ page: { type: QueryPageType.Cursor, limit: 25, cursor: null } }))).toBe(false);
    expect(check(row({ page: { ...page, include_total: true } }))).toBe(false);
  });

  test('rejects an OR root, a nested group, a call operand and a column compared with a column', () => {
    expect(check(row({ filter: { op: QueryLogicalOperator.Or, args: [eq('model', 'a')] } }))).toBe(false);
    expect(
      check(
        row({
          filter: { op: QueryLogicalOperator.And, args: [{ op: QueryLogicalOperator.And, args: [eq('model', 'a')] }] },
        }),
      ),
    ).toBe(false);
    expect(
      check(
        row({
          filter: {
            op: QueryOperator.Eq,
            args: [{ type: QueryExprType.Fn, name: 'lower', args: [field('model')] }, text('a')],
          },
        }),
      ),
    ).toBe(false);
    expect(check(row({ filter: { op: QueryOperator.Eq, args: [field('model'), field('cost')] } }))).toBe(false);
  });

  test('accepts a null comparison only under equality', () => {
    const nullValue: QueryValueExpr = { type: QueryExprType.Value, value_type: QueryValueType.Null, value: null };

    expect(check(row({ filter: { op: QueryOperator.Ne, args: [field('model'), nullValue] } }))).toBe(true);
    expect(check(row({ filter: { op: QueryOperator.Gt, args: [field('model'), nullValue] } }))).toBe(false);
  });

  test('lifts the period pair on the timestamp field before judging the filter', () => {
    const instant = (value: string): QueryValueExpr => ({
      type: QueryExprType.Value,
      value_type: QueryValueType.Timestamp,
      value,
    });
    const filter = {
      op: QueryLogicalOperator.And,
      args: [
        { op: QueryOperator.Ge, args: [field('request_time'), instant('1750000000000')] },
        { op: QueryOperator.Le, args: [field('request_time'), instant('1750003600000')] },
        eq('model', 'a'),
      ],
    };

    expect(check(row({ filter }))).toBe(true);
  });

  test('rejects a row query with a renamed column, a call column or a group-by key', () => {
    expect(check(row({ select: [{ expr: field('model'), as: 'm' }] }))).toBe(false);
    expect(check(row({ select: [avgOfCost] }))).toBe(false);
    expect(check(row({ group_by: ['model'] }))).toBe(false);
  });

  test('accepts an aggregate of one measure over one or two keys, the first optionally binned by time', () => {
    const binned: QueryOutputColumn = {
      expr: {
        type: QueryExprType.Fn,
        name: 'date_bin',
        args: [
          { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: '1' },
          text('hour'),
          field('request_time'),
        ],
      },
      as: 'bucket',
    };

    expect(check(aggregate())).toBe(true);
    expect(
      check(aggregate({ select: [binned, { expr: field('model') }, avgOfCost], group_by: ['bucket', 'model'] })),
    ).toBe(true);
  });

  test('rejects an aggregate with no key, two measures, three keys or a key missing from group_by', () => {
    expect(check(aggregate({ select: [avgOfCost], group_by: [] }))).toBe(false);
    expect(check(aggregate({ select: [{ expr: field('model') }, avgOfCost, { ...avgOfCost, as: 'b' }] }))).toBe(false);
    expect(
      check(
        aggregate({
          select: [{ expr: field('model') }, { expr: field('cost') }, { expr: field('request_time') }, avgOfCost],
          group_by: ['model', 'cost', 'request_time'],
        }),
      ),
    ).toBe(false);
    expect(check(aggregate({ group_by: [] }))).toBe(false);
  });

  test('rejects a measure the catalog does not serve or one marked distinct where that is unsupported', () => {
    const unserved: QueryOutputColumn = { expr: { type: QueryExprType.Fn, name: 'nope', args: [] }, as: 'n' };

    expect(check(aggregate({ select: [{ expr: field('model') }, unserved] }))).toBe(false);
    expect(isChipRepresentable(aggregate(), [], FIELDS)).toBe(false);
  });

  test('accepts a distinct measure only on the implicit count function', () => {
    const distinct = (name: string): QueryOutputColumn => ({
      expr: { type: QueryExprType.Fn, name, args: [field('cost')], distinct: true },
      as: 'd',
    });

    expect(check(aggregate({ select: [{ expr: field('model') }, distinct('count')] }))).toBe(true);
    expect(check(aggregate({ select: [{ expr: field('model') }, distinct('avg')] }))).toBe(false);
  });
});
