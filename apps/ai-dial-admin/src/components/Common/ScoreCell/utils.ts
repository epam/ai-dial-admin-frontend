import {
  ABSOLUTE_SCORE_BUCKET_KEYS,
  DELTA_NEGATIVE_THRESHOLDS,
  DELTA_POSITIVE_THRESHOLDS,
  DELTA_SCORE_BUCKET_KEYS,
} from './constants';
import { ScoreCellBucketClasses, ScoreColorMode } from './models';

// Guards against float drift (e.g. 0.3 * 10 === 2.9999999999999996) when flooring into a 0.1 bucket.
const BUCKET_EPSILON = 1e-9;

/** Index into `ABSOLUTE_SCORE_BUCKET_KEYS`: 0 and 11 are the exact-0/exact-1 edge buckets. */
const getAbsoluteScoreBucketIndex = (value: number): number => {
  if (value <= 0) return 0;
  if (value >= 1) return ABSOLUTE_SCORE_BUCKET_KEYS.length - 1;
  return Math.floor(value * 10 + BUCKET_EPSILON) + 1;
};

const getDeltaScoreBucketKey = (value: number): (typeof DELTA_SCORE_BUCKET_KEYS)[number] => {
  if (value > 0) {
    const threshold = DELTA_POSITIVE_THRESHOLDS.find((t) => value <= t) ?? DELTA_POSITIVE_THRESHOLDS.at(-1)!;
    return DELTA_SCORE_BUCKET_KEYS[DELTA_POSITIVE_THRESHOLDS.indexOf(threshold) + 4];
  }
  const descendingThresholds = [...DELTA_NEGATIVE_THRESHOLDS].sort((a, b) => b - a);
  const threshold = descendingThresholds.find((t) => value >= t) ?? descendingThresholds.at(-1)!;
  return DELTA_SCORE_BUCKET_KEYS[3 - descendingThresholds.indexOf(threshold)];
};

/**
 * Resolves a score (absolute `[0, 1]`) or a delta (`[-1, 1]`) to its bucket key. A delta of exactly
 * `0` returns `null` — the "Zero delta is neutral" scenario in the `score-cell-rendering` spec: no
 * bucket background/text/border applies.
 */
export const getScoreCellBucketKey = (value: number, mode: ScoreColorMode = ScoreColorMode.Absolute): string | null => {
  if (mode === ScoreColorMode.Delta) {
    return value === 0 ? null : getDeltaScoreBucketKey(value);
  }
  return ABSOLUTE_SCORE_BUCKET_KEYS[getAbsoluteScoreBucketIndex(value)];
};

/** Tailwind class names for a bucket — `null` in, `null` out, so callers can spread unconditionally. */
export const getScoreCellBucketClasses = (bucketKey: string | null): ScoreCellBucketClasses | null =>
  bucketKey
    ? {
        background: `bg-score-${bucketKey}`,
        text: `text-score-${bucketKey}`,
        border: `border-score-${bucketKey}`,
        backgroundBorder: `border-score-${bucketKey}-bg`,
      }
    : null;
