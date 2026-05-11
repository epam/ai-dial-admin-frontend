## Why

The container Events tab streams Kubernetes events over SSE and prepends each new event to the top of the grid. Every arrival currently snaps the user's scroll back to the top, so any user mid-read of an older event loses their place the moment a new event arrives — which on a busy container can be every few seconds. Issue #1802 asks for the items currently in view to stay in view as new events come in.

The root cause is two-fold:
1. `AgGridWrapper` has no `getRowId` configured, so `rowData` updates fall back to a full row rebuild instead of an id-keyed delta.
2. `AgGridWrapper`'s column-state effect re-applies `updateGridOptions`, `setFilterModel`, and `applyColumnState` on every `rowData` change, not just when columns or storage change. Together these wipe scroll on every event.

## What Changes

- Add a `getRowId` prop to `AgGridWrapper` and route the events grid through it using the stable `KubEvent.id`. When set, AG Grid does row-id-keyed delta updates that preserve scroll, focus, and row state.
- Add an opt-in `isLiveData` flag to `AgGridWrapper`. When `isLiveData` is set, the wrapper loads persisted filter and column state **once** (on mount and when `columnDefs` / `storageKey` change), and routes `rowData` / `columnDefs` through `AgGridReact`'s React props so AG Grid handles row diffing on its own. When `isLiveData` is unset (default for every existing call site), the wrapper preserves its current imperative `updateGridOptions` + `applyColumnState` flow on every `rowData` tick. **No behavior change for grids that don't opt in.**
- Add a small reusable `useGridFollowOnUpdate` hook that the events grid opts into. It implements the standard live-feed two-mode behavior:
  - **Auto-follow** when the user is at the top (newest in view) — new events appear in view, scroll stays at the top.
  - **Anchored read** when the user has scrolled into history — the topmost visible row is anchored across updates so the rows the user is reading stay put as new events prepend above.
  - Mode is implicit, derived per update from the grid's vertical pixel range with a small tolerance. No UI toggle.
- Wire the events grid (`Containers/View/Events/Events.tsx`) to use the hook.

### Non-goals

- No backend changes. SSE protocol and payload remain as-is.
- No changes to event filtering, sorting (still newest-first by `firstTimestamp`), or column definitions.
- Pods / Execution log / other live grids are out of scope, even though the hook is reusable. They keep their current behavior in this change.
- No "live updates on/off" toggle, no "N new events — jump to top" affordance.

## Capabilities

### New Capabilities
- `container-events-grid-scroll`: Defines the container Events grid's scroll behavior across SSE-driven row updates — including the auto-follow / anchored-read mode selection, anchor semantics, and how it interacts with stable row identity.

### Modified Capabilities
<!-- None. The existing deployment-sse-stream-resilience capability covers stream/error semantics and is unaffected. -->

## Impact

- **Touched files**:
  - `apps/ai-dial-admin/src/components/Grid/AgGridWrapper.tsx` — new `getRowId` prop, split the column-state effect.
  - `apps/ai-dial-admin/src/components/Grid/GridView/GridView.tsx` (and `ListView/List.tsx`) — pass the new prop through.
  - `apps/ai-dial-admin/src/components/Containers/View/Events/Events.tsx` — set `getRowId`, attach the follow-on-update hook.
  - `apps/ai-dial-admin/src/components/Grid/hooks/useGridFollowOnUpdate.ts` (new) — the reusable hook.
  - Co-located tests under `tests/`.
- **Cross-feature risk is contained by the opt-in flag.** `AgGridWrapper` is shared by ~every grid in the app, so the change preserves the existing imperative-update path for every call site that doesn't pass `isLiveData`. The new code path is only exercised by the events grid in this change. Regression sweep for the shared wrapper is limited to confirming that the default branch is byte-for-byte equivalent to today.
- **No breaking API change**: both `getRowId` and `isLiveData` are new optional props; every existing call site keeps its current behavior unchanged.
- **No new dependencies**.
