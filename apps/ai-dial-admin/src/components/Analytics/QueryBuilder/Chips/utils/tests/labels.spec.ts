import { describe, expect, test } from 'vitest';

import { TimePeriodOption } from '@/src/constants/global-time-filter';
import { ChipTranslate } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import {
  aggregateChipLabel,
  filterChipLabel,
  periodChipLabel,
  periodPresetLabel,
  sortChipLabel,
} from '@/src/components/Analytics/QueryBuilder/Chips/utils/labels';
import {
  createAggregate,
  createColumnRow,
  createFnRow,
  createInitialState,
  createPredicate,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { fnFixture, TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode, QueryOperator, QuerySortDirection, QuerySortNulls } from '@/src/models/analytics/query';
import { FilterPredicateNode, QueryBuilderState, SortRow } from '@/src/models/analytics/query-builder';
import { RelativeTimeUnit, TimeRange } from '@/src/models/time-range';

const FIELDS: AnalyticsEntityField[] = [
  { name: 'ts', type: AnalyticsFieldType.Timestamp, source: 'ts', display_name: 'Time' },
  { name: 'model', type: AnalyticsFieldType.String, source: 'model', display_name: 'Model' },
  { name: 'project', type: AnalyticsFieldType.String, source: 'project' },
  { name: 'latency', type: AnalyticsFieldType.Integer, source: 'latency', display_name: 'Latency' },
];

const t: ChipTranslate = (key) => key;

const predicateOf = (overrides: Partial<FilterPredicateNode> = {}): FilterPredicateNode => ({
  ...createPredicate(),
  field: 'model',
  ...overrides,
});

const stateOf = (overrides: Partial<QueryBuilderState> = {}): QueryBuilderState => ({
  ...createInitialState(TEST_FUNCTIONS),
  fields: FIELDS,
  mode: QueryMode.Aggregate,
  ...overrides,
});

const sortRow = (field: string, dir: QuerySortDirection): SortRow => ({
  id: 's1',
  field,
  dir,
  nulls: QuerySortNulls.Default,
});

describe('filterChipLabel', () => {
  test('reads as the field display name, the lowercased operator and the quoted value', () => {
    expect(filterChipLabel(predicateOf({ value: 'gpt-4' }), FIELDS, t)).toBe(
      `Model ${QueryBuilderI18nKey.OperatorEq.toLowerCase()} 'gpt-4'`,
    );
  });

  test('quotes each item of a list value', () => {
    expect(filterChipLabel(predicateOf({ op: QueryOperator.In, value: 'a, b' }), FIELDS, t)).toBe(
      `Model ${QueryBuilderI18nKey.OperatorIn.toLowerCase()} 'a', 'b'`,
    );
  });

  test('omits the value for an emptiness check', () => {
    expect(filterChipLabel(predicateOf({ isNull: true }), FIELDS, t)).toBe(
      `Model ${QueryChipsI18nKey.OperatorIsEmpty.toLowerCase()}`,
    );
    expect(filterChipLabel(predicateOf({ isNull: true, op: QueryOperator.Ne }), FIELDS, t)).toBe(
      `Model ${QueryChipsI18nKey.OperatorIsNotEmpty.toLowerCase()}`,
    );
  });

  test('omits the value when the predicate has none', () => {
    expect(filterChipLabel(predicateOf({ op: QueryOperator.Gt }), FIELDS, t)).toBe(
      `Model ${QueryBuilderI18nKey.OperatorGt.toLowerCase()}`,
    );
  });

  test('falls back to the field name when the schema gives no display name or does not know the field', () => {
    const operator = QueryBuilderI18nKey.OperatorEq.toLowerCase();

    expect(filterChipLabel(predicateOf({ field: 'project', value: 'x' }), FIELDS, t)).toBe(`project ${operator} 'x'`);
    expect(filterChipLabel(predicateOf({ field: 'unknown', value: 'x' }), [], t)).toBe(`unknown ${operator} 'x'`);
  });
});

describe('aggregateChipLabel', () => {
  test('returns an empty label when the query has no measure', () => {
    expect(aggregateChipLabel(stateOf({ groupBy: [createColumnRow('model')] }), t)).toBe('');
  });

  test('reads a measure without a column grouped by one field', () => {
    const state = stateOf({
      groupBy: [createColumnRow('model')],
      aggregates: [createAggregate(fnFixture('count'))],
    });

    expect(aggregateChipLabel(state, t)).toBe(`COUNT() ${QueryChipsI18nKey.AggregateBy} Model`);
  });

  test('names the measured column by its display name', () => {
    const state = stateOf({
      groupBy: [createColumnRow('project')],
      aggregates: [createAggregate(fnFixture('avg'), [{ field: 'latency' }])],
    });

    expect(aggregateChipLabel(state, t)).toBe(`AVG(Latency) ${QueryChipsI18nKey.AggregateBy} project`);
  });

  test('marks a distinct measure', () => {
    const state = stateOf({
      groupBy: [createColumnRow('model')],
      aggregates: [{ ...createAggregate(fnFixture('count'), [{ field: 'project' }]), distinct: true }],
    });

    expect(aggregateChipLabel(state, t)).toBe(`COUNT(DISTINCT project) ${QueryChipsI18nKey.AggregateBy} Model`);
  });

  test('lists both grouping fields and the time bucket of a binned grouping', () => {
    const state = stateOf({
      groupBy: [
        createFnRow(fnFixture('date_bin'), [{ literal: '1' }, { literal: 'hour' }, { field: 'ts' }]),
        createColumnRow('model'),
      ],
      aggregates: [createAggregate(fnFixture('percentile_cont'), [{ literal: '0.95' }, { field: 'latency' }])],
    });

    expect(aggregateChipLabel(state, t)).toBe(
      `PERCENTILE_CONT(Latency) ${QueryChipsI18nKey.AggregateBy} Time, Model ${QueryChipsI18nKey.AggregatePer} 1 hour`,
    );
  });

  test('reads a custom time bucket', () => {
    const state = stateOf({
      groupBy: [createFnRow(fnFixture('date_bin'), [{ literal: '5' }, { literal: 'minute' }, { field: 'ts' }])],
      aggregates: [createAggregate(fnFixture('count'))],
    });

    expect(aggregateChipLabel(state, t)).toBe(
      `COUNT() ${QueryChipsI18nKey.AggregateBy} Time ${QueryChipsI18nKey.AggregatePer} 5 minute`,
    );
  });
});

describe('sortChipLabel', () => {
  test('reads as the field display name and the direction', () => {
    expect(sortChipLabel(sortRow('model', QuerySortDirection.Asc), FIELDS, t)).toBe(
      `Model ${QueryBuilderI18nKey.DirectionAsc}`,
    );
    expect(sortChipLabel(sortRow('latency', QuerySortDirection.Desc), FIELDS, t)).toBe(
      `Latency ${QueryBuilderI18nKey.DirectionDesc}`,
    );
  });

  test('falls back to the field name for a column the schema does not know', () => {
    expect(sortChipLabel(sortRow('Row count', QuerySortDirection.Desc), FIELDS, t)).toBe(
      `Row count ${QueryBuilderI18nKey.DirectionDesc}`,
    );
  });
});

describe('periodChipLabel', () => {
  const RANGE: TimeRange = { startDate: new Date(2026, 0, 5, 10, 30), endDate: new Date(2026, 1, 17, 18, 0) };
  const formatted = (date: Date): string => date.toLocaleDateString(undefined, { dateStyle: 'medium' });

  test('reads a preset period by the label of its unit', () => {
    expect(periodChipLabel('15m', false, RANGE, t)).toBe('QueryChips.PeriodLastMinutes');
    expect(periodChipLabel('1h', false, RANGE, t)).toBe('QueryChips.PeriodLastHour');
    expect(periodChipLabel('3h', false, RANGE, t)).toBe('QueryChips.PeriodLastHours');
    expect(periodChipLabel('30d', false, RANGE, t)).toBe('QueryChips.PeriodLastDays');
  });

  test('falls back to the period id when it matches no preset', () => {
    expect(periodChipLabel('90d', false, RANGE, t)).toBe('90d');
    expect(periodChipLabel('', false, RANGE, t)).toBe('');
  });

  test('reads a custom range as its start and end dates', () => {
    expect(periodChipLabel('1h', true, RANGE, t)).toBe(`${formatted(RANGE.startDate)} – ${formatted(RANGE.endDate)}`);
  });

  test('reads a custom range within one day as the same date twice', () => {
    const day: TimeRange = { startDate: new Date(2026, 0, 5, 8), endDate: new Date(2026, 0, 5, 20) };

    expect(periodChipLabel('', true, day, t)).toBe(`${formatted(day.startDate)} – ${formatted(day.startDate)}`);
  });
});

describe('periodPresetLabel', () => {
  const withParams: ChipTranslate = (key, params) => `${key}:${params?.amount}`;
  const option = (unit: RelativeTimeUnit, amount: number): TimePeriodOption => ({
    value: 'x',
    label: 'Fallback',
    offset: 0,
    unit,
    amount,
  });

  test('passes the amount to the label of the unit', () => {
    expect(periodPresetLabel(option(RelativeTimeUnit.Minute, 15), withParams)).toBe('QueryChips.PeriodLastMinutes:15');
    expect(periodPresetLabel(option(RelativeTimeUnit.Day, 1), withParams)).toBe('QueryChips.PeriodLastDay:1');
    expect(periodPresetLabel(option(RelativeTimeUnit.Day, 7), withParams)).toBe('QueryChips.PeriodLastDays:7');
  });

  test('keeps the configured label for a unit that has none', () => {
    expect(periodPresetLabel(option(RelativeTimeUnit.Month, 2), withParams)).toBe('Fallback');
  });
});
