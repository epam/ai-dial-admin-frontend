import {
  HEALTH_DISTRIBUTION_THRESHOLD_PERCENT_MAX,
  HEALTH_DISTRIBUTION_THRESHOLD_PERCENT_MIN,
} from '@/src/components/EvalSystemHealth/constants';

/** Reads a typed percentage as a whole number within the allowed range; `null` when there is nothing usable to read. */
export const parseThresholdPercent = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.min(
    HEALTH_DISTRIBUTION_THRESHOLD_PERCENT_MAX,
    Math.max(HEALTH_DISTRIBUTION_THRESHOLD_PERCENT_MIN, Math.round(value)),
  );
};
