export interface TimePeriodOption {
  value: string;
  label: string;
  offset: number;
}

/**
 * A period whose start is an absolute anchor instead of a sliding offset from "now", so its span
 * grows as time passes. Anchors are parsed and validated before the option is built, so
 * `startDate` is always a valid `Date`.
 */
export interface AnchoredTimePeriodOption {
  value: string;
  label: string;
  startDate: Date;
}

export type TimeFilterOption = TimePeriodOption | AnchoredTimePeriodOption;

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_TIME_PERIOD = '2d';

export const SINCE_CREATION_PERIOD_ID = 'since-creation';

export const timePeriodOptionsConfig: TimePeriodOption[] = [
  { value: '15m', label: 'Last 15m', offset: 15 * 60 * 1000 },
  { value: '30m', label: 'Last 30m', offset: 30 * 60 * 1000 },
  { value: '1h', label: 'Last 1h', offset: 60 * 60 * 1000 },
  { value: '3h', label: 'Last 3h', offset: 3 * 60 * 60 * 1000 },
  { value: '6h', label: 'Last 6h', offset: 6 * 60 * 60 * 1000 },
  { value: '12h', label: 'Last 12h', offset: 12 * 60 * 60 * 1000 },
  { value: '24h', label: 'Last 24h', offset: 24 * 60 * 60 * 1000 },
  { value: '2d', label: 'Last 2d', offset: 2 * 24 * 60 * 60 * 1000 },
  { value: '7d', label: 'Last 7d', offset: 7 * 24 * 60 * 60 * 1000 },
  { value: '30d', label: 'Last 30d', offset: 30 * 24 * 60 * 60 * 1000 },
];

export function isAnchoredTimePeriodOption(option: TimeFilterOption): option is AnchoredTimePeriodOption {
  return 'startDate' in option;
}

export function getTimePeriodOptionsByMaxMs(
  options: TimeFilterOption[] = timePeriodOptionsConfig,
  maxRangeMs?: number,
): TimeFilterOption[] {
  if (maxRangeMs == null) return options;
  // An anchored option's span grows without bound, so there is nothing to compare against the cap.
  return options.filter((opt) => !isAnchoredTimePeriodOption(opt) && opt.offset <= maxRangeMs);
}

export function getDefaultTimePeriod(options: TimePeriodOption[]): string {
  if (options.some((opt) => opt.value === DEFAULT_TIME_PERIOD)) return DEFAULT_TIME_PERIOD;
  return options.length > 0 ? options[options.length - 1].value : DEFAULT_TIME_PERIOD;
}
