## Context

`Runs.tsx` (the Test Suite view's Runs tab) currently fetches through `getRuns` in
`@/src/app/[lang]/test-suites/actions.ts`, a thin wrapper over `GET /api/v1/test-suite-runs`. The
unscoped `/runs` page fetches through `getRunsQuery` in `@/src/app/[lang]/runs/actions.ts`, which
builds a `StructuredQuery` (`buildRunsQuery`) and posts it to `POST /queries/execute`. Both accept the
same `(page, size, sorts: SortDto[], filters: FilterDto[])` shape and both return
`EvaluationPageData<Run> | null`, because `Runs.tsx` already builds its filters as `FilterDto[]`
(`RUN_FILTER(selectedTestSuite.id)`) and `RUN_COLUMN_TO_DSL_FIELD` already maps `testSuiteId` to the
query API's `test_suite_id` field (`ValueType.Uuid`). See proposal.md - Why.

## Goals / Non-Goals

**Goals:**

- Make the Runs tab's fetch calls use `getRunsQuery` so Target, Metrics, Cost, and Overall score are
  populated from real data instead of always showing the missing-value indication.
- Preserve every other behavior of the tab as-is: the SSE status stream (`useRunStatusStream`), the
  page-0 prefetch, the infinite-scroll datasource shape, and the row actions (open, export, compare,
  cancel, delete).

**Non-Goals:**

- Migrating `Runs/Compare/utils.ts::fetchSuiteCompletedRuns` or `TestSuites/Trends/use-trends-data.ts`
  off the legacy endpoint (see proposal.md - Impact).
- Converging the tab's `GridView` wrapper onto the shared `ListEntities`/`EvaluationListView`
  component that `/runs` uses, or adopting its column-state persistence (`storageKey`) — that is a
  larger UI-consistency change, not required to fix the data gap.
- Changing `RUN_FILTER`, `RUN_COLUMN_TO_DSL_FIELD`, or any model/type.

## Decisions

**Swap the fetcher, not the grid.** `Runs.tsx` keeps `GridView`, its local `IDatasource`, its page-0
prefetch, and `useRunStatusStream`; only the function each call site invokes changes, from `getRuns` to
`getRunsQuery`. This is the smallest change that closes the data gap, and it matches how the tab
already isolates its data-fetching behind the two call sites — the alternative (rewriting the tab onto
`EvaluationListView`) touches unrelated concerns (`storageKey`, columns panel, SSE wiring) that aren't
part of this gap.

**No default-sort compensation.** The query API defaults to `started_at_ms DESC` when `sorts` is
empty (`buildRunsQuery`); `getRuns`'s underlying REST endpoint's default is not documented in the
client and isn't asserted by `Runs.spec.tsx`. Since `started_at_ms DESC` (newest run first) is the
same default `/runs` already presents, and no test or spec pins the tab to a different default, no
explicit sort is added at the call sites to force a particular order.

**Filter set is unchanged.** `Runs.tsx`'s only filters are `RUN_FILTER(selectedTestSuite.id)` plus
whatever the grid's own column filters produce, and `SUITE_RUNS_COLUMN` is exactly `RUNS_COLUMN` minus
`testSuiteId` — i.e. the same columns `buildRunsFilter` already resolves for `/runs`. No filter the tab
can produce is unmappable, so no change is needed to `buildRunsFilter` or `RUN_COLUMN_TO_DSL_FIELD`.

## Risks / Trade-offs

- **Silent filter drop** → `buildRunsFilter` drops (rather than errors on) a filter column it can't
  map to a DSL field. Since the tab's filterable columns are a subset of `/runs`'s already-mapped set,
  this risk doesn't materialize here, but it's a latent property of `getRunsQuery` worth naming: a
  future column added to `SUITE_RUNS_COLUMN` without a `RUN_COLUMN_TO_DSL_FIELD` entry would silently
  filter incorrectly rather than fail loudly.
- **Behavioral drift if the two endpoints' pagination/sort semantics differ subtly** (e.g. tie-breaking
  on equal timestamps) → covered by keeping the existing `Runs.spec.tsx` assertions on page/size/filter
  arguments passed to the fetcher, updated to target `getRunsQuery`, plus a manual smoke check in the
  browser (not a new automated scenario, since ordering ties aren't spec-observable behavior).
