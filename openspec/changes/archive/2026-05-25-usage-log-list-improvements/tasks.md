## 1. Filter model

- [x] 1.1 In `apps/ai-dial-admin/src/models/telemetry.ts`, add `AgGridNumberFilter` (`filterType: 'number'`, optional `type`, optional `filter: number`, optional `filterTo: number`); broaden `UsageLogFilterModel` to `Record<string, AgGridTextFilter | AgGridNumberFilter>`; widen `UsageLogFilterClause` to allow nested `$and`.
- [x] 1.2 In `apps/ai-dial-admin/src/utils/telemetry.ts`, rename `translateUsageLogTextFilter` to `translateUsageLogFilter`; dispatch on `filter.filterType`. Number path uses `filter.filter` directly. `inRange` decomposes defensively to `{ $and: [{ $gte }, { $lte }] }`.
- [x] 1.3 Update `translateUsageLogFilterModel` call site.
- [x] 1.4 Translator tests in `apps/ai-dial-admin/src/utils/tests/telemetry.spec.tsx`: text filter (rename), `agNumberColumnFilter greaterThan: 5` → `$gt`, defensive `inRange` decomposition.

## 2. Sort lock on `completion_time`

- [x] 2.1 In `apps/ai-dial-admin/src/constants/grid-columns/base-columns.ts`, `COMPLETION_TIME_COLUMN` gets `sortable: true`, `sort: 'desc'`, `sortingOrder: ['asc', 'desc']`. Export `COMPLETION_TIME_COL_ID = 'completion_time'`.
- [x] 2.2 In `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx`, add `restrictSort(cols, sortableFields)` helper. Split each `USAGE_LOG_*` array into `BASE_USAGE_LOG_*` (raw defs) and `export const USAGE_LOG_* = restrictSort(BASE_USAGE_LOG_*, ['completion_time'])`.
- [x] 2.3 In `List.tsx`, pass `multiSort: false` in `additionalGridOptions`.

## 3. Pure utilities (new file)

- [x] 3.1 Create `apps/ai-dial-admin/src/components/UsageLog/List/utils.ts` with:
  - Constants: `DAY_MS`, `SCROLL_END_THRESHOLD_ROWS`, `MIN_ROWS_TO_ENABLE_SCROLL`, `ROW_ID_KEY`, `DEFAULT_SORT_DIRECTION`, `KEEP_GRID_MOUNTED`.
  - Types: `SortDirection`, `ResetInput`, `TaggedRow`.
  - Pure helpers: `buildDayQueue(timeRange, direction)`, `tagRowsWithIds(rows, startCounter)`, `getNextSortDirection(columnState)`, `buildSortModel(direction)`, `getRowId(params)`.
- [x] 3.2 Unit tests `apps/ai-dial-admin/src/components/UsageLog/List/tests/utils.spec.ts`: desc/asc/inverse-equivalence/empty-range/inverted-range/sub-day/non-day-aligned for `buildDayQueue`; counter tagging for `tagRowsWithIds`.

## 4. `useUsageLogData` hook (new file)

- [x] 4.1 Create `apps/ai-dial-admin/src/components/UsageLog/List/useUsageLogData.ts`. Owns refs (day queue, loading, request id, sort direction, filter model, row-id counter, first-after-reset, grid api) and `rowData` state.
- [x] 4.2 `setLoading(boolean)` updates ref and pushes to the grid (if api is set) in lockstep.
- [x] 4.3 `notifyFetchError(response?)` helper covers both `success: false` and thrown-exception paths.
- [x] 4.4 `fetchMore` builds per-window query via `buildSortModel(sortDirectionRef.current)`, replaces or appends rows based on `firstAfterResetRef`, re-queues the window on error so it isn't lost.
- [x] 4.5 `restart({ timeRange, sortDirection, filterModel })` atomically updates queue/sort/filter, resets counters, increments `requestId`, sets `firstAfterResetRef`, fires `fetchMore`. Empty queue → `setRowData([])` and bail.
- [x] 4.6 Bootstrap `useEffect([query, timeRange, entityName])` calls `restart`.
- [x] 4.7 `onSortChanged` derives direction via `getNextSortDirection`; short-circuits if unchanged; calls `restart`.
- [x] 4.8 `onFilterChanged` short-circuits if `isEqual(nextFilter ?? {}, filterModelRef.current ?? {})`; calls `restart`. (Treat `null` and `{}` as equivalent — AG-Grid emits `filterChanged` on mount with `{}`.)
- [x] 4.9 `setGridApi(api)` is exposed for the component to call from its `onGridReady` handler; pushes current `loadingRef.current` to the grid so the loading overlay shows even if the api arrives after the first fetch started.
- [x] 4.10 Return `{ rowData, onBodyScroll, onSortChanged, onFilterChanged, setGridApi }`.

## 5. `List.tsx` view shell

- [x] 5.1 Reduce `List.tsx` to a view shell (~75 lines): import + call `useUsageLogData`; define module-level `NoRowsOverlay`; own `handleGridReady` that calls `setGridApi(event.api)` then forwards the optional `onGridReady` prop.
- [x] 5.2 Memoize `additionalGridOptions`: `multiSort: false`, `noRowsOverlayComponent: NoRowsOverlay`, `noRowsOverlayComponentParams: { title: emptyDataTitle }`, plus the three hook handlers.
- [x] 5.3 Pass `getIsEmptyData={KEEP_GRID_MOUNTED}`, `getRowId={getRowId}` to `ListEntities`. Drop the bespoke `overlayNoRowsTemplate` and any `console.*`.

## 6. Numeric column filter fix

- [x] 6.1 In `apps/ai-dial-admin/src/constants/grid-columns/configs.ts`, remove `numericColumn.filterValueGetter`. AG-Grid filters now evaluate against the raw cell value; display formatting stays via `valueFormatter`.

## 7. Tests

- [x] 7.1 `List.spec.tsx`: existing tests preserved as a regression net; add tests for default `orderBy: [{ $desc: '_time' }]` on first fetch and for `showNotification` being called when `getData` resolves with `success: false` (rowData preserved).
- [x] 7.2 `utils.spec.ts`: nine tests covering `buildDayQueue` directions/edges and `tagRowsWithIds` counter.
- [x] 7.3 `telemetry.spec.tsx`: translator tests for the new number-filter dispatch and defensive `inRange`.

## 8. Verification

- [x] 8.1 `npx vitest run src/components/UsageLog/List/tests/ src/utils/tests/telemetry.spec.tsx` from `apps/ai-dial-admin/` — passes.
- [x] 8.2 `npm run lint` — 0 errors.
- [x] 8.3 Full vitest suite. → 5030 passed, 9 skipped, 1 skipped file.
- [x] 8.4 `openspec validate usage-log-list-improvements --strict`. → valid.
