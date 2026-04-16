import { TimeFilterValue, TimeRange } from '@/src/models/time-range';

export const isTimeRange = (value: TimeFilterValue | undefined): value is TimeRange =>
  typeof value === 'object' && value !== null;

export const isRangeIncludingToday = (range: TimeRange): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDay = new Date(range.endDate);
  endDay.setHours(0, 0, 0, 0);
  return endDay.getTime() >= today.getTime();
};
