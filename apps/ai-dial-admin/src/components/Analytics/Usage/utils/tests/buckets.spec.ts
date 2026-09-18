import { describe, expect, test } from 'vitest';

import { BucketPoint } from '@/src/components/Analytics/Usage/models';
import { getBucketStepMs, padBucketPoints } from '@/src/components/Analytics/Usage/utils/buckets';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';

const MINUTE_MS = 60 * 1000;

const window = {
  startDate: new Date('2026-09-17T12:00:00.000Z'),
  endDate: new Date('2026-09-17T13:00:00.000Z'),
};

const point = (iso: string, calls: number): BucketPoint => ({
  bucketMs: new Date(iso).getTime(),
  measures: { ...EMPTY_MEASURES, calls },
});

describe('getBucketStepMs', () => {
  test.each([
    [{ value: 15, unit: 'm' as const }, 15 * MINUTE_MS],
    [{ value: 2, unit: 'h' as const }, 120 * MINUTE_MS],
    [{ value: 1, unit: 'd' as const }, 1440 * MINUTE_MS],
  ])('converts %o to milliseconds', (resolution, expected) => {
    expect(getBucketStepMs(resolution)).toBe(expected);
  });
});

describe('padBucketPoints', () => {
  const resolution = { value: 15, unit: 'm' as const };

  test('fills the window even when the response carried nothing', () => {
    const padded = padBucketPoints([], window, resolution);

    expect(padded.map((entry) => new Date(entry.bucketMs).toISOString())).toEqual([
      '2026-09-17T12:00:00.000Z',
      '2026-09-17T12:15:00.000Z',
      '2026-09-17T12:30:00.000Z',
      '2026-09-17T12:45:00.000Z',
    ]);
  });

  test('stops before the window bound, which the query itself excluded', () => {
    const padded = padBucketPoints([], window, resolution);

    expect(padded.at(-1)?.bucketMs).toBe(new Date('2026-09-17T12:45:00.000Z').getTime());
  });

  test('keeps the measures of a bucket the response did carry', () => {
    const padded = padBucketPoints([point('2026-09-17T12:30:00.000Z', 42)], window, resolution);

    expect(padded.map((entry) => entry.measures.calls)).toEqual([0, 0, 42, 0]);
  });

  test('aligns the generated grid to the epoch, as the backend bins do', () => {
    const offset = {
      startDate: new Date('2026-09-17T12:07:00.000Z'),
      endDate: new Date('2026-09-17T12:20:00.000Z'),
    };

    expect(padBucketPoints([], offset, resolution).map((entry) => new Date(entry.bucketMs).toISOString())).toEqual([
      '2026-09-17T12:00:00.000Z',
      '2026-09-17T12:15:00.000Z',
    ]);
  });

  test('leaves the response untouched when the resolution has no width', () => {
    const points = [point('2026-09-17T12:00:00.000Z', 1)];

    expect(padBucketPoints(points, window, { value: 0, unit: 'm' })).toBe(points);
  });
});
