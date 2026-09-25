import { ComparePeriod, ComparedWindows } from '@/src/components/Analytics/Usage/models';
import { TimeRange } from '@/src/models/time-range';

const getDurationMs = (range: TimeRange): number => range.endDate.getTime() - range.startDate.getTime();

/**
 * The same span ending where the current window begins, so a preset's sliding window and its
 * comparison always share an edge.
 */
export const getPreviousWindow = (current: TimeRange): TimeRange => {
  const startMs = current.startDate.getTime();
  return {
    startDate: new Date(startMs - getDurationMs(current)),
    endDate: new Date(startMs),
  };
};

/**
 * The same calendar date and time, `months` earlier. The day is set to the 1st before the month
 * moves, because moving a month first would roll 31 March back to 3 March, and it is clamped to the
 * target month's last day afterwards.
 */
const shiftBackByMonths = (date: Date, months: number): Date => {
  const shifted = new Date(date);
  const day = shifted.getDate();

  shifted.setDate(1);
  shifted.setMonth(shifted.getMonth() - months);

  const lastDayOfMonth = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  shifted.setDate(Math.min(day, lastDayOfMonth));

  return shifted;
};

/**
 * The window moved back by whole calendar months, keeping its duration rather than its end date: a
 * comparison over a different amount of time answers a different question, and February would
 * quietly shorten every window compared against it.
 */
export const getCalendarShiftedWindow = (current: TimeRange, months: number): TimeRange => {
  const startDate = shiftBackByMonths(current.startDate, months);

  return { startDate, endDate: new Date(startDate.getTime() + getDurationMs(current)) };
};

const MONTHS_BACK: Partial<Record<ComparePeriod, number>> = {
  [ComparePeriod.PreviousMonth]: 1,
  [ComparePeriod.PreviousYear]: 12,
};

export const buildComparedWindows = (current: TimeRange, compare: ComparePeriod): ComparedWindows => {
  if (compare === ComparePeriod.PreviousPeriod) {
    return { current, previous: getPreviousWindow(current) };
  }

  const months = MONTHS_BACK[compare];

  return months == null ? { current } : { current, previous: getCalendarShiftedWindow(current, months) };
};
