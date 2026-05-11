## Context

The container Events tab (`Containers/View/Events/Events.tsx`) renders a `KubEvent[]` list through `ListEntities` → `GridView` → `AgGridWrapper` → `AgGridReact`. New events arrive over SSE in `ContainerView.tsx` and are merged into the array with `setEvents(prev => [...prev, data].sort((a, b) => b.firstTimestamp - a.firstTimestamp))` — a brand-new array reference each tick, sorted descending so the newest is at index 0.

Two things conspire to reset scroll on every tick:

1. **No `getRowId`.** AG Grid cannot do row-keyed delta updates without a stable id. Each `rowData` change is treated as a fresh dataset, so rendered rows are torn down and rebuilt — scroll resets.
2. **`AgGridWrapper.tsx:152-159` re-applies column state on every `rowData` change.** The effect's dependency array includes `rowData`, so on each new event it runs `gridApi.updateGridOptions({ columnDefs, rowData })`, `gridApi.setFilterModel(model.filters)`, and `gridApi.applyColumnState({ state: model.columns })`. The latter two have nothing to do with new rows; they should only run on first attach or when `columnDefs` / `storageKey` changes.

The user's requirement (Issue #1802) is that the rows in view stay in view as new events arrive. Two reading modes need to coexist seamlessly:

- **Auto-follow** — the user is at the top (the "live tail" position). New events appear in view; scroll stays at 0.
- **Anchored read** — the user has scrolled into history. The row they were reading stays put as new events prepend above it, so the viewport effectively shifts down by the height of the prepended row(s).

This is the same pattern used by terminals, Slack, and most log viewers. Mode is implicit, derived per update from the grid's vertical pixel range.

`KubEvent.id: string` is already populated by the backend and is unique per event, so it is suitable for `getRowId`.

`AgGridWrapper` is shared by ~every grid in the app, so changes there carry cross-feature risk and need to preserve current behavior for callers that don't opt in.

## Goals / Non-Goals

**Goals:**
- The container Events grid preserves scroll across SSE-driven row updates.
- Auto-follow and anchored-read modes coexist, selected implicitly per update from the user's scroll position.
- The hook implementing the mode switch is reusable by future live grids (pods, logs) without touching `AgGridWrapper`.
- `AgGridWrapper` no longer churns filter / column state on every `rowData` tick — a general-purpose improvement that benefits every grid in the app.
- Existing call sites of `AgGridWrapper` keep their current behavior — no implicit migrations.

**Non-Goals:**
- No SSE / backend changes. `deployment-sse-stream-resilience` semantics are untouched.
- No "live updates on/off" toggle. No "N new events — jump to top" badge.
- No row-virtualization / windowing changes. AG Grid's clientSide row model continues to render the full set.
- Pods, Execution log, and other live grids are NOT migrated in this change. They keep their existing behavior.
- No retroactive `getRowId` rollout to all grids. We add the prop and use it only where needed; existing call sites are unchanged.

## Decisions

### 1. Add `getRowId` as an optional prop on `AgGridWrapper` (instead of inferring from `data.id`)

**Decision:** Expose `getRowId?: (params: GetRowIdParams<T>) => string` on `AgGridWrapper` and pass it to `AgGridReact`. The events grid sets `getRowId={({ data }) => data.id}`. Other grids that don't pass it keep their current id-less behavior.

**Why over alternatives:**
- *Auto-default to `data.id`*: Tempting, but not every grid's row type carries an `id` field, and even those that do may not have stable ones (some lists are derived/joined). An implicit default would silently change behavior for every grid in the app — too broad a blast radius for one ticket.
- *Hard-code `getRowId` inside the events grid wrapper only*: We'd have to fork `AgGridWrapper` or push an internal-only prop. An optional public prop is the same code with less coupling.

### 2. Make the column-state-effect change opt-in via an `isLiveData` flag

**Decision:** Add `isLiveData?: boolean` to `AgGridWrapper`'s props. When **unset**, every existing call site keeps the current imperative path byte-for-byte: `setGridColumnsState` runs on every `rowData` change, calling `gridApi.updateGridOptions({ columnDefs, rowData })`, `gridApi.setFilterModel(...)`, and `gridApi.applyColumnState(...)`. When **set**, the wrapper switches to a declarative path:

- `rowData`, `columnDefs`, and `getRowId` are passed as React props on `<AgGridReact>`, so AG Grid receives data and column updates through its own prop-diff path.
- A separate effect, keyed on `[columnDefs, gridApi, storageKey, isLiveData]` (no `rowData`), loads persisted state from `localStorage` once on mount and re-loads it only when `columnDefs` / `storageKey` change.

```ts
// Live-data path — runs once on mount and on columnDefs/storageKey changes.
useEffect(() => {
  if (!isLiveData || !columnDefs || !gridApi) return;
  if (storageKey) {
    const model = getColumnsStateFromStorage(storageKey, defaultSorts);
    gridApi.setFilterModel(model.filters);
    gridApi.applyColumnState({ state: model.columns });
  } else {
    gridApi.applyColumnState({ state: defaultSorts });
  }
}, [columnDefs, gridApi, storageKey, isLiveData]);

// Legacy path — preserved exactly. Runs on every rowData tick for non-live grids.
useEffect(() => {
  if (isLiveData || !columnDefs || !gridApi) return;
  setGridColumnsState(defaultSorts);
}, [columnDefs, gridApi, rowData, setGridColumnsState, storageKey, isLiveData]);

// React props for live-data grids only — non-live grids continue to receive
// data via the imperative updateGridOptions call inside setGridColumnsState.
<AgGridReact
  rowData={isLiveData ? rowData : undefined}
  columnDefs={isLiveData ? columnDefs : undefined}
  getRowId={getRowId}
  ...
/>
```

The events grid sets `isLiveData`. No other call site changes.

**Why over alternatives:**
- *Apply the split to every grid* (the original plan): cleaner long-term, but it's a behavior change in shared infrastructure for a release-0.17 ticket. The opt-in flag gives the same fix for the events grid with zero blast radius elsewhere. The latent waste in the legacy path is acceptable until we have evidence it matters; a follow-up change can flip the default and remove the flag.
- *Make `getRowId` imply `isLiveData`*: tempting (the two travel together for live feeds), but they're conceptually distinct — `getRowId` is about row identity, `isLiveData` is about state-restore cadence. Coupling them surprises readers and removes the ability to opt into one without the other.
- *Hide the flag inside `Events.tsx` (no shared-wrapper changes at all)*: equivalent to option C from the proposal — leaves the latent waste in place for every future live grid. Not worth saving the prop.

**Important:** `isLiveData` is a *behavioral* flag, not a *use-case* label. The only thing it controls is "when does persisted state get re-applied to the grid." Future authors should treat the name as descriptive of the live-data use case where this matters, not as documentation of every behavior the wrapper might one day want to vary by use case.

### 3. Auto-follow / anchored-read state machine via `useGridFollowOnUpdate`

**Decision:** Add `apps/ai-dial-admin/src/components/Grid/hooks/use-grid-follow-on-update.ts` exporting a hook with this shape:

```ts
useGridFollowOnUpdate<T>({ gridApi, rowData, getRowId, getViewportEl? })
```

`getViewportEl` is an optional resolver for the scrollable AG Grid viewport element; it defaults to `document.querySelector('.ag-body-viewport')` (adequate when only one live grid is mounted at a time) and exists primarily as a test seam, since JSDOM does not expose AG Grid's internal DOM via the gridApi.

It captures pre-update state in a `useLayoutEffect` keyed on `rowData`:

- `wasAtTop` = `(gridApi.getVerticalPixelRange()?.top ?? 0) < AT_TOP_TOLERANCE_PX`
- `anchorRowId` = the row id of the first **rendered** row whose pixel range intersects the viewport top — computed by walking from `getFirstDisplayedRowIndex()` to `getLastDisplayedRowIndex()` and picking the first node where `rowTop + rowHeight > viewportTop`. AG Grid's "first rendered row" includes overscan buffer rows above the viewport, so anchoring on that index would scroll the user's actual reading row off-screen.
- `offset` = `anchorRowTop - viewportTop` — the pixel distance from the viewport top down to the anchor row's top. This can be negative (row's top is scrolled above the viewport), zero (row flush with viewport top), or positive (gap above the row). Capturing this offset is what lets restoration preserve mid-viewport positions and sub-row precision instead of snapping the anchor to the viewport top.

The capture in `useLayoutEffect` is critical: ag-grid-react v35 applies `rowData` prop changes inside its own `useEffect` (we verified this in the dist source — `extractGridPropertyChanges` → `_processOnChange` is gated by `useEffect`). Since `useLayoutEffect` runs in the same commit phase **before** any `useEffect`, the gridApi at capture time still reflects the user's pre-update scroll position, regardless of parent/child component nesting. Approaches based on subscribing to `bodyScroll` (capture continuously and read on rowData change) are unsafe: AG Grid fires `bodyScroll` synchronously during the data update because the scrollbar shifts, which overwrites the pre-update anchor with post-update state before the restoration runs.

Restoration is deferred to AG Grid's `modelUpdated` event, not to a parent `useEffect`. Reasons:
- With React 19, ag-grid-react may queue prop processing asynchronously (`runWhenReadyAsync()` returns `isReact19()`). A parent `useEffect` keyed on `rowData` could fire before AG Grid has processed the new data — `getRowNode(anchorRowId)` would then return stale row indices.
- `modelUpdated` is AG Grid's authoritative "model is fully settled" signal. It fires after row model rebuild, sort, and filter application.

A `restorePendingRef` boolean is set by the pre-update `useLayoutEffect` and consumed by the `modelUpdated` listener, so the listener no-ops for unrelated `modelUpdated` events (e.g. AG Grid's own internal updates).

When the listener fires:
- If `wasAtTop`: `gridApi.ensureIndexVisible(0, 'top')` (no-op when nothing changed).
- Else: find the new node via `gridApi.getRowNode(anchorRowId)`. If `node.rowIndex` or `node.rowTop` is null, no-op. Otherwise:
  1. `gridApi.ensureIndexVisible(node.rowIndex, 'top')` to bring the row into AG Grid's rendered range.
  2. `viewport.scrollTop = max(0, node.rowTop - offset)` to land the anchor row at its captured on-screen Y. This preserves mid-viewport and sub-row positioning that `ensureIndexVisible(_, 'top')` alone cannot — AG Grid's positions are row-aligned only.

```
                 ┌───────┐
top of grid →    │ NEW   │ ◀── auto-follow: ensureIndexVisible(0, 'top')
                 ├───────┤
                 │ row 1 │
                 │ row 2 │ ◀── anchored read: viewport.scrollTop = newRowTop - offset
                 │ row 3 │     (anchor row's on-screen Y is preserved)
                 └───────┘
```

**Why over alternatives:**
- *Imperative `applyTransaction({ add: [...] })` from the SSE handler*: Most surgical for streaming, but couples `ContainerView.tsx` (which today is purely data-driven) to the grid api. Pushes grid awareness into a place it doesn't belong.
- *Capture/restore scroll inside `AgGridWrapper`*: Would special-case live-feed semantics in a generic component. Hook + opt-in is cleaner.
- *Use AG Grid's `suppressScrollOnNewData`*: Available, but only handles the "stay at top" half of the requirement. Not enough for anchored read.
- *Restore via `ensureIndexVisible(rowIndex, 'top')` alone (the original implementation)*: Snaps the anchor to the viewport top. Loses sub-row precision and yanks a mid-viewport row upward, dropping the rows the user could see above it off-screen. Pixel-offset preservation costs one extra `viewport.scrollTop` write per restore and avoids both problems.

### 4. Mode is implicit, not user-controlled

**Decision:** No toggle, no badge. The user's scroll position determines mode each update.

**Why:** This matches the prevailing UX (Slack, terminals, log viewers). Adding UI affordances for an implicit behavior tends to make the implicit behavior feel less trustworthy. If feedback later asks for a "back to top — N new events" affordance, it can be added on top non-disruptively.

### 5. Tolerance for "at top"

**Decision:** Treat `top < 8px` as "at top". A pure `top === 0` check is too brittle — sub-pixel scroll, momentum scroll on macOS, and AG Grid's own internal corrections all leave small offsets that would otherwise flip the user out of follow mode permanently. The value lives as the module-level `AT_TOP_TOLERANCE_PX` constant rather than a hook parameter; only a single live grid uses the hook today, and a parameter only the default value is ever passed to is over-parameterisation. If a future caller needs a different value, the constant becomes a parameter then.

### 6. Sorting and filter changes during anchored mode

**Decision:** When the user changes sort or filters, the anchor is dropped — the next update reverts to whichever mode the new scroll position dictates (almost always auto-follow because re-applying sort/filter resets scroll). No special re-anchoring.

**Why:** The user's act of changing sort/filter is itself a re-orientation; trying to preserve "what they were reading" across that boundary is more confusing than helpful.

### 7. Disable `animateRows` for live-data grids

**Decision:** When `isLiveData` is set, `AgGridWrapper` forwards `animateRows={false}` to `AgGridReact`. AG Grid's default is `animateRows: true`, which produces a CSS `transition: transform 0.4s, top 0.4s, opacity 0.2s` on `.ag-row`. When events arrive every few hundred ms, every still-rendering row is mid-transition when the next event arrives — the visible result is a continuous "blink" / "shimmer" of every row on screen, plus our scroll-restoration fights the in-progress transform.

**Why over alternatives:**
- *Override the row transition in CSS*: works, but duplicates the AG Grid prop's intent in a separate place and is easy for a future reader to revert without realising it interacts with `animateRows`.
- *Slow the SSE stream*: out of scope; backend contract.
- *Leave it on*: rejected — the visual effect is bad and the scroll restoration is correct in pixel terms but visibly jittery.

The flag is scoped to `isLiveData` so non-live grids keep AG Grid's default animation for their (rare, user-driven) row reorders.

## Risks / Trade-offs

- **Risk:** Two code paths inside `AgGridWrapper` (live and legacy) is more surface to maintain than one. Future authors can mistakenly route a non-live grid through the live path and get state-restore semantics they didn't expect (or vice versa). → **Mitigation:** Default is `isLiveData={undefined}` → legacy path. Document the flag in a comment above the props interface and on the prop itself. The two effects are clearly guarded by `if (isLiveData)` / `if (!isLiveData)` early returns so a reader can see at a glance which path runs.
- **Risk:** Carrying the latent waste in the legacy path (re-applying filter/column state on every `rowData` tick) keeps a known footgun alive for every grid that doesn't opt in. → **Mitigation:** Accepted for this change. A follow-up can flip the default and remove the flag once we have confidence from real usage of the live path.
- **Risk:** `getRowId` requires every row to have a unique, stable id. If `KubEvent.id` is ever non-unique (e.g. backend bug), AG Grid throws. → **Mitigation:** Trust the backend contract (`KubEvent.id` is documented as unique) and let the error surface — it would indicate a real backend bug worth seeing. No client-side defensive de-dup.
- **Risk:** Anchor row may scroll into a filtered-out state. → **Mitigation:** The hook falls back to the nearest visible row by `firstTimestamp`. If nothing matches, no-op (user keeps current pixel offset, which is acceptable).
- **Risk:** Tolerance value (`8px`) is a heuristic — too low and follow mode is brittle, too high and a deliberate small scroll feels ignored. → **Mitigation:** Start at 8px as the `AT_TOP_TOLERANCE_PX` module constant. Adjust based on QA feedback if needed; promote to a hook parameter only when a second caller needs a different value.
- **Risk:** `useLayoutEffect` + post-flush `ensureIndexVisible` + `viewport.scrollTop` write introduces two scroll operations per restore. → **Mitigation:** Within a single JavaScript task, successive scrollTop writes coalesce to one paint, so the cost is one layout pass per restore. We only restore on `rowData` changes, so the rate is bounded by the SSE event rate (a few per second on a busy container) — no measurable cost expected for typical event volumes (≤ thousands).
- **Risk:** Default `getViewportEl` does `document.querySelector('.ag-body-viewport')`, which returns the first match. If two live-data grids are ever mounted simultaneously, the second one's restore would target the first's viewport. → **Mitigation:** No call site mounts two live grids today. If a future call site does, callers can inject a scoped `getViewportEl` that returns their grid's viewport (e.g. by walking from a rendered cell up to `.ag-body-viewport`).
- **Trade-off:** The hook lives in `Grid/hooks/`, not `AgGridWrapper`, so each future live grid has to opt in. Trade explicit opt-in for keeping `AgGridWrapper` generic. Acceptable, given how few live grids exist.

## Open Questions

None blocking. To revisit if encountered during implementation:
- Is there a future need for a "scroll to newest" affordance when in anchored mode and many events have arrived since? Out of scope for this change but a natural extension.
