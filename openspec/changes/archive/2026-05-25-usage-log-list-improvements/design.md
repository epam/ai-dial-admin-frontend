## Context

The Usage Log list was rebuilt in `usage-log-day-chunked-pagination` (archived 2026-05-21) to use AG-Grid's `clientSide` row model with React-owned `rowData`. Each scroll-triggered fetch pops a 24-hour `_time` window off a queue and appends the rows.

That design has two latent issues this change addresses:

1. **Sort scope.** The day-chunked model only orders rows *within* a window — sorting by any column other than `_time` produces a layered result.
2. **Filter typing.** The filter-model TypeScript type is text-only. Number columns produce `filterType: 'number'` models the code doesn't formally handle. Separately, `numericColumn.filterValueGetter` returns a thousands-formatted string, breaking AG-Grid's client-side number filter for values ≥ 1000.

Underneath both is a state-shape problem: `List.tsx` keeps 9 refs + 1 React state inline, and the reset paths overlap. The race that wipes filter input lives in that tangle.

## Decisions

### Decision 1: Sort lock via per-column `restrictSort` helper

`grid-columns.tsx` defines:

```ts
const restrictSort = (cols: ColDef[], sortableFields: string[] = []): ColDef[] =>
  cols.map((col) => (col.field && sortableFields.includes(col.field) ? col : { ...col, sortable: false }));
```

Each Usage Log column array is split into a raw `BASE_USAGE_LOG_*` and an exported wrapped version: `restrictSort(BASE_USAGE_LOG_*, ['completion_time'])`. `COMPLETION_TIME_COLUMN` carries `sortable: true`, `sort: 'desc'`, and `sortingOrder: ['asc', 'desc']` (skip the null tri-state). The list also passes `multiSort: false`.

**Alternatives rejected:**

- **Wrapper-level `defaultColDef: { sortable: false }` in `AgGridWrapper`.** Affects every grid in the app — too broad.
- **Caller-provided `defaultColDef` merged in `AgGridWrapper`.** Required a shared-component change for a Usage Log–specific policy.
- **Inline per-column `sortable: false` on every non-time column.** Easy to miss when a new column is added; the helper enforces the rule structurally.

### Decision 2: Direction-aware day queue

`buildDayQueue(timeRange, direction)`:

- `desc`: cursor starts at `toMs`, steps back by `DAY_MS`, windows pushed newest-first.
- `asc`: cursor starts at `fromMs`, steps forward by `DAY_MS`, windows pushed oldest-first.

Windows stay half-open `[start, end)` and contiguous. Each per-window request sends `orderBy: [{ $desc | $asc: '_time' }]` matching the direction so within-day ordering matches too. A direction flip is a reset.

**Alternative rejected:** FE-side reverse of desc-fetched chunks for the asc case — would force loading the entire range before any rows display, defeating the streaming model.

### Decision 3: `useUsageLogData` hook, refs-based (not reducer)

The data loop is extracted to `apps/ai-dial-admin/src/components/UsageLog/List/useUsageLogData.ts`. It owns the day queue, loading flag, request id, sort direction, filter model, row-id counter, first-after-reset flag, grid api ref, and the `rowData` state. It exposes:

```ts
{ rowData, onBodyScroll, onSortChanged, onFilterChanged, setGridApi }
```

`List.tsx` owns `handleGridReady`, which calls `setGridApi(event.api)` and forwards the optional `onGridReady` prop. The hook stays prop-callback-agnostic.

State stays in refs, not a reducer. A reducer-backed equivalent races during recursive auto-fetch: between `dispatch({ type: 'FETCH_START' })` and the recursive `fetchMore()` call, `stateRef.current` isn't yet updated, so the recursive call reads stale state and the next window is never fetched. Refs mutate synchronously and avoid this.

One atomic reset path: `restart({ timeRange, sortDirection, filterModel })` updates all three together. Three call sites (bootstrap effect, sort change, filter change) all funnel through it.

### Decision 4: Filter model split by `filterType`

```ts
export interface AgGridTextFilter {
  filterType: 'text';
  type?: string;
  filter?: string;
}

export interface AgGridNumberFilter {
  filterType: 'number';
  type?: string;
  filter?: number;
  filterTo?: number;
}

export type UsageLogFilterModel = Record<string, AgGridTextFilter | AgGridNumberFilter>;
```

`translateUsageLogFilter` dispatches on `filterType`. The number path emits `filter.filter` directly (no `.toString().replace(/,/g, '')` shim). `inRange` decomposes to `{ $and: [{ $gte }, { $lte }] }` defensively — not exposed by any column's `filterOptions` today, but won't crash if a future config exposes it.

### Decision 5: `useNotification` for errors

A single helper `notifyFetchError(response?)` inside the hook:

- With response (`success: false`): `showNotification(getErrorNotification(response.errorHeader, response.errorMessage, response.requestId))`.
- Without response (thrown): `showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(ErrorI18nKey.TryAgainLater)))`.

Both paths re-queue the failed window (`dayQueueRef.current.unshift(dayWindow)`) so a transient failure doesn't permanently strip a day of data — the user can retry by scrolling. `rowData` is preserved.

### Decision 6: Grid stays mounted; in-grid no-rows overlay

The list passes `getIsEmptyData={KEEP_GRID_MOUNTED}` (a module-level `() => false`). `GridView`'s existing signature already accepts `() => boolean`; no shared-component change needed. The grid is therefore never swapped for the standalone `DialNoDataContent`, so column filter UI (popup + floating filter inputs) survives data refetches.

The empty state is rendered INSIDE the grid via AG-Grid's `noRowsOverlayComponent`:

```ts
const NoRowsOverlay: FC<{ title: string }> = ({ title }) => <DialNoDataContent title={title} />;

additionalGridOptions: {
  noRowsOverlayComponent: NoRowsOverlay,
  noRowsOverlayComponentParams: { title: emptyDataTitle },
}
```

The component reference is stable (module-level), and the reactive `title` is passed via `noRowsOverlayComponentParams` — the idiomatic AG-Grid pattern.

The custom `overlayNoRowsTemplate` HTML string is removed.

### Decision 7: `numericColumn.filterValueGetter` removed

`filterValueGetter` was returning the value through the same formatter used for display (which inserts thousands separators). AG-Grid's client-side number filter then called `Number("1,274")` → `NaN` → all comparisons fail → the row was silently dropped. Removing the override lets AG-Grid filter against the raw cell value.

The visible cell still uses `valueFormatter` for display — only the filter-evaluation path changes.

## Risks / Trade-offs

- **Direction toggle vs. fully locked desc.** We allow toggling so users can browse from the start of a long range. The cost is the asc-iteration branch in `buildDayQueue` and a queue rebuild on flip.
- **Refs over reducer.** Refs are less visible to React DevTools, but the in-flight invalidation pattern relies on synchronous mutation. The hook is tested with a mocked `getData`.
- **Filter model widened to a union.** Translator tests cover both branches; the union is internal to `models/telemetry.ts` and `utils/telemetry.ts`.

## Migration / rollout

Single PR. No feature flag. Bisect-friendly — the prior archived change is the immediate parent.
