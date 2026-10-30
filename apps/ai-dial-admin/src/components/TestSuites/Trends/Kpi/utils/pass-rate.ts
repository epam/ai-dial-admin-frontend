import { RunTestCaseSegments } from '@/src/components/TestSuites/Trends/models';

export const segmentPassRate = (segments: Pick<RunTestCaseSegments, 'above' | 'total'> | null): number | null => {
  if (segments == null || segments.total <= 0) {
    return null;
  }
  return segments.above / segments.total;
};

/**
 * Percentage-point delta between two 0–1 rates (e.g. 0.985 − 0.665 → `+32%`).
 * Null when either rate is missing or the rounded delta is zero.
 */
export const formatPassRateDelta = (latest: number | null, previous: number | null): string | null => {
  if (latest == null || previous == null) {
    return null;
  }
  const deltaPct = Math.round((latest - previous) * 1000) / 10;
  if (deltaPct === 0) {
    return null;
  }
  const sign = deltaPct > 0 ? '+' : '';
  const text = Number.isInteger(deltaPct) ? String(deltaPct) : String(deltaPct);
  return `${sign}${text}%`;
};
