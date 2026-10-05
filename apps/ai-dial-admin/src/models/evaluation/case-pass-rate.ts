/**
 * Case-level outcome counts for one test suite run, from
 * `GET /api/v1/analytics/eval-summaries/test-case-pass-rate/{testSuiteId}` (`RunPassRateDto`).
 *
 * Counts are per evaluated row (test case x run index x request index x turn index), not per test
 * case, and come from the run's latest metric computation. The backend documents the four buckets
 * as partitioning `totalCount`; the panel does not depend on that and renders any shortfall as
 * unfilled track.
 *
 * The wire also carries `computationId`, `status` and `runCreatedAtMs`. They are left out because
 * nothing reads them: the panel joins the suite's runs list for run metadata, since that is the
 * only source that can name a run (design.md D8).
 *
 * Do not confuse these names with the service's internal `RunPassRateStats` projection
 * (`runId`, `failed`, `successPassed`, ...) — only the DTO names below reach the wire.
 */
export interface CasePassRateRun {
  testSuiteRunId: string;
  /** Rows whose execution status is not SUCCESS (FAILED, TIMEOUT, ERROR) — the "error" group. */
  failedCount: number;
  /** SUCCESS rows whose overall score cleared the threshold — the "pass" group. */
  successPassedCount: number;
  /** SUCCESS rows whose overall score did not clear the threshold — the "fail" group. */
  successNotPassedCount: number;
  /** SUCCESS rows with no threshold evaluation result — the "not scored" group. */
  successNoVerdictCount: number;
  totalCount: number;
}

export interface CasePassRateResponse {
  testSuiteId: string;
  /** Newest run first. May be shorter than the requested `lastN`, or empty. */
  runs: CasePassRateRun[];
}
