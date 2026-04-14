export interface TimePeriodOption {
  value: string;
  label: string;
  offset: number;
}

export const DEFAULT_TIME_PERIOD = '2d';

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

export function getFilteredTimePeriodOptions(maxTimeRangeMs: number) {
  return timePeriodOptionsConfig.filter((opt) => opt.offset <= maxTimeRangeMs);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getTimePeriodOptionsByMaxDays(maxDays?: number): TimePeriodOption[] {
  if (!maxDays) return timePeriodOptionsConfig;
  return timePeriodOptionsConfig.filter((opt) => opt.offset <= maxDays * MS_PER_DAY);
}

export function getDefaultTimePeriod(options: TimePeriodOption[]): string {
  if (options.some((opt) => opt.value === DEFAULT_TIME_PERIOD)) return DEFAULT_TIME_PERIOD;
  return options.length > 0 ? options[options.length - 1].value : DEFAULT_TIME_PERIOD;
}
