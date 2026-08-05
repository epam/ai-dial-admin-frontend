import { GridRowType } from '@/src/types/grid-row-type';
import { TestCaseRow } from '@/src/types/test-case-row';

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
  isFlattened?: boolean;
}
