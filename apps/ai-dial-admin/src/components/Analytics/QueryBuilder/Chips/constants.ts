import { FilterChipOperator } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { QueryBuilderI18nKey, QueryChipsI18nKey } from '@/src/constants/i18n';
import { QuerySortDirection } from '@/src/models/analytics/query';
import { RelativeTimeUnit } from '@/src/models/time-range';

export const PERIOD_PRESET_I18N: Partial<Record<RelativeTimeUnit, [QueryChipsI18nKey, QueryChipsI18nKey]>> = {
  [RelativeTimeUnit.Minute]: [QueryChipsI18nKey.PeriodLastMinutes, QueryChipsI18nKey.PeriodLastMinutes],
  [RelativeTimeUnit.Hour]: [QueryChipsI18nKey.PeriodLastHour, QueryChipsI18nKey.PeriodLastHours],
  [RelativeTimeUnit.Day]: [QueryChipsI18nKey.PeriodLastDay, QueryChipsI18nKey.PeriodLastDays],
};

export const FILTER_OPERATOR_I18N: Record<FilterChipOperator, QueryBuilderI18nKey | QueryChipsI18nKey> = {
  [FilterChipOperator.Equals]: QueryBuilderI18nKey.OperatorEq,
  [FilterChipOperator.NotEquals]: QueryBuilderI18nKey.OperatorNe,
  [FilterChipOperator.Contains]: QueryBuilderI18nKey.OperatorCo,
  [FilterChipOperator.NotContains]: QueryBuilderI18nKey.OperatorNc,
  [FilterChipOperator.LessThan]: QueryBuilderI18nKey.OperatorLt,
  [FilterChipOperator.GreaterThan]: QueryBuilderI18nKey.OperatorGt,
  [FilterChipOperator.AtMost]: QueryBuilderI18nKey.OperatorLe,
  [FilterChipOperator.AtLeast]: QueryBuilderI18nKey.OperatorGe,
  [FilterChipOperator.InList]: QueryBuilderI18nKey.OperatorIn,
  [FilterChipOperator.IsEmpty]: QueryChipsI18nKey.OperatorIsEmpty,
  [FilterChipOperator.IsNotEmpty]: QueryChipsI18nKey.OperatorIsNotEmpty,
};

export const SORT_DIRECTION_I18N: Record<QuerySortDirection, QueryBuilderI18nKey> = {
  [QuerySortDirection.Asc]: QueryBuilderI18nKey.DirectionAsc,
  [QuerySortDirection.Desc]: QueryBuilderI18nKey.DirectionDesc,
};

export const TIME_BUCKET_I18N: Record<string, QueryChipsI18nKey> = {
  '15m': QueryChipsI18nKey.Bucket15m,
  '30m': QueryChipsI18nKey.Bucket30m,
  '1h': QueryChipsI18nKey.Bucket1h,
  '3h': QueryChipsI18nKey.Bucket3h,
  '6h': QueryChipsI18nKey.Bucket6h,
  '12h': QueryChipsI18nKey.Bucket12h,
  '24h': QueryChipsI18nKey.Bucket24h,
  '1w': QueryChipsI18nKey.Bucket1w,
  '1mo': QueryChipsI18nKey.Bucket1mo,
};
