import { formatRunCost } from '@/src/components/Runs/Summary/utils';
import { formatSuiteRunTime, roundScore } from '@/src/components/TestSuites/Trends/utils/format';

export const formatScoreDelta = (latest: number | null, previous: number | null): string | null => {
  if (latest == null || previous == null) {
    return null;
  }
  const delta = roundScore(latest - previous);
  if (delta === 0) {
    return null;
  }
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}`;
};

export const formatRuntimeDelta = (latestMs: number | null, previousMs: number | null): string | null => {
  if (latestMs == null || previousMs == null) {
    return null;
  }
  const delta = latestMs - previousMs;
  if (delta === 0) {
    return null;
  }
  const absLabel = formatSuiteRunTime(Math.abs(delta));
  return delta > 0 ? `+${absLabel}` : `-${absLabel}`;
};

export const formatCostDelta = (latest: number | null, previous: number | null): string | null => {
  if (latest == null || previous == null) {
    return null;
  }
  const delta = latest - previous;
  if (delta === 0) {
    return null;
  }
  const absLabel = formatRunCost(Math.abs(delta));
  if (absLabel == null || absLabel === '$0') {
    return null;
  }
  return delta > 0 ? `+${absLabel}` : `-${absLabel}`;
};
