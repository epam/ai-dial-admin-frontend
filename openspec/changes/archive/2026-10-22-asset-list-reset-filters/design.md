## Context

`DialFileManager` draws the Create button inside its own header toolbar; the host app cannot render next to it.
`@epam/ai-dial-react-file-manager` 0.4.0-dev.12 exposes `toolbarOptions.additionalButtons`, rendered before the
add button (and before the Sort dropdown in compact view). The entity lists already ship `ResetFiltersButton`
(`ListView/Header/ResetFiltersButton.tsx`): it takes a `GridApi`, listens to `filterChanged`, renders only while
the filter model is non-empty, and clears with `setFilterModel(null)`.

## Decisions

- **Reuse `ResetFiltersButton` unchanged**, passed as `toolbarOptions.additionalButtons` from
  `Common/FileManager/FileManager.tsx` with the `gridApi` the component already holds from `onGridApiChange`.
  Same look, label (`ButtonsI18nKey.ResetFilters`) and behaviour as the entity lists; no second implementation.
- **Filters only.** Clearing goes through the grid, so the persistence hook's `onFilterChanged` writes the empty
  filter model into `gridColumnsState<view>`; widths, order and sort in that entry are untouched. Nothing
  removes or rewrites the storage entry directly.
- **Memoized options.** `toolbarOptions` is built in a `useMemo` over `view`, `isReadOnlyAdmin`, `t`, `filePath`
  and `gridApi`, so the library does not see a new object on every render.
- **Dependency bump is part of the change**: the file manager needs `^0.4.0-dev.12`; it is built against
  ui-kit `^0.16.0-dev.19`, so both move together.

## Risks

- Both packages are prereleases (`-dev`). Pin to the released versions when they ship.
- Before the grid reports its api the button renders nothing (`gridApi` undefined), which is the right state: no
  grid, no filters.
