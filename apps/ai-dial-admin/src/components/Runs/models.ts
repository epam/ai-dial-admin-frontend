import { AnalyticsResult } from '@/src/models/evaluation/run';

export interface TestCaseScoreSummary {
  runId: string;
  testCaseId?: string;
  testCaseName?: string;
  score: number | null;
  passed: boolean | null;
}

export type TestCaseScoreLookup = (
  runId: string,
  testCaseId?: string,
  testCaseName?: string,
) => TestCaseScoreSummary | undefined;

export enum OverallScoreThresholdStatus {
  Above = 'above',
  Below = 'below',
  None = 'none',
}

export enum ExtractionRowType {
  Group = 'group',
  Result = 'result',
}

/** A result row of the Extraction result grid while it is grouped by test case. */
export type GroupedResultRow = AnalyticsResult & {
  rowType: ExtractionRowType.Result;
  groupKey: string;
};

/**
 * Deliberately not an `AnalyticsResult`: it carries no run, request or turn index and no id, so every
 * field-based cell of a group row is blank without per-column checks.
 */
export interface TestCaseGroupRow {
  rowType: ExtractionRowType.Group;
  groupKey: string;
  testCaseName?: string;
  testCaseScore?: number | null;
  isExpanded: boolean;
}

export type ExtractionGridRow = TestCaseGroupRow | GroupedResultRow;

/** What the Extraction result grid holds: plain results in the flat list, grid rows while grouped. */
export type ExtractionDisplayRow = AnalyticsResult | ExtractionGridRow;

export const isTestCaseGroupRow = (row: unknown): row is TestCaseGroupRow =>
  (row as Partial<TestCaseGroupRow> | null | undefined)?.rowType === ExtractionRowType.Group;
