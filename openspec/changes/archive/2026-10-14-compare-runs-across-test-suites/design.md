## Context

The compare picker is fed by `fetchSuiteCompletedRuns(testSuiteId)` — one `getRuns` call filtered by
suite and `COMPLETED` status — from two places: `useCompareRunLauncher` (opening a comparison from a
run) and `CompareView` (changing a run inside the comparison). Everything downstream of the picker
already keys on run ids: Heat Map and Execution Results load each run's results through
`getTestCaseRunResults` with a run-id filter, and the Summary's default path runs one structured query
per run. Only the picker's candidate list and the Summary's single-suite assumption tie comparison to
one suite.

A `Run` carries `testSuiteId` but no dataset. The dataset lives on the suite (`TestSuite.datasetId`).
See `proposal.md` for motivation and the no-backend-change constraint.

## Goals / Non-Goals

**Goals:**
- Derive "same dataset" from data the client can already read.
- Keep the same-suite behaviour as the degraded path, so a missing dataset or a failed lookup never
  makes the picker worse than today.
- Remove the Summary's one-suite assumption.

**Non-Goals:**
- Reconciling metrics between suites (the picker does not check that two suites measure the same
  things; the views already handle metrics present in only one run).
- Caching the suite lookup across the launcher and the comparison view.

## Decisions

**Resolve siblings through the suite, then `GET /datasets/{id}/test-suites`.**
`fetchCompareCandidateRuns` reads the opened run's suite for `datasetId`, then lists suites on that
dataset with the existing `getDatasetTestSuites` action. The opened run's own suite is always first in
the list, so its runs stay at the top and a stale dataset listing can never drop it.
- *Alternative — a `dataset_id` filter on the `test_suites` query:* `dataset_id` is selectable but not
  confirmed filterable, and the column map has no entry for it. Rejected: it rests on an unverified
  query-DSL capability.
- *Alternative — page through all suites and filter on `datasetId` client-side:* relies only on proven
  shapes but costs a large fetch on every picker open. Rejected as disproportionate.
- *Alternative — a `dataset_id` filter on `test_suite_runs`, or a backend join:* needs a backend change,
  which this change excludes.

**One `getRuns` call per suite, in parallel, not one `IN` query.**
The REST runs listing is only known to support `EQUALS` on `testSuiteId`; a multi-value filter would be
a new assumption. A dataset normally has a handful of suites, so the fan-out is small. Each result is
tagged with its suite's name at this point, so the grid needs no second lookup.

**A picker-specific run type, `CompareCandidateRun extends Run { testSuiteName? }`.**
The suite name is a property of how the run was listed, not of the run, so it stays out of `Run`. The
picker's Test Suite column reads it and falls back to `testSuiteId`.

**Fail soft.** `getTestSuite` and `getDatasetTestSuites` sit in one `try`/`catch`; any failure returns
the opened suite alone. The unhandled-promise behaviour of the call sites is unchanged.

**Summary resolves a suite per run.** `useSummaryOverviewData` returns `primaryTestSuite` and
`comparedTestSuite`, each loaded from its own run's `testSuiteId`, replacing the single suite taken from
`primaryRun ?? comparedRun`. `Header` uses each as the fallback suite context for that run's deployment
link. It renders the existing single `DialLabelledText` when the suite ids match, and a `DualRunField`
with a link per entry when they differ — the same component the Application, Start and End fields use.
Two identical `getTestSuite` calls are issued when both runs share a suite; deduplicating them was not
worth the added state.

## Risks / Trade-offs

- [`/analytics/metric-scores/comparison` may reject two suites] → Only the "Only matching test cases"
  path calls it; a `null` response already shows the matched-scores failure toast and an empty
  comparison. Verify against a backend before release; a rejection is a backend ticket, not a client fix.
- [Dataset binding is read at comparison time] → A suite re-pointed to another dataset after a run groups
  by its new dataset. Accepted: runs record no dataset, and a backend change is out of scope.
- [`getDatasetTestSuites` items may lack `id`] → Existing callers read only `name`/`description`. Items
  without an `id` are dropped, which degrades toward the same-suite list.
- [100 runs per suite] → The existing page size; a dataset with many suites can list more runs overall.
  Search and paging in the picker are a non-goal.
- [Run name collisions across suites] → Two suites can each have a "Run #1"; the compare tags show the
  run name only. The Summary header disambiguates by suite; tags are left unchanged.
