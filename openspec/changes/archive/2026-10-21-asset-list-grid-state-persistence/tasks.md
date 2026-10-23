## 1. Shared persistence hook (refactor, no behavior change)

- [x] 1.1 Create `apps/ai-dial-admin/src/components/Grid/hooks/use-grid-state-persistence.ts` and move into it
  the persistence logic from `components/Grid/AgGridWrapper.tsx`: sized-column ref, ignored resize sources,
  `onStateChanged`, the 300 ms debounced save, `handleColumnResized`, the initial restore effect, and stored
  width merging into column defs (D1). Move the pure helpers (`columnStateToStore`, `columnStateToApply`,
  `mergeStoredColumnDefs`, `applyGridState`) to `components/Grid/utils.ts` and `GRID_SIZED_RESIZE_SOURCES` to
  `components/Grid/constants.ts`.
- [x] 1.2 Rewire `AgGridWrapper` onto the hook. Keep `persistedWidthOptions` and its
  `onGridColumnsChanged`/`onDisplayedColumnsChanged` sizing as they are, and keep the grid-option spread order.
  `components/Grid/tests/AgGridWrapper.spec.tsx` passes without edits.

## 2. Hook capabilities for FileManager

- [x] 2.1 Add `persistedFields?: (keyof ColumnState)[]`: when it's given, reduce each stored column to those
  keys, with `width` still kept only for dragged columns (D2).
- [x] 2.2 On save, merge with the stored columns: columns absent from the grid keep their stored slot, present
  columns fill the slots present columns held in the grid's current order, and new columns go at the end (D4).
- [x] 2.3 Add `flex: null` to a def that gets a stored dragged width, drop `sortType` from the merged def, and
  pass column factories through untouched (D5).
- [x] 2.6 Add `userResizeSources?`: when it's given, a resize counts only if its source is listed and
  `finished` is true. When omitted, keep today's rule (D9).
- [x] 2.4 Add a guard so nothing is saved until the stored state has been applied to the attached grid, and
  expose `reapplyState` (D6).
- [x] 2.5 Make `getColumnsStateFromStorage` return the default model when the stored JSON can't be parsed (D7).

## 3. FileManager wiring

- [x] 3.1 Add `FILE_MANAGER_GRID_PERSISTENCE` to `components/Common/FileManager/constants.ts`: `persistedFields`
  `['width', 'sort', 'sortIndex', 'sortType']`, `userResizeSources` `['uiColumnResized']`, `shouldRestoreOrder`.
  Remove `ASSET_LIST_FILTER_STORAGE_KEY` (D8).
- [x] 3.2 In `components/Common/FileManager/FileManager.tsx`:
  - call `useGridStatePersistence({ storageKey: view, columnDefs, gridApi, ...FILE_MANAGER_GRID_PERSISTENCE })`;
  - pass the merged `columnDefs` to `getGridOptions`;
  - inject the hook's handlers and an `onGridColumnsChanged` that calls `reapplyState` into
    `additionalGridOptions`;
  - restore through `applyColumnState({ applyOrder: true })` + `setFilterModel` in `onGridApiChange` (D3);
  - delete `handleGridFilterChanged`, the sessionStorage restore, and `gridReadyRef`.

## 4. Unit tests

- [x] 4.1 Add `components/Grid/hooks/tests/use-grid-state-persistence.spec.ts`, covering:
  - `persistedFields` reduction
  - only dragged widths stored
  - `autosizeColumns`/`sizeColumnsToFit` resizes ignored
  - absent columns keep their slot on save
  - `flex: null` on a merged dragged column
  - no save before restore
  - `reapplyState` re-applies order, sort and filters
- [x] 4.2 Extend `components/Grid/utils.spec.ts` (or `tests/grid-state-storage.spec.ts`) so an unparseable
  entry returns the default model.
- [x] 4.3 Extend `components/Common/FileManager/tests/FileManager.spec.tsx`, covering:
  - handlers reach `DialFileManager`'s `gridOptions.additionalGridOptions`
  - stored state is restored on `onGridApiChange` and on `onGridColumnsChanged`
  - the key is `gridColumnsState<view>`
  - `sessionStorage` is never touched

  Add any missing mocks to `apps/ai-dial-admin/test-setup.tsx`.

## 5. Browser verification

- [x] 5.1 Check in the browser against the local stack, on Platform Models and folder lists:
  - a dragged Name width survives F5 and folder switches
  - column order and filters survive folder switches and a reload
  - compact view shows Name, and the stored order comes back after leaving it

## 6. Quality gates

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and
  `npm run test`; all pass.
