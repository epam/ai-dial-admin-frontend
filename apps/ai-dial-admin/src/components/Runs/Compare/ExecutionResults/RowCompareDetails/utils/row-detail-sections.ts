import { buildComparisonSections, valuesAreEqual } from '@/src/components/Runs/Details/BottomDrawer/utils';
import { CompareDiffCounts } from '@/src/components/Runs/Compare/ExecutionResults/models';
import {
  CompareRowDetailField,
  CompareRowDetailSection,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { getMetricDelta, MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { isScoreIndicatorValue } from '@/src/components/Common/ScoreBar/utils';
import { AnalyticsResult } from '@/src/models/evaluation/run';

const parseNumericRaw = (raw: string | null): number | null => {
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
};

export const getFieldDiffKind = (
  primaryRaw: string | null,
  secondaryRaw: string | null,
  isNumeric: boolean,
  hasCompared: boolean,
): MetricDeltaKind => {
  if (!hasCompared) {
    return MetricDeltaKind.Empty;
  }

  if (isNumeric) {
    return getMetricDelta(parseNumericRaw(primaryRaw), parseNumericRaw(secondaryRaw)).kind;
  }

  if (primaryRaw === null && secondaryRaw === null) {
    return MetricDeltaKind.Empty;
  }
  if (primaryRaw === null && secondaryRaw !== null) {
    return MetricDeltaKind.Added;
  }
  if (primaryRaw !== null && secondaryRaw === null) {
    return MetricDeltaKind.Removed;
  }
  if (valuesAreEqual(primaryRaw, secondaryRaw)) {
    return MetricDeltaKind.Empty;
  }
  return MetricDeltaKind.Changed;
};

const isScoreIndicatorRaw = (raw: string | null, isNumeric: boolean): boolean => {
  if (!isNumeric || raw === null) return false;
  const value = parseNumericRaw(raw);
  return value != null && isScoreIndicatorValue(value);
};

export const buildRowDetailSections = (
  primary: AnalyticsResult,
  compared: AnalyticsResult | null,
): CompareRowDetailSection[] => {
  const hasCompared = compared != null;
  const comparisonSections = buildComparisonSections(primary, compared, {}, [], {});

  return comparisonSections.map((section) => {
    const isMetric = section.key.startsWith('metric:');

    return {
      key: section.key,
      label: section.label,
      rows: section.rows.map((row): CompareRowDetailField => {
        const primaryRaw = row.values[0]?.raw ?? null;
        const secondaryRaw = hasCompared ? (row.values[1]?.raw ?? null) : null;

        return {
          fieldKey: row.fieldKey,
          label: row.label,
          primaryRaw,
          secondaryRaw,
          primaryFailed: row.values[0]?.isFailed,
          secondaryFailed: row.values[1]?.isFailed,
          diffKind: getFieldDiffKind(primaryRaw, secondaryRaw, row.isNumeric, hasCompared),
          isNumeric: row.isNumeric,
          isScoreIndicator:
            isScoreIndicatorRaw(primaryRaw, row.isNumeric) || isScoreIndicatorRaw(secondaryRaw, row.isNumeric),
          isMetric,
        };
      }),
    };
  });
};

export const countRowDetailDiffs = (sections: CompareRowDetailSection[]): CompareDiffCounts => {
  const counts: CompareDiffCounts = { improved: 0, changed: 0, regressed: 0 };

  for (const section of sections) {
    for (const row of section.rows) {
      switch (row.diffKind) {
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

  return counts;
};

export const getCompareRowDetailTitle = (row: AnalyticsResult): string => {
  if (row.testCaseName) {
    return row.testCaseName;
  }
  if (row.runIndex != null) {
    return `Row ${row.runIndex + 1}`;
  }
  return row.id ?? '';
};
