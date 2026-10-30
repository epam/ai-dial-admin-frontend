import {
  ExecutionResultRowType,
  GroupedAnalyticsResult,
  GroupedCompareAnalyticsRow,
  TestCaseScoreSummary,
} from '@/src/components/Runs/ExecutionResults/models';
import {
  buildTestCaseScoreLookup,
  getTestCaseThresholdStatus,
} from '@/src/components/Runs/ExecutionResults/utils/test-case-scores';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';

export const getExecutionResultGroupKey = (row: Pick<AnalyticsResult, 'testCaseId' | 'testCaseName' | 'id'>): string =>
  row.testCaseId || row.testCaseName || row.id || '';

const compareOptionalIndex = (left?: number, right?: number): number => (left ?? 0) - (right ?? 0);

export const sortExecutionResultGroupRows = <T extends AnalyticsResult>(rows: T[]): T[] =>
  rows
    .map((row, sourceIndex) => ({ row, sourceIndex }))
    .sort((left, right) => {
      const runOrder = compareOptionalIndex(left.row.runIndex, right.row.runIndex);
      if (runOrder !== 0) return runOrder;
      const requestOrder = compareOptionalIndex(left.row.requestIndex, right.row.requestIndex);
      if (requestOrder !== 0) return requestOrder;
      const turnOrder = compareOptionalIndex(left.row.turnIndex, right.row.turnIndex);
      return turnOrder !== 0 ? turnOrder : left.sourceIndex - right.sourceIndex;
    })
    .map(({ row }) => row);

const groupRows = <T extends AnalyticsResult>(rows: T[]): T[][] => {
  const groups = new Map<string, T[]>();
  const orderedGroups: T[][] = [];
  rows.forEach((row) => {
    const key = getExecutionResultGroupKey(row);
    // Without an identity, keep the row standalone instead of merging unrelated results.
    if (!key) {
      orderedGroups.push([row]);
      return;
    }
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      const newGroup = [row];
      groups.set(key, newGroup);
      orderedGroups.push(newGroup);
    }
  });
  return orderedGroups;
};

const toResultRow = <T extends AnalyticsResult>(row: T, groupKey: string): T & GroupedAnalyticsResult => ({
  ...row,
  groupKey,
  resultRowType: ExecutionResultRowType.Result,
});

export const projectExecutionResultScores = (
  rows: AnalyticsResult[],
  summaries: TestCaseScoreSummary[],
  runId: string,
  threshold?: number,
): GroupedAnalyticsResult[] => {
  const findScore = buildTestCaseScoreLookup(summaries);
  return rows.map((row) => {
    const summary = findScore(runId, row.testCaseId, row.testCaseName);
    return {
      ...toResultRow(row, getExecutionResultGroupKey(row)),
      testCaseScore: summary?.score,
      thresholdStatus: getTestCaseThresholdStatus(summary?.score, threshold),
    };
  });
};

export const projectExecutionResultGroups = (
  rows: AnalyticsResult[],
  collapsedGroupKeys: ReadonlySet<string>,
  summaries: TestCaseScoreSummary[],
  runId: string,
  threshold?: number,
): GroupedAnalyticsResult[] => {
  const findScore = buildTestCaseScoreLookup(summaries);
  return groupRows(rows).flatMap((group) => {
    const first = group[0];
    const groupKey = getExecutionResultGroupKey(first);
    if (!groupKey) return [toResultRow(first, groupKey)];
    const summary = findScore(runId, first.testCaseId, first.testCaseName);
    const isExpanded = !collapsedGroupKeys.has(groupKey);
    const groupRow: GroupedAnalyticsResult = {
      testCaseId: first.testCaseId,
      testCaseName: first.testCaseName,
      runIndex: 0,
      resultRowType: ExecutionResultRowType.Group,
      groupKey,
      isExpanded,
      testCaseScore: summary?.score,
      thresholdStatus: getTestCaseThresholdStatus(summary?.score, threshold),
    };
    const resultRows = isExpanded ? sortExecutionResultGroupRows(group).map((row) => toResultRow(row, groupKey)) : [];
    return [groupRow, ...resultRows];
  });
};

export const projectCompareExecutionResultGroups = (
  rows: CompareAnalyticsRow[],
  collapsedGroupKeys: ReadonlySet<string>,
  summaries: TestCaseScoreSummary[],
  primaryRunId: string,
  comparedRunId: string,
  primaryThreshold?: number,
  comparedThreshold?: number,
): GroupedCompareAnalyticsRow[] => {
  const findScore = buildTestCaseScoreLookup(summaries);
  return groupRows(rows).flatMap((group) => {
    const first = group[0];
    const groupKey = getExecutionResultGroupKey(first);
    if (!groupKey) return [toResultRow(first, groupKey)];
    const primarySummary = findScore(primaryRunId, first.testCaseId, first.testCaseName);
    const comparedResult = first._compared;
    const comparedSummary = findScore(
      comparedRunId,
      comparedResult?.testCaseId,
      comparedResult?.testCaseName ?? first.testCaseName,
    );
    const isExpanded = !collapsedGroupKeys.has(groupKey);
    const groupRow: GroupedCompareAnalyticsRow = {
      testCaseId: first.testCaseId,
      testCaseName: first.testCaseName,
      runIndex: 0,
      resultRowType: ExecutionResultRowType.Group,
      groupKey,
      isExpanded,
      primaryScore: primarySummary?.score,
      primaryThresholdStatus: getTestCaseThresholdStatus(primarySummary?.score, primaryThreshold),
      comparedScore: comparedSummary?.score,
      comparedThresholdStatus: getTestCaseThresholdStatus(comparedSummary?.score, comparedThreshold),
    };
    const resultRows = isExpanded ? sortExecutionResultGroupRows(group).map((row) => toResultRow(row, groupKey)) : [];
    return [groupRow, ...resultRows];
  });
};

export const projectCompareExecutionResultScores = (
  rows: CompareAnalyticsRow[],
  summaries: TestCaseScoreSummary[],
  primaryRunId: string,
  comparedRunId: string,
  primaryThreshold?: number,
  comparedThreshold?: number,
): GroupedCompareAnalyticsRow[] => {
  const findScore = buildTestCaseScoreLookup(summaries);
  return rows.map((row) => {
    const primarySummary = findScore(primaryRunId, row.testCaseId, row.testCaseName);
    const comparedSummary = findScore(
      comparedRunId,
      row._compared?.testCaseId,
      row._compared?.testCaseName ?? row.testCaseName,
    );
    return {
      ...toResultRow(row, getExecutionResultGroupKey(row)),
      primaryScore: primarySummary?.score,
      primaryThresholdStatus: getTestCaseThresholdStatus(primarySummary?.score, primaryThreshold),
      comparedScore: comparedSummary?.score,
      comparedThresholdStatus: getTestCaseThresholdStatus(comparedSummary?.score, comparedThreshold),
    };
  });
};
