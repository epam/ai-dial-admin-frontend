import { describe, expect, test } from 'vitest';

import {
  findTimestampField,
  liftTimeRange,
  timeRangePredicates,
  withTimeBound,
} from '@/src/components/Analytics/QueryBuilder/utils/time';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  QueryExprType,
  QueryFilterNode,
  QueryFnExpr,
  QueryGroup,
  QueryLogicalOperator,
  QueryOperator,
  QueryPredicate,
  QueryValueType,
} from '@/src/models/analytics/query';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';

const field = (name: string, type: AnalyticsFieldType): AnalyticsEntityField => ({ name, type, source: 'core' });

const RANGE = { startDate: new Date('2026-07-01T00:00:00.000Z'), endDate: new Date('2026-07-13T00:00:00.000Z') };

// The backend parses timestamp literals as longs — own serialization is epoch millis.
const gePredicate = (name = 'request_time', value = String(RANGE.startDate.getTime())): QueryPredicate => ({
  op: QueryOperator.Ge,
  args: [
    { type: QueryExprType.Field, name },
    { type: QueryExprType.Value, value_type: QueryValueType.Timestamp, value },
  ],
});

const lePredicate = (name = 'request_time', value = String(RANGE.endDate.getTime())): QueryPredicate => ({
  op: QueryOperator.Le,
  args: [
    { type: QueryExprType.Field, name },
    { type: QueryExprType.Value, value_type: QueryValueType.Timestamp, value },
  ],
});

const otherPredicate: QueryPredicate = {
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field, name: 'deployment' },
    { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'gpt-4o' },
  ],
};

describe('findTimestampField', () => {
  test('returns the first timestamp field', () => {
    const fields = [
      field('name', AnalyticsFieldType.String),
      field('event_date', AnalyticsFieldType.Date),
      field('request_time', AnalyticsFieldType.Timestamp),
    ];
    expect(findTimestampField(fields)).toBe('request_time');
  });

  test('falls back to the first date field', () => {
    const fields = [field('name', AnalyticsFieldType.String), field('event_date', AnalyticsFieldType.Date)];
    expect(findTimestampField(fields)).toBe('event_date');
  });

  test('returns null when no temporal field exists', () => {
    expect(findTimestampField([field('name', AnalyticsFieldType.String)])).toBeNull();
    expect(findTimestampField([])).toBeNull();
  });
});

describe('timeRangePredicates', () => {
  test('builds a ge/le pair with epoch-millis timestamps', () => {
    expect(timeRangePredicates('request_time', RANGE)).toEqual([gePredicate(), lePredicate()]);
  });
});

describe('withTimeBound', () => {
  const bound = { field: 'request_time', range: RANGE };

  test('creates an AND group when there is no filter', () => {
    expect(withTimeBound(null, bound)).toEqual({
      op: QueryLogicalOperator.And,
      args: [gePredicate(), lePredicate()],
    });
  });

  test('extends a root AND group', () => {
    const filter: QueryGroup = { op: QueryLogicalOperator.And, args: [otherPredicate] };
    expect(withTimeBound(filter, bound)).toEqual({
      op: QueryLogicalOperator.And,
      args: [otherPredicate, gePredicate(), lePredicate()],
    });
  });

  test('wraps a non-AND filter', () => {
    const filter: QueryFilterNode = { op: QueryLogicalOperator.Or, args: [otherPredicate] };
    expect(withTimeBound(filter, bound)).toEqual({
      op: QueryLogicalOperator.And,
      args: [filter, gePredicate(), lePredicate()],
    });
  });
});

describe('liftTimeRange', () => {
  test('lifts a matching pair and drops the empty group', () => {
    const filter: QueryGroup = { op: QueryLogicalOperator.And, args: [gePredicate(), lePredicate()] };
    const lifted = liftTimeRange(filter, 'request_time');
    expect(lifted?.range).toEqual(RANGE);
    expect(lifted?.rest).toBeUndefined();
  });

  test('lifts ISO-formatted values from hand-written JSON too', () => {
    const filter: QueryGroup = {
      op: QueryLogicalOperator.And,
      args: [
        gePredicate('request_time', '2026-07-01T00:00:00.000Z'),
        lePredicate('request_time', '2026-07-13T00:00:00.000Z'),
      ],
    };
    expect(liftTimeRange(filter, 'request_time')?.range).toEqual(RANGE);
  });

  test('keeps other conditions: single leftover is unwrapped', () => {
    const filter: QueryGroup = {
      op: QueryLogicalOperator.And,
      args: [otherPredicate, gePredicate(), lePredicate()],
    };
    const lifted = liftTimeRange(filter, 'request_time');
    expect(lifted?.range).toEqual(RANGE);
    expect(lifted?.rest).toEqual(otherPredicate);
  });

  test('keeps other conditions: multiple leftovers stay an AND group', () => {
    const filter: QueryGroup = {
      op: QueryLogicalOperator.And,
      args: [otherPredicate, gePredicate(), otherPredicate, lePredicate()],
    };
    const lifted = liftTimeRange(filter, 'request_time');
    expect(lifted?.rest).toEqual({ op: QueryLogicalOperator.And, args: [otherPredicate, otherPredicate] });
  });

  test('returns null for a partial pair', () => {
    const filter: QueryGroup = { op: QueryLogicalOperator.And, args: [gePredicate()] };
    expect(liftTimeRange(filter, 'request_time')).toBeNull();
  });

  test('returns null when predicates target another field', () => {
    const filter: QueryGroup = {
      op: QueryLogicalOperator.And,
      args: [gePredicate('_ingested_at'), lePredicate('_ingested_at')],
    };
    expect(liftTimeRange(filter, 'request_time')).toBeNull();
  });

  test('returns null for a non-AND root, an unparsable date, or no filter', () => {
    expect(
      liftTimeRange({ op: QueryLogicalOperator.Or, args: [gePredicate(), lePredicate()] }, 'request_time'),
    ).toBeNull();
    expect(
      liftTimeRange(
        { op: QueryLogicalOperator.And, args: [gePredicate('request_time', 'not-a-date'), lePredicate()] },
        'request_time',
      ),
    ).toBeNull();
    expect(liftTimeRange(undefined, 'request_time')).toBeNull();
  });
});

describe('relative time bounds', () => {
  const nowExpr: QueryFnExpr = { type: QueryExprType.Fn, name: 'now', args: [] };

  const relativeExpr = (unit: string, amount: string): QueryFnExpr => ({
    type: QueryExprType.Fn,
    name: 'date_sub',
    args: [
      { type: QueryExprType.Value, value_type: QueryValueType.String, value: unit },
      { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: amount },
      nowExpr,
    ],
  });

  const relativeGe = (unit: string, amount: string): QueryPredicate => ({
    op: QueryOperator.Ge,
    args: [{ type: QueryExprType.Field, name: 'request_time' }, relativeExpr(unit, amount)],
  });

  const nowLe: QueryPredicate = {
    op: QueryOperator.Le,
    args: [{ type: QueryExprType.Field, name: 'request_time' }, nowExpr],
  };

  // A catalog whose subtraction accepts fewer units than this deployment's presets need.
  const NARROW_FUNCTIONS: QueryFunction[] = TEST_FUNCTIONS.map((fn) =>
    fn.name === 'date_sub'
      ? { ...fn, args: [{ ...fn.args[0], constraints: { allowed_values: ['second'] } }, fn.args[1], fn.args[2]] }
      : fn,
  );

  test.each([
    ['15m', 'minute', '15'],
    ['24h', 'hour', '24'],
    ['2d', 'day', '2'],
  ])('preset %s serializes as a bound relative to the current instant', (period, unit, amount) => {
    expect(timeRangePredicates('request_time', RANGE, period, TEST_FUNCTIONS)).toEqual([
      relativeGe(unit, amount),
      nowLe,
    ]);
  });

  test('a custom range keeps serializing as two instants', () => {
    expect(timeRangePredicates('request_time', RANGE, undefined, TEST_FUNCTIONS)).toEqual([
      gePredicate(),
      lePredicate(),
    ]);
  });

  test('a catalog without the relative functions falls back to instants', () => {
    expect(timeRangePredicates('request_time', RANGE, '30m', [])).toEqual([gePredicate(), lePredicate()]);
  });

  test('a catalog whose subtraction refuses the unit falls back to instants', () => {
    expect(timeRangePredicates('request_time', RANGE, '30m', NARROW_FUNCTIONS)).toEqual([gePredicate(), lePredicate()]);
  });

  test('withTimeBound carries the relative pair into the filter', () => {
    const bound = { field: 'request_time', range: RANGE, period: '1h' };

    expect(withTimeBound(null, bound, TEST_FUNCTIONS)).toEqual({
      op: QueryLogicalOperator.And,
      args: [relativeGe('hour', '1'), nowLe],
    });
  });

  test('a relative pair lifts back to its preset, not to a range', () => {
    const filter: QueryGroup = { op: QueryLogicalOperator.And, args: [relativeGe('day', '2'), nowLe] };
    const lifted = liftTimeRange(filter, 'request_time', TEST_FUNCTIONS);

    expect(lifted?.periodId).toBe('2d');
    expect(lifted?.range).toBeUndefined();
  });

  test('a relative pair keeps the conditions around it', () => {
    const filter: QueryGroup = {
      op: QueryLogicalOperator.And,
      args: [otherPredicate, relativeGe('minute', '30'), nowLe],
    };
    const lifted = liftTimeRange(filter, 'request_time', TEST_FUNCTIONS);

    expect(lifted?.periodId).toBe('30m');
    expect(lifted?.rest).toEqual(otherPredicate);
  });

  test('a relative span no preset offers stays a filter condition', () => {
    const filter: QueryGroup = { op: QueryLogicalOperator.And, args: [relativeGe('hour', '7'), nowLe] };

    expect(liftTimeRange(filter, 'request_time', TEST_FUNCTIONS)).toBeNull();
  });

  test('a lower bound with no matching upper bound stays a filter condition', () => {
    const filter: QueryGroup = { op: QueryLogicalOperator.And, args: [relativeGe('minute', '30')] };

    expect(liftTimeRange(filter, 'request_time', TEST_FUNCTIONS)).toBeNull();
  });

  test('a pair mixing a relative bound and an instant stays a filter condition', () => {
    const filter: QueryGroup = { op: QueryLogicalOperator.And, args: [relativeGe('minute', '30'), lePredicate()] };

    expect(liftTimeRange(filter, 'request_time', TEST_FUNCTIONS)).toBeNull();
  });

  test('a relative pair the catalog cannot express is not lifted', () => {
    const filter: QueryGroup = { op: QueryLogicalOperator.And, args: [relativeGe('minute', '30'), nowLe] };

    expect(liftTimeRange(filter, 'request_time', NARROW_FUNCTIONS)).toBeNull();
    expect(liftTimeRange(filter, 'request_time', [])).toBeNull();
  });

  test('an absolute pair still lifts while the catalog is present', () => {
    const filter: QueryGroup = { op: QueryLogicalOperator.And, args: [gePredicate(), lePredicate()] };

    expect(liftTimeRange(filter, 'request_time', TEST_FUNCTIONS)?.range).toEqual(RANGE);
  });
});
