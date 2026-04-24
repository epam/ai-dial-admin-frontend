## ADDED Requirements

### Requirement: Server-side paginated fetch of Usage Log rows

The Usage Log list (Traces, Conversations, MCP, and Toolset Traces tabs on both the `/usage-log` page and entity-embedded UsageLog views) SHALL fetch rows from the telemetry endpoint in fixed-size pages using `limit` and `offset` on the telemetry query, rather than fetching all matching rows in one request.

The page size SHALL be `100` rows, matching the shared `PAGE_SIZE` constant used by other paginated grids in the application.

#### Scenario: Initial page fetch on view load

- **WHEN** the user opens the `/usage-log` page (or an entity page whose UsageLog tab is active)
- **THEN** the grid requests rows from the telemetry endpoint with `offset = 0` and `limit = 100`
- **AND** only the first 100 rows are rendered initially

#### Scenario: Fetching subsequent pages as the user scrolls

- **WHEN** the user scrolls past the bottom of the currently loaded rows
- **THEN** the grid requests the next 100 rows with `offset` equal to the count of rows already loaded and `limit = 100`

#### Scenario: Final page is smaller than page size

- **WHEN** the backend returns fewer than 100 rows for a page request
- **THEN** the datasource signals end-of-data to the grid (`lastRow = offset + rows.length`)
- **AND** no further pages are requested

#### Scenario: First-page request returns zero rows

- **WHEN** the first page request returns zero rows (time range empty, or filters exclude everything)
- **THEN** the datasource signals `lastRow = 0`
- **AND** the grid renders the localized "no rows" overlay using the per-tab empty message
- **AND** no further pages are requested

#### Scenario: Backend request fails

- **WHEN** the telemetry request errors out (network error, HTTP error, or unsuccessful response)
- **THEN** the datasource calls ag-Grid's `failCallback` so the grid exits its loading state
- **AND** no spinner is left indefinitely visible

---

### Requirement: Server-side single-column sort

The Usage Log SHALL support sorting by exactly one column at a time. The active sort model is owned by the grid; every fetch translates the grid's current sort state into the telemetry query's `orderBy` field.

The default sort SHALL be `completion_time` descending, declared on the `completion_time` column definition. The `orderBy` field SHALL NOT be hard-coded in `TRACES_QUERY`, `CONVERSATIONS_QUERY`, or `MCP_QUERY` constants.

Multi-column sort (ag-Grid shift-click) SHALL be disabled via `multiSort: false` on the grid options.

#### Scenario: Default sort applied on first load

- **WHEN** the user opens the Usage Log and has taken no sort actions
- **THEN** the telemetry request carries `orderBy: [{ "$desc": "completion_time" }]`
- **AND** rows are displayed newest-first

#### Scenario: User sorts by a different column

- **WHEN** the user clicks the `model` column header to sort ASC
- **THEN** the grid purges its infinite cache
- **AND** subsequent telemetry requests carry `orderBy: [{ "$asc": "model" }]` — with no residual `completion_time` sort clause

#### Scenario: User clears all sort

- **WHEN** the user cycles the active column back to an unsorted state
- **THEN** the datasource falls back to the default `orderBy: [{ "$desc": "completion_time" }]`

#### Scenario: Multi-column sort is prevented

- **WHEN** the user shift-clicks a second column header
- **THEN** the second click replaces the active sort rather than appending
- **AND** the telemetry request carries exactly one entry in `orderBy`

---

### Requirement: Server-side per-column filtering on every Usage Log column

The Usage Log SHALL enable ag-Grid floating filters on every column on the Traces, Conversations, MCP, and Toolset Traces tabs, including opaque ID columns and the `completion_time` column. Each column filter MUST apply server-side by adding clauses to the telemetry query's `where.$and`.

Per-column default filter operators SHALL follow this table:

| Column group | ag-Grid filter type | Default operator |
|---|---|---|
| ID columns (`trace_id`, `core_span_id`, `core_parent_span_id`, `response_id`, `chat_id`) | `agTextColumnFilter` | `$eq` |
| Free-text columns (`model`, `deployment`, `parent_deployment`, `project_id`, `execution_path`, `language`, `upstream`, `topic`, `user_title`, `user_hash`, `mcp_method`, `mcp_tool_call_name`) | `agTextColumnFilter` | `$contains` |
| Numeric columns (`price`, `deployment_price`, `prompt_tokens`, `completion_tokens`, `number_request_messages`) | `agNumberColumnFilter` | `$eq` |
| Timestamp column (`completion_time`) | `agDateColumnFilter` | `$eq` |

All columns SHALL expose the full relevant operator dropdown (contains / not_contains / starts_with / ends_with / equals / not_equals / greater / less / gte / lte, as applicable to the filter type). The default is only what opens first.

Column filters MUST compose as an AND with the top-level TimeFilter, the entity-name filter (when present), and the active sort.

#### Scenario: Typing in a text column's floating filter

- **WHEN** the user types "gpt-4" in the floating filter on the `model` column
- **THEN** the grid purges its cache and re-fetches from `offset = 0`
- **AND** the telemetry request's `where.$and` includes `{ "$contains": { "left": "model", "right": "'gpt-4'" } }`
- **AND** the time range and entity filters remain in `where.$and`

#### Scenario: Pasting a trace_id into an ID column's floating filter

- **WHEN** the user pastes a full trace_id into the `trace_id` column filter
- **THEN** the telemetry request's `where.$and` includes `{ "$eq": { "left": "trace_id", "right": "'<id>'" } }`
- **AND** the grid either displays the matching row(s) or renders the no-rows overlay

#### Scenario: Numeric range filter on a price column

- **WHEN** the user opens the `price` column filter, selects operator `≥`, and enters `0.01`
- **THEN** the telemetry request's `where.$and` includes `{ "$gte": { "left": "price", "right": "0.01" } }`

#### Scenario: Date filter on completion_time composes with top TimeFilter

- **WHEN** the user's top TimeFilter is set to "last 24 hours" AND the user enters `2026-04-22` in the `completion_time` column filter
- **THEN** the telemetry request's `where.$and` contains BOTH the time-range bounds from the top filter AND the column filter's equality clause
- **AND** results are only rows that satisfy both constraints

#### Scenario: Filter change resets pagination

- **WHEN** the user modifies any column filter
- **THEN** the infinite cache is purged
- **AND** the next request starts at `offset = 0`

#### Scenario: Filter returns zero rows

- **WHEN** the user applies a filter combination that matches no rows
- **THEN** the grid renders the localized "no rows" overlay
- **AND** no further pages are requested

---

### Requirement: Cache reset on tab / time / refresh actions

The Usage Log infinite cache SHALL be purged whenever the effective request shape changes outside of the grid's own sort/filter controls. Purging causes the next `getRows` call to start from `offset = 0` with the updated parameters.

#### Scenario: Switching tabs

- **WHEN** the user switches between Traces, Conversations, and MCP tabs
- **THEN** the newly active tab starts its grid fresh at `offset = 0` with the correct column set and telemetry table

#### Scenario: Changing the time filter

- **WHEN** the user changes the top TimeFilter (preset period or custom range)
- **THEN** the grid's infinite cache is purged
- **AND** the next request starts at `offset = 0` with the new time range in `where.$and`

#### Scenario: Clicking Refresh

- **WHEN** the user clicks the Refresh button
- **THEN** the grid's infinite cache is purged
- **AND** the next request starts at `offset = 0` with the current filters

---

### Requirement: Telemetry query model supports pagination fields

The `TelemetryQuery.query` TypeScript interface in `models/telemetry.ts` SHALL expose optional `limit?: number` and `offset?: number` fields. When either field is set, the corresponding wire-level JSON field SHALL be emitted on the telemetry request body. When both are absent, the request SHALL omit them entirely so as not to regress existing callers (e.g. chart queries such as `createMcpUsageQuery`).

#### Scenario: Paginated Usage Log call sets both fields

- **WHEN** the Usage Log datasource builds a request for a subsequent page
- **THEN** the outgoing JSON includes both `limit` and `offset` keys inside `query`

#### Scenario: Existing chart call omits both fields

- **WHEN** an existing non-paginated caller (e.g. `createMcpUsageQuery`) issues a request
- **THEN** the outgoing JSON contains no `limit` key and no `offset` key inside `query`
- **AND** the backend response is unchanged versus current behavior
