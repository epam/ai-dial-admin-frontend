## Context

See proposal.md for motivation and specs/asset-list-grid-state/spec.md for the required behavior. This
section covers only what shapes the approach.

- **Entity grids** persist through `components/Grid/AgGridWrapper.tsx`:
  - Storage: `localStorage["gridColumnsState" + storageKey]`, written via `saveColumnsStateToStorage` /
    `getColumnsStateFromStorage` (`Grid/utils.ts`), holding a `GridModel`: `{ columns, filters, sizedColIds }`.
  - Which widths are kept: only those in `sizedColIds`. Resizes from `autosizeColumns` / `sizeColumnsToFit`
    are ignored.
  - Saving: column moves, visibility changes and resizes are debounced by 300 ms; sorts and filters are saved
    at once.
  - Restoring: dragged widths are merged into the column defs, so they survive a defs rebuild, and
    filters and column state are applied through the grid API.
- **FileManager lists** render `DialFileManager` from `@epam/ai-dial-react-file-manager`:
  - The kit `Grid` sits underneath.
  - Columns use `flex: 1` (`getGridOptions` in `FileManager/utils.ts`), and the kit sets `fitGridWidth`.
  - The library builds the final defs from ours: in full view it uses them as given and appends an actions
    column; in compact view it keeps only `defs[0]` and actions. It rebuilds them on path, selection and
    compact-view changes.
  - Our `additionalGridOptions` are passed through to the grid, which is the only hook point.
  - The grid API arrives through `onGridApiChange`.
- **Current filter persistence:** FileManager stores filters in `sessionStorage["assetListFilter_" + view]`,
  guarded by `gridReadyRef`.

## Goals / Non-Goals

**Goals:**

- One implementation of "store only what the operator chose", used by both grid hosts.
- No observable change for entity grids. The existing `AgGridWrapper.spec.tsx` persistence and sizing suites
  pass unmodified.

**Non-Goals:**

- Changing the entity grids' sizing model (`sizeColumnsToFit`) or FileManager's (`flex`).
- Any library change in `@epam/ai-dial-react-file-manager`.

## Decisions

### D1. Extract a hook rather than duplicate the logic in FileManager

The new hook is `components/Grid/hooks/use-grid-state-persistence.ts`:

```ts
useGridStatePersistence({ storageKey, columnDefs, gridApi, persistedFields? })
  → { columnDefs, onFilterChanged, onSortChanged, onColumnMoved, onColumnVisible, onColumnResized,
      reapplyState }
```

- **What moves out of `AgGridWrapper`:** the dragged-column set, the ignored resize sources, the debounced
  save, width stripping on save and restore, merging stored widths into the defs, and the initial apply.
- **Where things live:** pure helpers move to `Grid/utils.ts` and constants to `Grid/constants.ts`.
- **What stays in `AgGridWrapper`:** its own sizing options (`persistedWidthOptions`,
  `onGridColumnsChanged` / `onDisplayedColumnsChanged` → `sizeColumnsToFit`), because those are sizing, not
  persistence.

*Alternatives:*

- *A FileManager-local copy that reuses only the storage helpers.* Rejected: the "ignore computed resizes"
  rule would live twice and drift.
- *Shared pure helpers with each host wiring its own events.* Rejected: the subtle part, ref-tracked dragged
  columns plus the debounce, is stateful and would still be duplicated.

### D2. `persistedFields` allow-list narrows what is stored

`persistedFields?: (keyof ColumnState)[]`:

- **Omitted** (`AgGridWrapper`): the full `ColumnState` is stored, as today.
- **Given:** each stored column is reduced to those keys before it is written. FileManager passes
  `FILE_MANAGER_GRID_PERSISTENCE.persistedFields = ['width', 'sort', 'sortIndex', 'sortType']` (`colId` is always kept)
  (`FileManager/constants.ts`).
- **Order** is the array order of `columns`, so it needs no field of its own.
- **`width`** is still kept only for dragged columns.

*Alternative:* a mode enum (`Full` / `Layout`). It's a closed set that hides what is actually stored, and the
allow-list is as short while being explicit.

### D3. FileManager restores order through the grid API, not by reordering the defs

FileManager passes its defs in default order, with stored widths merged in. It applies order, sort and
filters with `applyColumnState({ state, applyOrder: true })` and `setFilterModel`:

- once when the API arrives (`onGridApiChange`),
- again in `onGridColumnsChanged`, because the library replaces the defs on path, selection and compact-view
  changes.

FileManager also sets `maintainColumnOrder: true`, so a rebuild of the same columns keeps the order the
grid already has. ag-Grid's default is to take the order from the new defs, which would undo a column
move on every path or selection change.

This handles compact view for free: the library keeps `defs[0]`, which is still Name, and a stored order has
only Name and actions to arrange. Back in full view, `onGridColumnsChanged` re-applies the order.

*Alternative:* reorder the defs with `applyColumnStateOrderToColDefs`, the way `GridView` does. That breaks
compact view, which would then show whichever column the operator moved first, and FileManager has no
compact-view signal to switch it off.

### D4. Columns absent from the grid keep their stored slot on save

A save that sees only some columns (compact view, or a path whose column set is smaller) would otherwise
overwrite the full stored order with that subset and lose the rest. On save, the hook:

1. merges the grid's current columns into the stored list,
2. puts the present columns, in the grid's current order, into the slots present columns held,
3. leaves absent columns where they were,
4. appends new columns at the end.

This merge runs only when the hook owns column order (`shouldRestoreOrder`, FileManager). Entity grids
take their order from the column defs (`GridView`), so they keep today's save, which writes exactly what
the grid reports.

### D5. Dragged flex columns are stored as fixed width

When a stored width is merged into a column def, the def also gets `flex: null` (next to `width` and
`suppressSizeToFit: true`). Without it, FileManager's `defaultColDef.flex: 1` takes the column back to a
flex share. It has to be `null`, not `undefined`: ag-Grid skips undefined values when it merges a def over
`defaultColDef`, so `flex: 1` would win. For entity grids, whose defs have no `flex`, this is a no-op.

The merge also drops `sortType` from the stored state it spreads into the def. `sortType` is valid only as
column state, and ag-Grid flags it as an invalid column-definition property.

Some of FileManager's column defs are factories, which the library calls with date and compact-view
arguments. The Name column (`getAssetNameColumn`) is one of them. The merge wraps each factory, so every
def the library resolves from it carries the stored width. Restoring the width only through the grid API
isn't enough: each rebuild re-applies the def's own `flex: 1`, and a dragged Name column snaps back to an
equal flex share. This was found in browser testing.

For the same reason, the merged defs are recomputed once a *finished* drag has been stored. The library
builds a new `defaultColDef` on every loading or selection change, a folder switch among them. ag-Grid then
rebuilds the columns from their defs, and defs computed before the drag would undo it. Mid-drag events
don't trigger the recompute, so a def update can't land in the middle of a drag on an entity grid.

### D9. On FileManager, only a finished operator drag counts as a chosen width

While the file-manager grid lays out or restores flex columns, it dispatches `columnResized` with sources
`api`, `flex` and `gridInitializing`, not only `autosizeColumns` / `sizeColumnsToFit`. And while a header is
being dragged, every intermediate event lists all the flex columns that moved; only the finished event
lists just the dragged column. So the hook takes `userResizeSources?: ColumnResizedEvent['source'][]`:

- **Given** (FileManager passes `['uiColumnResized']`): a resize counts only when its source is listed
  and `finished` is true.
- **Omitted** (`AgGridWrapper`): today's rule, every source except the grid's own sizing, unchanged.

*Alternative:* apply the finished-only rule to entity grids as well. Rejected: their columns aren't flex, so
an intermediate drag event lists only the dragged column. Changing their rule would alter tested behavior
for no gain.

### D6. No save before the stored state is applied

The hook doesn't write until it has applied the stored state to the attached grid. This replaces
FileManager's `gridReadyRef`. Otherwise an early `onFilterChanged` from library setup, carrying an empty
model, would overwrite the stored filters before they were restored.

### D7. Unreadable stored state falls back to defaults

`getColumnsStateFromStorage` catches a JSON parse failure and returns the default model, the same as for an
empty entry. Today a corrupted entry makes an entity grid throw during render, so this also hardens entity
grids. Stored entries whose `colId` no longer exists are ignored by `applyColumnState`.

### D8. Drop the sessionStorage entry without migrating it

It lives only for one tab, so at most one open session loses its filters once. Migration code would only
exist to be removed later.

## Risks / Trade-offs

- **Every entity grid that passes `storageKey` runs through the refactored code.** → The existing
  `AgGridWrapper.spec.tsx` suites ("state restore", "column state persistence", "default and stored width of a
  sized column", "sizing strategy") are the regression gate and must pass without edits. The hook gets its own
  spec.
- **The library could stop passing `additionalGridOptions` handlers through, or start setting its own
  `onGridColumnsChanged`.** → The FileManager spec asserts the handlers reach `DialFileManager`'s
  `gridOptions`. A library bump that overrides them shows up there, and in the browser-verification task.
- **Re-applying column state in `onGridColumnsChanged` fires `sortChanged` / `columnMoved`.** → Those saves
  write the state that was just applied (same model). D6's guard and the debounce keep this to one write.
- **A stored filter can hide every row on reload, with nothing on screen to explain it.** → The filter is
  visible in its floating-filter input and clears with the filter's own reset button. This is the same
  behavior entity lists have today.
