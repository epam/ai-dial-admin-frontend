import { BucketPoint, SpendBucket } from '@/src/components/Analytics/Usage/models';
import { EMPTY_MEASURES } from '@/src/components/Analytics/Usage/utils/folds';
import { TimeRange } from '@/src/models/time-range';
import { ChartResolution } from '@/src/utils/time-filter/get-chart-resolution';

const MS_PER_UNIT: Record<ChartResolution['unit'], number> = {
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export const getBucketStepMs = (resolution: ChartResolution): number => resolution.value * MS_PER_UNIT[resolution.unit];

/**
 * Fills the window's every bucket, whether the response carried it or not.
 *
 * The backend emits a row only for a bucket that has rows, so a window whose traffic stops halfway
 * comes back as the buckets before the stop — and a category axis built from those alone redraws
 * the window as that fragment. A day with an hour of traffic then read as an hour-long day.
 *
 * The generated grid is epoch-aligned, which is what `date_bin` aligns its own bins to, so a padded
 * bucket lands on the timestamp the backend would have given it.
 */
export const padBucketPoints = (
  points: BucketPoint[],
  window: TimeRange,
  resolution: ChartResolution,
): BucketPoint[] => {
  const stepMs = getBucketStepMs(resolution);

  if (stepMs <= 0) {
    return points;
  }

  const byBucket = new Map(points.map((point) => [point.bucketMs, point]));
  const firstMs = Math.floor(window.startDate.getTime() / stepMs) * stepMs;
  // The window's own bound is exclusive, so a bucket starting on it was never queried: drawing it
  // would end every custom range on a phantom drop to the axis.
  const endMs = window.endDate.getTime();
  const padded: BucketPoint[] = [];

  for (let bucketMs = firstMs; bucketMs < endMs; bucketMs += stepMs) {
    padded.push(byBucket.get(bucketMs) ?? { bucketMs, measures: EMPTY_MEASURES });
  }

  return padded;
};

/** The same filling for the spend row, whose bars are a bin of their own. */
export const padSpendBuckets = (
  buckets: SpendBucket[],
  window: TimeRange,
  resolution: ChartResolution,
): SpendBucket[] => {
  const stepMs = getBucketStepMs(resolution);

  if (stepMs <= 0) {
    return buckets;
  }

  const byBucket = new Map(buckets.map((bucket) => [bucket.bucketMs, bucket]));
  const firstMs = Math.floor(window.startDate.getTime() / stepMs) * stepMs;
  const endMs = window.endDate.getTime();
  const padded: SpendBucket[] = [];

  for (let bucketMs = firstMs; bucketMs < endMs; bucketMs += stepMs) {
    padded.push(byBucket.get(bucketMs) ?? { bucketMs, spend: 0 });
  }

  return padded;
};
