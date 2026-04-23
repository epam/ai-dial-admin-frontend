## Why

The Usage Log view (`/usage-log` and the UsageLog tab embedded on entity pages) fetches every row matching the selected time range in a single request and loads it into a client-side grid. On busy deployments with wide time windows this can return tens of thousands of rows, which is slow to transfer, heavy on browser memory, and can make the tab unresponsive. GitHub issue #2822 asks for pagination to bring the view back to acceptable performance.

## What Changes

- Usage Log list switches from client-side rendering of all rows to **server-side pagination** using ag-Grid's infinite row model, with a fixed page size of 100.
- Telemetry query contract gains optional `limit` and `offset` fields (BE already accepts them on `QueryDto`; FE only needs to send them).
- **Every column** on each Usage Log tab (Traces, Conversations, MCP, Toolset Traces) becomes server-side **filterable** with per-column default operators (IDs → `$eq`, free-text → `$contains`, numbers → `$eq` with range operators available, timestamp → date filter). Column filters compose with the top-level TimeFilter and entity-name filter as AND.
- Every column becomes server-side **sortable**, constrained to one column at a time (`multiSort: false`) to stay compatible with both InfluxDB 2 (Flux) and InfluxDB 3 (SQL) query engines. Default sort is `completion_time` DESC, declared on the column definition so that the grid is the single source of truth for active sort order.
- Tab switch, time-range change, and Refresh purge the infinite cache and re-fetch from `offset=0`.
- Empty and short pages are handled explicitly: the grid renders a "no rows" overlay with a localized message, and the datasource signals end-of-data so the grid stops requesting further pages.
- `TRACES_QUERY`, `CONVERSATIONS_QUERY`, and `MCP_QUERY` constants stop carrying a hard-coded `orderBy` (moved to column config).

## Capabilities

### New Capabilities
- `usage-log-pagination`: server-side paginated listing, sorting, and filtering for the Usage Log (Traces / Conversations / MCP / Toolset Traces) backed by the telemetry metrics endpoint.

### Modified Capabilities
<!-- None. The existing telemetry query shape is extended (adds optional limit/offset), but no existing spec describes its requirements, so no delta is needed. -->

## Impact

**Affected code (frontend only; no BE work):**
- `apps/ai-dial-admin/src/models/telemetry.ts` — `TelemetryQuery.query` gains optional `limit` and `offset`.
- `apps/ai-dial-admin/src/components/UsageLog/List/List.tsx` — replace `useEffect + setData` with an `IDatasource`; translate ag-Grid sort + filter model into telemetry `orderBy` + `where`.
- `apps/ai-dial-admin/src/components/UsageLog/UsageLog.tsx` — hold a ref to the grid API; purge the infinite cache on tab switch, TimeFilter change, and Refresh click.
- `apps/ai-dial-admin/src/constants/telemetry.tsx` — drop hard-coded `orderBy: [{ $desc: '_time' }]` from `TRACES_QUERY`, `CONVERSATIONS_QUERY`, `MCP_QUERY`.
- `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` — on `USAGE_LOG_TRACES_COLUMNS`, `USAGE_LOG_CONVERSATIONS_COLUMNS`, `USAGE_LOG_MCP_COLUMNS`, `USAGE_LOG_TOOLSET_TRACES_COLUMNS`: set `sort: 'desc'` on `completion_time`, enable `floatingFilter`, and pick filter type + default operator per column.
- New helper module (exact path TBD in design) that translates `(sortModel, filterModel, timeRange, entityName, startRow, pageSize)` into a complete `TelemetryQuery`.

**Not affected:**
- ActivityAudit (`/activity-audit`) — already server-paginated; different feature despite the issue's "[Audit]" prefix.
- `createMcpUsageQuery` / MCP usage line chart — feeds a chart, not the log list.
- Backend — `QueryDto` already exposes `limit`/`offset`, and the filter/sort operator vocabulary used here is already supported; no backend changes needed.

**Risk / things to watch:**
- Flux engine rejects mixed ASC/DESC across sort columns; the FE must enforce single-column sort to avoid surfacing that error.
- ag-Grid must always receive a `successCallback` (or `failCallback` on error) — a missed callback leaves a stuck spinner.
- The embedded UsageLog on entity detail pages reuses the same `List.tsx`, so that surface is covered by the same change.

**Non-goals:**
- Server-side export/download of paginated results (today's usage log is view-only).
- Custom/saved filter sets or shareable filter URLs.
- Upgrading enum-ish columns (e.g. `language`) from text filter to dropdown filter — can come as a follow-up once filter wiring lands.
- Multi-column sort. Explicitly excluded to remain compatible with Flux.
