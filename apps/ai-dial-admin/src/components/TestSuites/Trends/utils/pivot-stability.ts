import { HeatMapGridRow } from '@/src/components/Common/HeatMap/models';
import { HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE } from '@/src/components/Common/HeatMap/constants';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';

export interface StabilitySummaryRow {
  test_suite_run_id?: string;
  test_case_name?: string;
  score?: number | null;
  passed?: boolean | null;
}

export interface StabilityCellMeta {
  score: number | null | undefined;
  passed: boolean | null | undefined;
}

export interface StabilityMatrix {
  rows: HeatMapGridRow[];
  /** Per row id → col id → score/passed for tooltips. */
  cellMeta: Record<string, Record<string, StabilityCellMeta>>;
  headerLabels: string[];
  /** Value column ids (`tc_<testCaseName>`). */
  testCaseColIds: string[];
}

export const getStabilityTestCaseColId = (testCaseName: string): string =>
  `${HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE}${encodeURIComponent(testCaseName)}`;

const parseScore = (value: unknown): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  return null;
};

/**
 * Pivot eval_summaries into run × test-case cells (Figma: rows = runs, columns = test cases).
 * Missing pairs stay undefined (gap). Duplicate pairs: last row wins.
 */
export const pivotStabilitySummaries = (
  summaries: StabilitySummaryRow[],
  runOrder: TrendsRunPoint[],
): StabilityMatrix => {
  const cellMap = new Map<string, Map<string, StabilityCellMeta>>();
  const testCaseNames = new Set<string>();

  for (const summary of summaries) {
    const testCaseName = summary.test_case_name;
    const runId = summary.test_suite_run_id;
    if (!testCaseName || !runId) {
      continue;
    }

    testCaseNames.add(testCaseName);
    const colId = getStabilityTestCaseColId(testCaseName);
    let byCol = cellMap.get(runId);
    if (!byCol) {
      byCol = new Map();
      cellMap.set(runId, byCol);
    }
    // Last row wins for duplicate (test_case_name, runId) pairs.
    byCol.set(colId, {
      score: parseScore(summary.score),
      passed: summary.passed ?? null,
    });
  }

  const sortedNames = [...testCaseNames].sort((a, b) => a.localeCompare(b));
  const testCaseColIds = sortedNames.map((name) => getStabilityTestCaseColId(name));
  const headerLabels = sortedNames;

  const cellMeta: Record<string, Record<string, StabilityCellMeta>> = {};
  const rows: HeatMapGridRow[] = runOrder.map((run) => {
    const values: Record<string, number | null | undefined> = {};
    const metaForRow: Record<string, StabilityCellMeta> = {};
    const byCol = cellMap.get(run.runId);

    for (const colId of testCaseColIds) {
      const cell = byCol?.get(colId);
      if (!cell) {
        values[colId] = undefined;
        continue;
      }
      values[colId] = cell.score;
      metaForRow[colId] = cell;
    }

    const id = `run_${run.runId}`;
    cellMeta[id] = metaForRow;
    return { id, label: run.runName || run.runId, values };
  });

  return { rows, cellMeta, headerLabels, testCaseColIds };
};
