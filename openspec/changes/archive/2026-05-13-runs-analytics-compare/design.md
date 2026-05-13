## Context

The Analytics tab in `/runs/[id]` currently loads `AnalyticsResult[]` for a single run via `getTestCaseRunResults` and renders them in an AG Grid with two-level column headers (group → column). The column tree is built by `getAnalyticsColumns` in `components/Runs/View/utils.ts`.

Runs belong to a test suite via `run.testSuiteId`. Sibling runs can be fetched via the existing `getRuns` server action with a `testSuiteId` filter. Analytics results for a second run use the same `getTestCaseRunResults` action with a different `runId` filter.

AG Grid supports arbitrary column group nesting — adding a third tier (Current / Compared) within each dynamic group is a pure column-definition change.

## Goals / Non-Goals

**Goals:**
- Dropdown above the analytics grid to select a completed sibling run for comparison
- Merge current and compared `AnalyticsResult[]` into unified row data joined by `testCaseId`
- Three-level column headers for EXECUTION and all dynamic groups (metrics, EXTRACTED) when compare mode is active
- Show `—` in Compared cells when a test case has no match in the compared run
- Revert to normal two-level layout when comparison is cleared

**Non-Goals:**
- Diff highlighting between current and compared cell values
- Comparing more than two runs at once
- Comparison in the Extraction Result tab

## Decisions

### 1. Row data structure: embedded `_compared` field

**Decision:** Extend each `AnalyticsResult` row with an optional `_compared?: AnalyticsResult | null` field (`CompareAnalyticsRow` type in `models.ts`). Compared columns read from `params.data?._compared?.fieldName`.

**Alternatives considered:**
- _Separate row arrays with index-based pairing_: Fragile — row order may differ between runs.
- _Two parallel AG Grid instances_: Complex layout, no shared scrolling without custom sync.

**Why `_compared`:** Row data stays a flat array, AG Grid's row model is unchanged, valueGetters simply branch on whether they read from `data` or `data._compared`. Joining at merge time (by `testCaseId`, fallback `testCaseName`) is a simple one-pass O(n) operation.

### 2. Column builder: separate compare-mode function

**Decision:** Add `getAnalyticsColumnsCompare(results: CompareAnalyticsRow[], errorText?: string)` alongside the existing `getAnalyticsColumns`. The `[blank]` group is unchanged. EXECUTION and each dynamic group are each wrapped in `{ headerName: groupKey, children: [{ headerName: 'Current', children: [...] }, { headerName: 'Compared', children: [...] }] }`.

**Why not a flag on the existing function:** The compared column variant requires different `valueGetter`, `cellStyle`, `colId`, and `comparator` signatures for every child column. Branching inside one function would make it hard to follow. Two focused functions are clearer.

**Compared colId convention:** Prefix every compared column's `colId` with `cmp_` (e.g., `cmp_http`, `cmp_duration`) to avoid AG Grid key collisions.

### 3. Sibling runs fetch: mount-time, filtered

**Decision:** Fetch sibling runs once on Analytics tab mount using `getRuns(0, 100, [], [testSuiteIdFilter, statusFilter(COMPLETED)])`, excluding the current `run.id`. 100 is a safe upper bound — test suites are not expected to accumulate thousands of runs.

**Why not lazy/on-dropdown-open:** The list is small and the fetch is cheap. Pre-loading avoids a visible delay when the user first opens the dropdown.

### 4. Compared results fetch: triggered by dropdown selection

**Decision:** When `comparedRunId` changes to a non-null value, fetch `getTestCaseRunResults(RESULT_FILTERS(comparedRun))` where `comparedRun` is the selected sibling. Reset `comparedResults` to `null` when dropdown is cleared.

**No caching:** Compared results are not cached between selections. The dataset is loaded fresh each time a different run is chosen. Given typical result sizes (~hundreds of rows), this is acceptable.

### 5. AG Grid header height in compare mode

**Decision:** Pass `groupHeaderHeight: 28` in `additionalGridOptions` only when compare mode is active. The default `groupHeaderHeight` handles the normal two-level case fine; the third tier would be clipped without this override.

## Risks / Trade-offs

- **`testCaseId` may be absent on some results** → fallback to `testCaseName` for joining. If both are absent the row gets `_compared: null`. This is an edge case; the API should always populate `testCaseId`.
- **Schema drift between runs** — if one run has metrics the other doesn't, compared columns for the missing group render `—` for all rows. The merged schema is the union of both results' metric keys (same `mergeMetricValuesSchema` logic).
- **100-run cap** — if a test suite genuinely has >100 completed runs the oldest ones won't appear in the dropdown. This is acceptable for now; can be raised or paginated later.
- **Column state persistence** — `GridView` persists column visibility to `localStorage` via `storageKey`. Compare-mode columns have distinct `colId` values so they won't bleed into normal-mode column state.
