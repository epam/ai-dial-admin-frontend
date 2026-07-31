/**
 * UI-side grouping of flat test-case grid rows into collapsible multi-turn cases.
 * Storage stays an array of test cases; a turn row is identified by sharing its case
 * `id` plus a client-only, never-persisted `_turnIndex`.
 */

export enum GridRowType {
  GROUP = 'GROUP', // collapsed multi-turn summary row (carries its turns for stacked rendering)
  TURN = 'TURN', // one editable turn of a multi-turn case (only when its group is expanded)
  SINGLE = 'SINGLE', // a single-turn case rendered as one editable row
}

export type TestCaseRow = Record<string, unknown>;

export interface TestCaseGroup {
  key: string; // shared case id (multi) or the row id (single)
  isMulti: boolean;
  testCaseName?: string;
  turns: TestCaseRow[]; // ordered by _turnIndex
}

export interface GroupedGridRow extends TestCaseRow {
  id: string;
  rowType: GridRowType;
  groupKey: string;
  turnCount?: number; // GROUP only
  expanded?: boolean; // GROUP only
  turns?: TestCaseRow[]; // GROUP only
  turnNumber?: number; // TURN only, 1-based for display
}
