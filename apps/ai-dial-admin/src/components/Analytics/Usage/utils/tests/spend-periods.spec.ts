import { describe, expect, test } from 'vitest';

import { SPEND_DAY_COUNT, SPEND_MONTH_COUNT } from '@/src/components/Analytics/Usage/constants';
import { SpendScaleUnit } from '@/src/components/Analytics/Usage/models';
import { buildSpendPeriods, getSpendRange, getSpendScale } from '@/src/components/Analytics/Usage/utils/spend-periods';

const range = (startIso: string, endIso: string) => ({ startDate: new Date(startIso), endDate: new Date(endIso) });

const HOURS_3 = range('2026-09-17T12:00:00.000Z', '2026-09-17T15:00:00.000Z');
const DAYS_30 = range('2026-08-18T15:00:00.000Z', '2026-09-17T15:00:00.000Z');

const bucket = (iso: string, spend: number) => ({ bucketMs: new Date(iso).getTime(), spend });

describe('getSpendScale', () => {
  test.each([
    ['an hours-long window', HOURS_3],
    ['a window of exactly the threshold', range('2026-09-10T15:00:00.000Z', '2026-09-17T15:00:00.000Z')],
  ])('reads %s in days', (_case, window) => {
    expect(getSpendScale(window)).toEqual({ unit: SpendScaleUnit.Day, count: SPEND_DAY_COUNT });
  });

  test('switches to months once the window runs past a week', () => {
    expect(getSpendScale(DAYS_30)).toEqual({ unit: SpendScaleUnit.Month, count: SPEND_MONTH_COUNT });
  });
});

describe('getSpendRange', () => {
  test('reaches back to the first day of the scale, aligned to the calendar', () => {
    const scale = { unit: SpendScaleUnit.Day, count: 14 };

    expect(getSpendRange(HOURS_3, scale)).toEqual({
      startDate: new Date('2026-09-04T00:00:00.000Z'),
      endDate: HOURS_3.endDate,
    });
  });

  test('reaches back to the first of the month on the month scale', () => {
    const scale = { unit: SpendScaleUnit.Month, count: 3 };

    expect(getSpendRange(DAYS_30, scale)).toEqual({
      startDate: new Date('2026-07-01T00:00:00.000Z'),
      endDate: DAYS_30.endDate,
    });
  });
});

describe('buildSpendPeriods', () => {
  const scale = { unit: SpendScaleUnit.Day, count: 3 };

  test('emits one period per step of the scale, ending in the window', () => {
    const periods = buildSpendPeriods([], HOURS_3, scale);

    expect(periods.map((period) => new Date(period.startMs).toISOString())).toEqual([
      '2026-09-15T00:00:00.000Z',
      '2026-09-16T00:00:00.000Z',
      '2026-09-17T00:00:00.000Z',
    ]);
  });

  test('marks only the period the window ends in as the current one', () => {
    expect(buildSpendPeriods([], HOURS_3, scale).map((period) => period.isCurrent)).toEqual([false, false, true]);
  });

  test('sums every bucket of a period, whatever hour it landed on', () => {
    const periods = buildSpendPeriods(
      [bucket('2026-09-16T00:00:00.000Z', 2), bucket('2026-09-16T00:00:00.000Z', 3)],
      HOURS_3,
      scale,
    );

    expect(periods[1].spend).toBe(5);
  });

  test('leaves a period with no buckets at zero rather than dropping it', () => {
    expect(buildSpendPeriods([bucket('2026-09-17T00:00:00.000Z', 9)], HOURS_3, scale).map((p) => p.spend)).toEqual([
      0, 0, 9,
    ]);
  });

  test('ignores a bucket outside the scale', () => {
    const periods = buildSpendPeriods([bucket('2026-01-01T00:00:00.000Z', 99)], HOURS_3, scale);

    expect(periods.every((period) => period.spend === 0)).toBe(true);
  });

  test('groups by calendar month on the month scale', () => {
    const periods = buildSpendPeriods(
      [bucket('2026-08-01T00:00:00.000Z', 4), bucket('2026-09-01T00:00:00.000Z', 6)],
      DAYS_30,
      { unit: SpendScaleUnit.Month, count: 2 },
    );

    expect(periods.map((period) => period.spend)).toEqual([4, 6]);
  });
});
