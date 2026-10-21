import { BucketPoint, DimensionBucketPoint } from '@/src/components/Analytics/Usage/models';

export interface StackedSeries {
  id: string;
  values: number[];
}

export interface StackedMatrix {
  buckets: number[];
  series: StackedSeries[];
  /** Calls in each bucket that none of the named series accounts for. */
  otherValues: number[];
}

/**
 * Lays the split response out against the bucket axis the unsplit one already defines, so the stack
 * and the plain line agree on where a bucket sits — and on how tall the window is, since the
 * residual is the bucket's own total minus the named series rather than a second query.
 */
export const buildStackedMatrix = (
  points: BucketPoint[],
  dimensionPoints: DimensionBucketPoint[],
  seriesIds: string[],
): StackedMatrix => {
  const buckets = points.map((point) => point.bucketMs);
  const indexByBucket = new Map(buckets.map((bucketMs, index) => [bucketMs, index]));

  const series = seriesIds.map((id) => ({ id, values: Array<number>(buckets.length).fill(0) }));
  const valuesById = new Map(series.map((entry) => [entry.id, entry.values]));

  for (const point of dimensionPoints) {
    const index = indexByBucket.get(point.bucketMs);
    const values = valuesById.get(point.seriesId);

    if (index != null && values) {
      values[index] += point.calls;
    }
  }

  const otherValues = points.map((point, index) => {
    const named = series.reduce((acc, entry) => acc + entry.values[index], 0);

    return Math.max(point.measures.calls - named, 0);
  });

  return { buckets, series, otherValues };
};
