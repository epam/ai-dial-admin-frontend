import { describe, expect, test } from 'vitest';

import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import {
  buildComparedWindows,
  getCalendarShiftedWindow,
  getPreviousWindow,
} from '@/src/components/Analytics/Usage/utils/windows';

const range = (startIso: string, endIso: string) => ({ startDate: new Date(startIso), endDate: new Date(endIso) });

const TWO_DAYS = range('2026-09-15T00:00:00.000Z', '2026-09-17T00:00:00.000Z');

describe('getPreviousWindow', () => {
  test('returns the same span ending where the current window begins', () => {
    expect(getPreviousWindow(TWO_DAYS)).toEqual(range('2026-09-13T00:00:00.000Z', '2026-09-15T00:00:00.000Z'));
  });

  test('keeps sub-day spans exact rather than rounding to a boundary', () => {
    const window = range('2026-09-17T09:30:00.000Z', '2026-09-17T10:00:00.000Z');

    expect(getPreviousWindow(window)).toEqual(range('2026-09-17T09:00:00.000Z', '2026-09-17T09:30:00.000Z'));
  });

  test('collapses to the window start when the range has no duration', () => {
    const instant = range('2026-09-17T00:00:00.000Z', '2026-09-17T00:00:00.000Z');

    expect(getPreviousWindow(instant)).toEqual(instant);
  });
});

/**
 * The calendar shift reads and writes local date parts, so these assert on those parts rather than
 * on a UTC instant: a month whose UTC offset differs from the current one would otherwise fail on a
 * machine that observes daylight saving and pass on one that does not.
 */
describe('getCalendarShiftedWindow', () => {
  const localRange = (start: Date, durationMs: number) => ({
    startDate: start,
    endDate: new Date(start.getTime() + durationMs),
  });

  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

  test('keeps the date and time of day, one calendar month back', () => {
    const { startDate } = getCalendarShiftedWindow(localRange(new Date(2026, 8, 15, 11, 30), TWO_DAYS_MS), 1);

    expect([startDate.getFullYear(), startDate.getMonth(), startDate.getDate()]).toEqual([2026, 7, 15]);
    expect([startDate.getHours(), startDate.getMinutes()]).toEqual([11, 30]);
  });

  test('keeps the window duration rather than its end date', () => {
    const current = localRange(new Date(2026, 8, 15, 11, 30), TWO_DAYS_MS);
    const shifted = getCalendarShiftedWindow(current, 1);

    expect(shifted.endDate.getTime() - shifted.startDate.getTime()).toBe(TWO_DAYS_MS);
  });

  test('crosses the year boundary rather than wrapping inside one', () => {
    const { startDate } = getCalendarShiftedWindow(localRange(new Date(2026, 0, 20, 9, 0), TWO_DAYS_MS), 1);

    expect([startDate.getFullYear(), startDate.getMonth(), startDate.getDate()]).toEqual([2025, 11, 20]);
  });

  test('clamps a day the target month does not have', () => {
    const { startDate } = getCalendarShiftedWindow(localRange(new Date(2026, 2, 31, 9, 0), TWO_DAYS_MS), 1);

    expect([startDate.getMonth(), startDate.getDate()]).toEqual([1, 28]);
  });

  test('takes a leap day back to the 28th of a common year', () => {
    const { startDate } = getCalendarShiftedWindow(localRange(new Date(2028, 1, 29, 9, 0), TWO_DAYS_MS), 12);

    expect([startDate.getFullYear(), startDate.getMonth(), startDate.getDate()]).toEqual([2027, 1, 28]);
  });
});

describe('buildComparedWindows', () => {
  test('pairs the window with the span before it when comparison is on', () => {
    const windows = buildComparedWindows(TWO_DAYS, ComparePeriod.PreviousPeriod);

    expect(windows.current).toEqual(TWO_DAYS);
    expect(windows.previous).toEqual(range('2026-09-13T00:00:00.000Z', '2026-09-15T00:00:00.000Z'));
  });

  test('leaves the previous window absent when comparison is off', () => {
    const windows = buildComparedWindows(TWO_DAYS, ComparePeriod.Off);

    expect(windows.current).toEqual(TWO_DAYS);
    expect(windows.previous).toBeUndefined();
  });

  test('takes the previous month as the same dates one calendar month back', () => {
    const current = { startDate: new Date(2026, 8, 15, 0, 0), endDate: new Date(2026, 8, 17, 0, 0) };
    const previous = buildComparedWindows(current, ComparePeriod.PreviousMonth).previous;

    expect([previous?.startDate.getMonth(), previous?.startDate.getDate()]).toEqual([7, 15]);
  });

  test('takes the previous year as the same dates twelve months back', () => {
    const current = { startDate: new Date(2026, 8, 15, 0, 0), endDate: new Date(2026, 8, 17, 0, 0) };
    const previous = buildComparedWindows(current, ComparePeriod.PreviousYear).previous;

    expect([previous?.startDate.getFullYear(), previous?.startDate.getMonth(), previous?.startDate.getDate()]).toEqual([
      2025, 8, 15,
    ]);
  });

  test('compares a window of any length, since the dataset caps no range', () => {
    const month = range('2026-08-18T00:00:00.000Z', '2026-09-17T00:00:00.000Z');

    expect(buildComparedWindows(month, ComparePeriod.PreviousPeriod).previous).toEqual(
      range('2026-07-19T00:00:00.000Z', '2026-08-18T00:00:00.000Z'),
    );
  });
});
