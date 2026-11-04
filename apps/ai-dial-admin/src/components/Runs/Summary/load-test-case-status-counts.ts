import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { TestCaseStatusCounts } from '@/src/components/Runs/Summary/models';
import {
  buildTestCaseExecutionsQuery,
  buildTestCasesStatusQuery,
  foldTestCaseExecutions,
  parseTestCaseStatusCounts,
} from '@/src/components/Runs/Summary/utils';

interface Params {
  runId: string;
  /** Test cases to leave out of the scores query (the matched-only comparison population). */
  excludeTestCaseIds?: string[];
  /** Executions to leave out of the fallback query (the matched-only comparison population). */
  excludeEvalSummaryIds?: string[];
  /**
   * The run's reported number of test cases. Pass it only for a finished run counted in full: it becomes the
   * fallback total, so a test case that never executed counts as N/A instead of vanishing.
   */
  testCaseCount?: number;
}

export interface LoadedTestCaseStatusCounts {
  counts: TestCaseStatusCounts;
  /** False when the counts were derived from executions because the run has no score rows. */
  hasScoreRows: boolean;
}

/**
 * A run's test-case status counts. They come from the per-test-case scores when the run has any; a suite
 * without metrics has none, so the counts are then derived from the run's executions: a test case is completed
 * only when every execution of it succeeded, and everything else — including test cases that never ran — is
 * Error or N/A. The executions are only queried when the scores come back empty, so runs with metrics pay
 * nothing for the fallback. A failed fallback query yields empty counts, which the cards present as an error.
 */
export const loadTestCaseStatusCounts = async ({
  runId,
  excludeTestCaseIds,
  excludeEvalSummaryIds,
  testCaseCount,
}: Params): Promise<LoadedTestCaseStatusCounts> => {
  const scored = parseTestCaseStatusCounts(
    await executeStructuredQuery(buildTestCasesStatusQuery(runId, excludeTestCaseIds)),
  );
  if (scored.total > 0) {
    return { counts: scored, hasScoreRows: true };
  }

  const executions = await executeStructuredQuery(buildTestCaseExecutionsQuery(runId, excludeEvalSummaryIds));
  if (executions == null) {
    return { counts: scored, hasScoreRows: false };
  }

  const { completed, notCompleted } = foldTestCaseExecutions(executions);
  const total = Math.max(testCaseCount ?? 0, completed + notCompleted);

  return {
    counts: { passed: 0, failed: 0, error: total - completed, unscored: completed, total },
    hasScoreRows: false,
  };
};
