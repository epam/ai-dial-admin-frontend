## Context

The Usage Log infinite grid drives a server-paginated `IDatasource` against the telemetry endpoint. Today's request shape sends `{ limit: PAGE_SIZE, offset: startRow }` where `PAGE_SIZE = 100` (`apps/ai-dial-admin/src/constants/ag-grid.ts:9`). End-of-data is signalled when the response's row count is strictly less than `PAGE_SIZE`.

Verified BE behavior (`ai-dial-admin-backend/src/main/java/com/epam/aidial/metric/service/influx3/SqlQueryBuilder.java:499-510`):

```java
private String buildLimitClause(Query query) {
    var limit = query.getLimit();
    if (limit == null) {
        return "";
    }
    var sb = new StringBuilder("LIMIT ").append(limit);
    var offset = query.getOffset();
    if (offset != null && offset > 0) {
        sb.append(" OFFSET ").append(offset);
    }
    return sb.toString();
}
```

There is no default cap, no day-batching, no streaming chunker. The `WHERE` clause is the only bound.

## Goals / Non-Goals

**Goals:**

- Stop sending `limit` from the Usage Log path.
- Bound each request to a 1-day `_time` window on the FE so each round-trip's response is predictable in scale.
- Allow the user to scroll through the full user-selected range by walking the day queue.
- Auto-advance through empty days so the user never sees a stuck empty view.
- Preserve scroll position when more data appends.
- Preserve server-side sort and filter UX (BE re-runs the query with new `orderBy` / `where` clauses).
- Scope to Usage Log: no edits to `PAGE_SIZE`, `infiniteGridOptions`, or other grids that share them.

**Non-Goals:**

- No BE change.
- No alignment of day windows to local-calendar-day boundaries. Windows are rolling 24-hour spans anchored to the user-selected `endDate`.
- No buffer / prefetch layer between BE responses and the rendered grid.
- No change to ag-grid `cacheBlockSize` (no longer used on this surface).
- No change to columns, tabs, layout, or empty-state UX surface.

## Decisions

### Decision 1: clientSide row model with React-owned `rowData`

The Usage Log list uses ag-grid's default `clientSide` row model. `rowData` is React state (`useState<Record<string, string>[]>`) that grows by `setRowData(prev => [...prev, ...tagged])`. ag-grid is passed `isLiveData` so it consumes `rowData` as a declarative prop (matching the existing live-streaming code path in `AgGridWrapper`).

**Alternatives considered:**

- **ag-grid infinite + prefetch buffer.** Rejected: too much machinery for the simple "request → append → scroll → request" loop. The buffer was a workaround for ag-grid's fixed `cacheBlockSize`; with clientSide it is not needed.
- **ag-grid infinite without a buffer.** Rejected: `cacheBlockSize` truncates rows beyond the requested block, so removing `limit` while keeping `cacheBlockSize: 100` causes silent data loss or false end-of-data at any boundary where the BE returns fewer-than-100 rows.

### Decision 2: FE day queue

`buildDayQueue(timeRange)` slices `[startDate, endDate)` into 24-hour half-open windows, newest first. Each entry is a synthetic `TimeRange` `{ startDate, endDate }`. The windows are contiguous (window N's `startDate` equals window N+1's `endDate`) and half-open (`$gte: start`, `$lt: end`), so every row falls into exactly one window — no duplication, no gaps.

Per-fetch, the datasource pops the next day off the queue and passes it as the `timeRange` parameter to `buildUsageLogQuery`. The query builder emits the day's bounds as `_time` clauses in `where.$and`, unchanged from its existing behavior.

**Why rolling 24h windows instead of local-calendar-day alignment?** The user's `endDate` is rarely midnight in any timezone. Aligning to local calendar days would either truncate the user-selected range or require an extra (partial-day) window. Rolling 24h is simpler and exact.

### Decision 3: Auto-fetch next day on empty or insufficient response

After a fetch resolves:

- If the response has zero rows AND the queue still has days, immediately re-enter `fetchMore` to pull the next day. Without this the grid would display an empty view even when later days have data.
- If the response had rows but the running total is below `MIN_ROWS_TO_ENABLE_SCROLL = 100` AND the queue still has days, re-enter `fetchMore`. Without this the user has no scroll bar to trigger the next-day fetch via `onBodyScroll`.
- Otherwise stop and wait for either scroll or a reset event.

The recursive call happens inside the same `finally` block, after `loadingRef.current = false`, so the guard at the top of `fetchMore` passes and the next day proceeds. Each iteration is `await`-bounded, so there is no stack-recursion risk.

`MIN_ROWS_TO_ENABLE_SCROLL` is a heuristic: 100 rows × default 28px row height = 2800px of content, which exceeds typical viewport heights. If a real-world viewport is taller than this, the user still has scroll bar capacity to trigger the next fetch via `onBodyScroll`.

### Decision 4: Scroll-end trigger via `onBodyScroll`

The grid wires `onBodyScroll` through `additionalGridOptions`. The handler checks `api.getLastDisplayedRowIndex()` against `api.getDisplayedRowCount() - SCROLL_END_THRESHOLD_ROWS` (constant: 20). When the user scrolls within the threshold of the loaded end AND the day queue is non-empty AND no fetch is in flight, `fetchMore()` runs.

**Why `getLastDisplayedRowIndex()` rather than `getLastDisplayedRow()`**: ag-grid renamed the method in the version this repo uses.

### Decision 5: Refs (not state) for queue, loading, counters, models, requestId

`fetchMore` and the ag-grid event handlers must read the *latest* value of these variables without re-creating themselves on every change. React's `useRef` is the standard tool: values mutate without re-rendering, and event handlers wrapped in `useCallback` read `*Ref.current` to get the current value.

`rowData` is state because the grid needs to re-render when it changes. `hasLoadedOnce` is state because it gates the empty-state overlay in `GridView.getIsEmptyData`.

### Decision 6: Stale-response invalidation via `requestIdRef`

Every `fetchMore` invocation captures a monotonically incrementing `requestId`. Before processing the response, the handler checks `if (requestId !== requestIdRef.current) return`. Any reset (filter / sort / time / entity / tab change) calls `requestIdRef.current++` so all in-flight fetches become stale and their responses are silently dropped on arrival.

**Why this rather than `AbortController`**: the underlying server action does not currently accept an `AbortSignal`. The request keeps running on the server until done, but its result is discarded on the client.

### Decision 7: Sort and filter changes reset + refetch

`onSortChanged` and `onFilterChanged` are wired through `additionalGridOptions`. Each handler reads the new model from `event.api`, stores it in `sortModelRef` / `filterModelRef`, calls `reset()`, then calls `fetchMore()`. `reset()` rebuilds the day queue and clears `rowData` so the new BE query runs against the full user-selected range.

**Why server-side rather than client-side filter on `rowData`**: the loaded `rowData` is only a prefix of the BE result set. In-memory filtering would hide matches that exist further down. Server-side filtering with reset keeps the result complete.

### Decision 8: Stable row IDs preserve scroll on append

Every appended row is tagged with a synthetic `__rowId` field — a string from a monotonic counter (`rowIdCounterRef`). On `reset()`, the counter is reset to 0. The component passes `getRowId={(p) => p.data.__rowId as string}` through `ListEntities → GridView → AgGridWrapper → AgGridReact`.

With `getRowId` defined, ag-grid uses immutable-data semantics: when the `rowData` prop changes, ag-grid diffs old IDs vs new IDs, identifies adds/removes/updates, and applies the diff in place. Existing row nodes are reused, and scroll position is preserved.

**Why not `applyTransaction({ add: newRows })`?** That API requires bypassing the `rowData` prop, which the `AgGridWrapper` already drives declaratively when `isLiveData`. Using `getRowId` keeps the data flow one-way and avoids a special-case imperative path.

### Decision 9: Empty-state suppression during initial load

`getIsEmptyData={() => hasLoadedOnce && rowData.length === 0}` is passed to `ListEntities`. `hasLoadedOnce` flips to `true` in the `finally` of `fetchMore` and also in the `useEffect` if the day queue is empty after `reset()`. This prevents a brief flash of "no data" overlay between mount and the first response, and handles the degenerate `endDate <= startDate` case.

### Decision 10: Scope to Usage Log only

No edits to `constants/ag-grid.ts`. The four other grids that consume `PAGE_SIZE` and `infiniteGridOptions` are unchanged.

## Risks / Trade-offs

[**Unbounded single-day response**] → For a high-traffic 24-hour window, a single response can be large. The day window is the inner bound; the user-selected time range is the outer bound.
**Mitigation**: If product feedback shows this is painful in practice, the natural next step is to ask the BE to apply a default cap when `limit` is null, or to shrink the FE window from 24h to a smaller bound. The architecture supports either.

[**Sort/filter UX during initial load**] → A user typing in a column filter while the initial fetch is still running will trigger a reset + new fetch. The previous in-flight fetch is invalidated by `requestId` and its response (if it arrives) is dropped.
**Mitigation**: This is the correct behavior. The wasted request is acceptable.

[**Loading overlay timing**] → If `fetchMore` runs before `onGridReady` fires (race during mount), `gridApiRef.current` is `null` and the initial `setGridOption('loading', true)` no-ops. The empty-state is suppressed by `getIsEmptyData` until `hasLoadedOnce` flips.

[**Ascending sort + day-queue traversal**] → With ascending time sort, ag-grid's clientSide model resorts `rowData` in memory — older rows appear at the top. But we fetch newest-first, so initially the user sees only the newest day at the top until older days arrive.
**Mitigation**: Documented trade-off. Most users keep the default desc sort. If this surfaces, consider walking the queue oldest-first when sort is asc.

[**Log readability**] → The day windows are rolling 24h spans anchored to `endDate`, not aligned to calendar days. Log lines like `day [2026-03-17T22:59:59.999Z, 2026-03-18T22:59:59.999Z)` can mislead a reader into expecting "March 17 data only."
**Mitigation**: Spec describes the rolling-window contract explicitly. If logs cause repeated confusion, reformat with local-time hints.

## Migration Plan

No data migration. Pure FE behavior swap.

1. Land the change (no feature flag — fully backwards-compatible with the BE).
2. Verify on staging across all four Usage Log tabs (Traces, Conversations, MCP, Toolset Traces) plus the entity-embedded UsageLog view.
3. Monitor telemetry endpoint p95 latency for one release cycle.

Rollback: revert the FE PR. BE contract is unchanged.

## Open Questions

### Q1: Cap on `rowData` growth?

A user who scrolls through many days could accumulate hundreds of thousands of rows in `rowData`. ag-grid's row virtualization keeps rendering fast, but JS heap grows. If this becomes a problem, options:

- Add a soft cap with a "narrow the range" message.
- Defer until a real user report.

Default for now: ship without a ceiling; revisit on feedback.

### Q2: Local-calendar-day alignment?

Rolling 24h windows match the user's selected range exactly but produce log lines that don't align with calendar days. Local-day alignment would be more intuitive in logs and possibly UX, at the cost of one extra partial-day window and timezone handling. Defer until product feedback.
