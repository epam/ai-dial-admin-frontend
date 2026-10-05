export interface MetricScoreValue {
  metricScoreName: string;
  metricName: string;
  value: number;
}

export interface RunComparisonRun {
  runId: string;
  computationId: string;
  totalRowCount: number;
  matchedRowCount: number;
  matchedSuccessRowCount: number;
  avgExecDurationMs?: number | null;
  unmatchedEvalSummaryIds: string[];
  /** test_case_id values with no counterpart in the other compared run (backed by `test_case_eval_scores`). */
  unmatchedEvalTestCaseIds: string[];
  scores: MetricScoreValue[];
}

export interface RunComparisonResponse {
  runs: RunComparisonRun[];
}
