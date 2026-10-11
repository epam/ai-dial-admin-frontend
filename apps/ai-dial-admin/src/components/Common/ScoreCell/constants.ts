/**
 * Ascending-score bucket keys for the absolute 0.00-1.00 scale. `abs-00` and `abs-11` are the
 * exact-0/exact-1 edge buckets the Figma frames call out as distinct from their neighbors; the rest
 * key a half-open `[n, n+0.1)` range. Each key is also a `tailwind.config.js` color token suffix
 * (`bg-score-${key}`, `text-score-${key}`, `border-score-${key}`) — see that file's
 * `scoreCell*Colors` objects for the Dark Mode values these resolve to by default.
 */
export const ABSOLUTE_SCORE_BUCKET_KEYS = [
  'abs-00',
  'abs-01',
  'abs-02',
  'abs-03',
  'abs-04',
  'abs-05',
  'abs-06',
  'abs-07',
  'abs-08',
  'abs-09',
  'abs-10',
  'abs-11',
] as const;

/** Ascending delta bucket keys for the -1.00..+1.00 scale: 4 negative (`n4`..`n1`), 4 positive (`p1`..`p4`). */
export const DELTA_SCORE_BUCKET_KEYS = [
  'delta-n4',
  'delta-n3',
  'delta-n2',
  'delta-n1',
  'delta-p1',
  'delta-p2',
  'delta-p3',
  'delta-p4',
] as const;

export const DELTA_POSITIVE_THRESHOLDS = [0.25, 0.5, 0.75, 1.0] as const;
export const DELTA_NEGATIVE_THRESHOLDS = [-0.25, -0.5, -0.75, -1.0] as const;
