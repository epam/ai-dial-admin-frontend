import {
  AggregateChipForm,
  AggregateFunctionChoice,
  TimeBucket,
  TimeBucketChoice,
  TimeBucketPreset,
} from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { prunedSort } from '@/src/components/Analytics/QueryBuilder/Chips/utils/sort';
import { typeOf } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import {
  aggregateFunctions,
  emptyArgs,
  functionByName,
  implicitMeasureFunction,
  isExpressionArg,
  timeBinFunction,
} from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { createAggregate, createColumnRow, createFnRow } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode } from '@/src/models/analytics/query';
import {
  AggregateRow,
  ExpressionRow,
  FnArgValue,
  QueryBuilderState,
  TimeBinFunction,
} from '@/src/models/analytics/query-builder';
import { QueryFunction } from '@/src/models/analytics/query-function';

const DISTINCT_SUFFIX = ':distinct';

const TIME_BUCKET_PRESETS: TimeBucketPreset[] = [
  { id: '15m', amount: 15, unit: 'minute' },
  { id: '30m', amount: 30, unit: 'minute' },
  { id: '1h', amount: 1, unit: 'hour' },
  { id: '3h', amount: 3, unit: 'hour' },
  { id: '6h', amount: 6, unit: 'hour' },
  { id: '12h', amount: 12, unit: 'hour' },
  { id: '24h', amount: 24, unit: 'hour' },
  { id: '1w', amount: 1, unit: 'week' },
  { id: '1mo', amount: 1, unit: 'month' },
];

const UNIT_ALIASES: Record<string, string> = {
  s: 'second',
  sec: 'second',
  secs: 'second',
  m: 'minute',
  min: 'minute',
  mins: 'minute',
  h: 'hour',
  hr: 'hour',
  hrs: 'hour',
  d: 'day',
  w: 'week',
  wk: 'week',
  mo: 'month',
  y: 'year',
  yr: 'year',
};

const CUSTOM_BUCKET = /^(\d+)\s*([a-z]+)$/i;

const TEMPORAL_TYPES: string[] = [AnalyticsFieldType.Timestamp, AnalyticsFieldType.Date];

const isUnitAllowed = (bin: TimeBinFunction, unit: string): boolean => !bin.units || bin.units.includes(unit);

export const isTemporalField = (fields: AnalyticsEntityField[], name: string): boolean =>
  TEMPORAL_TYPES.includes(typeOf(fields, name) ?? '');

export const timeBucketPresets = (bin: TimeBinFunction | null): TimeBucketPreset[] =>
  bin ? TIME_BUCKET_PRESETS.filter((preset) => isUnitAllowed(bin, preset.unit) && preset.amount >= bin.minAmount) : [];

export const parseCustomBucket = (text: string, bin: TimeBinFunction | null): TimeBucket | null => {
  const match = CUSTOM_BUCKET.exec(text.trim());
  if (!bin || !match) return null;
  const amount = Number(match[1]);
  const raw = match[2].toLowerCase();
  const candidates = [UNIT_ALIASES[raw], raw.replace(/s$/, ''), raw].filter(Boolean);
  const unit = candidates.find((candidate) => isUnitAllowed(bin, candidate));
  return unit && Number.isInteger(amount) && amount >= bin.minAmount ? { amount, unit } : null;
};

export const formatBucket = (bucket: TimeBucket): string => `${bucket.amount} ${bucket.unit}`;

export const aggregateFunctionChoices = (functions: QueryFunction[]): AggregateFunctionChoice[] => {
  const implicit = implicitMeasureFunction(functions);
  return aggregateFunctions(functions).flatMap((fn) => {
    const plain = { key: fn.name, fn: fn.name, isDistinct: false };
    return fn.name === implicit?.name && fn.distinct_supported
      ? [plain, { key: `${fn.name}${DISTINCT_SUFFIX}`, fn: fn.name, isDistinct: true }]
      : [plain];
  });
};

export const aggregateChoiceByKey = (functions: QueryFunction[], key: string): AggregateFunctionChoice | undefined =>
  aggregateFunctionChoices(functions).find((choice) => choice.key === key);

export const isArgRequired = (fn: QueryFunction, index: number, isDistinct: boolean): boolean =>
  !fn.args[index].optional || (isDistinct && isExpressionArg(fn.args[index]));

export const isArgShown = (fn: QueryFunction, index: number, isDistinct: boolean): boolean =>
  isArgRequired(fn, index, isDistinct) || !isExpressionArg(fn.args[index]);

const isArgSet = (fn: QueryFunction, index: number, value: FnArgValue | undefined): boolean =>
  isExpressionArg(fn.args[index]) ? !!value?.field : !!value?.literal?.trim();

export const bucketOf = (form: AggregateChipForm, bin: TimeBinFunction | null): TimeBucket | null => {
  if (form.bucketId === TimeBucketChoice.None) return null;
  if (form.bucketId === TimeBucketChoice.Custom) return parseCustomBucket(form.customBucket, bin);
  return timeBucketPresets(bin).find((preset) => preset.id === form.bucketId) ?? null;
};

export const isBucketOffered = (
  form: AggregateChipForm,
  fields: AnalyticsEntityField[],
  bin: TimeBinFunction | null,
): boolean => !!bin && !!form.groupBy && isTemporalField(fields, form.groupBy);

export const isAggregateFormValid = (
  form: AggregateChipForm,
  fields: AnalyticsEntityField[],
  functions: QueryFunction[],
): boolean => {
  const bin = timeBinFunction(functions);
  const choice = aggregateChoiceByKey(functions, form.functionKey);
  const fn = choice && functionByName(functions, choice.fn);
  if (!form.groupBy || !choice || !fn) return false;
  if (form.secondaryGroupBy === '' || form.secondaryGroupBy === form.groupBy) return false;
  if (isBucketOffered(form, fields, bin) && form.bucketId !== TimeBucketChoice.None && !bucketOf(form, bin)) {
    return false;
  }
  return fn.args.every(
    (_, index) => !isArgRequired(fn, index, choice.isDistinct) || isArgSet(fn, index, form.args[index]),
  );
};

export const createAggregateForm = (functions: QueryFunction[]): AggregateChipForm => {
  const choices = aggregateFunctionChoices(functions);
  const implicit = implicitMeasureFunction(functions);
  const first = choices.find((choice) => choice.fn === implicit?.name) ?? choices[0];
  const fn = first && functionByName(functions, first.fn);
  return {
    groupBy: '',
    bucketId: TimeBucketChoice.None,
    customBucket: '',
    secondaryGroupBy: null,
    functionKey: first?.key ?? '',
    args: fn ? emptyArgs(fn) : [],
  };
};

const bucketOfRow = (row: ExpressionRow, bin: TimeBinFunction): TimeBucket => ({
  amount: Number(row.args[bin.amountIndex]?.literal ?? ''),
  unit: row.args[bin.unitIndex]?.literal ?? '',
});

export const toAggregateForm = (state: QueryBuilderState): AggregateChipForm => {
  const bin = timeBinFunction(state.functions);
  const [first, second] = state.groupBy;
  const [metric] = state.aggregates;
  const form = createAggregateForm(state.functions);
  if (!first || !metric) return form;

  const isBinned = !!bin && first.fn === bin.fn.name;
  const bucket = isBinned ? bucketOfRow(first, bin) : null;
  const preset = bucket && timeBucketPresets(bin).find((p) => p.amount === bucket.amount && p.unit === bucket.unit);

  return {
    groupBy: isBinned ? (first.args[bin.timestampIndex]?.field ?? '') : first.field,
    bucketId: bucket ? (preset?.id ?? TimeBucketChoice.Custom) : TimeBucketChoice.None,
    customBucket: bucket && !preset ? formatBucket(bucket) : '',
    secondaryGroupBy: second ? second.field : null,
    functionKey: metric.distinct ? `${metric.fn}${DISTINCT_SUFFIX}` : metric.fn,
    args: metric.args,
  };
};

const firstGroupByRow = (
  form: AggregateChipForm,
  fields: AnalyticsEntityField[],
  bin: TimeBinFunction | null,
): ExpressionRow => {
  const bucket = isBucketOffered(form, fields, bin) ? bucketOf(form, bin) : null;
  if (!bin || !bucket) return createColumnRow(form.groupBy);

  const args: FnArgValue[] = emptyArgs(bin.fn);
  args[bin.amountIndex] = { literal: String(bucket.amount) };
  args[bin.unitIndex] = { literal: bucket.unit };
  args[bin.timestampIndex] = { field: form.groupBy };
  return createFnRow(bin.fn, args);
};

const argsKey = (args: FnArgValue[]): string =>
  JSON.stringify(args.map((arg) => [arg.field || '', arg.literal || '', arg.call ?? null]));

const groupByKey = (row: ExpressionRow): string => `${row.fn ?? ''}|${row.field}|${argsKey(row.args)}`;

const aggregateKey = (row: AggregateRow): string => `${row.fn}|${row.distinct}|${argsKey(row.args)}`;

const withKeptAlias = <T extends ExpressionRow | AggregateRow>(row: T, previous: T[], keyOf: (row: T) => string): T => {
  const match = previous.find((entry) => keyOf(entry) === keyOf(row));
  return match ? { ...row, alias: match.alias, aliasEdited: match.aliasEdited } : row;
};

export const withAggregate = (state: QueryBuilderState, form: AggregateChipForm): QueryBuilderState => {
  const choice = aggregateChoiceByKey(state.functions, form.functionKey);
  const fn = choice && functionByName(state.functions, choice.fn);
  if (!choice || !fn) return state;

  const groupBy = [firstGroupByRow(form, state.fields, timeBinFunction(state.functions))];
  if (form.secondaryGroupBy) groupBy.push(createColumnRow(form.secondaryGroupBy));
  const args = fn.args.map((_, index) => (isArgShown(fn, index, choice.isDistinct) ? (form.args[index] ?? {}) : {}));

  const next: QueryBuilderState = {
    ...state,
    mode: QueryMode.Aggregate,
    select: [],
    groupBy: groupBy.map((row) => withKeptAlias(row, state.groupBy, groupByKey)),
    aggregates: [
      withKeptAlias({ ...createAggregate(fn, args), distinct: choice.isDistinct }, state.aggregates, aggregateKey),
    ],
  };
  return { ...next, sort: prunedSort(next) };
};

export const withoutAggregate = (state: QueryBuilderState): QueryBuilderState => {
  const next: QueryBuilderState = { ...state, mode: QueryMode.Row, groupBy: [], aggregates: [] };
  return { ...next, sort: prunedSort(next) };
};

export const hasAggregate = (state: QueryBuilderState): boolean =>
  state.mode === QueryMode.Aggregate && state.groupBy.length > 0 && state.aggregates.length > 0;
