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
