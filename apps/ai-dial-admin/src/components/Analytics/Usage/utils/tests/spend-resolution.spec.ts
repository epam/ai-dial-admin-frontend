import { describe, expect, test } from 'vitest';

import { getBucketStepMs, padSpendBuckets } from '@/src/components/Analytics/Usage/utils/buckets';
import { getSpendResolution } from '@/src/components/Analytics/Usage/utils/spend-resolution';

const MS_PER_MINUTE = 60 * 1000;

const windowOfMinutes = (minutes: number) => ({
  startDate: new Date('2026-09-22T00:00:00.000Z'),
  endDate: new Date(new Date('2026-09-22T00:00:00.000Z').getTime() + minutes * MS_PER_MINUTE),
});

const barsIn = (minutes: number): number => {
  const resolution = getSpendResolution(windowOfMinutes(minutes));

  return (minutes * MS_PER_MINUTE) / getBucketStepMs(resolution);
};

describe('getSpendResolution', () => {
  test.each([
    ['an hour', 60],
    ['three hours', 180],
    ['a day', 1440],
    ['two days', 2880],
    ['a week', 10080],
    ['a month', 43200],
    ['a quarter', 129600],
    ['a year', 525600],
  ])('fills the row for %s', (_label, minutes) => {
    const bars = barsIn(minutes);

    expect(bars).toBeGreaterThanOrEqual(10);
    expect(bars).toBeLessThanOrEqual(24);
  });

  test('states the step in the largest unit that divides it', () => {
    expect(getSpendResolution(windowOfMinutes(1440))).toEqual({ value: 2, unit: 'h' });
    expect(getSpendResolution(windowOfMinutes(10080))).toEqual({ value: 12, unit: 'h' });
    expect(getSpendResolution(windowOfMinutes(43200))).toEqual({ value: 2, unit: 'd' });
  });

  test('gives a window shorter than the smallest step that step', () => {
    expect(getSpendResolution(windowOfMinutes(1))).toEqual({ value: 1, unit: 'm' });
  });

  test('gives an empty window a step rather than none', () => {
    const instant = new Date('2026-09-22T00:00:00.000Z');

    expect(getSpendResolution({ startDate: instant, endDate: instant })).toEqual({ value: 1, unit: 'm' });
  });
});

describe('padSpendBuckets', () => {
  const window = windowOfMinutes(180);
  const resolution = { value: 1, unit: 'h' } as const;

  test('fills every bin of the window, whether the response carried it or not', () => {
    const padded = padSpendBuckets([{ bucketMs: window.startDate.getTime(), spend: 5 }], window, resolution);

    expect(padded).toHaveLength(3);
    expect(padded[0].spend).toBe(5);
    expect(padded[1].spend).toBe(0);
  });

  test('keeps the bins epoch-aligned, as the backend bins them', () => {
    const padded = padSpendBuckets([], window, resolution);
    const stepMs = getBucketStepMs(resolution);

    expect(padded.every((bucket) => bucket.bucketMs % stepMs === 0)).toBe(true);
  });

  test('draws no bar on the window own exclusive bound', () => {
    const padded = padSpendBuckets([], window, resolution);

    expect(padded.at(-1)?.bucketMs).toBeLessThan(window.endDate.getTime());
  });
});
