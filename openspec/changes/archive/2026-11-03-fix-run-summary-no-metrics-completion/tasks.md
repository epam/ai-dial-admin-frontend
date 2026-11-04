## 1. Execution-based counts

- [x] 1.1 In `Runs/Summary/utils.ts` add `buildTestCaseExecutionsQuery(runId, excludeEvalSummaryIds)` (aggregate
      `eval_summaries` by `test_case_id` + `execution_status`, row cap `TEST_CASE_EXECUTIONS_ROW_LIMIT` in
      `Summary/constants.ts`) and `foldTestCaseExecutions(result)` returning `{ completed, notCompleted }` where a
      test case is completed only if every execution group is SUCCESS. Verify with the new cases in
      `Summary/tests/utils.spec.ts` (query shape and exclusion filter; all-SUCCESS, mixed, all-failed, empty, null).
- [x] 1.2 Add `hasScoreRows` to `RunAnalyticsSlice` and make `toRunKpiFigures` set `hasThreshold` to
      `snapshot threshold set && hasScoreRows`, exposing `threshold` only in that case (single flag drives the rate
      title, Threshold line and tooltip rows). Verify with `Summary/tests/utils.spec.ts` (threshold with and without
      score rows).
- [x] 1.3 Create `Runs/Summary/load-test-case-status-counts.ts` exporting
      `loadTestCaseStatusCounts({ runId, excludeTestCaseIds, excludeEvalSummaryIds, testCaseCount })`: scores query
      first; when it returns no rows, run the executions query, fold, and map onto `TestCaseStatusCounts`
      (completed → `unscored`, rest → `error`, total = `testCaseCount` when given and not smaller, else the folded
      count); return `{ counts, hasScoreRows }`. Verify with `Summary/tests/load-test-case-status-counts.spec.ts`
      (scores present → no second query; empty → fallback; total override; N/A for unexecuted cases; exclusion ids).

## 2. Wiring

- [x] 2.1 Make `use-run-analytics-slice.ts` call the loader and accept the run's `testCaseCount`; pass
      `run.numberOfTestCases` from `use-run-kpi-cards.ts` and `use-compare-kpi-cards.ts` only when the run is not in
      flight (`isTransitionalRunStatus`). Verify with `Summary/tests/use-run-kpi-cards.spec.ts` and
      `Compare/Summary/tests/use-compare-kpi-cards.spec.ts` (finished vs in-flight total).
- [x] 2.2 Make the matched loader in `Compare/Summary/use-summary-overview-data.ts` call the same loader with the
      unmatched test-case ids and unmatched eval-summary ids and no `testCaseCount`. Verify with
      `Compare/Summary/tests/use-summary-overview-data.spec.ts` (matched-only fallback is limited to matched
      executions).

## 3. Tests

- [x] 3.1 Add single-run `Analytics` specs for a no-metrics run: `4 /4` with no error line and Completion Rate
      `100%`; repeat executions counted once; a mixed-outcome case shown as Error; an unexecuted case shown as N/A;
      a threshold without score rows rated by completion; zero test cases on a COMPLETED run still showing Error.
      Verify with `npx vitest run src/components/Runs/Summary/tests/Analytics.spec.tsx`.
- [x] 3.2 Add the compare equivalents (one run with metrics, one without; matching-only on) to
      `Compare/Summary/tests/Analytics.spec.tsx`. Verify with the same single-file run.

## 4. Verification

- [x] 4.1 Run the `spec-browser-verify` skill for this change's browser-observable scenarios against the local app
      (stack running, auth disabled), using a COMPLETED no-metrics run such as the one that reproduced the bug, and
      resolve any `fail` verdict. Verify by a report with no `fail` verdicts.

## 5. Quality gates

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`;
      fix regressions. Verify all exit 0.
