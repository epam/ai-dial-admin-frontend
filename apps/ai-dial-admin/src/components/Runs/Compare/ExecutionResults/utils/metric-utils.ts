import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult, ExtractionResultStatus } from '@/src/models/evaluation/run';

import { CompareDiffCounts, CompareRowDiffVisibility } from '../models';

export enum MetricDeltaKind {
  Empty = 'empty',
  /** Primary missing, secondary has a value — highlight green. */
  Added = 'added',
  /** Both have values and they differ — highlight blue. */
  Changed = 'changed',
  /** Primary has a value, secondary missing — highlight red. */
  Removed = 'removed',
}

export interface MetricDelta {
  kind: MetricDeltaKind;
  /** Signed delta value (secondary − primary), rounded to 3 decimals. */
  value?: number;
}

const ROUND_FACTOR = 1000;

export const roundMetricValue = (value: number): number => Math.round(value * ROUND_FACTOR) / ROUND_FACTOR;

export const isMissingMetricValue = (value: unknown): boolean =>
  value == null || (typeof value === 'number' && Number.isNaN(value));

export const formatCompareMetricCellValue = (value: unknown): string | number => {
  if (isMissingMetricValue(value)) {
    return '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    return +value.toFixed(3);
  }

  return String(value);
};

export const formatCompareExtractedCellValue = (value: unknown): string => {
  if (value == null) {
    return '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

export const getNumericMetricValue = (value: unknown): number | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value;
};

export const getMetricDelta = (primary: unknown, secondary: unknown): MetricDelta => {
  const primaryNum = getNumericMetricValue(primary);
  const secondaryNum = getNumericMetricValue(secondary);

  if (primaryNum == null && secondaryNum == null) {
    return { kind: MetricDeltaKind.Empty };
  }

  if (primaryNum == null && secondaryNum != null) {
    return { kind: MetricDeltaKind.Added };
  }

  if (primaryNum != null && secondaryNum == null) {
    return { kind: MetricDeltaKind.Removed };
  }

  const delta = roundMetricValue(secondaryNum! - primaryNum!);

  if (delta === 0) {
    return { kind: MetricDeltaKind.Empty };
  }

  return {
    kind: MetricDeltaKind.Changed,
    value: delta,
  };
};

/**
 * Numeric sort key for the delta column: signed (secondary − primary) when both
 * sides are numeric (0 for equal values), otherwise null when a side is missing.
 */
export const getMetricDeltaSortValue = (primary: unknown, secondary: unknown): number | null => {
  const primaryNum = getNumericMetricValue(primary);
  const secondaryNum = getNumericMetricValue(secondary);
  if (primaryNum == null || secondaryNum == null) return null;
  return roundMetricValue(secondaryNum - primaryNum);
};

export const formatMetricDelta = (delta: MetricDelta): string | null => {
  if (delta.kind !== MetricDeltaKind.Changed) return null;
  if (delta.value == null) return null;

  const sign = delta.value > 0 ? '+' : '';
  return `${sign}${delta.value.toFixed(3)}`;
};

export const isMissingCompareFieldValue = (value: unknown): boolean => value == null || value === '—';

export const getCompareFieldDelta = (
  primary: unknown,
  secondary: unknown,
  options?: { isNumeric?: boolean },
): MetricDeltaKind => {
  const isNumeric = options?.isNumeric ?? false;
  const primaryMissing = isMissingCompareFieldValue(primary);
  const secondaryMissing = isMissingCompareFieldValue(secondary);

  if (primaryMissing && secondaryMissing) {
    return MetricDeltaKind.Empty;
  }

  if (primaryMissing && !secondaryMissing) {
    return MetricDeltaKind.Added;
  }

  if (!primaryMissing && secondaryMissing) {
    return MetricDeltaKind.Removed;
  }

  if (isNumeric) {
    const primaryNum = typeof primary === 'number' ? primary : Number(primary);
    const secondaryNum = typeof secondary === 'number' ? secondary : Number(secondary);
    return getMetricDelta(primaryNum, secondaryNum).kind;
  }

  if (String(primary) === String(secondary)) {
    return MetricDeltaKind.Empty;
  }

  return MetricDeltaKind.Changed;
};

export const getCompareRowDurationMs = (row: AnalyticsResult): number | null => {
  const executionInfo = (row as AnalyticsResult & { executionInfo?: { durationMs?: number } }).executionInfo;
  const durationMs = executionInfo?.durationMs ?? row.execDurationMs;
  return durationMs ?? null;
};

const isExecutionStatusDisplayEmpty = (status?: ExtractionResultStatus): boolean =>
  status == null || status === ExtractionResultStatus.ERROR;

export const getExecutionStatusDelta = (
  primary?: ExtractionResultStatus,
  secondary?: ExtractionResultStatus,
): MetricDeltaKind => {
  const primaryEmpty = isExecutionStatusDisplayEmpty(primary);
  const secondaryEmpty = isExecutionStatusDisplayEmpty(secondary);

  if (primaryEmpty && secondaryEmpty) {
    return MetricDeltaKind.Empty;
  }

  if (primaryEmpty && !secondaryEmpty) {
    return MetricDeltaKind.Added;
  }

  if (!primaryEmpty && secondaryEmpty) {
    return MetricDeltaKind.Removed;
  }

  if (primary === secondary) {
    return MetricDeltaKind.Empty;
  }

  return MetricDeltaKind.Changed;
};

const hasExecutionStatusDiff = (row: CompareAnalyticsRow): boolean => {
  const compared = row._compared;
  if (!compared) return false;

  return getExecutionStatusDelta(row.executionStatus, compared.executionStatus) !== MetricDeltaKind.Empty;
};

const isAnyColVisible = (colIds: string[], hiddenColIds: ReadonlySet<string>): boolean =>
  colIds.some((colId) => !hiddenColIds.has(colId));

const hasExecutionStatusDiffForVisibility = (row: CompareAnalyticsRow, hiddenColIds?: ReadonlySet<string>): boolean => {
  if (hiddenColIds && !isAnyColVisible(['status', 'cmp_status'], hiddenColIds)) {
    return false;
  }

  return hasExecutionStatusDiff(row);
};

const hasHttpDiffForVisibility = (row: CompareAnalyticsRow, hiddenColIds?: ReadonlySet<string>): boolean => {
  if (hiddenColIds && !isAnyColVisible(['http', 'cmp_http'], hiddenColIds)) {
    return false;
  }

  const compared = row._compared;
  if (!compared) return false;

  return (
    getCompareFieldDelta(row.responseStatusCode, compared.responseStatusCode, { isNumeric: true }) !==
    MetricDeltaKind.Empty
  );
};

const hasDurationDiffForVisibility = (row: CompareAnalyticsRow, hiddenColIds?: ReadonlySet<string>): boolean => {
  if (hiddenColIds && !isAnyColVisible(['duration', 'cmp_duration'], hiddenColIds)) {
    return false;
  }

  const compared = row._compared;
  if (!compared) return false;

  return (
    getCompareFieldDelta(getCompareRowDurationMs(row), getCompareRowDurationMs(compared), { isNumeric: true }) !==
    MetricDeltaKind.Empty
  );
};

const hasExecutionFieldDiffForVisibility = (row: CompareAnalyticsRow, hiddenColIds?: ReadonlySet<string>): boolean =>
  hasHttpDiffForVisibility(row, hiddenColIds) || hasDurationDiffForVisibility(row, hiddenColIds);

const hasExtractedDiffForVisibility = (row: CompareAnalyticsRow, hiddenColIds?: ReadonlySet<string>): boolean => {
  const compared = row._compared;
  if (!compared) return false;

  const keys = new Set([...Object.keys(row.extractedColumns ?? {}), ...Object.keys(compared.extractedColumns ?? {})]);

  for (const key of keys) {
    if (hiddenColIds && !isAnyColVisible([`extracted_${key}`, `cmp_extracted_${key}`], hiddenColIds)) {
      continue;
    }

    const delta = getCompareFieldDelta(row.extractedColumns?.[key] ?? null, compared.extractedColumns?.[key] ?? null);
    if (delta !== MetricDeltaKind.Empty) return true;
  }

  return false;
};

const hasMetricDiffForRowForVisibility = (row: CompareAnalyticsRow, hiddenColIds?: ReadonlySet<string>): boolean => {
  const compared = row._compared;
  const groupKeys = new Set([...Object.keys(row.metricValues ?? {}), ...Object.keys(compared?.metricValues ?? {})]);

  for (const groupKey of groupKeys) {
    const metricKeys = new Set([
      ...Object.keys(row.metricValues?.[groupKey] ?? {}),
      ...Object.keys(compared?.metricValues?.[groupKey] ?? {}),
    ]);

    for (const key of metricKeys) {
      if (
        hiddenColIds &&
        !isAnyColVisible([`${groupKey}_${key}`, `cmp_${groupKey}_${key}`, `delta_${groupKey}_${key}`], hiddenColIds)
      ) {
        continue;
      }

      const primary = row.metricValues?.[groupKey]?.[key];
      const secondary = compared?.metricValues?.[groupKey]?.[key];
      if (getMetricDelta(primary, secondary).kind !== MetricDeltaKind.Empty) {
        return true;
      }
    }
  }

  return false;
};

export const hasCompareRowDiff = (row: CompareAnalyticsRow, visibility?: CompareRowDiffVisibility): boolean => {
  const hiddenColIds = visibility?.hiddenColIds;

  return (
    hasExecutionStatusDiffForVisibility(row, hiddenColIds) ||
    hasExecutionFieldDiffForVisibility(row, hiddenColIds) ||
    hasExtractedDiffForVisibility(row, hiddenColIds) ||
    hasMetricDiffForRowForVisibility(row, hiddenColIds)
  );
};

export const mergeCompareMetricValuesSchema = (results: AnalyticsResult[]): Record<string, Record<string, unknown>> => {
  const merged: Record<string, Record<string, unknown>> = {};
  for (const result of results) {
    const metricValues = result.metricValues;
    if (!metricValues) continue;
    for (const [groupKey, groupValues] of Object.entries(metricValues)) {
      if (!merged[groupKey]) merged[groupKey] = {};
      for (const [key, value] of Object.entries(groupValues)) {
        if (!(key in merged[groupKey])) merged[groupKey][key] = value;
      }
    }
  }
  return merged;
};

export const isCompareRowAllMetricsEmpty = (
  row: CompareAnalyticsRow,
  schemaMetrics: Record<string, Record<string, unknown>>,
): boolean => {
  const compared = row._compared;
  const schemaEntries = Object.entries(schemaMetrics).flatMap(([groupKey, groupValues]) =>
    Object.keys(groupValues).map((key) => ({ groupKey, key })),
  );

  if (schemaEntries.length === 0) {
    return true;
  }

  return schemaEntries.every(({ groupKey, key }) => {
    const primary = row.metricValues?.[groupKey]?.[key];
    const secondary = compared?.metricValues?.[groupKey]?.[key];
    return isMissingMetricValue(primary) && isMissingMetricValue(secondary);
  });
};

export const isCompareRunExecutionDataEmpty = (result: AnalyticsResult | null | undefined): boolean => {
  if (!result) return true;
  if (result.runIndex != null) return false;
  if (result.responseStatusCode != null) return false;
  if (getCompareRowDurationMs(result) != null) return false;
  return true;
};

export const isCompareRowFullyEmpty = (
  row: CompareAnalyticsRow,
  schemaMetrics: Record<string, Record<string, unknown>>,
): boolean =>
  isCompareRunExecutionDataEmpty(row) &&
  isCompareRunExecutionDataEmpty(row._compared) &&
  isCompareRowAllMetricsEmpty(row, schemaMetrics);

const countFieldDelta = (delta: MetricDeltaKind, counts: CompareDiffCounts): void => {
  switch (delta) {
    case MetricDeltaKind.Added:
      counts.improved++;
      break;
    case MetricDeltaKind.Changed:
      counts.changed++;
      break;
    case MetricDeltaKind.Removed:
      counts.regressed++;
      break;
  }
};

const countExecutionFieldDiffsForRow = (row: CompareAnalyticsRow, counts: CompareDiffCounts): void => {
  const compared = row._compared;
  if (!compared) return;

  countFieldDelta(
    getCompareFieldDelta(row.responseStatusCode, compared.responseStatusCode, { isNumeric: true }),
    counts,
  );
  countFieldDelta(
    getCompareFieldDelta(getCompareRowDurationMs(row), getCompareRowDurationMs(compared), { isNumeric: true }),
    counts,
  );
};

const countExtractedDiffsForRow = (row: CompareAnalyticsRow, counts: CompareDiffCounts): void => {
  const compared = row._compared;
  if (!compared) return;

  const keys = new Set([...Object.keys(row.extractedColumns ?? {}), ...Object.keys(compared.extractedColumns ?? {})]);

  for (const key of keys) {
    countFieldDelta(
      getCompareFieldDelta(row.extractedColumns?.[key] ?? null, compared.extractedColumns?.[key] ?? null),
      counts,
    );
  }
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
      const delta = getMetricDelta(primary, secondary);

      switch (delta.kind) {
        case MetricDeltaKind.Added:
          counts.improved++;
          break;
        case MetricDeltaKind.Changed:
          counts.changed++;
          break;
        case MetricDeltaKind.Removed:
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
    countExecutionFieldDiffsForRow(row, counts);
    countExtractedDiffsForRow(row, counts);
    countMetricDiffsForRow(row, counts);
  }

  return counts;
};
