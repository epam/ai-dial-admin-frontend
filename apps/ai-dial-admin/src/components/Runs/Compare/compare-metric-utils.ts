import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';

import { CompareDiffCounts } from './models';

export enum CompareMetricDeltaKind {
  Empty = 'empty',
  /** Primary missing, secondary has a value — highlight green. */
  Added = 'added',
  /** Both have values and they differ — highlight blue. */
  Changed = 'changed',
  /** Primary has a value, secondary missing — highlight red. */
  Removed = 'removed',
}

export interface CompareMetricDelta {
  kind: CompareMetricDeltaKind;
  /** Signed delta value (secondary − primary), rounded to 3 decimals. */
  value?: number;
}

const ROUND_FACTOR = 1000;

export const roundMetricValue = (value: number): number => Math.round(value * ROUND_FACTOR) / ROUND_FACTOR;

export const isMissingMetricValue = (value: unknown): boolean =>
  value == null || (typeof value === 'number' && Number.isNaN(value));

export const getNumericMetricValue = (value: unknown): number | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value;
};

export const getCompareMetricDelta = (primary: unknown, secondary: unknown): CompareMetricDelta => {
  const primaryNum = getNumericMetricValue(primary);
  const secondaryNum = getNumericMetricValue(secondary);

  if (primaryNum == null && secondaryNum == null) {
    return { kind: CompareMetricDeltaKind.Empty };
  }

  if (primaryNum == null && secondaryNum != null) {
    return { kind: CompareMetricDeltaKind.Added };
  }

  if (primaryNum != null && secondaryNum == null) {
    return { kind: CompareMetricDeltaKind.Removed };
  }

  const delta = roundMetricValue(secondaryNum! - primaryNum!);

  if (delta === 0) {
    return { kind: CompareMetricDeltaKind.Empty };
  }

  return {
    kind: CompareMetricDeltaKind.Changed,
    value: delta,
  };
};

export const formatCompareMetricDelta = (delta: CompareMetricDelta): string | null => {
  if (delta.kind !== CompareMetricDeltaKind.Changed) return null;
  if (delta.value == null) return null;

  const sign = delta.value > 0 ? '+' : '';
  return `${sign}${delta.value.toFixed(3)}`;
};

const hasExecutionStatusDiff = (row: CompareAnalyticsRow): boolean => {
  const compared = row._compared;
  if (!compared) return false;

  const primary = row.executionStatus;
  const secondary = compared.executionStatus;
  if (primary == null && secondary == null) return false;
  return primary !== secondary;
};

const countMetricDiffsForRow = (row: CompareAnalyticsRow, counts: CompareDiffCounts): void => {
  const compared = row._compared;
  const groupKeys = new Set([...Object.keys(row.metricValues ?? {}), ...Object.keys(compared?.metricValues ?? {})]);

  for (const groupKey of groupKeys) {
    const metricKeys = new Set([
      ...Object.keys(row.metricValues?.[groupKey] ?? {}),
      ...Object.keys(compared?.metricValues?.[groupKey] ?? {}),
    ]);

    for (const key of metricKeys) {
      const primary = row.metricValues?.[groupKey]?.[key];
      const secondary = compared?.metricValues?.[groupKey]?.[key];
      const delta = getCompareMetricDelta(primary, secondary);

      switch (delta.kind) {
        case CompareMetricDeltaKind.Added:
          counts.improved++;
          break;
        case CompareMetricDeltaKind.Changed:
          counts.changed++;
          break;
        case CompareMetricDeltaKind.Removed:
          counts.regressed++;
          break;
      }
    }
  }
};

export const countCompareDiffs = (rows: CompareAnalyticsRow[]): CompareDiffCounts => {
  const counts: CompareDiffCounts = { improved: 0, changed: 0, regressed: 0 };

  for (const row of rows) {
    if (hasExecutionStatusDiff(row)) {
      counts.changed++;
    }
    countMetricDiffsForRow(row, counts);
  }

  return counts;
};
