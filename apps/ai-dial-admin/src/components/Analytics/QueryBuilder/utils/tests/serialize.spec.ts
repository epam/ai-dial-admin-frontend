import { describe, expect, test } from 'vitest';

import {
  buildQuery,
  getAggregateWarnings,
  serializeNode,
} from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import {
  createAggregate,
  createGroup,
  createGroupByColumn,
  createGroupByFn,
  createInitialState,
  createPredicate,
  createSort,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { QueryBuilderState, QueryBuilderWarning } from '@/src/models/analytics/query-builder';
import {
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  QuerySortNulls,
  QueryValueType,
} from '@/src/models/analytics/query';
import { fnFixture, TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';

const baseState = (): QueryBuilderState => {
  const s = createInitialState(TEST_FUNCTIONS);
  s.entityName = 'dial_usage_log';
  return s;
};

describe('buildQuery — row mode', () => {
  test('minimal row query carries entity, mode and default offset page', () => {
    const q = buildQuery(baseState());
    expect(q.entity).toBe('dial_usage_log');
    expect(q.mode).toBe(QueryMode.Row);
    expect(q.page).toEqual({ type: QueryPageType.Offset, offset: 0, limit: 25, include_total: false });
    expect(q.select).toBeUndefined();
    expect(q.filter).toBeUndefined();
  });

  test('distinct flag is emitted only when set', () => {
    const s = baseState();
    expect(buildQuery(s).distinct).toBeUndefined();
    s.distinct = true;
    expect(buildQuery(s).distinct).toBe(true);
  });

  test('selected fields become field-expression columns in selection order', () => {
    const s = baseState();
    s.select = ['project_id', 'chat_id'];
    expect(buildQuery(s).select).toEqual([
      { expr: { type: 'field', name: 'project_id' } },
      { expr: { type: 'field', name: 'chat_id' } },
    ]);
  });

  test('page omitted when include page disabled', () => {
    const s = baseState();
    s.page.enabled = false;
    expect(buildQuery(s).page).toBeUndefined();
  });

  test('cursor paging serializes cursor and limit (empty cursor → null)', () => {
    const s = baseState();
    s.page.type = QueryPageType.Cursor;
    s.page.cursor = '';
    s.page.cursorLimit = 50;
    expect(buildQuery(s).page).toEqual({ type: QueryPageType.Cursor, cursor: null, limit: 50 });
    s.page.cursor = 'abc';
    expect(buildQuery(s).page).toEqual({ type: QueryPageType.Cursor, cursor: 'abc', limit: 50 });
  });
});

describe('buildQuery — sort', () => {
  test('fieldless sort keys are dropped and nulls omitted at default', () => {
    const s = baseState();
    const withField = createSort();
    withField.field = 'request_time';
    withField.dir = 'desc' as never;
    const fieldless = createSort();
    s.sort = [withField, fieldless];
    expect(buildQuery(s).sort).toEqual([{ field: 'request_time', dir: 'desc' }]);
  });

  test('nulls ordering included when set', () => {
    const s = baseState();
    const sort = createSort();
    sort.field = 'request_time';
    sort.nulls = QuerySortNulls.Last;
    s.sort = [sort];
    expect(buildQuery(s).sort?.[0]).toEqual({ field: 'request_time', dir: 'asc', nulls: 'last' });
  });
});

describe('serializeNode — filter tree', () => {
  test('empty group serializes to null (omitted)', () => {
    expect(serializeNode(createGroup())).toBeNull();
  });

  test('fieldless predicate serializes to null', () => {
    expect(serializeNode(createPredicate())).toBeNull();
  });

  test('AND group with a predicate', () => {
    const group = createGroup(QueryLogicalOperator.And);
    const pred = createPredicate();
    pred.field = 'event_kind';
    pred.value = 'chat';
    pred.valueType = QueryValueType.String;
    group.children.push(pred);
    expect(serializeNode(group)).toEqual({
      op: 'and',
      args: [
        {
          op: 'eq',
          args: [
            { type: 'field', name: 'event_kind' },
            { type: 'value', value_type: 'string', value: 'chat' },
          ],
        },
      ],
    });
  });

  test('is-null predicate → null value expression, ignores the text value', () => {
    const pred = createPredicate();
    pred.field = 'chat_id';
    pred.isNull = true;
    pred.value = 'ignored';
    const group = createGroup();
    group.children.push(pred);
    const serialized = serializeNode(group) as { args: { args: unknown[] }[] };
    expect(serialized.args[0].args[1]).toEqual({ type: 'value', value_type: 'null', value: null });
  });

  test('in operator builds an array expression, dropping empty tokens', () => {
    const pred = createPredicate();
    pred.field = 'event_kind';
    pred.op = QueryOperator.In;
    pred.valueType = QueryValueType.String;
    pred.value = 'a, b, ,c';
    const group = createGroup();
    group.children.push(pred);
    const serialized = serializeNode(group) as { args: { args: unknown[] }[] };
    expect(serialized.args[0].args[1]).toEqual({
      type: 'array',
      items: [
        { type: 'value', value_type: 'string', value: 'a' },
        { type: 'value', value_type: 'string', value: 'b' },
        { type: 'value', value_type: 'string', value: 'c' },
      ],
    });
  });

  test('NOT group wraps its single child', () => {
    const group = createGroup(QueryLogicalOperator.Not);
    const pred = createPredicate();
    pred.field = 'success';
    pred.value = 'true';
    group.children.push(pred);
    expect(serializeNode(group)).toEqual({
      op: 'not',
      args: [
        {
          op: 'eq',
          args: [
            { type: 'field', name: 'success' },
            { type: 'value', value_type: 'string', value: 'true' },
          ],
        },
      ],
    });
  });
});

describe('buildQuery — aggregate mode', () => {
  test('group-by fields and aggregates land in select and group_by', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    s.groupBy = [createGroupByColumn('deployment')];
    const agg = createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }]);
    agg.alias = 'sum_tokens';
    s.aggregates = [agg];
    const q = buildQuery(s);
    expect(q.group_by).toEqual(['deployment']);
    expect(q.select).toEqual([
      { expr: { type: 'field', name: 'deployment' } },
      { expr: { type: 'fn', name: 'sum', args: [{ type: 'field', name: 'total_tokens' }] }, as: 'sum_tokens' },
    ]);
  });

  test('date_bin group-by entry serializes its literal + field args from the catalog', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    const bucket = createGroupByFn(fnFixture('date_bin'), [
      { literal: '5' },
      { literal: 'minute' },
      { field: 'request_time' },
    ]);
    bucket.alias = 'bucket';
    s.groupBy = [bucket];
    const q = buildQuery(s);
    expect(q.group_by).toContain('bucket');
    expect(q.select).toContainEqual({
      expr: {
        type: 'fn',
        name: 'date_bin',
        args: [
          { type: 'value', value_type: 'integer', value: '5' },
          { type: 'value', value_type: 'string', value: 'minute' },
          { type: 'field', name: 'request_time' },
        ],
      },
      as: 'bucket',
    });
  });

  test('multi-arg scalar function (width_bucket) serializes four field args', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    const row = createGroupByFn(fnFixture('width_bucket'), [
      { field: 'latency' },
      { field: 'lo' },
      { field: 'hi' },
      { field: 'n' },
    ]);
    row.alias = 'bkt';
    s.groupBy = [row];
    const q = buildQuery(s);
    expect(q.group_by).toEqual(['bkt']);
    expect(q.select).toContainEqual({
      expr: {
        type: 'fn',
        name: 'width_bucket',
        args: [
          { type: 'field', name: 'latency' },
          { type: 'field', name: 'lo' },
          { type: 'field', name: 'hi' },
          { type: 'field', name: 'n' },
        ],
      },
      as: 'bkt',
    });
  });

  test('scalar function group-by entry serializes fn(field) AS alias, group_by uses the alias', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    const row = createGroupByFn(fnFixture('lower'), [{ field: 'deployment' }]);
    row.alias = 'dep';
    s.groupBy = [row];
    const q = buildQuery(s);
    expect(q.group_by).toEqual(['dep']);
    expect(q.select).toContainEqual({
      expr: { type: 'fn', name: 'lower', args: [{ type: 'field', name: 'deployment' }] },
      as: 'dep',
    });
  });

  test('ordered-set aggregate (percentile_cont) serializes its numeric literal + field args', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    const agg = createAggregate(fnFixture('percentile_cont'), [{ literal: '0.95' }, { field: 'latency' }]);
    agg.alias = 'p95';
    s.aggregates = [agg];
    const q = buildQuery(s);
    expect(q.select).toContainEqual({
      expr: {
        type: 'fn',
        name: 'percentile_cont',
        args: [
          { type: 'value', value_type: 'decimal', value: '0.95' },
          { type: 'field', name: 'latency' },
        ],
      },
      as: 'p95',
    });
  });

  test('distinct is emitted on an aggregate only when set', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    const agg = createAggregate(fnFixture('count'), [{ field: 'chat_id' }]);
    agg.alias = 'chats';
    agg.distinct = true;
    s.aggregates = [agg];
    const expr = buildQuery(s).select?.find((c) => c.as === 'chats')?.expr as { distinct?: boolean };
    expect(expr.distinct).toBe(true);
  });

  test('incomplete function entries are dropped; aliasless complete entries stay out of group_by', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    const empty = createGroupByFn(fnFixture('upper')); // required text arg unfilled → dropped
    const noAlias = createGroupByFn(fnFixture('trim'), [{ field: 'deployment' }]);
    noAlias.alias = '';
    s.groupBy = [empty, noAlias];
    const q = buildQuery(s);
    expect(q.group_by).toBeUndefined();
    expect(q.select).toContainEqual({
      expr: { type: 'fn', name: 'trim', args: [{ type: 'field', name: 'deployment' }] },
      as: '',
    });
    expect(q.select?.some((c) => (c.expr as { name?: string }).name === 'upper')).toBe(false);
  });
});

describe('getAggregateWarnings', () => {
  test('no warnings in row mode', () => {
    expect(getAggregateWarnings(baseState())).toEqual([]);
  });

  test('empty aggregate query warns', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    expect(getAggregateWarnings(s)).toContain(QueryBuilderWarning.EmptyAggregate);
  });

  test('missing aggregate alias and function field are flagged', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    s.aggregates = [createAggregate(fnFixture('sum'))];
    s.groupBy = [createGroupByFn(fnFixture('date_bin'))];
    const warnings = getAggregateWarnings(s);
    expect(warnings).toContain(QueryBuilderWarning.MissingAggregateAlias);
    expect(warnings).toContain(QueryBuilderWarning.MissingGroupByField);
  });

  test('function entry with all args filled but no alias is flagged; plain columns are not', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    const fnRow = createGroupByFn(fnFixture('lower'), [{ field: 'deployment' }]);
    fnRow.alias = '';
    s.groupBy = [createGroupByColumn('project_id'), fnRow];
    const warnings = getAggregateWarnings(s);
    expect(warnings).toContain(QueryBuilderWarning.MissingGroupByAlias);
    expect(warnings).not.toContain(QueryBuilderWarning.MissingGroupByField);
  });
});

describe('buildQuery implicit measure', () => {
  test('aggregate mode without aggregates appends the catalog implicit measure (count)', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    s.groupBy = [createGroupByColumn('project_id')];
    const q = buildQuery(s);
    expect(q.select).toEqual([
      { expr: { type: 'field', name: 'project_id' } },
      { expr: { type: 'fn', name: 'count', args: [] }, as: 'count' },
    ]);
  });

  test('no implicit measure when the catalog has no all-optional aggregate function', () => {
    const s = baseState();
    s.functions = TEST_FUNCTIONS.filter((f) => f.name !== 'count');
    s.mode = QueryMode.Aggregate;
    s.groupBy = [createGroupByColumn('project_id')];
    const q = buildQuery(s);
    expect(q.select).toEqual([{ expr: { type: 'field', name: 'project_id' } }]);
  });

  test('user-defined aggregates suppress the implicit measure', () => {
    const s = baseState();
    s.mode = QueryMode.Aggregate;
    s.groupBy = [createGroupByColumn('project_id')];
    const agg = createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }]);
    agg.alias = 'tokens';
    s.aggregates = [agg];
    const q = buildQuery(s);
    expect(q.select?.filter((c) => c.expr.type === 'fn')).toHaveLength(1);
  });

  test('row mode never gets an implicit measure', () => {
    const q = buildQuery(baseState());
    expect(q.select).toBeUndefined();
  });
});

describe('buildQuery time bound', () => {
  const bound = {
    field: 'request_time',
    range: { startDate: new Date('2026-07-01T00:00:00.000Z'), endDate: new Date('2026-07-13T00:00:00.000Z') },
  };

  test('serializes the toolbar time range into the filter as an epoch-millis ge/le pair', () => {
    const q = buildQuery(baseState(), bound);
    expect(q.filter).toEqual({
      op: QueryLogicalOperator.And,
      args: [
        {
          op: QueryOperator.Ge,
          args: [
            { type: 'field', name: 'request_time' },
            { type: 'value', value_type: QueryValueType.Timestamp, value: String(bound.range.startDate.getTime()) },
          ],
        },
        {
          op: QueryOperator.Le,
          args: [
            { type: 'field', name: 'request_time' },
            { type: 'value', value_type: QueryValueType.Timestamp, value: String(bound.range.endDate.getTime()) },
          ],
        },
      ],
    });
  });

  test('appends the pair after user conditions in a root AND group', () => {
    const s = baseState();
    const pred = createPredicate();
    pred.field = 'deployment';
    pred.value = 'gpt-4o';
    s.filter.children = [pred];
    const q = buildQuery(s, bound);
    const args = (q.filter as { args: unknown[] }).args;
    expect(args).toHaveLength(3);
  });

  test('no bound leaves the filter untouched', () => {
    const q = buildQuery(baseState());
    expect(q.filter).toBeUndefined();
  });
});
