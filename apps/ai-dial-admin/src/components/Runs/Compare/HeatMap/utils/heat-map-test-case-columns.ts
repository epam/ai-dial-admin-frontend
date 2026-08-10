import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';

type HeatMapTestCaseSource = Pick<
  AnalyticsResult,
  'testCaseId' | 'testCaseName' | 'id' | 'runIndex' | 'turnIndex' | 'totalTurns'
>;

export const getHeatMapTestCaseKey = (row: HeatMapTestCaseSource): string =>
  row.testCaseId || row.testCaseName || row.id || '';

export const formatHeatMapTestCaseColId = (testCaseKey: string, runIndex: number, turnIndex?: number): string => {
  const base = `tc_${testCaseKey}__${runIndex}`;
  return turnIndex != null ? `${base}__t${turnIndex}` : base;
};

export const getHeatMapTestCaseColId = (row: HeatMapTestCaseSource): string =>
  formatHeatMapTestCaseColId(getHeatMapTestCaseKey(row), row.runIndex ?? 0, row.turnIndex);

export const hasHeatMapMultiSubRuns = (rows: CompareAnalyticsRow[]): boolean =>
  rows.some((row) => row.runIndex > 0 || (row._compared?.runIndex ?? 0) > 0);

export const hasHeatMapMultiTurns = (rows: CompareAnalyticsRow[]): boolean =>
  rows.some((row) => {
    const primaryMulti = (row.totalTurns ?? 0) > 1 || (row.turnIndex ?? 0) > 0;
    const comparedMulti = (row._compared?.totalTurns ?? 0) > 1 || (row._compared?.turnIndex ?? 0) > 0;
    return primaryMulti || comparedMulti;
  });

export const formatHeatMapTestCaseHeader = (
  row: HeatMapTestCaseSource,
  includeSubRunIndex: boolean,
  includeTurnIndex = false,
): string => {
  const name = row.testCaseName || row.testCaseId || row.id || '';
  const parts = [name];

  if (includeSubRunIndex) {
    parts.push(String((row.runIndex ?? 0) + 1));
  }

  if (includeTurnIndex && row.turnIndex != null) {
    parts.push(`T${row.turnIndex + 1}`);
  }

  return parts.join('_');
};

export const getHeatMapTestCaseHeaderLabels = (
  rows: CompareAnalyticsRow[],
  includeSubRunIndex = hasHeatMapMultiSubRuns(rows),
  includeTurnIndex = hasHeatMapMultiTurns(rows),
): string[] => rows.map((row) => formatHeatMapTestCaseHeader(row, includeSubRunIndex, includeTurnIndex));
