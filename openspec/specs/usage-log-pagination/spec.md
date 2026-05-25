# usage-log-pagination Specification

## Purpose
TBD - created by archiving change usage-log-pagination. Update Purpose after archive.
## Requirements
### Requirement: Day-chunked append-on-scroll fetch of Usage Log rows

The Usage Log list (Traces, Conversations, MCP, and Toolset Traces tabs on both the `/usage-log` page and entity-embedded UsageLog views) SHALL use ag-grid's `clientSide` row model with React-owned `rowData`. The grid SHALL NOT send `limit` on telemetry requests for the Usage Log path.

The user-selected time range SHALL be sliced on the FE into a queue of 24-hour half-open windows `[start, end)`, ordered newest first. Each scroll-triggered or auto-triggered fetch SHALL pop the next window off the queue and send a request whose `where.$and` carries that window's `_time` bounds. Windows SHALL be contiguous so that every row in the user-selected range falls into exactly one window.

Response rows SHALL be appended to `rowData` via `setRowData(prev => [...prev, ...tagged])`, where each row is tagged with a stable synthetic `__rowId` from a monotonic counter that resets on every reset event.

End-of-data SHALL be signalled when the day queue is empty. Once signalled, no further requests fire until a reset event (filter / sort / time / entity / tab change).

When a fetch resolves and the day queue is non-empty, the next day SHALL be auto-fetched if EITHER:

- the just-resolved response had zero rows, OR
- the running total of loaded rows is below the scroll-enabling threshold (so the user has no scroll bar to trigger the next fetch via scroll).

In-flight requests SHALL be invalidated on reset via a monotonically incrementing `requestId`. A late response that does not match the current `requestId` SHALL be discarded without touching `rowData`, the day queue, or any counters.

The Usage Log list SHALL pass `getRowId` to the grid wrapper so ag-grid uses immutable-data semantics — appending rows SHALL NOT reset scroll position.

#### Scenario: Initial fetch on view load

- **WHEN** the user opens the Usage Log
- **THEN** the FE builds a day queue from the selected time range (newest first)
- **AND** the grid issues one request whose body contains no `limit` key
- **AND** the request body contains no `offset` key
- **AND** `where.$and` contains `_time >= window.start` and `_time < window.end` for the first (newest) 24h window
- **AND** the response rows are tagged with synthetic `__rowId`s and appended to `rowData`

#### Scenario: Scroll-end triggers a follow-up request

- **WHEN** the user scrolls such that the last displayed row index is within the scroll-end threshold of `rowData.length` AND the day queue is non-empty AND a request is not already in flight
- **THEN** the grid issues a new request whose `where.$and` carries the next (older) 24h window
- **AND** the request body still contains no `limit` key
- **AND** the response rows are appended to `rowData` with new `__rowId`s

#### Scenario: Empty day auto-fetches the next day

- **WHEN** a fetch returns zero rows AND the day queue is non-empty
- **THEN** the next 24h window is requested immediately, without waiting for scroll
- **AND** this continues until either the queue is exhausted or a day returns rows that bring the total above the scroll-enabling threshold

#### Scenario: Insufficient-rows-to-scroll auto-fetches the next day

- **WHEN** a fetch returns some rows but the running total of loaded rows is below the scroll-enabling threshold AND the day queue is non-empty
- **THEN** the next 24h window is requested immediately, without waiting for scroll
- **AND** this continues until either the queue is exhausted or the total reaches the threshold

#### Scenario: End-of-data when queue exhausted

- **WHEN** the day queue is empty
- **THEN** no further scroll-triggered or auto-triggered requests fire
- **AND** the grid displays the localized "no rows" overlay if `rowData` is also empty, otherwise renders the rows accumulated so far

#### Scenario: A second fetch does not fire while one is in flight

- **WHEN** the user scrolls past the scroll-end threshold while a previous fetch is still pending
- **THEN** the duplicate trigger is ignored
- **AND** exactly one fetch is in flight at any time

#### Scenario: Stale response after reset is discarded

- **WHEN** a fetch is in flight AND the user changes the time range (or filter / sort / entity / tab) AND the in-flight response then arrives
- **THEN** the late response is discarded without modifying `rowData`, the day queue, or any counters
- **AND** the new request issued after the reset proceeds independently

#### Scenario: Backend request fails

- **WHEN** the telemetry request errors out (network error, HTTP error, or `success: false` response)
- **THEN** `rowData` and the day queue are unchanged
- **AND** `loading` is cleared so subsequent scroll triggers can re-attempt the fetch

#### Scenario: Appending rows preserves scroll position

- **WHEN** new rows arrive and are appended to `rowData`
- **THEN** ag-grid diffs old vs new `rowData` by `__rowId`
- **AND** existing row nodes are reused, only the newly tagged rows are added at the bottom
- **AND** scroll position is preserved

---

### Requirement: Reset on time range / entity / tab / filter / sort change

The Usage Log SHALL reset `rowData = []`, rebuild the day queue from the current `timeRange`, reset `loading` and the row-id counter to zero, and invalidate any in-flight request whenever any of the following change: the user's time range, the entity name filter, the active tab (which changes the `baseQuery`), the column filter model, or the column sort model. After reset, an initial fetch SHALL fire automatically for the newest window in the rebuilt queue.

#### Scenario: Switching tabs

- **WHEN** the user switches between Traces, Conversations, and MCP tabs
- **THEN** the new tab starts with `rowData = []` and a freshly built day queue
- **AND** the first request issued by the new tab carries the newest window's `_time` bounds in `where.$and`

#### Scenario: Changing the time filter

- **WHEN** the user changes the top TimeFilter (preset period or custom range)
- **THEN** `rowData` resets to `[]`
- **AND** the day queue is rebuilt from the new range
- **AND** the next request carries the new newest-window `_time` bounds in `where.$and`

#### Scenario: Filter or sort change

- **WHEN** the user modifies any column filter or changes the active sort column / direction
- **THEN** `rowData` resets to `[]` and any in-flight fetch is invalidated by `requestId`
- **AND** the day queue is rebuilt from the current time range
- **AND** the next request carries the new sort (`orderBy`) and/or column filter clauses in `where.$and`, plus the newest-window `_time` bounds

---

### Requirement: Telemetry query model supports pagination fields

The `TelemetryQuery.query` TypeScript interface in `models/telemetry.ts` SHALL continue to expose optional `limit?: number` and `offset?: number` fields. When either field is set on an outgoing request, the corresponding wire-level JSON field SHALL be emitted. When both are absent, the request SHALL omit them entirely.

The Usage Log query builder (`buildUsageLogQuery`) SHALL NOT emit `limit`. It SHALL emit `offset` only when the passed value is strictly greater than zero. The Usage Log list always passes `offset: 0` because each request scopes to a single day window, so the field is effectively never emitted on the wire today.

Other non-Usage-Log callers (e.g., charts via `createMcpUsageQuery`) SHALL be unaffected and may continue to set or omit `limit`/`offset` independently.

#### Scenario: Usage Log request omits both fields

- **WHEN** the Usage Log builds a request for any day window
- **THEN** the outgoing JSON contains no `limit` key inside `query`
- **AND** the outgoing JSON contains no `offset` key inside `query`

#### Scenario: Existing chart call omits both fields

- **WHEN** an existing non-paginated caller (e.g. `createMcpUsageQuery`) issues a request
- **THEN** the outgoing JSON contains no `limit` key and no `offset` key inside `query`
- **AND** the backend response is unchanged versus current behavior
