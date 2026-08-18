import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';

type HeatMapTestCaseSource = Pick<
  AnalyticsResult,
  'testCaseId' | 'testCaseName' | 'id' | 'runIndex' | 'requestIndex' | 'totalRequests' | 'turnIndex' | 'totalTurns'
>;

export const getHeatMapTestCaseKey = (row: HeatMapTestCaseSource): string =>
  row.testCaseId || row.testCaseName || row.id || '';

export const formatHeatMapTestCaseColId = (
  testCaseKey: string,
  runIndex: number,
  requestIndex?: number,
  turnIndex?: number,
): string => {
  const base = `tc_${testCaseKey}__${runIndex}`;
  const withRequest = requestIndex != null ? `${base}__r${requestIndex}` : base;
  return turnIndex != null ? `${withRequest}__t${turnIndex}` : withRequest;
};

export const getHeatMapTestCaseColId = (row: HeatMapTestCaseSource): string =>
  formatHeatMapTestCaseColId(getHeatMapTestCaseKey(row), row.runIndex ?? 0, row.requestIndex, row.turnIndex);

export const hasHeatMapMultiSubRuns = (rows: CompareAnalyticsRow[]): boolean =>
  rows.some((row) => row.runIndex > 0 || (row._compared?.runIndex ?? 0) > 0);

export const hasHeatMapMultiRequests = (rows: CompareAnalyticsRow[]): boolean =>
  rows.some((row) => {
    const primaryMulti = (row.totalRequests ?? 0) > 1 || (row.requestIndex ?? 0) > 0;
    const comparedMulti = (row._compared?.totalRequests ?? 0) > 1 || (row._compared?.requestIndex ?? 0) > 0;
    return primaryMulti || comparedMulti;
  });

export const hasHeatMapMultiTurns = (rows: CompareAnalyticsRow[]): boolean =>
  rows.some((row) => {
    const primaryMulti = (row.totalTurns ?? 0) > 1 || (row.turnIndex ?? 0) > 0;
    const comparedMulti = (row._compared?.totalTurns ?? 0) > 1 || (row._compared?.turnIndex ?? 0) > 0;
    return primaryMulti || comparedMulti;
  });

export const formatHeatMapTestCaseHeader = (
  row: HeatMapTestCaseSource,
  includeSubRunIndex: boolean,
  includeRequestIndex = false,
  includeTurnIndex = false,
): string => {
  const name = row.testCaseName || row.testCaseId || row.id || '';
  const parts = [name];

  if (includeSubRunIndex) {
    parts.push(String((row.runIndex ?? 0) + 1));
  }

  if (includeRequestIndex && row.requestIndex != null) {
    parts.push(`R${row.requestIndex + 1}`);
  }

  if (includeTurnIndex && row.turnIndex != null) {
    parts.push(`T${row.turnIndex + 1}`);
  }

  return parts.join('_');
};

export const getHeatMapTestCaseHeaderLabels = (
  rows: CompareAnalyticsRow[],
  includeSubRunIndex = hasHeatMapMultiSubRuns(rows),
  includeRequestIndex = hasHeatMapMultiRequests(rows),
  includeTurnIndex = hasHeatMapMultiTurns(rows),
): string[] =>
  rows.map((row) => formatHeatMapTestCaseHeader(row, includeSubRunIndex, includeRequestIndex, includeTurnIndex));
