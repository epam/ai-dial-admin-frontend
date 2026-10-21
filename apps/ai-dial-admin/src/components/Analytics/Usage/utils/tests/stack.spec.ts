import { describe, expect, test } from 'vitest';

import { BucketPoint, DimensionBucketPoint } from '@/src/components/Analytics/Usage/models';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import { buildStackedMatrix } from '@/src/components/Analytics/Usage/utils/stack';

const point = (bucketMs: number, calls: number): BucketPoint => ({
  bucketMs,
  measures: { ...EMPTY_MEASURES, calls },
});

const split = (bucketMs: number, seriesId: string, calls: number): DimensionBucketPoint => ({
  bucketMs,
  seriesId,
  calls,
});

const BUCKETS = [point(1000, 100), point(2000, 50)];

describe('buildStackedMatrix', () => {
  test('lays each series onto the bucket axis the unsplit response defines', () => {
    const matrix = buildStackedMatrix(BUCKETS, [split(1000, 'a', 60), split(2000, 'a', 20)], ['a']);

    expect(matrix.buckets).toEqual([1000, 2000]);
    expect(matrix.series).toEqual([{ id: 'a', values: [60, 20] }]);
  });

  test('leaves a zero where a series had no rows in a bucket', () => {
    const matrix = buildStackedMatrix(BUCKETS, [split(2000, 'a', 20)], ['a']);

    expect(matrix.series[0].values).toEqual([0, 20]);
  });

  test('takes the residual from the bucket total, so the stack matches the plain line', () => {
    const matrix = buildStackedMatrix(BUCKETS, [split(1000, 'a', 60), split(2000, 'a', 20)], ['a']);

    expect(matrix.otherValues).toEqual([40, 30]);
  });

  test('clamps a residual that would go negative rather than dipping the stack', () => {
    const matrix = buildStackedMatrix([point(1000, 10)], [split(1000, 'a', 25)], ['a']);

    expect(matrix.otherValues).toEqual([0]);
  });

  test('ignores a split row whose bucket is not on the axis', () => {
    const matrix = buildStackedMatrix(BUCKETS, [split(9999, 'a', 500)], ['a']);

    expect(matrix.series[0].values).toEqual([0, 0]);
    expect(matrix.otherValues).toEqual([100, 50]);
  });

  test('ignores a split row for a series that was not asked for', () => {
    const matrix = buildStackedMatrix(BUCKETS, [split(1000, 'unnamed', 70)], ['a']);

    expect(matrix.series[0].values).toEqual([0, 0]);
    expect(matrix.otherValues).toEqual([100, 50]);
  });

  test('sums several rows landing in one bucket for one series', () => {
    const matrix = buildStackedMatrix([point(1000, 100)], [split(1000, 'a', 10), split(1000, 'a', 15)], ['a']);

    expect(matrix.series[0].values).toEqual([25]);
  });

  test('returns an empty matrix when the window carries no buckets', () => {
    expect(buildStackedMatrix([], [split(1000, 'a', 5)], ['a'])).toEqual({
      buckets: [],
      series: [{ id: 'a', values: [] }],
      otherValues: [],
    });
  });
});
