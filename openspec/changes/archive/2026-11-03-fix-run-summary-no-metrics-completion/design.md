## Context

See `proposal.md` for motivation. Today `useRunAnalyticsSlice` runs `buildTestCasesStatusQuery` over
`test_case_eval_scores` and everything downstream (`toCompletionBreakdown`, `hasNoTestCases`, the rate card)
treats `total === 0` as "no results". Findings from the dev backend that shape the fix (read-only probes through
the app's own query action):

- `test_case_eval_scores` has one row **per test case**, and only exists when a metric scored it. A no-metrics
  run returns `{"rows":[]}`.
- `eval_summaries` has `test_case_id` and `execution_status`, one row **per execution**: about a fifth of the
  runs sampled have more summary rows than test cases (repeat executions), with per-case multiplicity that
  varies and mixed outcomes per case (for example `FAILED:1, SUCCESS:1`).
- `eval_summaries` has no `passed` column; there is no distinct-count function; `group_by [test_case_id,
  execution_status]` works.
- `number_of_test_cases` on the run matched the scores table's total on every run with scores checked, and the
  summary count on single-execution runs.

## Goals / Non-Goals

**Goals:** correct Completed / Error-or-N/A / rate for no-metrics runs, in single run and compare, without
changing any run that already has score rows.

**Non-Goals:** the threshold breakdown for runs without scores; runtime or cost; a backend change.

## Decisions

### 1. Fall back on "no score rows", not on "suite has no metrics"

After the scores query, `statusCounts.total === 0` triggers the fallback. The suite's metric count is only known
to `SummaryTab` and is not available to the slice in compare. The empty-rows condition is the actual cause and
also covers a metrics run whose scores are still being computed (which previously showed Error too).

*Alternative — run both queries in parallel:* rejected; it doubles the load for every run to help the minority
without metrics. The fallback adds one sequential query only when the first comes back empty.

### 2. Executions folded per test case, "every execution succeeded"

`buildTestCaseExecutionsQuery(runId, excludeEvalSummaryIds)` aggregates `eval_summaries` by `(test_case_id,
execution_status)` with a row cap (`TEST_CASE_EXECUTIONS_ROW_LIMIT`, 10 000 like the distribution fetch). A pure
`foldTestCaseExecutions(result)` maps each test case to its statuses and returns `{ completed, notCompleted }`: a
test case is completed iff all its status groups are SUCCESS. This is the conservative reading chosen with the
user; the scores table's own rule for mixed outcomes could not be observed (the only repeat run with scores was
all-SUCCESS).

*Alternative — "at least one execution succeeded":* rejected as the default; it can report a test case as
completed that failed more often than it passed. A one-line change in the fold if wanted.

### 3. Total from the run, completed from executions

For a **finished** run (not PENDING / RUNNING / CANCELLING) the fallback total is `run.numberOfTestCases`, and
`errorOrNa = total − completed`, so a test case with no execution (stopped run, partial execution) is N/A. For an
in-flight run the total is the folded number of test cases seen so far, so unstarted cases are not shown as
errors. In matching-only compare there is no run-level total for the matched subset, so the folded total is used.
Callers pass `testCaseCount` only when it applies; the scores path never uses it (its totals already agree).

### 4. Reuse `TestCaseStatusCounts`, add one flag

The fallback maps onto the existing shape: completed → `unscored` (SUCCESS with no threshold outcome — exactly
what it means), the rest → `error`, `passed`/`failed` 0. `toCompletionBreakdown` is unchanged. `RunAnalyticsSlice`
gains `hasScoreRows` (false when derived from executions). `toRunKpiFigures` sets `hasThreshold` to
`snapshot threshold set && hasScoreRows` and exposes the threshold value only in that case, so the rate title, the
Threshold line and the tooltip rows all follow one flag. A threshold run whose scores have not arrived is rated by
completion until they do.

### 5. One loader, two callers

A shared `loadTestCaseStatusCounts({ runId, excludeTestCaseIds, excludeEvalSummaryIds, testCaseCount })` returns
`{ counts, hasScoreRows }`: scores query first, executions fallback when empty. `useRunAnalyticsSlice` (full run;
now takes the run's `testCaseCount`) and the compare matched loader in `use-summary-overview-data` both call it,
so single run and compare cannot drift. `use-run-kpi-cards` and `use-compare-kpi-cards` pass
`run.numberOfTestCases` when the run is not in flight.

### 6. Spec

The wrong sentence is in the Test Cases Completed requirement. It is corrected and a new requirement states the
metric-independence rules with scenarios for every branch, including the repeat-execution and N/A cases.

## Risks / Trade-offs

- **Row cap** → a run with more than ~3 300 test cases (three statuses each) would have its fold truncated.
  Acceptable for now; the cap is a named constant and the counts degrade by undercounting, not erroring.
- **One extra round trip** for runs without score rows → sequential only on empty, so runs with metrics pay
  nothing.
- **Mixed-outcome rule is a product call** → documented here and in the spec; trivially flippable.
- **Scores-path total can be below `numberOfTestCases` for a stopped run** (unstarted cases are not rows) → left
  as is; changing it would alter runs that work today.
- **A threshold with no score rows is rated by completion** → intended, and visible in the card title.
