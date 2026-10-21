## Context

Name columns come from five shared definitions in `constants/grid-columns/base-columns.ts` (`NAME_COLUMN*`,
`DISPLAY_NAME_COLUMN*`, `ASSET_NAME_COLUMN`) plus a few inline `{ field: 'name' }` / `{ field: 'id' }`
definitions in `grid-columns.tsx` (test suites, datasets, metrics). None sets a width, so each falls back to
AG Grid's 200 px default and the kit `Grid`'s `defaultColDef.minWidth` of 150.

`AgGridWrapper` renders the kit `Grid` and, for grids with a `storageKey`, drops the kit's `fitGridWidth`
strategy and calls `sizeColumnsToFit()` on every column or size change. `sizeColumnsToFit()` scales columns in
proportion to their current widths, within each column's `minWidth`/`maxWidth`. A width the operator drags is
recorded in `sizedColIds` and restored by `mergeStoredColumnDefs`, which writes `width` and
`suppressSizeToFit` onto the column definition.

## Goals / Non-Goals

**Goals:**
- A wider default name column everywhere in scope, through column definitions only.

**Non-Goals:**
- No change to `AgGridWrapper`, the stored model, or the kit.

## Decisions

**`width` + `minWidth`, not `flex`.** Because `sizeColumnsToFit()` is proportional, `width: 400` against the
200 px default gives the name column about twice a neighbour's share. `flex` was rejected: AG Grid gives it
precedence over `width`, and `mergeStoredColumnDefs` restores a saved width only through `width`, so a `flex`
name column would ignore the operator's saved width unless the shared wrapper were also changed — a wider
blast radius than the issue needs. *Autosize to content* was rejected too: it fights the wrapper's removal of
the kit's fit strategy and costs a measurement pass on infinite-row-model grids.

**Values 400 / 260.** 260 px holds roughly thirty characters at the grid font, so the issue's example ID fits
even when the grid is squeezed to its floor; 400 px sets the default share. Display Name cells carry an icon
and a second line, which the same width accommodates.

**One shared constant.** A single `nameColumnSizing` (`{ width: 400, minWidth: 260 }`) is spread into every
in-scope definition, before per-column overrides, so a caller can still override it and the numbers live once.

## Risks / Trade-offs

- [Narrow viewports squeeze other columns] → each keeps its own `minWidth`; verify at 1366 and 1920 px and add a
  `minWidth` to date or author columns only if something truncates.
- [Operators who already dragged a narrow name column keep it] → accepted; their choice wins, and no migration
  is attempted.
- [An in-scope grid defines its name column somewhere the audit missed] → the task list ends with a sweep of
  every grid-defining module; a miss is cosmetic, not functional.
