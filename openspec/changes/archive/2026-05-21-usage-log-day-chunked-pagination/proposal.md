## Why

The Usage Log infinite grid caps every telemetry request at `limit: 100`, even though the backend's SQL builder (`SqlQueryBuilder.buildLimitClause` in `ai-dial-admin-backend`) returns the full result of the `WHERE` clause when no `limit` is supplied. The FE-imposed cap forces one HTTP round-trip per 100 rows and ties the request shape to a constant (`PAGE_SIZE`) shared by unrelated grids. Issue #3153 asks for the cap to be removed so each request can return whatever the backend chooses to return, and scrolling to the end can pull more.

## What Changes

- **`buildUsageLogQuery` stops emitting `limit`.** It still emits `offset` when greater than zero (forward-compat field on the type; the Usage Log path always passes `0`).
- **The Usage Log list switches from ag-grid's `rowModelType: 'infinite'` to the default `clientSide` row model.** `rowData` is React state that grows by append.
- **FE day-chunking.** The user-selected time range is sliced into 24-hour windows (newest first). Each fetch sends a query whose `where.$and` carries one 1-day `_time` window. There is no `limit`.
- **Auto-fetch next day on empty or insufficient response.** When a day's response is empty, or when the total number of loaded rows is below `MIN_ROWS_TO_ENABLE_SCROLL` (so the user has no scroll bar to trigger the next fetch), the next day in the queue is requested automatically. This continues until either the grid has enough content to scroll or the queue is exhausted.
- **`onBodyScroll` is the scroll-end trigger.** When the last displayed row gets within `SCROLL_END_THRESHOLD_ROWS` of the loaded total AND days remain in the queue, the next day's request fires.
- **End-of-data** is signalled when the day queue is empty.
- **Reset events**: `timeRange`, `entityName`, and `query` changes (tab switch) clear `rowData`, rebuild the day queue, and trigger an initial fetch. Column sort and column filter changes do the same.
- **In-flight requests are invalidated on reset** using a monotonically incrementing `requestId` ref — late responses to a stale query are dropped.
- **Stable row IDs preserve scroll on append.** Each appended row is tagged with a synthetic `__rowId` (monotonic counter, reset on reset). `getRowId` is passed through `ListEntities → AgGridWrapper`. With immutable-data semantics, ag-grid diffs the new rowData against the old by ID and inserts only the additions — scroll position is preserved when more data arrives.
- **Scope is Usage Log only.** The shared `PAGE_SIZE` constant and `infiniteGridOptions` in `constants/ag-grid.ts` are not modified. ActivityAudit, TestSuites Runs/Run Modal, and Evaluation List continue to use their existing offset/limit pagination.
- `TelemetryQuery.query.limit` remains an optional field on the type so other callers (charts via `createMcpUsageQuery`, etc.) are unaffected.

## Non-goals

- No BE change. The BE already returns all rows in the `WHERE` window when no `limit` is sent.
- No change to other paginated grids that share `PAGE_SIZE`.
- No alignment of day windows to local-calendar-day boundaries. Windows are rolling 24-hour spans anchored to the user-selected `endDate`.
- No change to the `/usage-log` page layout, columns, or tabs.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `usage-log-pagination`: the previous "Server-side paginated fetch of Usage Log rows" requirement (fixed 100-row pages via `limit`/`offset`) is replaced by "Day-chunked append-on-scroll fetch" (no `limit`, each request carries a 1-day `_time` window, auto-fetch next day on empty or insufficient response, end-of-data when day queue empty). The "Cache reset on tab / time / refresh actions" requirement is rewritten to talk about queue rebuild and `rowData` reset. The "Telemetry query model supports pagination fields" requirement is updated to reflect that the Usage Log builder no longer emits `limit`.

## Impact

- **Code touched**:
  - `apps/ai-dial-admin/src/components/UsageLog/List/List.tsx`: rewritten to `clientSide` row model with `useState<Row[]>` for `rowData`, refs for `dayQueue`/`loading`/`totalLoaded`/`rowIdCounter`/`sortModel`/`filterModel`/`requestId`. `onBodyScroll`, `onSortChanged`, `onFilterChanged` wired through `additionalGridOptions`. `getRowId` passed for stable per-row IDs.
  - `apps/ai-dial-admin/src/utils/telemetry.ts`: `buildUsageLogQuery` drops `limit`, conditionally emits `offset`.
  - `apps/ai-dial-admin/src/models/telemetry.ts`: `BuildUsageLogQueryParams` drops `startRow`/`pageSize`, adds `offset`.
  - Tests updated: `apps/ai-dial-admin/src/utils/tests/telemetry.spec.tsx` and `apps/ai-dial-admin/src/components/UsageLog/List/tests/List.spec.tsx`.
- **No constants changed**: `PAGE_SIZE = 100`, `CACHE_LIMIT = 1000`, `infiniteGridOptions` all stay as-is.
- **No BE change.**
- **Backwards compatibility**: existing telemetry callers (charts, etc.) are untouched — `TelemetryQuery.query.limit` remains optional on the type.
- **Risk**: a single day-window response could be large if the tenant has many rows in 24 hours. The user-selected time range is the only outer bound; the day window is the inner bound. Documented in `design.md` as the open trade-off.
