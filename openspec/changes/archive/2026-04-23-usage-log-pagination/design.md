## Context

The Usage Log surface (`/usage-log`, plus embedded `UsageLog` tabs on entity detail pages) reads time-series rows from the telemetry metrics endpoint `POST /api/v1/metrics/datasets/{dataset}/data`. Today `components/UsageLog/List/List.tsx` calls `getDashboardData(query)` once on mount and hands every row it receives to a client-side ag-Grid rendered by `ListEntities`. With no `limit` on the wire, the backend returns every matching row — easily tens of thousands on busy deployments.

Five other list views in this codebase (ActivityAudit, TestSuites Runs, Evaluation, HF Registry, MCP Registry) already use ag-Grid's `infinite` row model backed by a paged server endpoint. `constants/ag-grid.ts` exposes `infiniteGridOptions` (cacheBlockSize 100, maxBlocksInCache 10, blockLoadDebounceMillis 200) and `ListView/List.tsx`/`GridView.tsx` already route through the infinite path when `additionalGridOptions.rowModelType === 'infinite'`.

Backend capability (verified in `ai-dial-admin-backend/query-language/.../dto/QueryDto.java`): `limit`, `offset`, `orderBy`, and `where` are first-class fields already. Filter operators cover the full comparison/text/set vocabulary (`$eq`, `$ne`, `$lt`, `$lte`, `$gt`, `$gte`, `$like`, `$not_like`, `$contains`, `$not_contains`, `$starts_with`, `$ends_with`, `$in`, `$nin`) plus `$and`/`$or`/`$not`. Sort is serialized as `{ $asc: "col" }` / `{ $desc: "col" }` — already matches FE usage.

One backend asymmetry drives an important FE constraint. The Flux engine (`FluxQueryBuilder.java:844-846`) rejects mixed sort directions across columns with "Only one sort direction is allowed". The Influx3/SQL engine has no such restriction. The FE must ship the common denominator.

## Goals / Non-Goals

**Goals:**
- `UsageLog/List/List.tsx` drives the grid through an `IDatasource`, fetching 100 rows at a time via `limit`/`offset` on the telemetry query.
- Server-side sort on any one column; default `completion_time` DESC, declared on the column config so the grid owns the active sort model.
- Server-side filter on every column in every Usage Log tab, composed AND with the existing TimeFilter and entity-name filter.
- Tab switch, TimeFilter change, and Refresh click reset pagination back to offset 0 by purging the infinite cache.
- Empty / short pages render a localized "no rows" overlay; the datasource signals end-of-data so the grid stops requesting further pages.
- Works identically for the standalone `/usage-log` page and every embedded UsageLog tab (entity detail pages, toolsets).

**Non-Goals:**
- Multi-column sort (excluded to stay Flux-compatible).
- A numbered-page pager UI. Infinite scroll matches existing conventions for this codebase.
- Client-side export, saved filter sets, or shareable filter URLs.
- Upgrading enum-ish columns (e.g. `language`, `mcp_method`) from free-text filter to select dropdowns — deferred to a follow-up once the base wiring lands.
- Any backend change.

## Decisions

### D1. ag-Grid `infinite` row model driven by `limit`/`offset`

The FE sends `{ limit: 100, offset: startRow }` on every page request. The BE already honors both. This matches the pattern established by `ActivityAudit/List/List.tsx` and reuses the shared `infiniteGridOptions` and `PAGE_SIZE=100` from `constants/ag-grid.ts`.

Alternatives rejected:
- **Cursor pagination on `_time`.** Cleaner for strictly time-ordered data, but forces a specific sort and breaks the moment the user sorts by any other column. Offset pagination lets sort and pagination evolve independently.
- **Numbered pager UI.** No existing component in the app, inconsistent with peer surfaces, and `lastRow` from the BE is implicit (we infer it from short pages) — numbered pages would need a total-count probe, which the telemetry endpoint does not return.

### D2. Grid is the single source of truth for active sort; default sort lives on the column definition

`TRACES_QUERY`, `CONVERSATIONS_QUERY`, `MCP_QUERY` stop carrying `orderBy`. Instead, `sort: 'desc'` is set on the `completion_time` column definition. On every `getRows`, the datasource reads `params.sortModel` from ag-Grid and translates it into `orderBy`; if the user clears the sort, the datasource falls back to the default `{ $desc: 'completion_time' }`.

Why this matters: if the default stayed baked into the query constant AND the user added their own sort, we would send two sort clauses. If those directions differed, the Flux engine would reject the whole query. Making the grid authoritative means exactly one sort clause is ever on the wire.

Alternatives rejected:
- **Always append user sort to default.** Fails on Flux as described.
- **Always send default alone.** Breaks user-initiated sort.

### D3. Single-column sort (`multiSort: false`)

Flux rejects mixed ASC/DESC across sort columns. Rather than filter directions FE-side (surprising — the user clicks "sort by user ASC" and doesn't understand why it also reordered `_time`), we lock the grid to single-column sort. SQL/Influx3 deployments lose nothing perceptible; Flux deployments never hit the error.

### D4. Short/empty page = end-of-data signal, via ag-Grid `lastRow`

Inside `IDatasource.getRows`:

```
const response = await getData(buildQuery({ startRow, sortModel, filterModel }));
const rows = getListingData(response);

if (rows.length < PAGE_SIZE) {
    params.successCallback(rows, startRow + rows.length);  // lastRow = absolute end index
} else {
    params.successCallback(rows, -1);                       // "more exists"
}
```

Special case `startRow === 0 && rows.length === 0` emits `successCallback([], 0)`; ag-Grid renders the no-rows overlay. No second request is issued.

Error path must call `params.failCallback()` (otherwise the grid is stuck mid-load). Wrap in try/catch at the datasource boundary.

### D5. `TelemetryQuery.query` gains optional `limit` and `offset`

Added as `number | undefined` on the existing interface in `models/telemetry.ts`. The JSON field names are `limit` / `offset` — Jackson on the BE binds them directly, no new DTO needed. `createMcpUsageQuery` and other chart queries keep working because they simply never set these fields (null on the wire → BE returns full result, current behavior preserved).

### D6. Filter model translator — pure, unit-tested helper

Extract a new module `apps/ai-dial-admin/src/utils/usage-log-query.ts` (or similar) exposing:

```
buildUsageLogQuery({
  baseQuery,        // TRACES_QUERY | CONVERSATIONS_QUERY | MCP_QUERY (stripped of orderBy)
  startRow,
  pageSize,
  sortModel,        // from ag-Grid: SortModelItem[]
  filterModel,      // from ag-Grid: Record<colId, FilterModel>
  timeRange,
  entityName,
}): TelemetryQuery
```

Responsibilities, in order:
1. Assemble `where.$and` from time range + entity name + per-column filter translations.
2. Translate `sortModel` → `orderBy`; fall back to default `completion_time` DESC if empty.
3. Inject `limit` and `offset`.
4. Preserve `baseQuery.query.expressions` and `from` untouched.

This helper is the ONLY place that needs to know about BE operator names (`$contains`, `$eq`, etc.). The column definitions stay declarative. Exhaustive unit tests against the BE's operator vocabulary.

### D7. Per-column filter type + default operator mapping

| Column group | ag-Grid filter | Default operator | Available operators |
|---|---|---|---|
| ID-like: `trace_id`, `core_span_id`, `core_parent_span_id`, `response_id`, `chat_id` | `agTextColumnFilter` | `$eq` | `$eq`, `$ne` |
| Free-text: `model`, `deployment`, `parent_deployment`, `project_id`, `execution_path`, `language`, `upstream`, `topic`, `user_title`, `user_hash`, `mcp_method`, `mcp_tool_call_name` | `agTextColumnFilter` | `$contains` | `$contains`, `$not_contains`, `$starts_with`, `$ends_with`, `$eq`, `$ne` |
| Numeric: `price`, `deployment_price`, `prompt_tokens`, `completion_tokens`, `number_request_messages` | `agNumberColumnFilter` | `$eq` | `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte` |
| Time: `completion_time` | `agDateColumnFilter` | `$eq` | `$eq`, `$gte`, `$lte`, `$gt`, `$lt` |

Rationale for every column (including IDs and timestamp) is captured in memory `feedback_log_grid_filters.md`: log surfaces exist for debugging, users paste IDs, and coarse + fine filter composition is a feature not a bug.

### D8. Cache invalidation on tab / TimeFilter / Refresh

`UsageLog.tsx` holds a `gridApiRef: MutableRefObject<GridApi | null>` set via the `List` component's `onGridReady` callback. On any of:
- tab change (`onChangeActiveTab`)
- time period change (`onTimePeriodChange`)
- time range change (`onTimeRangeChange`)
- Refresh button click (`onRefresh`)

…`gridApiRef.current?.purgeInfiniteCache()` runs. Because the datasource closure re-reads current `timeRange` and `entityFilterName` via `useCallback` dependencies, the next `getRows` call fires with the updated filters from `offset=0`.

Note: tab switch today unmounts/remounts the List via the existing `activeTab === EntityViewTab.X` branches in JSX. That still works — the new grid instance simply starts fresh at `offset=0`. No behavior change needed there.

### D9. i18n for empty/error states

The existing `emptyDataTitle` prop on the inner `List` already flows through to `ListEntities.emptyDataProps.title`. Verify (and, if necessary, extend) that `GridView` renders this text as the ag-Grid `overlayNoRowsTemplate` so empty pages show a translated message — not an empty table. Same emptyDataTitle is reused for "filter matched zero rows" — simpler than a distinct "no match" copy, and matches how ActivityAudit behaves.

## Risks / Trade-offs

- **Risk:** Flux engine rejects mixed-direction multi-column sort. → **Mitigation:** D3 locks to single-column sort; D2 keeps exactly one sort clause on the wire.
- **Risk:** Missed `successCallback` or `failCallback` leaves a stuck spinner. → **Mitigation:** datasource wraps the fetch in try/catch; test covers the error path explicitly.
- **Risk:** Performance of `$contains` on non-indexed Influx fields (`topic`, `user_title`, `user_hash`) can be slow on large datasets. → **Mitigation:** acknowledged; user-triggered; the 100-row page cap naturally bounds response time. No FE-side remediation in this change.
- **Risk:** Column filter UI adds a floating-filter row to every column → noisier UI. → **Mitigation:** `floatingFilter: true` is an established pattern across the app (see ActivityAudit); users can collapse/resize columns as usual.
- **Trade-off:** Deferring total-count / numbered pager means "page 3 of 42" is not available. Acceptable — infinite scroll is the house convention and the BE doesn't return a count.
- **Trade-off:** Single-column sort is slightly less powerful than what Influx3/SQL deployments could offer. Accepted to keep a single code path and a single UX across engines.

## Migration Plan

Feature-level rollout only — no data migration, no external API contract change.

1. Land the FE changes (proposal → tasks). No env flag needed; the only runtime difference is the presence of `limit` / `offset` on outbound requests, which the BE has always accepted.
2. Manual smoke on a representative environment: verify all three tabs, an entity-scoped UsageLog, and the toolsets route (`USAGE_LOG_TOOLSET_TRACES_COLUMNS`).
3. **Rollback:** revert the PR. Since no BE changes are involved and `TelemetryQuery` is still backward compatible (limit/offset are optional, omitted when reverted), there's no coordinated rollback needed.

## Open Questions

- `USAGE_LOG_TOOLSET_TRACES_COLUMNS` shares the same infrastructure as `USAGE_LOG_MCP_COLUMNS`-style queries but uses the `MCP_QUERY` base with a toolset-prefixed deployment filter. Verify during implementation that the toolset route's extra filter still composes correctly with user-applied column filters (suspected fine, since both flow through `where.$and`, but worth confirming with a manual smoke).
- Does the existing `GridView` / `ListEntities` path reliably render `emptyDataProps.title` as an overlay under the infinite row model, or will we need to pass a custom `overlayNoRowsTemplate` through `additionalGridOptions`? Resolvable while coding — if the former, nothing to do; if the latter, one small plumbing addition.
