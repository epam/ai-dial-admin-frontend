## 1. AgGridWrapper — add opt-in isLiveData flag (legacy path preserved)

- [x] 1.1 In `AgGridProps<T>` (in `apps/ai-dial-admin/src/components/Grid/AgGridWrapper.tsx`), add `isLiveData?: boolean`. Add a short comment above the prop documenting that it switches the wrapper to a declarative (React-prop) data flow and loads persisted state once instead of on every `rowData` tick.
- [x] 1.2 Leave the existing `useEffect` that calls `setGridColumnsState(defaultSorts)` in place, but guard it with `if (isLiveData) return;` at the top so it runs only for non-live grids. Add `isLiveData` to its dependency array. This preserves the pre-change behavior for every existing call site byte-for-byte.
- [x] 1.3 Add a second `useEffect` keyed on `[columnDefs, gridApi, storageKey, isLiveData]` (no `rowData`) that runs only when `isLiveData` is set. It SHALL load `getColumnsStateFromStorage(storageKey, defaultSorts)` once and call `gridApi.setFilterModel(model.filters)` + `gridApi.applyColumnState({ state: model.columns })`. When `storageKey` is empty, it SHALL fall back to `gridApi.applyColumnState({ state: defaultSorts })`. It SHALL NOT call `updateGridOptions`.
- [x] 1.4 Pass `rowData`, `columnDefs`, and `getRowId` to `<AgGridReact>` as React props **only when `isLiveData` is set** (e.g. `rowData={isLiveData ? rowData : undefined}`, same for `columnDefs`). When unset, leave those props off so AG Grid continues to receive data exclusively through the legacy imperative path.

## 2. AgGridWrapper — add optional getRowId prop and plumb both new props

- [x] 2.1 In `AgGridProps<T>` (in `AgGridWrapper.tsx`), add `getRowId?: (params: GetRowIdParams<T>) => string`. Import `GetRowIdParams` from `ag-grid-community`.
- [x] 2.2 Forward `getRowId` to `<AgGridReact>` only when `isLiveData` is set, alongside `rowData` and `columnDefs` (per task 1.4). When `getRowId` is `undefined`, omit the prop from `<AgGridReact>`; do not coerce to a default.
- [x] 2.3 Plumb `isLiveData` and `getRowId` through `apps/ai-dial-admin/src/components/Grid/GridView/GridView.tsx` and `apps/ai-dial-admin/src/components/ListView/List.tsx` (`Props<T>` extends `GridViewProps<T>`) so that `<ListEntities isLiveData getRowId={...}>` reaches `AgGridWrapper`.

## 3. Tests for AgGridWrapper changes

- [x] 3.1 Add `apps/ai-dial-admin/src/components/Grid/tests/AgGridWrapper.spec.tsx` (or extend existing test file if one is added later) with tests asserting:
  - **Live path:** when `isLiveData` is set and only `rowData` changes after first render, `applyColumnState` and `setFilterModel` are NOT called (spy on AG Grid api via `onGridReady`).
  - **Live path:** when `isLiveData` is set and `columnDefs` reference changes, `applyColumnState` IS called.
  - **Live path:** when `isLiveData` is set, `getRowId` is forwarded to `AgGridReact`; when omitted, no `getRowId` is set.
  - **Legacy path:** when `isLiveData` is unset and `rowData` changes, the existing imperative sequence (`updateGridOptions` + `setFilterModel` + `applyColumnState`) runs as it does today.
- [x] 3.2 Use only mocks already centralized in `apps/ai-dial-admin/test-setup.tsx`. Do not introduce new global mocks; do not use `data-testid`.

## 4. useGridFollowOnUpdate hook

- [x] 4.1 Create `apps/ai-dial-admin/src/components/Grid/hooks/use-grid-follow-on-update.ts` exporting a hook with signature `useGridFollowOnUpdate<T>({ gridApi, rowData, getRowId, atTopTolerancePx?: number })` (default tolerance `8`).
- [x] 4.2 Implement pre-update capture in a `useLayoutEffect` keyed on `rowData`: read `gridApi.getVerticalPixelRange()?.top`, compute `wasAtTop`, and if not at top capture `anchorRowId` from the topmost displayed row (`gridApi.getFirstDisplayedRowIndex()` → `gridApi.getDisplayedRowAtIndex(...)` → `getRowId(node.data)`). Stash both on a ref.
- [x] 4.3 In a follow-up effect (or via `requestAnimationFrame` inside the same layout effect after data update flushes), apply: when `wasAtTop`, call `gridApi.ensureIndexVisible(0, 'top')`; otherwise resolve `gridApi.getRowNode(anchorRowId)` and call `gridApi.ensureIndexVisible(node.rowIndex, 'top')`. If the anchor row is no longer in the visible/displayed set, no-op.
- [x] 4.4 Add `gridApi.addEventListener('sortChanged', ...)` and `'filterChanged'` listeners that drop the captured anchor for the next update so sort / filter changes do not anchor stale rows.
- [x] 4.5 Clean up listeners on unmount and when `gridApi` identity changes.

## 5. Tests for useGridFollowOnUpdate

- [x] 5.1 Add `apps/ai-dial-admin/src/components/Grid/hooks/tests/use-grid-follow-on-update.spec.ts(x)` with `renderHook` cases covering:
  - When `wasAtTop`, `ensureIndexVisible(0, 'top')` is called after `rowData` changes.
  - When NOT at top, the topmost rowId is captured pre-update and `ensureIndexVisible` is called for that row's new index after `rowData` changes.
  - When the anchor row's `getRowNode` returns null after the update, no `ensureIndexVisible` call is made.
  - `sortChanged` and `filterChanged` events drop the next anchor.
- [x] 5.2 Use a fake `gridApi` object built in the test with the AG Grid methods stubbed via `vi.fn()`. Reuse mocks from `test-setup.tsx`; do not add new globals.

## 6. Wire the events grid

- [x] 6.1 In `apps/ai-dial-admin/src/components/Containers/View/Events/Events.tsx`, capture `gridApi` via `onGridReady` in local component state and pass `isLiveData getRowId={({ data }) => data.id}` through `<ListEntities>`.
- [x] 6.2 In the same component, call `useGridFollowOnUpdate({ gridApi, rowData: events, getRowId: ({ data }) => data.id })`.
- [x] 6.3 Verify `Containers/View/ContainerView.tsx` already clears `events` to `[]` on container switch (it does — keep behavior unchanged). No new code in `ContainerView.tsx`.

## 7. Tests for the events grid wiring

- [x] 7.1 Update / extend `apps/ai-dial-admin/src/components/Containers/View/Events/tests/Events.spec.tsx` to assert that `getRowId` is forwarded such that two consecutive `events` arrays sharing rows by id do not cause those rows' DOM nodes to be remounted.
- [x] 7.2 Add a focused integration test (in the same file or a sibling) that mounts `<Events>` with an initial event list, simulates a non-zero scroll position via the `gridApi` fake from `onGridReady`, then re-renders with one prepended event, and asserts that `ensureIndexVisible` was called with the originally-topmost row's id (rather than index 0).
- [x] 7.3 Reuse `useI18n` and other mocks from `test-setup.tsx`. No new globals; no `data-testid`.

## 8. Regression checks — confirm legacy path is unchanged

- [x] 8.1 Run the existing test suite (`npm run test`) and confirm no regressions in any grid-using component. With `isLiveData` defaulting to unset everywhere except `Events.tsx`, no other call site should observe a behavior change. Treat any test failure outside the events grid and the new wrapper tests as a sign that the legacy guard (`if (isLiveData) return;` early returns) was implemented incorrectly.
- [x] 8.2 Verify (by code reading, not new tests) that no other call site is silently passing `isLiveData` through `additionalGridOptions` or any other escape hatch. The flag SHALL be reachable only via the explicit prop chain `ListEntities` → `GridView` → `AgGridWrapper`.

## 9. Final quality gates

- [x] 9.1 Run `npm run lint`.
- [x] 9.2 Run `npm run format` (or `npm run format:write` if auto-fixing).
- [x] 9.3 Run `npm run test` and ensure it passes end-to-end.
- [x] 9.4 Run `openspec validate preserve-container-events-scroll --strict` and resolve any reported issues.
