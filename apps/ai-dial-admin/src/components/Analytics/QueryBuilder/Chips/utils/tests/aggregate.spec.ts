import { describe, expect, test } from 'vitest';

import { AggregateChipForm, TimeBucketChoice } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import {
  aggregateChoiceByKey,
  aggregateFunctionChoices,
  bucketOf,
  createAggregateForm,
  formatBucket,
  hasAggregate,
  isAggregateFormValid,
  isArgRequired,
  isArgShown,
  isBucketOffered,
  isTemporalField,
  parseCustomBucket,
  timeBucketPresets,
  toAggregateForm,
  withAggregate,
  withoutAggregate,
} from '@/src/components/Analytics/QueryBuilder/Chips/utils/aggregate';
import {
  createAggregate,
  createColumnRow,
  createFnRow,
  createInitialState,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { fnFixture, TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode, QuerySortDirection, QuerySortNulls } from '@/src/models/analytics/query';
import { QueryBuilderState, SortRow, TimeBinFunction } from '@/src/models/analytics/query-builder';
import {
  QueryFunction,
  QueryFunctionArgKind,
  QueryFunctionGroup,
  QueryFunctionReturnType,
} from '@/src/models/analytics/query-function';

const FIELDS: AnalyticsEntityField[] = [
  { name: 'ts', type: AnalyticsFieldType.Timestamp, source: 'ts' },
  { name: 'day', type: AnalyticsFieldType.Date, source: 'day' },
  { name: 'model', type: AnalyticsFieldType.String, source: 'model' },
  { name: 'project', type: AnalyticsFieldType.String, source: 'project' },
  { name: 'latency', type: AnalyticsFieldType.Integer, source: 'latency' },
];

const BIN: TimeBinFunction = {
  fn: fnFixture('date_bin'),
  amountIndex: 0,
  unitIndex: 1,
  timestampIndex: 2,
  units: ['day', 'hour', 'minute', 'second', 'week'],
  minAmount: 1,
};

const BIN_ANY_UNIT: TimeBinFunction = { ...BIN, units: null };

const OPTIONAL_ARGS_FN: QueryFunction = {
  name: 'top_k',
  group: QueryFunctionGroup.Aggregate,
  signature: 'top_k([k], [value])',
  returns: QueryFunctionReturnType.Numeric,
  distinct_supported: true,
  description: 'top values',
  args: [
    { name: 'k', kind: QueryFunctionArgKind.IntegerLiteral, optional: true },
    { name: 'value', kind: QueryFunctionArgKind.Expression, optional: true },
  ],
};

const formOf = (overrides: Partial<AggregateChipForm> = {}): AggregateChipForm => ({
  groupBy: 'model',
  bucketId: TimeBucketChoice.None,
  customBucket: '',
  secondaryGroupBy: null,
  functionKey: 'count',
  args: [{}],
  ...overrides,
});

const sortRow = (id: string, field: string): SortRow => ({
  id,
  field,
  dir: QuerySortDirection.Asc,
  nulls: QuerySortNulls.Default,
});

const stateOf = (overrides: Partial<QueryBuilderState> = {}): QueryBuilderState => ({
  ...createInitialState(TEST_FUNCTIONS),
  fields: FIELDS,
  ...overrides,
});

const binRow = (amount: string, unit: string, field: string) =>
  createFnRow(fnFixture('date_bin'), [{ literal: amount }, { literal: unit }, { field }]);

describe('isTemporalField', () => {
  test('recognizes timestamp and date fields', () => {
    expect(isTemporalField(FIELDS, 'ts')).toBe(true);
    expect(isTemporalField(FIELDS, 'day')).toBe(true);
  });

  test('rejects a field of another type', () => {
    expect(isTemporalField(FIELDS, 'model')).toBe(false);
    expect(isTemporalField(FIELDS, 'latency')).toBe(false);
  });

  test('rejects a field the schema does not know', () => {
    expect(isTemporalField(FIELDS, 'unknown')).toBe(false);
    expect(isTemporalField([], 'ts')).toBe(false);
  });
});

describe('timeBucketPresets', () => {
  test('offers no presets without a time-bin function', () => {
    expect(timeBucketPresets(null)).toEqual([]);
  });

  test('offers only the presets whose unit the function allows', () => {
    expect(timeBucketPresets(BIN).map((preset) => preset.id)).toEqual([
      '15m',
      '30m',
      '1h',
      '3h',
      '6h',
      '12h',
      '24h',
      '1w',
    ]);
  });

  test('offers every preset when the function does not restrict units', () => {
    expect(timeBucketPresets(BIN_ANY_UNIT).map((preset) => preset.id)).toEqual([
      '15m',
      '30m',
      '1h',
      '3h',
      '6h',
      '12h',
      '24h',
      '1w',
      '1mo',
    ]);
  });

  test('withholds the presets below the minimum amount', () => {
    expect(timeBucketPresets({ ...BIN, units: ['hour'], minAmount: 6 })).toEqual([
      { id: '6h', amount: 6, unit: 'hour' },
      { id: '12h', amount: 12, unit: 'hour' },
      { id: '24h', amount: 24, unit: 'hour' },
    ]);
  });
});

describe('parseCustomBucket', () => {
  test('parses an amount with a short unit alias', () => {
    expect(parseCustomBucket('5m', BIN)).toEqual({ amount: 5, unit: 'minute' });
    expect(parseCustomBucket('2h', BIN)).toEqual({ amount: 2, unit: 'hour' });
    expect(parseCustomBucket('3d', BIN)).toEqual({ amount: 3, unit: 'day' });
  });

  test('parses a full unit name, singular or plural', () => {
    expect(parseCustomBucket('90 second', BIN)).toEqual({ amount: 90, unit: 'second' });
    expect(parseCustomBucket('2 hours', BIN)).toEqual({ amount: 2, unit: 'hour' });
  });

  test('ignores surrounding whitespace and letter case', () => {
    expect(parseCustomBucket('  3 HRS ', BIN)).toEqual({ amount: 3, unit: 'hour' });
  });

  test('parses an amount with leading zeros', () => {
    expect(parseCustomBucket('05m', BIN)).toEqual({ amount: 5, unit: 'minute' });
  });

  test('resolves an alias to any unit when the function does not restrict units', () => {
    expect(parseCustomBucket('2mo', BIN_ANY_UNIT)).toEqual({ amount: 2, unit: 'month' });
  });

  test('reads a plural unit as its singular when the function does not restrict units', () => {
    expect(parseCustomBucket('5 minutes', BIN_ANY_UNIT)).toEqual({ amount: 5, unit: 'minute' });
  });

  test('rejects a unit the function does not allow', () => {
    expect(parseCustomBucket('1mo', BIN)).toBeNull();
    expect(parseCustomBucket('5 fortnights', BIN)).toBeNull();
  });

  test('rejects an amount below the minimum', () => {
    expect(parseCustomBucket('0h', BIN)).toBeNull();
    expect(parseCustomBucket('3m', { ...BIN, minAmount: 5 })).toBeNull();
  });

  test('accepts an amount equal to the minimum', () => {
    expect(parseCustomBucket('5m', { ...BIN, minAmount: 5 })).toEqual({ amount: 5, unit: 'minute' });
  });

  test('rejects text that is not an amount followed by a unit', () => {
    expect(parseCustomBucket('', BIN)).toBeNull();
    expect(parseCustomBucket('5', BIN)).toBeNull();
    expect(parseCustomBucket('h', BIN)).toBeNull();
    expect(parseCustomBucket('1.5h', BIN)).toBeNull();
    expect(parseCustomBucket('-5m', BIN)).toBeNull();
    expect(parseCustomBucket('5m 10s', BIN)).toBeNull();
  });

  test('returns null without a time-bin function', () => {
    expect(parseCustomBucket('5m', null)).toBeNull();
  });
});

describe('formatBucket', () => {
  test('formats a bucket as its amount and unit', () => {
    expect(formatBucket({ amount: 5, unit: 'minute' })).toBe('5 minute');
  });

  test('produces text the custom bucket parser reads back', () => {
    const bucket = { amount: 45, unit: 'second' };

    expect(parseCustomBucket(formatBucket(bucket), BIN)).toEqual(bucket);
  });
});

describe('aggregateFunctionChoices', () => {
  test('offers every aggregate function plus a distinct variant of the implicit measure', () => {
    expect(aggregateFunctionChoices(TEST_FUNCTIONS)).toEqual([
      { key: 'avg', fn: 'avg', isDistinct: false },
      { key: 'count', fn: 'count', isDistinct: false },
      { key: 'count:distinct', fn: 'count', isDistinct: true },
      { key: 'max', fn: 'max', isDistinct: false },
      { key: 'min', fn: 'min', isDistinct: false },
      { key: 'percentile_cont', fn: 'percentile_cont', isDistinct: false },
      { key: 'percentile_disc', fn: 'percentile_disc', isDistinct: false },
      { key: 'sum', fn: 'sum', isDistinct: false },
    ]);
  });

  test('offers no distinct variant when the implicit measure does not support distinct', () => {
    const functions = [{ ...fnFixture('count'), distinct_supported: false }];

    expect(aggregateFunctionChoices(functions)).toEqual([{ key: 'count', fn: 'count', isDistinct: false }]);
  });

  test('offers no distinct variant when the catalog has no implicit measure', () => {
    expect(aggregateFunctionChoices([fnFixture('avg'), fnFixture('sum')])).toEqual([
      { key: 'avg', fn: 'avg', isDistinct: false },
      { key: 'sum', fn: 'sum', isDistinct: false },
    ]);
  });

  test('offers nothing for an empty catalog or one with scalar functions only', () => {
    expect(aggregateFunctionChoices([])).toEqual([]);
    expect(aggregateFunctionChoices([fnFixture('lower'), fnFixture('date_bin')])).toEqual([]);
  });
});

describe('aggregateChoiceByKey', () => {
  test('finds a plain choice by its key', () => {
    expect(aggregateChoiceByKey(TEST_FUNCTIONS, 'avg')).toEqual({ key: 'avg', fn: 'avg', isDistinct: false });
  });

  test('finds the distinct choice of the implicit measure', () => {
    expect(aggregateChoiceByKey(TEST_FUNCTIONS, 'count:distinct')).toEqual({
      key: 'count:distinct',
      fn: 'count',
      isDistinct: true,
    });
  });

  test('returns undefined for a key that is not offered', () => {
    expect(aggregateChoiceByKey(TEST_FUNCTIONS, 'lower')).toBeUndefined();
    expect(aggregateChoiceByKey(TEST_FUNCTIONS, '')).toBeUndefined();
    expect(aggregateChoiceByKey([], 'count')).toBeUndefined();
  });
});

describe('isArgRequired', () => {
  test('requires a non-optional argument', () => {
    expect(isArgRequired(fnFixture('avg'), 0, false)).toBe(true);
    expect(isArgRequired(fnFixture('percentile_cont'), 0, false)).toBe(true);
  });

  test('does not require an optional argument of a plain call', () => {
    expect(isArgRequired(fnFixture('count'), 0, false)).toBe(false);
    expect(isArgRequired(OPTIONAL_ARGS_FN, 0, false)).toBe(false);
  });

  test('requires an optional expression argument of a distinct call', () => {
    expect(isArgRequired(fnFixture('count'), 0, true)).toBe(true);
  });

  test('does not require an optional literal argument of a distinct call', () => {
    expect(isArgRequired(OPTIONAL_ARGS_FN, 0, true)).toBe(false);
  });
});

describe('isArgShown', () => {
  test('shows a required argument', () => {
    expect(isArgShown(fnFixture('avg'), 0, false)).toBe(true);
    expect(isArgShown(fnFixture('count'), 0, true)).toBe(true);
  });

  test('hides an optional expression argument of a plain call', () => {
    expect(isArgShown(fnFixture('count'), 0, false)).toBe(false);
    expect(isArgShown(OPTIONAL_ARGS_FN, 1, false)).toBe(false);
  });

  test('shows an optional literal argument', () => {
    expect(isArgShown(OPTIONAL_ARGS_FN, 0, false)).toBe(true);
    expect(isArgShown(OPTIONAL_ARGS_FN, 0, true)).toBe(true);
  });
});

describe('bucketOf', () => {
  test('returns null when no bucket is chosen', () => {
    expect(bucketOf(formOf({ customBucket: '5m' }), BIN)).toBeNull();
  });

  test('returns the chosen preset', () => {
    expect(bucketOf(formOf({ bucketId: '1h' }), BIN)).toEqual({ id: '1h', amount: 1, unit: 'hour' });
  });

  test('returns null for a preset the function does not offer', () => {
    expect(bucketOf(formOf({ bucketId: '1mo' }), BIN)).toBeNull();
    expect(bucketOf(formOf({ bucketId: 'unknown' }), BIN)).toBeNull();
  });

  test('parses a custom bucket', () => {
    expect(bucketOf(formOf({ bucketId: TimeBucketChoice.Custom, customBucket: '5m' }), BIN)).toEqual({
      amount: 5,
      unit: 'minute',
    });
  });

  test('returns null for a custom bucket that does not parse', () => {
    expect(bucketOf(formOf({ bucketId: TimeBucketChoice.Custom, customBucket: 'soon' }), BIN)).toBeNull();
  });

  test('returns null without a time-bin function', () => {
    expect(bucketOf(formOf({ bucketId: '1h' }), null)).toBeNull();
    expect(bucketOf(formOf({ bucketId: TimeBucketChoice.Custom, customBucket: '5m' }), null)).toBeNull();
  });
});

describe('isBucketOffered', () => {
  test('offers a bucket for a temporal group-by field', () => {
    expect(isBucketOffered(formOf({ groupBy: 'ts' }), FIELDS, BIN)).toBe(true);
    expect(isBucketOffered(formOf({ groupBy: 'day' }), FIELDS, BIN)).toBe(true);
  });

  test('offers no bucket for a non-temporal group-by field', () => {
    expect(isBucketOffered(formOf({ groupBy: 'model' }), FIELDS, BIN)).toBe(false);
  });

  test('offers no bucket before a group-by field is picked', () => {
    expect(isBucketOffered(formOf({ groupBy: '' }), FIELDS, BIN)).toBe(false);
  });

  test('offers no bucket without a time-bin function', () => {
    expect(isBucketOffered(formOf({ groupBy: 'ts' }), FIELDS, null)).toBe(false);
  });
});

describe('isAggregateFormValid', () => {
  const isValid = (overrides: Partial<AggregateChipForm> = {}, functions = TEST_FUNCTIONS): boolean =>
    isAggregateFormValid(formOf(overrides), FIELDS, functions);

  test('accepts a group-by field with the implicit measure', () => {
    expect(isValid()).toBe(true);
  });

  test('rejects a form without a group-by field', () => {
    expect(isValid({ groupBy: '' })).toBe(false);
  });

  test('rejects a function the catalog does not offer', () => {
    expect(isValid({ functionKey: 'unknown' })).toBe(false);
    expect(isValid({ functionKey: '' })).toBe(false);
    expect(isValid({}, [])).toBe(false);
  });

  test('accepts a secondary group-by field that differs from the first', () => {
    expect(isValid({ secondaryGroupBy: 'project' })).toBe(true);
  });

  test('rejects a secondary grouping that is empty or repeats the first field', () => {
    expect(isValid({ secondaryGroupBy: '' })).toBe(false);
    expect(isValid({ secondaryGroupBy: 'model' })).toBe(false);
  });

  test('accepts a temporal field with a valid bucket or none', () => {
    expect(isValid({ groupBy: 'ts' })).toBe(true);
    expect(isValid({ groupBy: 'ts', bucketId: '1h' })).toBe(true);
    expect(isValid({ groupBy: 'ts', bucketId: TimeBucketChoice.Custom, customBucket: '5m' })).toBe(true);
  });

  test('rejects a temporal field with a bucket that does not resolve', () => {
    expect(isValid({ groupBy: 'ts', bucketId: TimeBucketChoice.Custom, customBucket: 'soon' })).toBe(false);
    expect(isValid({ groupBy: 'ts', bucketId: '1mo' })).toBe(false);
  });

  test('ignores the bucket for a non-temporal field', () => {
    expect(isValid({ bucketId: TimeBucketChoice.Custom, customBucket: 'soon' })).toBe(true);
  });

  test('ignores the bucket when the catalog has no time-bin function', () => {
    const functions = TEST_FUNCTIONS.filter((fn) => fn.name !== 'date_bin');

    expect(isValid({ groupBy: 'ts', bucketId: TimeBucketChoice.Custom, customBucket: 'soon' }, functions)).toBe(true);
  });

  test('requires the expression argument of a function that declares one', () => {
    expect(isValid({ functionKey: 'avg', args: [{}] })).toBe(false);
    expect(isValid({ functionKey: 'avg', args: [] })).toBe(false);
    expect(isValid({ functionKey: 'avg', args: [{ field: 'latency' }] })).toBe(true);
  });

  test('requires the optional expression argument of a distinct measure', () => {
    expect(isValid({ functionKey: 'count:distinct', args: [{}] })).toBe(false);
    expect(isValid({ functionKey: 'count:distinct', args: [{ field: 'project' }] })).toBe(true);
  });

  test('requires a non-blank literal argument', () => {
    const column = { field: 'latency' };

    expect(isValid({ functionKey: 'percentile_cont', args: [{ literal: '0.95' }, column] })).toBe(true);
    expect(isValid({ functionKey: 'percentile_cont', args: [{ literal: '  ' }, column] })).toBe(false);
    expect(isValid({ functionKey: 'percentile_cont', args: [{}, column] })).toBe(false);
    expect(isValid({ functionKey: 'percentile_cont', args: [{ literal: '0.95' }, {}] })).toBe(false);
  });
});

describe('createAggregateForm', () => {
  test('starts on the implicit measure with one empty slot per argument', () => {
    expect(createAggregateForm(TEST_FUNCTIONS)).toEqual({
      groupBy: '',
      bucketId: TimeBucketChoice.None,
      customBucket: '',
      secondaryGroupBy: null,
      functionKey: 'count',
      args: [{}],
    });
  });

  test('starts on the first aggregate function when the catalog has no implicit measure', () => {
    expect(createAggregateForm([fnFixture('percentile_cont'), fnFixture('sum')])).toEqual({
      groupBy: '',
      bucketId: TimeBucketChoice.None,
      customBucket: '',
      secondaryGroupBy: null,
      functionKey: 'percentile_cont',
      args: [{}, {}],
    });
  });

  test('starts without a function for an empty catalog', () => {
    expect(createAggregateForm([])).toEqual({
      groupBy: '',
      bucketId: TimeBucketChoice.None,
      customBucket: '',
      secondaryGroupBy: null,
      functionKey: '',
      args: [],
    });
  });
});

describe('toAggregateForm', () => {
  test('returns a fresh form when the query has no grouping', () => {
    const state = stateOf({ aggregates: [createAggregate(fnFixture('avg'), [{ field: 'latency' }])] });

    expect(toAggregateForm(state)).toEqual(createAggregateForm(TEST_FUNCTIONS));
  });

  test('returns a fresh form when the query has no aggregate', () => {
    expect(toAggregateForm(stateOf({ groupBy: [createColumnRow('model')] }))).toEqual(
      createAggregateForm(TEST_FUNCTIONS),
    );
  });

  test('reads a plain grouping column and its measure', () => {
    const state = stateOf({
      groupBy: [createColumnRow('model')],
      aggregates: [createAggregate(fnFixture('avg'), [{ field: 'latency' }])],
    });

    expect(toAggregateForm(state)).toEqual({
      groupBy: 'model',
      bucketId: TimeBucketChoice.None,
      customBucket: '',
      secondaryGroupBy: null,
      functionKey: 'avg',
      args: [{ field: 'latency' }],
    });
  });

  test('reads a time-binned grouping that matches a preset, with a secondary column', () => {
    const state = stateOf({
      groupBy: [binRow('1', 'hour', 'ts'), createColumnRow('model')],
      aggregates: [createAggregate(fnFixture('count'))],
    });

    expect(toAggregateForm(state)).toEqual({
      groupBy: 'ts',
      bucketId: '1h',
      customBucket: '',
      secondaryGroupBy: 'model',
      functionKey: 'count',
      args: [{}],
    });
  });

  test('reads a time-binned grouping that matches no preset as a custom bucket', () => {
    const state = stateOf({
      groupBy: [binRow('5', 'minute', 'ts')],
      aggregates: [createAggregate(fnFixture('count'))],
    });

    expect(toAggregateForm(state)).toEqual({
      groupBy: 'ts',
      bucketId: TimeBucketChoice.Custom,
      customBucket: '5 minute',
      secondaryGroupBy: null,
      functionKey: 'count',
      args: [{}],
    });
  });

  test('reads a distinct measure as its distinct choice', () => {
    const state = stateOf({
      groupBy: [createColumnRow('model')],
      aggregates: [{ ...createAggregate(fnFixture('count'), [{ field: 'project' }]), distinct: true }],
    });

    expect(toAggregateForm(state)).toEqual({
      groupBy: 'model',
      bucketId: TimeBucketChoice.None,
      customBucket: '',
      secondaryGroupBy: null,
      functionKey: 'count:distinct',
      args: [{ field: 'project' }],
    });
  });
});

describe('withAggregate', () => {
  const columnRow = (field: string) => ({
    id: expect.any(String),
    fn: null,
    field,
    alias: '',
    aliasEdited: false,
    args: [],
  });

  test('returns the same state when the form names a function that is not offered', () => {
    const state = stateOf();

    expect(withAggregate(state, formOf({ functionKey: 'unknown' }))).toBe(state);
  });

  test('switches to an aggregate query grouped by the column and clears the projection', () => {
    const kept = sortRow('s1', 'model');
    const state = stateOf({ select: [createColumnRow('latency')], sort: [kept, sortRow('s2', 'latency')] });

    expect(withAggregate(state, formOf())).toEqual({
      ...state,
      mode: QueryMode.Aggregate,
      select: [],
      groupBy: [columnRow('model')],
      aggregates: [{ id: expect.any(String), fn: 'count', distinct: false, alias: '', aliasEdited: false, args: [{}] }],
      sort: [kept],
    });
  });

  test('groups a temporal field by its time bucket, adds the secondary column and marks the measure distinct', () => {
    const form = formOf({
      groupBy: 'ts',
      bucketId: '1h',
      secondaryGroupBy: 'model',
      functionKey: 'count:distinct',
      args: [{ field: 'project' }],
    });

    const next = withAggregate(stateOf(), form);

    expect(next.groupBy).toEqual([
      {
        id: expect.any(String),
        fn: 'date_bin',
        field: '',
        alias: '',
        aliasEdited: false,
        args: [{ literal: '1' }, { literal: 'hour' }, { field: 'ts' }],
      },
      columnRow('model'),
    ]);
    expect(next.aggregates).toEqual([
      {
        id: expect.any(String),
        fn: 'count',
        distinct: true,
        alias: '',
        aliasEdited: false,
        args: [{ field: 'project' }],
      },
    ]);
  });

  test('groups by a custom time bucket', () => {
    const form = formOf({ groupBy: 'ts', bucketId: TimeBucketChoice.Custom, customBucket: '5m' });

    expect(withAggregate(stateOf(), form).groupBy).toEqual([
      {
        id: expect.any(String),
        fn: 'date_bin',
        field: '',
        alias: '',
        aliasEdited: false,
        args: [{ literal: '5' }, { literal: 'minute' }, { field: 'ts' }],
      },
    ]);
  });

  test('groups by the plain column when the bucket does not apply to it', () => {
    expect(withAggregate(stateOf(), formOf({ bucketId: '1h' })).groupBy).toEqual([columnRow('model')]);
  });

  test('groups a temporal field by the plain column when no bucket is chosen', () => {
    expect(withAggregate(stateOf(), formOf({ groupBy: 'ts' })).groupBy).toEqual([columnRow('ts')]);
  });

  test('groups a temporal field by the plain column when the catalog has no time-bin function', () => {
    const state = stateOf({ functions: TEST_FUNCTIONS.filter((fn) => fn.name !== 'date_bin') });

    expect(withAggregate(state, formOf({ groupBy: 'ts', bucketId: '1h' })).groupBy).toEqual([columnRow('ts')]);
  });

  test('drops the value of an argument the chosen function does not show', () => {
    const next = withAggregate(stateOf(), formOf({ args: [{ field: 'project' }] }));

    expect(next.aggregates[0].args).toEqual([{}]);
  });

  test('fills an argument the form does not carry with an empty slot', () => {
    const next = withAggregate(stateOf(), formOf({ functionKey: 'percentile_cont', args: [{ literal: '0.5' }] }));

    expect(next.aggregates[0].args).toEqual([{ literal: '0.5' }, {}]);
  });
});

describe('withAggregate — authored aliases', () => {
  const aliased = (): QueryBuilderState =>
    stateOf({
      mode: QueryMode.Aggregate,
      groupBy: [{ ...binRow('1', 'hour', 'ts'), alias: 'bucket', aliasEdited: true }],
      aggregates: [{ ...createAggregate(fnFixture('avg'), [{ field: 'latency' }], 'total'), aliasEdited: true }],
      sort: [sortRow('s1', 'total'), sortRow('s2', 'bucket')],
    });

  test('keeps the aliases and the sort keys naming them when the form is applied unchanged', () => {
    const state = aliased();

    const next = withAggregate(state, toAggregateForm(state));

    expect(next.groupBy.map((row) => [row.alias, row.aliasEdited])).toEqual([['bucket', true]]);
    expect(next.aggregates.map((row) => [row.alias, row.aliasEdited])).toEqual([['total', true]]);
    expect(next.sort.map((row) => row.field)).toEqual(['total', 'bucket']);
  });

  test('drops the alias of a measure whose function changed, with the sort key naming it', () => {
    const state = aliased();

    const next = withAggregate(state, { ...toAggregateForm(state), functionKey: 'count', args: [{}] });

    expect(next.aggregates.map((row) => row.alias)).toEqual(['']);
    expect(next.groupBy.map((row) => row.alias)).toEqual(['bucket']);
    expect(next.sort.map((row) => row.field)).toEqual(['bucket']);
  });
});

describe('withoutAggregate', () => {
  test('returns to a row query without grouping or measures and drops the sort keys it no longer offers', () => {
    const kept = sortRow('s1', 'model');
    const state = stateOf({
      mode: QueryMode.Aggregate,
      groupBy: [createColumnRow('model')],
      aggregates: [createAggregate(fnFixture('count'))],
      sort: [kept, sortRow('s2', 'Row count')],
    });

    expect(withoutAggregate(state)).toEqual({
      ...state,
      mode: QueryMode.Row,
      groupBy: [],
      aggregates: [],
      sort: [kept],
    });
  });

  test('leaves a row query without an aggregate as it is', () => {
    const state = stateOf({ sort: [sortRow('s1', 'latency')] });

    expect(withoutAggregate(state)).toEqual(state);
  });
});

describe('hasAggregate', () => {
  const aggregated = (): QueryBuilderState =>
    stateOf({
      mode: QueryMode.Aggregate,
      groupBy: [createColumnRow('model')],
      aggregates: [createAggregate(fnFixture('count'))],
    });

  test('is true for an aggregate query with a grouping and a measure', () => {
    expect(hasAggregate(aggregated())).toBe(true);
  });

  test('is false for a row query', () => {
    expect(hasAggregate({ ...aggregated(), mode: QueryMode.Row })).toBe(false);
    expect(hasAggregate(stateOf())).toBe(false);
  });

  test('is false for an aggregate query without a grouping', () => {
    expect(hasAggregate({ ...aggregated(), groupBy: [] })).toBe(false);
  });

  test('is false for an aggregate query without a measure', () => {
    expect(hasAggregate({ ...aggregated(), aggregates: [] })).toBe(false);
  });
});
