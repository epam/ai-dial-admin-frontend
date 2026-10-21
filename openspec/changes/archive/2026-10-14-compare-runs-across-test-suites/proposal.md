## Why

Run comparison only offers completed runs of the same test suite. Applications with different APIs
(different request and JSONata for extracting columns) cannot share a suite, so their runs — made on
the same dataset with the same metrics — cannot be compared in Admin. The workaround is exporting
both runs to CSV and comparing them outside the product. Part of #3090 (use case 2: comparison
between different test suites on the same dataset).

## What Changes

- The compare-run picker (`SelectCompareRunModal`) offers completed runs of the primary run's suite
  **and** of every other test suite bound to the same dataset. Runs on a different dataset are never
  offered.
- The picker gains a leading **Test Suite** column showing each run's suite name (the suite id while
  the name is unavailable).
- The candidate list is built on the client: the primary run's suite is read for its `datasetId`, the
  sibling suites come from the existing `GET /datasets/{id}/test-suites` action, and completed runs
  are fetched per suite through the existing runs listing. No new backend endpoint is added.
- A suite with no dataset, or a failed dataset lookup, falls back to the suite's own runs — the picker
  then behaves exactly as before.
- Compare Summary resolves the test suite **per run** instead of assuming the primary run's. Its
  header shows one Test Suite field when both runs share a suite and one entry per run when they
  differ; each run's deployment link falls back to its own suite, not the primary's.
- Heat Map and Execution Results already load data per run id and need no change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `eval-runs-list`: the compare-run picker's column set gains the Test Suite column, and a new
  requirement defines which runs the picker offers (same suite plus same-dataset suites, completed
  only, no other datasets, same-suite fallback).
- `run-summary-deployment-link`: Compare Summary resolves each run's suite context from that run's
  own suite, and shows the Test Suite per run when the runs belong to different suites.

## Impact

- **Code**: `components/Runs/Compare/` (`utils.ts`, `models.ts`, `useCompareRunLauncher.tsx`,
  `CompareView.tsx`, `SelectCompareRunModal.tsx`, `Summary/Header.tsx`,
  `Summary/use-summary-overview-data.ts`, `Summary/SummaryOverviewTab.tsx`) and
  `constants/grid-columns/grid-columns.tsx` (`COMPARE_RUN_PICKER_COLUMN`).
- **APIs**: reuses `getTestSuite`, `getDatasetTestSuites` and `getRuns`; no backend change required.
- **Risk — "Only matching test cases" toggle**: Compare Summary's matched-scores path calls
  `/analytics/metric-scores/comparison`. Whether that endpoint accepts runs of two suites is a backend
  concern the client cannot verify; on rejection the existing "matched scores load failed" toast
  shows and the view stays usable.
- **Risk — dataset binding**: a run does not store its dataset, so "same dataset" is each suite's
  *current* dataset binding.
- **Risk — response shape**: `getDatasetTestSuites` items are assumed to carry `id` (existing callers
  read only `name` and `description`); items without one are skipped.
- **Limit**: runs are fetched per suite with the existing page size of 100, so a dataset with many
  suites can list more runs overall.

## Non-goals

- A backend change, a new endpoint, or a stored dataset id on runs.
- Comparing runs of different datasets.
- Showing the suite name in the compare run tags, Heat Map or Execution Results headers.
- Paginating or searching the picker beyond the existing 100-run-per-suite fetch.
- Rewriting `runs-analytics-run-compare`, which still describes the replaced "Compare with"
  dropdown; that is a separate cleanup.
