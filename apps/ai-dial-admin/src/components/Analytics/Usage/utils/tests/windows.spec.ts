import { describe, expect, test } from 'vitest';

import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { buildComparedWindows, getPreviousWindow } from '@/src/components/Analytics/Usage/utils/windows';

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

  test('compares a window of any length, since the dataset caps no range', () => {
    const month = range('2026-08-18T00:00:00.000Z', '2026-09-17T00:00:00.000Z');

    expect(buildComparedWindows(month, ComparePeriod.PreviousPeriod).previous).toEqual(
      range('2026-07-19T00:00:00.000Z', '2026-08-18T00:00:00.000Z'),
    );
  });
});
