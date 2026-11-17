import {
  FILTER_OPERATOR_I18N,
  PERIOD_PRESET_I18N,
  SORT_DIRECTION_I18N,
} from '@/src/components/Analytics/QueryBuilder/Chips/constants';
import { ChipTranslate, FilterChipParts } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { formatBucket, toAggregateForm, bucketOf } from '@/src/components/Analytics/QueryBuilder/Chips/utils/aggregate';
import { toFilterForm } from '@/src/components/Analytics/QueryBuilder/Chips/utils/filter';
import { fieldDisplayName } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { timeBinFunction } from '@/src/components/Analytics/QueryBuilder/utils/functions';
import { TimePeriodOption, timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { QueryChipsI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { FilterPredicateNode, QueryBuilderState, SortRow } from '@/src/models/analytics/query-builder';
import { TimeRange } from '@/src/models/time-range';

const quoted = (value: string): string => `'${value}'`;

export const filterChipParts = (
  predicate: FilterPredicateNode,
  fields: AnalyticsEntityField[],
  t: ChipTranslate,
): FilterChipParts => {
  const form = toFilterForm(predicate);
  const operator = t(FILTER_OPERATOR_I18N[form.operator]).toLowerCase();
  const value = form.values.length ? form.values.map(quoted).join(', ') : form.value && quoted(form.value);
  return { condition: `${fieldDisplayName(fields, form.field)} ${operator}`, value: value || '' };
};

export const filterChipLabel = (
  predicate: FilterPredicateNode,
  fields: AnalyticsEntityField[],
  t: ChipTranslate,
): string => {
  const { condition, value } = filterChipParts(predicate, fields, t);
  return [condition, value].filter(Boolean).join(' ');
};

export const aggregateChipLabel = (state: QueryBuilderState, t: ChipTranslate): string => {
  const form = toAggregateForm(state);
  const [metric] = state.aggregates;
  if (!metric) return '';

  const column = metric.args.find((arg) => arg.field)?.field;
  const operand = [metric.distinct && 'DISTINCT', column && fieldDisplayName(state.fields, column)]
    .filter(Boolean)
    .join(' ');
  const keys = [form.groupBy, form.secondaryGroupBy]
    .filter((key): key is string => !!key)
    .map((key) => fieldDisplayName(state.fields, key))
    .join(', ');
  const bucket = bucketOf(form, timeBinFunction(state.functions));

  return [
    `${metric.fn.toUpperCase()}(${operand})`,
    t(QueryChipsI18nKey.AggregateBy),
    keys,
    bucket && `${t(QueryChipsI18nKey.AggregatePer)} ${formatBucket(bucket)}`,
  ]
    .filter(Boolean)
    .join(' ');
};

export const sortChipLabel = (row: SortRow, fields: AnalyticsEntityField[], t: ChipTranslate): string =>
  `${fieldDisplayName(fields, row.field)} ${t(SORT_DIRECTION_I18N[row.dir])}`;

const formatDate = (date: Date): string => date.toLocaleDateString(undefined, { dateStyle: 'medium' });

export const periodPresetLabel = (option: TimePeriodOption, t: ChipTranslate): string => {
  const keys = PERIOD_PRESET_I18N[option.unit];
  if (!keys) return option.label;
  return t(option.amount === 1 ? keys[0] : keys[1], { amount: String(option.amount) });
};

export const periodChipLabel = (timePeriod: string, isCustom: boolean, range: TimeRange, t: ChipTranslate): string => {
  if (isCustom) return `${formatDate(range.startDate)} – ${formatDate(range.endDate)}`;
  const option = timePeriodOptionsConfig.find((entry) => entry.value === timePeriod);
  return option ? periodPresetLabel(option, t) : timePeriod;
};
