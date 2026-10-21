## Why

The Runs table rework (`2026-09-28-rework-runs-list-columns`) added Target, Metrics, Cost, and Overall
score to the shared run columns, but deliberately left the Test Suite view's Runs tab on the legacy
`GET /api/v1/test-suite-runs` endpoint, which doesn't carry those fields. As a result, those four
columns render as a missing-value indication on every suite's Runs tab, even for runs that have real
target, metric, cost, and score data. The `/runs` page already gets this data correctly through the
structured-query API (`getRunsQuery`), filtered by `testSuiteId` would produce the same suite-scoped
result the tab needs.

## What Changes

- Point the Test Suite view's Runs tab (`TestSuites/Runs/Runs.tsx`) at `getRunsQuery` (the
  structured-query-backed action already used by `/runs`) instead of the legacy `getRuns` REST action,
  at both its call sites (the page-0 prefetch and the infinite-scroll datasource), keeping the existing
  `RUN_FILTER(selectedTestSuite.id)` filter prepended to each request.
- Update the `eval-runs-list` spec's Purpose note and add a requirement making explicit that the
  suite-scoped tab reads through the same query-backed source as the unscoped list, so its Target,
  Metrics, Cost, and Overall score columns render real values rather than a permanent missing-value
  indication.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `eval-runs-list`: the Test Suite Runs tab now sources rows from the structured-query API rather than
  the legacy REST endpoint, so its Target, Metrics, Cost, and Overall score columns are populated like
  the unscoped list's.

## Impact

- `apps/ai-dial-admin/src/components/TestSuites/Runs/Runs.tsx` — swap `getRuns` (from
  `@/src/app/[lang]/test-suites/actions`) for `getRunsQuery` (from `@/src/app/[lang]/runs/actions`) at
  both call sites.
- `apps/ai-dial-admin/src/components/TestSuites/Runs/tests/Runs.spec.tsx` — update the mocked action
  and any assertions tied to the legacy fetcher.
- No changes to `apps/ai-dial-admin/src/app/[lang]/test-suites/actions.ts`, `RUN_FILTER`, column
  definitions, or any model/type — `getRunsQuery`'s signature, its `FilterDto`/`SortDto` inputs, and its
  `EvaluationPageData<Run>` return shape already match what `Runs.tsx` consumes today.
- Out of scope: `Runs/Compare/utils.ts::fetchSuiteCompletedRuns` (compare-run picker) and
  `TestSuites/Trends/use-trends-data.ts` remain on the legacy endpoint; they have the same gap but are
  not addressed by this change.
