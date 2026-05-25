## 1. Query builder

- [x] 1.1 Update `BuildUsageLogQueryParams` in `apps/ai-dial-admin/src/models/telemetry.ts`: drop `startRow` and `pageSize`; add `offset: number`. Keep `timeRange: TimeRange` — the Usage Log list passes per-day windows here.
- [x] 1.2 Update `buildUsageLogQuery` in `apps/ai-dial-admin/src/utils/telemetry.ts`: do NOT emit `limit`; emit `offset` only when `> 0`. The time filter still comes from `timeRange` via `getFormattedFilters` and now carries the per-day window bounds.
- [x] 1.3 Update existing `buildUsageLogQuery` tests at `apps/ai-dial-admin/src/utils/tests/telemetry.spec.tsx:449-535` to assert: outgoing JSON has no `limit`; `offset` is undefined when `offset = 0` and equals the value when `offset > 0`; `where.$and` still composes time range + entity name + grid filters.

## 2. List datasource

- [x] 2.1 Rewrite `apps/ai-dial-admin/src/components/UsageLog/List/List.tsx` to use the default `clientSide` row model. Remove the `IDatasource`/`useMemo(gridDataSource)` plumbing and the `infiniteGridOptions` spread.
- [x] 2.2 Add a module-level `buildDayQueue(timeRange)` that slices `[startDate, endDate)` into 24-hour half-open windows, newest first.
- [x] 2.3 Add component state and refs: `rowData: useState<Record<string, string>[]>`, `hasLoadedOnce: useState<boolean>`, plus refs `gridApiRef`, `dayQueueRef`, `loadingRef`, `totalLoadedRef`, `rowIdCounterRef`, `sortModelRef`, `filterModelRef`, `requestIdRef`.
- [x] 2.4 Implement `fetchMore`: gate on `loadingRef`/`dayQueueRef.length`; capture `requestId = ++requestIdRef.current`; pop the next window off `dayQueueRef`; call `getData(buildUsageLogQuery({ baseQuery: query, offset: 0, sortModel, filterModel, timeRange: dayWindow, entityName }))`. Discard stale responses by `requestId` mismatch. Tag new rows with `__rowId = String(rowIdCounterRef.current++)` and append to `rowData`. In `finally`, clear `loading`, set `hasLoadedOnce = true`, and if more days remain AND (response was empty OR total loaded < `MIN_ROWS_TO_ENABLE_SCROLL`), recursively call `fetchMore`.
- [x] 2.5 Implement `reset`: increment `requestIdRef` (invalidates in-flight), clear `loadingRef`/`totalLoadedRef`/`rowIdCounterRef = 0`, rebuild `dayQueueRef.current = buildDayQueue(timeRange)`, `setRowData([])`, `setHasLoadedOnce(false)`.
- [x] 2.6 Implement `useEffect` with deps `[query, timeRange, entityName]` that calls `reset()` then either `setHasLoadedOnce(true)` (if queue empty) or `fetchMore()`.
- [x] 2.7 Implement `onBodyScroll`: if not loading and `dayQueueRef.length > 0`, check `event.api.getLastDisplayedRowIndex() >= event.api.getDisplayedRowCount() - SCROLL_END_THRESHOLD_ROWS` and call `fetchMore()`. Use module-level constants `SCROLL_END_THRESHOLD_ROWS = 20` and `MIN_ROWS_TO_ENABLE_SCROLL = 100`.
- [x] 2.8 Implement `onSortChanged` and `onFilterChanged`: read the new model from `event.api`, store in the ref, call `reset()` + `fetchMore()`.
- [x] 2.9 Wire `onBodyScroll`, `onSortChanged`, `onFilterChanged` through `additionalGridOptions`. Keep `multiSort: false` and `overlayNoRowsTemplate`. Drop `infiniteGridOptions`.
- [x] 2.10 Pass `getIsEmptyData={() => hasLoadedOnce && rowData.length === 0}` to `ListEntities` to suppress the empty overlay during the initial fetch. Pass `isLiveData` so `AgGridWrapper` consumes `rowData` declaratively. Pass `getRowId={(p) => p.data.__rowId as string}` so ag-grid uses immutable-data semantics and preserves scroll on append.
- [x] 2.11 Verify no leftover imports/usage of `PAGE_SIZE`, `infiniteGridOptions`, `IDatasource`, or `IGetRowsParams` in `List.tsx`.

## 3. Tests for `List.tsx`

- [x] 3.1 Keep the existing two tests (`renders the list…`, `accepts an onGridReady prop…`).
- [x] 3.2 Add: initial fetch sends no `limit`, no `offset`, and the user time range bounds inside `where.$and` (single-day range).
- [x] 3.3 Add: when the initial response is empty AND the queue has no more days, no second fetch fires.
- [x] 3.4 Add: when `timeRange` changes via prop, a fresh fetch fires with the new bounds.
- [x] 3.5 Add: when the range spans multiple days and every day returns empty, the FE auto-fetches each day in newest-first order until the queue is exhausted.
- [x] 3.6 Add: when the first day returns enough rows to enable scrolling, the FE does NOT auto-fetch subsequent days — it waits for user scroll.

## 4. Verification

- [x] 4.1 Run `npx vitest run src/utils/tests/telemetry.spec.tsx` from `apps/ai-dial-admin/`. → 52 tests passed.
- [x] 4.2 Run `npx vitest run src/components/UsageLog/List/tests/List.spec.tsx` from `apps/ai-dial-admin/`. → 7 tests passed.
- [x] 4.3 Run `npm run lint` from repo root. → 0 errors.
- [x] 4.4 Run `openspec validate usage-log-day-chunked-pagination --strict`.
