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
  scores: MetricScoreValue[];
}

export interface RunComparisonResponse {
  runs: RunComparisonRun[];
}
