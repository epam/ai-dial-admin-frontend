import { buildComparisonSections, valuesAreEqual } from '@/src/components/Runs/Details/BottomDrawer/utils';
import { CompareDiffCounts } from '@/src/components/Runs/Compare/ExecutionResults/models';
import { EXECUTION_STATUS_FIELD_KEY } from '@/src/components/Runs/Details/BottomDrawer/constants';
import {
  ROW_DETAIL_DURATION_FIELD_KEY,
  ROW_DETAIL_EXECUTION_SECTION_KEY,
  ROW_DETAIL_HTTP_FIELD_KEY,
  ROW_DETAIL_HTTP_LABEL,
  ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
  ROW_DETAIL_RUN_NUMBER_LABEL,
} from '@/src/components/Runs/Details/RowDetails/constants';
import { RowDetailField, RowDetailSection } from '@/src/components/Runs/Details/RowDetails/models';
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

const buildExecutionMetaFields = (primary: AnalyticsResult, compared: AnalyticsResult | null): RowDetailField[] => {
  const hasCompared = compared != null;

  const runPrimary = primary.runIndex != null ? String(primary.runIndex + 1) : null;
  const runSecondary = hasCompared && compared.runIndex != null ? String(compared.runIndex + 1) : null;
  const httpPrimary = primary.responseStatusCode != null ? String(primary.responseStatusCode) : null;
  const httpSecondary = hasCompared && compared.responseStatusCode != null ? String(compared.responseStatusCode) : null;

  return [
    {
      fieldKey: ROW_DETAIL_RUN_NUMBER_FIELD_KEY,
      label: ROW_DETAIL_RUN_NUMBER_LABEL,
      primaryRaw: runPrimary,
      secondaryRaw: runSecondary,
      diffKind: MetricDeltaKind.Empty,
      isNumeric: false,
      isScoreIndicator: false,
      isMetric: false,
    },
    {
      fieldKey: ROW_DETAIL_HTTP_FIELD_KEY,
      label: ROW_DETAIL_HTTP_LABEL,
      primaryRaw: httpPrimary,
      secondaryRaw: httpSecondary,
      diffKind: getFieldDiffKind(httpPrimary, httpSecondary, true, hasCompared),
      isNumeric: true,
      isScoreIndicator: false,
      isMetric: false,
    },
  ];
};

/** Status → Run number → HTTP → Duration (+ any other execution rows). */
const orderExecutionFields = (rows: RowDetailField[], metaFields: RowDetailField[]): RowDetailField[] => {
  const byKey = new Map(rows.map((row) => [row.fieldKey, row]));
  const status = byKey.get(EXECUTION_STATUS_FIELD_KEY);
  const duration = byKey.get(ROW_DETAIL_DURATION_FIELD_KEY);
  const used = new Set<string>([
    EXECUTION_STATUS_FIELD_KEY,
    ROW_DETAIL_DURATION_FIELD_KEY,
    ...metaFields.map((field) => field.fieldKey),
  ]);

  return [
    ...(status ? [status] : []),
    ...metaFields,
    ...(duration ? [duration] : []),
    ...rows.filter((row) => !used.has(row.fieldKey)),
  ];
};

/** Execution, then metric sections, then remaining sections (stable within each group). */
const orderRowDetailSections = (sections: RowDetailSection[]): RowDetailSection[] => {
  const execution: RowDetailSection[] = [];
  const metrics: RowDetailSection[] = [];
  const rest: RowDetailSection[] = [];

  for (const section of sections) {
    if (section.key === ROW_DETAIL_EXECUTION_SECTION_KEY) {
      execution.push(section);
    } else if (section.key.startsWith('metric:')) {
      metrics.push(section);
    } else {
      rest.push(section);
    }
  }

  return [...execution, ...metrics, ...rest];
};

export const buildRowDetailSections = (
  primary: AnalyticsResult,
  compared: AnalyticsResult | null,
): RowDetailSection[] => {
  const hasCompared = compared != null;
  const comparisonSections = buildComparisonSections(primary, compared, {}, [], {});

  const mapped = comparisonSections.map((section) => {
    const isMetric = section.key.startsWith('metric:');

    const rows = section.rows.map((row): RowDetailField => {
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
    });

    return {
      key: section.key,
      label: section.label,
      rows:
        section.key === ROW_DETAIL_EXECUTION_SECTION_KEY
          ? orderExecutionFields(rows, buildExecutionMetaFields(primary, compared))
          : rows,
    };
  });

  const result = orderRowDetailSections(mapped);

  return result;
};

export const countRowDetailDiffs = (sections: RowDetailSection[]): CompareDiffCounts => {
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

export const getRowDetailTitle = (row: AnalyticsResult): string => {
  if (row.testCaseName) {
    return row.testCaseName;
  }
  if (row.runIndex != null) {
    return `Row ${row.runIndex + 1}`;
  }
  return row.id ?? '';
};
