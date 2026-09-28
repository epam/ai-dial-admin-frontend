import { TimeRange } from '@/src/models/time-range';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Weeks start on Monday, matching the ISO week the rest of the platform reports in. */
export const getWeekStart = (date: Date): Date => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const isoDayIndex = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - isoDayIndex);
  return start;
};

/**
 * The week `offset` weeks back from the one containing `reference`. Offset 0 is the current week,
 * so the grid always covers exactly seven days regardless of the page's period.
 */
export const getWeekRange = (offset: number, reference: Date = new Date()): TimeRange => {
  const start = getWeekStart(reference);
  start.setDate(start.getDate() - offset * 7);

  return { startDate: start, endDate: new Date(start.getTime() + 7 * DAY_MS) };
};

/**
 * The year is stated only when the week is not in the current one, so the common label stays short
 * enough to sit on the card's own header line.
 */
export const formatWeekLabel = (range: TimeRange, today: Date = new Date()): string => {
  const lastDay = new Date(range.endDate.getTime() - DAY_MS);
  const sameMonth = lastDay.getMonth() === range.startDate.getMonth();
  const sameYear = lastDay.getFullYear() === today.getFullYear();

  const start = range.startDate.toLocaleDateString(void 0, {
    day: 'numeric',
    ...(sameMonth ? {} : { month: 'short' }),
  });
  const end = lastDay.toLocaleDateString(void 0, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });

  return `${start} – ${end}`;
};
