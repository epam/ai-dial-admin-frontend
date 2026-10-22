import { describe, expect, test } from 'vitest';

import { renderFilterSql } from '@/src/components/Analytics/Pipelines/Filter/filter-sql';
import {
  formatTimestampValue,
  isFlatFilter,
  toFilterRows,
} from '@/src/components/Analytics/Pipelines/Filter/filter-rows';
import { PipelineFilterMatch, PipelineFilterOperator } from '@/src/components/Analytics/Pipelines/Filter/models';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  QueryExpr,
  QueryExprType,
  QueryFilterNode,
  QueryLogicalOperator,
  QueryOperator,
  QueryValueType,
} from '@/src/models/analytics/query';

const col = (name: string): QueryExpr => ({ type: QueryExprType.Field, name });
const val = (value: string | null, valueType = QueryValueType.String): QueryExpr => ({
  type: QueryExprType.Value,
  value_type: valueType,
  value,
});
const cmp = (op: QueryOperator, left: QueryExpr, right: QueryExpr): QueryFilterNode => ({ op, args: [left, right] });
const group = (op: QueryLogicalOperator, ...args: QueryFilterNode[]): QueryFilterNode => ({ op, args });

const summary = (node?: QueryFilterNode) => {
  const parsed = toFilterRows(node);
  return (
    parsed && { match: parsed.match, rows: parsed.rows.map(({ field, operator, value }) => [field, operator, value]) }
  );
};

describe('toFilterRows', () => {
  test('reads no filter as an empty list', () => {
    expect(summary(undefined)).toEqual({ match: PipelineFilterMatch.All, rows: [] });
  });

  test('reads a single condition', () => {
    expect(summary(cmp(QueryOperator.Eq, col('deployment'), val('gpt-4o')))).toEqual({
      match: PipelineFilterMatch.All,
      rows: [['deployment', PipelineFilterOperator.Eq, 'gpt-4o']],
    });
  });

  test('reads an OR list as match any', () => {
    const node = group(
      QueryLogicalOperator.Or,
      cmp(QueryOperator.Eq, col('a'), val('1')),
      cmp(QueryOperator.Gt, col('b'), val('2', QueryValueType.Integer)),
    );
    expect(summary(node)).toEqual({
      match: PipelineFilterMatch.Any,
      rows: [
        ['a', PipelineFilterOperator.Eq, '1'],
        ['b', PipelineFilterOperator.Gt, '2'],
      ],
    });
  });

  test('flattens a conjunction nested in a conjunction, as the service nests a folded range', () => {
    const node = group(
      QueryLogicalOperator.And,
      group(
        QueryLogicalOperator.And,
        cmp(QueryOperator.Gt, col('code'), val('1', QueryValueType.Integer)),
        cmp(QueryOperator.Lt, col('code'), val('5', QueryValueType.Integer)),
      ),
      cmp(QueryOperator.Eq, col('a'), val('x')),
    );
    expect(summary(node)?.rows).toEqual([
      ['code', PipelineFilterOperator.Gt, '1'],
      ['code', PipelineFilterOperator.Lt, '5'],
      ['a', PipelineFilterOperator.Eq, 'x'],
    ]);
  });

  test('reads null comparisons as emptiness checks', () => {
    const node = group(
      QueryLogicalOperator.And,
      cmp(QueryOperator.Eq, col('a'), val(null, QueryValueType.Null)),
      cmp(QueryOperator.Ne, col('b'), val(null, QueryValueType.Null)),
    );
    expect(summary(node)?.rows).toEqual([
      ['a', PipelineFilterOperator.IsEmpty, ''],
      ['b', PipelineFilterOperator.IsNotEmpty, ''],
    ]);
  });

  test('reads an in list as comma-separated values', () => {
    const node = cmp(QueryOperator.In, col('code'), {
      type: QueryExprType.Array,
      items: [
        { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: '200' },
        { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: '201' },
      ],
    });
    expect(summary(node)?.rows).toEqual([['code', PipelineFilterOperator.In, '200, 201']]);
  });

  test('reads NOT over an equality or a contains as its counterpart', () => {
    expect(summary(group(QueryLogicalOperator.Not, cmp(QueryOperator.Eq, col('a'), val('x'))))?.rows).toEqual([
      ['a', PipelineFilterOperator.Ne, 'x'],
    ]);
    expect(summary(group(QueryLogicalOperator.Not, cmp(QueryOperator.Inc, col('a'), val('x'))))?.rows).toEqual([
      ['a', PipelineFilterOperator.Contains, 'x'],
    ]);
  });

  test('shows a timestamp the service returns as epoch millis in UTC text', () => {
    const node = cmp(QueryOperator.Ge, col('at'), val(String(Date.UTC(2026, 9, 1, 8, 30)), QueryValueType.Timestamp));
    expect(summary(node)?.rows).toEqual([['at', PipelineFilterOperator.Ge, '2026-10-01 08:30:00']]);
  });

  test('gives each row its own id', () => {
    const node = group(
      QueryLogicalOperator.And,
      cmp(QueryOperator.Eq, col('a'), val('1')),
      cmp(QueryOperator.Eq, col('b'), val('2')),
    );
    const ids = toFilterRows(node)?.rows.map((row) => row.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe('toFilterRows — shapes the builder cannot show', () => {
  const a = cmp(QueryOperator.Eq, col('a'), val('1'));
  const b = cmp(QueryOperator.Eq, col('b'), val('2'));

  test.each([
    ['groups of different kinds', group(QueryLogicalOperator.And, a, group(QueryLogicalOperator.Or, a, b))],
    ['NOT over a group', group(QueryLogicalOperator.Not, group(QueryLogicalOperator.And, a, b))],
    [
      'NOT over an in list',
      group(
        QueryLogicalOperator.Not,
        cmp(QueryOperator.In, col('a'), {
          type: QueryExprType.Array,
          items: [{ type: QueryExprType.Value, value_type: QueryValueType.String, value: 'x' }],
        }),
      ),
    ],
    [
      'a function on the left',
      cmp(QueryOperator.Eq, { type: QueryExprType.Fn, name: 'lower', args: [col('a')] }, val('x')),
    ],
    ['a function on the right', cmp(QueryOperator.Lt, col('at'), { type: QueryExprType.Fn, name: 'now', args: [] })],
    ['two columns compared', cmp(QueryOperator.Eq, col('a'), col('b'))],
    ['a case-sensitive LIKE', cmp(QueryOperator.Co, col('a'), val('x'))],
    ['a null under an ordering operator', cmp(QueryOperator.Gt, col('a'), val(null, QueryValueType.Null))],
    ['an in over something other than values', cmp(QueryOperator.In, col('a'), val('x'))],
    [
      'an in item holding a comma',
      cmp(QueryOperator.In, col('a'), {
        type: QueryExprType.Array,
        items: [
          { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'a,b' },
          { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'c' },
        ],
      }),
    ],
    [
      'an in item with edge spaces',
      cmp(QueryOperator.In, col('a'), {
        type: QueryExprType.Array,
        items: [{ type: QueryExprType.Value, value_type: QueryValueType.String, value: 'x ' }],
      }),
    ],
  ])('refuses %s', (_, node) => {
    expect(toFilterRows(node)).toBeNull();
    expect(isFlatFilter(node)).toBe(false);
  });

  test('accepts a flat filter', () => {
    expect(isFlatFilter(group(QueryLogicalOperator.And, a, b))).toBe(true);
  });
});

describe('formatTimestampValue', () => {
  test('keeps milliseconds only when there are any', () => {
    expect(formatTimestampValue(String(Date.UTC(2026, 0, 2, 3, 4, 5)))).toBe('2026-01-02 03:04:05');
    expect(formatTimestampValue(String(Date.UTC(2026, 0, 2, 3, 4, 5, 60)))).toBe('2026-01-02 03:04:05.060');
  });
});

describe('render → parse round trip', () => {
  const FIELDS: AnalyticsEntityField[] = [
    { name: 'code', type: AnalyticsFieldType.Integer, source: 'src' },
    { name: 'deployment', type: AnalyticsFieldType.String, source: 'src' },
  ];

  // What the service hands back for each rendered operator, written out by hand from its translator.
  test.each([
    [PipelineFilterOperator.Eq, '1', cmp(QueryOperator.Eq, col('code'), val('1', QueryValueType.Integer))],
    [PipelineFilterOperator.Ne, '1', cmp(QueryOperator.Ne, col('code'), val('1', QueryValueType.Integer))],
    [PipelineFilterOperator.Lt, '1', cmp(QueryOperator.Lt, col('code'), val('1', QueryValueType.Integer))],
    [PipelineFilterOperator.Gt, '1', cmp(QueryOperator.Gt, col('code'), val('1', QueryValueType.Integer))],
    [PipelineFilterOperator.Le, '1', cmp(QueryOperator.Le, col('code'), val('1', QueryValueType.Integer))],
    [PipelineFilterOperator.Ge, '1', cmp(QueryOperator.Ge, col('code'), val('1', QueryValueType.Integer))],
    [
      PipelineFilterOperator.In,
      '1, 2',
      cmp(QueryOperator.In, col('code'), {
        type: QueryExprType.Array,
        items: [
          { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: '1' },
          { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: '2' },
        ],
      }),
    ],
    [PipelineFilterOperator.IsEmpty, '', cmp(QueryOperator.Eq, col('code'), val(null, QueryValueType.Null))],
    [PipelineFilterOperator.IsNotEmpty, '', cmp(QueryOperator.Ne, col('code'), val(null, QueryValueType.Null))],
  ])('%s survives a round trip', (operator, value, parsed) => {
    const row = { id: 'r', field: 'code', operator, value };
    expect(renderFilterSql([row], PipelineFilterMatch.All, FIELDS).sql).not.toBe('');
    expect(summary(parsed)?.rows).toEqual([['code', operator, value]]);
  });

  test.each([
    [PipelineFilterOperator.Contains, QueryOperator.Ico],
    [PipelineFilterOperator.NotContains, QueryOperator.Inc],
  ])('%s survives a round trip', (operator, op) => {
    const row = { id: 'r', field: 'deployment', operator, value: 'gpt' };
    expect(renderFilterSql([row], PipelineFilterMatch.All, FIELDS).sql).not.toBe('');
    expect(summary(cmp(op, col('deployment'), val('gpt')))?.rows).toEqual([['deployment', operator, 'gpt']]);
  });
});
