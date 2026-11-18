import { ExtractionGridRow, ExtractionRowType, GroupedResultRow } from '@/src/components/Runs/models';
import { AnalyticsResult } from '@/src/models/evaluation/run';

export const getTestCaseGroupKey = (row: Pick<AnalyticsResult, 'testCaseId' | 'testCaseName' | 'id'>): string =>
  row.testCaseId || row.testCaseName || row.id || '';

const compareIndex = (left?: number, right?: number): number => (left ?? 0) - (right ?? 0);

/** Natural order of a test case's requests: run, then request, then turn; ties keep their source order. */
const sortGroupResults = (rows: AnalyticsResult[]): AnalyticsResult[] =>
  rows
    .map((row, sourceIndex) => ({ row, sourceIndex }))
    .sort(
      (left, right) =>
        compareIndex(left.row.runIndex, right.row.runIndex) ||
        compareIndex(left.row.requestIndex, right.row.requestIndex) ||
        compareIndex(left.row.turnIndex, right.row.turnIndex) ||
        left.sourceIndex - right.sourceIndex,
    )
    .map(({ row }) => row);

const collectGroups = (rows: AnalyticsResult[]): Map<string, AnalyticsResult[]> => {
  const groups = new Map<string, AnalyticsResult[]>();
  rows.forEach((row) => {
    const key = getTestCaseGroupKey(row);
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  });
  return groups;
};

/**
 * Flattens scored result rows into `[group row, ...its results]` per test case, groups ordered by test
 * case name. A collapsed group keeps only its group row. The group's score is its first result's: scores
 * are attached per test case, so every result of a group carries the same one.
 */
export const buildTestCaseGroupRows = (
  rows: AnalyticsResult[],
  collapsedGroupKeys: ReadonlySet<string>,
): ExtractionGridRow[] => {
  const groups = [...collectGroups(rows)].sort(
    ([leftKey, left], [rightKey, right]) =>
      (left[0].testCaseName ?? '').localeCompare(right[0].testCaseName ?? '') || leftKey.localeCompare(rightKey),
  );

  return groups.flatMap(([groupKey, group]) => {
    const isExpanded = !collapsedGroupKeys.has(groupKey);
    const groupRow: ExtractionGridRow = {
      rowType: ExtractionRowType.Group,
      groupKey,
      testCaseName: group[0].testCaseName,
      testCaseScore: group[0].testCaseScore,
      isExpanded,
    };
    const resultRows: GroupedResultRow[] = isExpanded
      ? sortGroupResults(group).map((row) => ({ ...row, rowType: ExtractionRowType.Result, groupKey }))
      : [];
    return [groupRow, ...resultRows];
  });
};
