## Why

On a COMPLETED run whose suite has no metrics, the Run Summary shows an **Error** badge on Test Cases Completed
and Completion Rate even though the run executed fine (run #3086: 4 test cases, all SUCCESS, visible in the
Extraction result tab). The cards read their counts from `test_case_eval_scores`, which only gets a row per
test case once a metric has produced a score, so a no-metrics run returns `{"rows":[]}` and the UI mistakes
"no score rows" for "no results". The `run-summary-kpi-cards` spec encoded that mistake ("a COMPLETED run with no
test-case results shows Error").

## What Changes

- **Total** test cases becomes the run's own `numberOfTestCases` for a run that has finished, so it no longer
  depends on score rows.
- **Fallback source:** when a run has no score rows (no metrics), Completed and Error-or-N/A are derived from
  `eval_summaries` executions, grouped by `(test_case_id, execution_status)` and folded per test case. A test
  case counts as completed only when **every** execution of it succeeded; any other executed test case, and every
  test case with no execution, is Error or N/A.
- Runs **with** score rows keep today's behaviour exactly (threshold above/below breakdown from the scores table).
- **Compare** gets the same fallback per run; in matching-only mode the fallback is limited to the matched
  executions through the same unmatched eval-summary exclusion the runtime totals already use.
- The Error badge now means what it says: a COMPLETED run that reports **zero** test cases (not "no score rows").
- Correct the spec wording that caused the bug.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `run-summary-kpi-cards`: Test Cases Completed no longer shows Error merely because the scores table is
  empty; adds the requirement that test case counts do not depend on metrics (total from the run, fallback from
  executions, fold rule, matching-only scope).

## Impact

- `apps/ai-dial-admin/src/components/Runs/Summary/` — `utils.ts` (execution query builder + fold), a shared
  status-count loader, `use-run-analytics-slice.ts`, `use-run-kpi-cards.ts`
- `apps/ai-dial-admin/src/components/Runs/Compare/Summary/` — `use-summary-overview-data.ts` (matched loader),
  `use-compare-kpi-cards.ts`
- Co-located specs for the above plus single-run and compare `Analytics` specs
- No new backend endpoint: `eval_summaries.execution_status` / `test_case_id` already exist and are queryable
  through the existing structured-query action (verified against the dev backend)

## Non-goals

- No change to the threshold breakdown or to how runs with metrics are counted.
- No change to runtime or cost cards.
- Not introducing a backend distinct-count (none exists); the fold happens in the client.
- The "at least one execution succeeded" rule is deliberately not implemented; flipping it later is a one-line
  change in the fold.
