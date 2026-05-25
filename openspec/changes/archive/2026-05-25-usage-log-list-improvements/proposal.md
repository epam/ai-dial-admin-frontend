## Why

The Usage Log list (`apps/ai-dial-admin/src/components/UsageLog/List/List.tsx`) ships with day-chunked pagination from change `usage-log-day-chunked-pagination`, but its current shape has two functional defects and several quality issues:

**Functional defects**

1. **All columns are sortable, but only `completion_time` can be sorted correctly.** Each request scopes to a single 24-hour `_time` window and rows are appended day-by-day. The backend's `orderBy` only orders rows within one window — sorting by anything else produces day-layered output, not a global sort.
2. **Column filters are broken.** The filter model is typed as text-only, so `agNumberColumnFilter` inputs go through a string-coercion path that misses real number-filter shapes. Combined with overlapping reset triggers, typed values in the floating filter can be wiped before the request returns. Separately, `numericColumn.filterValueGetter` returns a thousands-formatted string for filter evaluation, which makes AG-Grid's client filter coerce values above 999 to `NaN` and drop the row.

**Quality issues**

- `List.tsx` holds 9 mutable refs + 1 React state inline — a state machine implemented as a pile of refs in a UI component.
- Stray `console.info` / `console.error` calls instead of the project's notification pattern.
- Two overlapping no-data UIs: a custom `overlayNoRowsTemplate` and the shared `getIsEmptyData → DialNoDataContent` path. The latter unmounts the grid (and its floating-filter inputs) on every empty response.
- Backend errors are swallowed to the console; the user sees no feedback.

## What Changes

### Functional

- **Lock sort to `completion_time`.** A `restrictSort(cols, sortableFields)` helper in `grid-columns.tsx` flips `sortable: false` on every column not in the allow-list. Each `USAGE_LOG_*` array is wrapped: `restrictSort(BASE_USAGE_LOG_*, ['completion_time'])`. `COMPLETION_TIME_COLUMN` (in `base-columns.ts`) carries `sortable: true`, `sort: 'desc'`, and `sortingOrder: ['asc', 'desc']` (so toggling skips the null state). The list also passes `multiSort: false`.
- **Direction-aware day queue.** `buildDayQueue(timeRange, direction)` iterates newest→oldest for `desc` (current behavior) and oldest→newest for `asc`. Each per-window request's `orderBy` matches the direction. Backend already supports both — no BE work.
- **Filter model dispatches on `filterType`.** New `AgGridNumberFilter` shape (`filterType: 'number'`, `type`, `filter`, optional `filterTo`). `UsageLogFilterModel` becomes `Record<string, AgGridTextFilter | AgGridNumberFilter>`. `translateUsageLogFilter` dispatches on `filter.filterType`; the number path emits the value directly without the string-coercion shim. `inRange` is decomposed defensively into `$gte` + `$lte` (not exposed by any column's `filterOptions` today).
- **Remove `numericColumn.filterValueGetter`.** It returned a comma-formatted string, causing AG-Grid's client-side filter to drop rows whose values crossed the thousands-formatting threshold. AG-Grid now filters against the raw cell value.

### Non-functional

- **Data loop extracted to `useUsageLogData` hook.** Owns the refs (day queue, loading, request id, sort direction, filter model, row-id counter, first-after-reset flag, grid api), the row-data state, the bootstrap effect, and the three data-driven ag-grid event handlers (`onBodyScroll`, `onSortChanged`, `onFilterChanged`). Returns `{ rowData, onBodyScroll, onSortChanged, onFilterChanged, setGridApi }`. State stays in refs (not a reducer) — the in-flight invalidation via incrementing `requestIdRef` requires synchronous mutation that a reducer would race against during recursive auto-fetch.
- **`List.tsx` is a view shell (~75 lines).** Wires the hook into `ListEntities`, owns `handleGridReady` (calls `setGridApi`, then forwards the optional `onGridReady` prop), defines the `noRowsOverlayComponent`, and memoizes `additionalGridOptions`.
- **One atomic reset path: `restart({ timeRange, sortDirection, filterModel })`.** All three reset triggers (bootstrap effect, sort change, filter change) call the same helper. Queue, sort, and filter never drift apart.
- **Reset no longer flashes the grid empty.** `firstAfterResetRef` is set on reset; the first fetch in the cycle REPLACES `rowData`, subsequent fetches APPEND. Old rows stay visible (under the loading overlay) until the new ones land.
- **Errors surface via `useNotification` + `getErrorNotification`.** A single `notifyFetchError(response?)` helper handles both the `success: false` response path and the thrown-exception fallback. Previously loaded rows are preserved.
- **Grid stays mounted; in-grid no-rows overlay.** `getIsEmptyData={KEEP_GRID_MOUNTED}` (a module-level `() => false`) keeps `GridView` from ever swapping the grid out for `DialNoDataContent`. Instead, AG-Grid's `noRowsOverlayComponent` renders `DialNoDataContent` inside the grid via stable component + `noRowsOverlayComponentParams: { title }`. Column filter UI persists across data refetches.

## Non-goals

- No backend change. Backend supports `$asc` / `$desc` on `_time` and the existing operator vocabulary.
- No changes to `AgGridWrapper` or `GridView` shared components — the sort lock and no-data swap are solved per-Usage-Log via the helpers above.
- No layout / visibility changes to the five Usage Log grids.
- No new filter operators. Each column keeps its existing `filterOptions` list. `inRange` stays unexposed (handled defensively at translate time).
- No `localStorage` migration — column state storage key is unchanged.

## Capabilities

### Modified Capabilities

- `usage-log-pagination`:
  - Reset requirement refined: sort changes are only direction flips on `completion_time`; reset no longer clears `rowData` synchronously.
  - New requirement: **Sort restricted to `completion_time` with direction-aware day iteration**.
  - New requirement: **Column filter support for text and number columns**.
  - New requirement: **Backend errors surface to the user**.
  - New requirement: **Grid stays mounted with in-grid no-rows overlay**.

## Impact

- **Code:**
  - `apps/ai-dial-admin/src/components/UsageLog/List/List.tsx`: refactored to a ~75-line view shell.
  - `apps/ai-dial-admin/src/components/UsageLog/List/useUsageLogData.ts`: **new** — extracted data-loop hook.
  - `apps/ai-dial-admin/src/components/UsageLog/List/utils.ts`: **new** — pure helpers (`buildDayQueue`, `tagRowsWithIds`, `buildSortModel`, `getNextSortDirection`, `getRowId`) and shared constants (`ROW_ID_KEY`, `DEFAULT_SORT_DIRECTION`, `KEEP_GRID_MOUNTED`, scroll thresholds).
  - `apps/ai-dial-admin/src/constants/grid-columns/base-columns.ts`: `COMPLETION_TIME_COLUMN` gets `sortable: true` + `sortingOrder: ['asc', 'desc']`; `COMPLETION_TIME_COL_ID` constant exported.
  - `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx`: `restrictSort` helper; each `USAGE_LOG_*` array split into `BASE_USAGE_LOG_*` (raw defs) + exported `USAGE_LOG_*` (wrapped).
  - `apps/ai-dial-admin/src/constants/grid-columns/configs.ts`: `numericColumn.filterValueGetter` removed.
  - `apps/ai-dial-admin/src/utils/telemetry.ts`: `translateUsageLogTextFilter` → `translateUsageLogFilter` (dispatches on `filterType`, defensive `inRange` decomposition).
  - `apps/ai-dial-admin/src/models/telemetry.ts`: `AgGridNumberFilter` added; `UsageLogFilterModel` widened to the union; `UsageLogFilterClause` widened to allow nested `$and`.
  - Tests: new `utils.spec.ts`; new translator tests in `telemetry.spec.tsx`; new List tests for default `orderBy` and error notification.
- **No backend change. No changes to shared `AgGridWrapper` / `GridView`.**
- **Backwards compatibility:** wire shape unchanged for cases that work today. Number-filter requests previously sent malformed clauses now send valid ones.
