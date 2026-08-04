export enum GridRowType {
  GROUP = 'GROUP',
  TURN = 'TURN',
  SINGLE = 'SINGLE',
}

export type TestCaseRow = Record<string, unknown>;

export interface CollapsibleTestCase {
  data?: Record<string, unknown>;
  multiTurnData?: Record<string, unknown>[];
}

export interface TestCaseGroup {
  key: string;
  isMulti: boolean;
  testCaseName?: string;
  turns: TestCaseRow[];
}

export interface GroupedGridRow extends TestCaseRow {
  id: string;
  rowType: GridRowType;
  groupKey: string;
  turnCount?: number;
  expanded?: boolean;
  turns?: TestCaseRow[];
  turnNumber?: number;
}
