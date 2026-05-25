## MODIFIED Requirements

### Requirement: Day-chunked append-on-scroll fetch of Usage Log rows

The Usage Log list (Traces, Conversations, MCP, Routes, and Toolset Traces tabs on both the `/usage-log` page and entity-embedded UsageLog views) SHALL use ag-grid's `clientSide` row model with React-owned `rowData`. The grid SHALL NOT send `limit` on telemetry requests for the Usage Log path.

The user-selected time range SHALL be sliced on the FE into a queue of 24-hour half-open windows `[start, end)`, ordered to match the current `completion_time` sort direction: newest-first for `desc` (default), oldest-first for `asc`. Each scroll-triggered or auto-triggered fetch SHALL pop the next window off the queue and send a request whose `where.$and` carries that window's `_time` bounds and whose `orderBy` matches the current sort direction. Windows SHALL be contiguous so every row in the user-selected range falls into exactly one window.

The FIRST fetch after a reset event SHALL atomically REPLACE `rowData` with the tagged response rows (which may be `[]`); subsequent fetches in the same cycle SHALL APPEND. This keeps previously rendered rows visible (under the loading overlay) until the new data lands, so a filter / sort / range change does not flash the grid empty. Each row is tagged with a stable synthetic `__rowId` from a monotonic counter that resets on every reset event.

End-of-data SHALL be signalled when the day queue is empty. Once signalled, no further requests fire until a reset event.

When a fetch resolves and the day queue is non-empty, the next window SHALL be auto-fetched if EITHER the just-resolved response had zero rows OR the running total of loaded rows is below the scroll-enabling threshold.

In-flight requests SHALL be invalidated on reset via a monotonically incrementing `requestId`. A late response that does not match the current `requestId` SHALL be discarded without touching `rowData`, the day queue, or any counters.

The Usage Log list SHALL pass `getRowId` to the grid wrapper so ag-grid uses immutable-data semantics — appending rows SHALL NOT reset scroll position.

#### Scenario: Initial fetch on view load (desc default)

- **WHEN** the user opens the Usage Log
- **THEN** the FE builds a day queue from the selected time range in newest-first order
- **AND** the grid issues one request whose body contains no `limit` key
- **AND** the request body contains no `offset` key
- **AND** `where.$and` contains `_time >= window.start` and `_time < window.end` for the first (newest) 24h window
- **AND** the request body's `orderBy` is `[{ $desc: '_time' }]`
- **AND** the response rows are tagged with synthetic `__rowId`s and appended to `rowData`

#### Scenario: Scroll-end triggers a follow-up request

- **WHEN** the user scrolls such that the last displayed row index is within the scroll-end threshold of `rowData.length` AND the day queue is non-empty AND a request is not already in flight
- **THEN** the grid issues a new request whose `where.$and` carries the next window in the current direction (older for `desc`, newer for `asc`)
- **AND** the request body still contains no `limit` key

#### Scenario: Empty day auto-fetches the next day

- **WHEN** a fetch returns zero rows AND the day queue is non-empty
- **THEN** the next 24h window in the current direction is requested immediately, without waiting for scroll

#### Scenario: Insufficient-rows-to-scroll auto-fetches the next day

- **WHEN** a fetch returns some rows but the running total is below the scroll-enabling threshold AND the day queue is non-empty
- **THEN** the next 24h window in the current direction is requested immediately, without waiting for scroll

#### Scenario: End-of-data when queue exhausted

- **WHEN** the day queue is empty
- **THEN** no further scroll-triggered or auto-triggered requests fire

#### Scenario: A second fetch does not fire while one is in flight

- **WHEN** the user scrolls past the threshold while a previous fetch is still pending
- **THEN** the duplicate trigger is ignored
- **AND** exactly one fetch is in flight at any time

#### Scenario: Stale response after reset is discarded

- **WHEN** a fetch is in flight AND any reset event fires AND the in-flight response then arrives
- **THEN** the late response is discarded without modifying `rowData`, the day queue, or any counters

---

### Requirement: Reset on time range / entity / tab / filter / sort change

The Usage Log SHALL rebuild the day queue from the current `timeRange` and `completion_time` sort direction, reset `loading` and the row-id counter to zero, mark the next fetch as a REPLACE, and invalidate any in-flight request whenever any of the following change: the user's time range, the entity name filter, the active tab (which changes the `baseQuery`), the column filter model, or the `completion_time` sort direction. Sort changes other than `completion_time` direction flips SHALL NOT be reachable through the UI.

A reset SHALL NOT clear `rowData` synchronously. The previously rendered rows remain visible until the first new fetch resolves; that response REPLACES `rowData` atomically. After reset, an initial fetch SHALL fire automatically for the first window of the rebuilt queue.

#### Scenario: Switching tabs

- **WHEN** the user switches between Traces, Conversations, MCP, Routes, and Toolset Traces tabs
- **THEN** the new tab starts with a freshly built day queue using the current sort direction
- **AND** the first request issued by the new tab carries the first window's `_time` bounds in `where.$and`

#### Scenario: Changing the time filter

- **WHEN** the user changes the top TimeFilter (preset period or custom range)
- **THEN** the day queue is rebuilt from the new range in the current sort direction
- **AND** the first new response REPLACES `rowData` atomically

#### Scenario: Filter change preserves floating-filter input

- **WHEN** the user types a value into a column's floating filter AND applies it
- **THEN** any in-flight fetch is invalidated by `requestId` and the next fetch is marked as REPLACE
- **AND** `rowData` is NOT cleared synchronously — the previously rendered rows remain visible under the loading overlay
- **AND** when the first new request resolves, `rowData` is atomically replaced with the response rows (which may be `[]`)
- **AND** the typed value remains visible in the floating-filter input throughout, because the grid is never unmounted

#### Scenario: Sort direction flip on `completion_time`

- **WHEN** the user toggles the `completion_time` sort from `desc` to `asc` (or back)
- **THEN** the day queue is rebuilt in the matching direction
- **AND** the next request's `orderBy` carries `[{ $asc: '_time' }]` or `[{ $desc: '_time' }]` to match
- **AND** `rowData` is replaced atomically when the first new response arrives — old rows remain visible until then

## ADDED Requirements

### Requirement: Sort restricted to `completion_time` with direction-aware day iteration

The Usage Log grids SHALL allow user-initiated sorting only on the `completion_time` column. Every other column SHALL be non-sortable: no sort affordance in the header, no sort items in the column menu, and clicks on the header SHALL NOT change the sort model or trigger a fetch.

The `completion_time` column SHALL allow toggling between `desc` (default) and `asc`. The sort-direction tri-state (`asc` / `desc` / null) SHALL be collapsed to two states via `sortingOrder: ['asc', 'desc']`, so the null state is never reachable through the UI. The `orderBy` field in every Usage Log request SHALL carry the current direction. The day queue SHALL iterate in the matching direction.

#### Scenario: Non-time column header clicks are ignored

- **WHEN** the user clicks the header of any column other than `completion_time`
- **THEN** no sort indicator appears on that column
- **AND** the sort model does not change
- **AND** no new telemetry request fires

#### Scenario: Default sort on initial load

- **WHEN** the user opens any Usage Log grid
- **THEN** the active sort is `completion_time` `desc`
- **AND** the day queue is ordered newest-first
- **AND** the first request's `orderBy` is `[{ $desc: '_time' }]`

#### Scenario: Toggling to ascending direction

- **WHEN** the user clicks the `completion_time` header to flip to `asc`
- **THEN** the day queue is rebuilt oldest-first
- **AND** the next request carries `orderBy: [{ $asc: '_time' }]` and the bounds of the oldest 24h window

#### Scenario: Toggling back to descending direction

- **WHEN** the user, on an `asc`-sorted grid, clicks the `completion_time` header to flip to `desc`
- **THEN** the day queue is rebuilt newest-first
- **AND** the next request carries `orderBy: [{ $desc: '_time' }]` and the bounds of the newest 24h window

---

### Requirement: Column filter support for text and number columns

The Usage Log filter translator SHALL accept both AG-Grid text filter models (`filterType: 'text'`) and AG-Grid number filter models (`filterType: 'number'`) and SHALL emit valid backend clauses for each. Per-column `filterOptions` configured in `apps/ai-dial-admin/src/constants/grid-columns/filters.ts` SHALL remain the canonical list of user-selectable operators. The `inRange` operator SHALL NOT be added to any column's `filterOptions` as part of this change, but the translator SHALL handle it defensively by decomposing it into `$gte` + `$lte` clauses.

When a filter is applied via the floating filter or popup, the typed value SHALL remain visible in the floating-filter input after the resulting fetch resolves.

#### Scenario: Text filter emits string clause

- **WHEN** the user applies a `contains: "foo"` filter on a text column
- **THEN** the request's `where.$and` contains `{ $contains: { left: <column>, right: "'foo'" } }`
- **AND** the floating-filter input still shows `foo` after the request resolves

#### Scenario: Number filter emits numeric clause

- **WHEN** the user applies a `greaterThan: 5` filter on a number column (an `agNumberColumnFilter` column)
- **THEN** the request's `where.$and` contains `{ $gt: { left: <column>, right: 5 } }`
- **AND** the floating-filter input still shows `5` after the request resolves

#### Scenario: Defensive `inRange` decomposition

- **WHEN** the translator is given a number filter model with `type: 'inRange'`, `filter: 1`, `filterTo: 10`
- **THEN** the emitted clause is `{ $and: [{ $gte: { left: <column>, right: 1 } }, { $lte: { left: <column>, right: 10 } }] }`

#### Scenario: Empty filter input is treated as no filter

- **WHEN** the user clears a filter input AND applies it
- **THEN** the corresponding clause is omitted from `where.$and`
- **AND** the next fetch returns rows without that constraint

#### Scenario: Numeric cells are filter-evaluated as numbers, not formatted strings

- **WHEN** the backend returns a row whose numeric field exceeds the thousands-formatting threshold (e.g. `prompt_tokens = "1274"`)
- **AND** the user's number filter would match it (e.g. `> 22`)
- **THEN** the row is displayed in the grid
- **AND** AG-Grid's client-side number filter SHALL NOT receive a comma-formatted string from `filterValueGetter` (which would coerce to `NaN` and silently drop the row); the raw cell value is used instead

---

### Requirement: Backend errors surface to the user

When a Usage Log telemetry request returns `success: false` or throws, the list SHALL show a notification via the project's `useNotification` + `getErrorNotification` pattern. Previously loaded `rowData` SHALL be preserved so the user keeps their context. The `loading` flag SHALL clear so further scroll triggers can re-attempt. The day-window that failed SHALL be re-queued at the head of the day queue so a transient backend error does not permanently strip a day of data — the user can retry by scrolling.

#### Scenario: Backend returns an error response

- **WHEN** a telemetry request resolves with `success: false`
- **THEN** `showNotification` is called with the response's `errorHeader`, `errorMessage`, and `requestId`
- **AND** `rowData` is unchanged from before the failed request
- **AND** the failed day-window is re-queued at the head of the queue

#### Scenario: Network exception during fetch

- **WHEN** `getData` throws
- **THEN** `showNotification` is called with a localized fallback error notification
- **AND** `rowData` is unchanged
- **AND** the failed day-window is re-queued
- **AND** `loading` is cleared so the next scroll trigger can retry

---

### Requirement: Grid stays mounted with in-grid no-rows overlay

The Usage Log grids SHALL keep `AgGridWrapper` mounted at all times so column filter UI (popup + floating filter inputs) survives data refetches. The empty-state UI SHALL render INSIDE the grid via AG-Grid's `noRowsOverlayComponent` (rendering `DialNoDataContent`), not by replacing the grid with `DialNoDataContent` at the `GridView` level.

The list SHALL pass a `getIsEmptyData` callback that always returns `false`, so `GridView`'s existing empty-data swap is never triggered. The list SHALL NOT pass `overlayNoRowsTemplate` (HTML string) — it uses the React `noRowsOverlayComponent` overlay instead, with the per-tab title passed via `noRowsOverlayComponentParams` so the overlay component reference stays stable.

#### Scenario: Empty result keeps the filter row visible

- **WHEN** the user-selected range or applied filters yield zero rows
- **THEN** the grid header (column titles + floating-filter inputs) remains rendered
- **AND** the `noRowsOverlayComponent` shows `DialNoDataContent` with the per-tab `emptyDataTitle` over the empty grid body
- **AND** clicking column filter funnels still opens the popup filter with its current state
- **AND** clearing or changing a filter triggers a new fetch and the grid re-populates without remounting

#### Scenario: First fetch on mount

- **WHEN** the Usage Log mounts and the first fetch is in flight
- **THEN** the grid is mounted with empty `rowData`
- **AND** the AG-Grid loading overlay is shown (not the no-rows overlay)
- **AND** when the response arrives, `rowData` is set atomically
