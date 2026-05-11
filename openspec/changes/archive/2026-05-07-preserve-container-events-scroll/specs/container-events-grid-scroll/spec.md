## ADDED Requirements

### Requirement: Container events grid preserves scroll across SSE-driven updates

The container Events tab SHALL NOT reset its scroll position when the SSE stream delivers a new event. Existing rendered rows SHALL be preserved across `rowData` updates by AG Grid's row-id-keyed delta path. The grid SHALL be configured with a stable `getRowId` derived from `KubEvent.id`, which is unique per event as supplied by the deployment-manager backend.

#### Scenario: User scrolled into history when a new event arrives

- **WHEN** the user has scrolled the events grid such that the topmost rendered row is below the first row in the dataset
- **AND** a new `KubEvent` arrives over SSE and is merged into the events array
- **THEN** the grid does NOT scroll to the top
- **AND** the row the user was previously looking at remains rendered (not torn down and re-instantiated)
- **AND** any selected / focused cell or row state is preserved

#### Scenario: User has manually applied a column filter when a new event arrives

- **WHEN** the user has set a filter (e.g. on `eventType` or `message`) on the events grid
- **AND** a new `KubEvent` arrives over SSE and is merged into the events array
- **THEN** the user's filter remains active
- **AND** the floating filter inputs retain their values
- **AND** the user's sort / column-order / column-width state is preserved

#### Scenario: New event has the same id as an event already in the buffer

- **WHEN** a Kubernetes event update arrives with the same `KubEvent.id` as a row already in the buffer (e.g. an event whose `count` was incremented)
- **THEN** the grid updates the existing row in place rather than rendering a duplicate
- **AND** scroll position and row state are preserved

### Requirement: Container events grid implements auto-follow / anchored-read behavior

The container Events grid SHALL behave as a live feed with two implicit modes selected per update from the user's current scroll position:

- **Auto-follow** when the viewport is at the top of the grid (within a small pixel tolerance). New events appearing at the top SHALL remain in view; the grid SHALL re-anchor to row index 0 after each update.
- **Anchored read** when the viewport is below the top. The topmost-intersecting row at the moment of the update SHALL remain at the same on-screen Y position after the update — i.e. the grid SHALL scroll by the height of any rows that prepended above the anchor, preserving the anchor row's pixel offset within the viewport (top, middle, or bottom) rather than snapping it to the viewport top.

The mode SHALL NOT be exposed via UI affordance (no toggle, no badge). It SHALL be derived per update from `gridApi.getVerticalPixelRange()`.

#### Scenario: User is at the top when a new event arrives (auto-follow)

- **WHEN** the events grid's viewport top is within `8px` of the top of the rendered list
- **AND** a new `KubEvent` arrives and is prepended (newest-first sort)
- **THEN** the new event is shown at row index 0 in the viewport
- **AND** the viewport remains at the top after the update

#### Scenario: User has scrolled into history when a new event arrives (anchored read)

- **WHEN** the events grid's viewport top is more than `8px` below the top of the rendered list
- **AND** the topmost-intersecting row at the moment of the update has `KubEvent.id === A` and sits `Δ` pixels below the viewport top
- **AND** a new `KubEvent` arrives and is prepended (newest-first sort)
- **THEN** the row whose `KubEvent.id === A` remains at the same on-screen Y position after the update — its top is `Δ` pixels below the viewport top, regardless of whether `Δ` is small (row near the top), large (row near the bottom), or negative (row's top scrolled above the viewport)
- **AND** the prepended new event is rendered above the viewport, not in it

#### Scenario: Multiple events arrive in rapid succession during anchored read

- **WHEN** the user is in anchored-read mode (scrolled into history)
- **AND** N new events arrive between consecutive renders
- **THEN** the row used as the anchor at the start of the burst remains at the same on-screen Y position across the burst
- **AND** auto-follow does NOT temporarily activate mid-burst because of intermediate scroll-corrections

#### Scenario: Anchor row becomes filtered out before the update completes

- **WHEN** the user is in anchored-read mode
- **AND** the user changes a filter that removes the anchor row from the visible set during the same render cycle
- **THEN** the grid does NOT throw and does NOT scroll to the top
- **AND** the viewport falls back to whichever mode the new scroll position dictates (typically auto-follow because filter changes reset scroll)

#### Scenario: User changes sort or filters

- **WHEN** the user clicks a column header to change sort, or edits a filter
- **THEN** the anchor is dropped for that update
- **AND** subsequent updates re-derive mode from the resulting scroll position

#### Scenario: Container switch clears events and resets mode

- **WHEN** the user navigates from one container to another (the SSE subscription's container id changes)
- **THEN** the events array is cleared synchronously
- **AND** the next update is treated as the first update for the new subscription (no anchor carries over from the previous container)

### Requirement: AgGridWrapper exposes an opt-in isLiveData flag that changes its state-restore cadence

`AgGridWrapper` SHALL accept an optional boolean `isLiveData` prop. The flag SHALL default to falsy and SHALL be opt-in per call site. The container Events grid SHALL set `isLiveData={true}`; every other call site SHALL leave it unset.

When `isLiveData` is set, `AgGridWrapper` SHALL:
- pass `rowData`, `columnDefs`, and `getRowId` to `AgGridReact` as React props so AG Grid handles row diffing through its own prop-diff path;
- apply persisted column state and filter model only on initial grid attach and when `columnDefs` or `storageKey` change;
- NOT call `gridApi.applyColumnState` or `gridApi.setFilterModel` as a side effect of `rowData` changes alone;
- pass `animateRows={false}` to `AgGridReact` so prepended rows do not visually slide existing rows to their new positions — the AG Grid default `animateRows: true` produces a per-tick "blink" effect when streaming events arrive faster than the animation can settle.

#### Scenario: isLiveData is set — row position animations are disabled

- **WHEN** a parent passes `isLiveData={true}` to `AgGridWrapper`
- **THEN** `animateRows={false}` is forwarded to `AgGridReact`
- **AND** existing rows do not animate their `top` / `transform` positions when new rows prepend

When `isLiveData` is unset, `AgGridWrapper` SHALL preserve its pre-change behavior exactly: the imperative `gridApi.updateGridOptions({ columnDefs, rowData })` + `gridApi.setFilterModel(...)` + `gridApi.applyColumnState(...)` sequence SHALL run on every `rowData` change as it does today.

#### Scenario: isLiveData is set and rowData changes without column or storageKey changes

- **WHEN** a parent passes `isLiveData={true}` to `AgGridWrapper`
- **AND** the parent passes a new `rowData` reference while `columnDefs` and `storageKey` are unchanged
- **THEN** `gridApi.applyColumnState` is NOT called as a side effect of the update
- **AND** `gridApi.setFilterModel` is NOT called as a side effect of the update
- **AND** any user-applied filters, sorts, column widths, and column order remain in effect

#### Scenario: isLiveData is set and columnDefs change

- **WHEN** a parent passes `isLiveData={true}` to `AgGridWrapper`
- **AND** the parent passes a new `columnDefs` reference
- **THEN** the persisted column state for `storageKey` is re-loaded and applied
- **AND** the persisted filter model is re-applied

#### Scenario: isLiveData is set and the grid mounts with a storageKey

- **WHEN** `AgGridWrapper` mounts with `isLiveData={true}` and a non-empty `storageKey`
- **THEN** persisted column state and filter model are loaded from `localStorage` and applied once

#### Scenario: isLiveData is unset — legacy behavior preserved

- **WHEN** a parent does NOT pass `isLiveData` (or passes `false`)
- **AND** the parent passes a new `rowData` reference
- **THEN** `AgGridWrapper` follows its pre-change behavior: `gridApi.updateGridOptions({ columnDefs, rowData })`, `gridApi.setFilterModel(...)`, and `gridApi.applyColumnState(...)` are invoked as before
- **AND** observable behavior for the call site is identical to the pre-change implementation

### Requirement: AgGridWrapper exposes an optional getRowId prop

`AgGridWrapper` SHALL accept an optional `getRowId` prop and forward it to `AgGridReact`. When provided, AG Grid SHALL use it for row-id-keyed delta updates so that `rowData` replacements preserve scroll, focus, and row state. When omitted, `AgGridWrapper` SHALL preserve its current behavior (no `getRowId` set on `AgGridReact`), so existing call sites are unaffected.

#### Scenario: Caller passes getRowId

- **WHEN** a caller of `AgGridWrapper` passes `getRowId={({ data }) => data.id}`
- **THEN** subsequent `rowData` array replacements update existing rows in place by id
- **AND** rows whose ids are unchanged are not re-instantiated
- **AND** scroll position and selection / focus state are preserved

#### Scenario: Caller does not pass getRowId

- **WHEN** a caller of `AgGridWrapper` does not pass `getRowId`
- **THEN** `AgGridReact` is not given a `getRowId` callback
- **AND** the grid behaves identically to its pre-change behavior for that caller
