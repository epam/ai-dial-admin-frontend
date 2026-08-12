import { TestCase } from '@/src/models/evaluation/test-suite';
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

// Grids consuming the shared validity column without the grouping projection (CSV import preview)
// pass rows carrying neither field.
export interface ValidityStatusRow extends TestCase {
  rowType?: GridRowType;
  isFlattened?: boolean;
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
