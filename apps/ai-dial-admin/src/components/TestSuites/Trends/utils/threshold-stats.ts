import { TrendsRunPoint, TrendsThresholdStats } from '@/src/components/TestSuites/Trends/models';

/**
 * Aggregates last-N Trends runs against a suite overallScoreThreshold.
 * Returns null when the threshold is unset so the KPI card can be omitted.
 */
export const aggregateThresholdStats = (
  runOrder: TrendsRunPoint[],
  threshold: number | null | undefined,
): TrendsThresholdStats | null => {
  if (threshold == null) {
    return null;
  }

  const stats: TrendsThresholdStats = { passed: 0, failed: 0, error: 0, total: runOrder.length };

  for (const point of runOrder) {
    if (point.isFailed) {
      stats.error += 1;
      continue;
    }
    if (point.overallScore == null) {
      continue;
    }
    if (point.overallScore >= threshold) {
      stats.passed += 1;
    } else {
      stats.failed += 1;
    }
  }

  return stats;
};
