import { FnArgValue } from '@/src/models/analytics/query-builder';
import { TimeRange } from '@/src/models/time-range';

export type ChipTranslate = (key: string, params?: Record<string, string>) => string;

export enum ChipKind {
  Filter = 'filter',
  Aggregate = 'aggregate',
  Columns = 'columns',
  Sort = 'sort',
}

export enum FilterChipOperator {
  Equals = 'eq',
  NotEquals = 'ne',
  Contains = 'ico',
  NotContains = 'inc',
  LessThan = 'lt',
  GreaterThan = 'gt',
  AtMost = 'le',
  AtLeast = 'ge',
  InList = 'in',
  IsEmpty = 'is_empty',
  IsNotEmpty = 'is_not_empty',
}

export enum FilterValueKind {
  None = 'none',
  Text = 'text',
  TextList = 'text-list',
  Enum = 'enum',
  EnumList = 'enum-list',
  Boolean = 'boolean',
}

export interface FilterChipForm {
  field: string;
  operator: FilterChipOperator;
  value: string;
  values: string[];
}

export enum TimeBucketChoice {
  None = 'none',
  Custom = 'custom',
}

export interface TimeBucket {
  amount: number;
  unit: string;
}

export interface TimeBucketPreset extends TimeBucket {
  id: string;
}

export interface AggregateFunctionChoice {
  key: string;
  fn: string;
  isDistinct: boolean;
}

export interface AggregateChipForm {
  groupBy: string;
  bucketId: string;
  customBucket: string;
  secondaryGroupBy: string | null;
  functionKey: string;
  args: FnArgValue[];
}

export interface SortChipForm {
  field: string;
  dir: string;
}

export interface LimitChipForm {
  rows: string;
  offset: string;
}

export interface PeriodChipForm {
  period: string;
  isCustom: boolean;
  range: TimeRange | null;
}

export interface FilterChipParts {
  condition: string;
  value: string;
}

export interface PeriodControl {
  timePeriod: string;
  isCustom: boolean;
  timeRange: TimeRange;
  onChangeTimePeriod: (period: string) => void;
  onChangeTimeRange: (range: TimeRange, isCustom?: boolean) => void;
}

export interface ChipPanelProps {
  titleId: string;
  onClose: () => void;
  onBack?: () => void;
}
