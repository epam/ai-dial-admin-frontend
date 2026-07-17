import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';

type HeatMapTestCaseSource = Pick<AnalyticsResult, 'testCaseId' | 'testCaseName' | 'id' | 'runIndex'>;

export const getHeatMapTestCaseKey = (row: HeatMapTestCaseSource): string =>
  row.testCaseId || row.testCaseName || row.id || '';

export const formatHeatMapTestCaseColId = (testCaseKey: string, runIndex: number): string =>
  `tc_${testCaseKey}__${runIndex}`;

export const getHeatMapTestCaseColId = (row: HeatMapTestCaseSource): string =>
  formatHeatMapTestCaseColId(getHeatMapTestCaseKey(row), row.runIndex ?? 0);

export const hasHeatMapMultiSubRuns = (rows: CompareAnalyticsRow[]): boolean =>
  rows.some((row) => row.runIndex > 0 || (row._compared?.runIndex ?? 0) > 0);

export const formatHeatMapTestCaseHeader = (row: HeatMapTestCaseSource, includeSubRunIndex: boolean): string => {
  const name = row.testCaseName || row.testCaseId || row.id || '';

  if (!includeSubRunIndex) {
    return name;
  }

  return `${name}_${(row.runIndex ?? 0) + 1}`;
};

export const getHeatMapTestCaseHeaderLabels = (
  rows: CompareAnalyticsRow[],
  includeSubRunIndex = hasHeatMapMultiSubRuns(rows),
): string[] => rows.map((row) => formatHeatMapTestCaseHeader(row, includeSubRunIndex));
