## Why

In entity lists the Name column opens too narrow, so long IDs such as `bedrock.amazon.nova-pro-v1:0` are
ellipsized and the operator has to drag the column wider on every list, every time
([#5077](https://github.com/epam/ai-dial-admin-frontend/issues/5077)). The name is the one cell an operator
reads to recognise a row, so it should be readable without a manual resize.

## What Changes

- Give the shared name column definitions — `NAME_COLUMN`, `NAME_COLUMN_WITH_SORT`, `DISPLAY_NAME_COLUMN`,
  `DISPLAY_NAME_COLUMN_WITH_SORT`, `ASSET_NAME_COLUMN` — a wider default: `width: 400`, `minWidth: 260`.
- Apply the same sizing to the name/ID columns that TestSuites (test suites, datasets, metrics) and the
  Interceptors and Export/Import grids define themselves rather than taking from the shared definitions.
- Size with `width` + `minWidth`, **not** `flex`. `AgGridWrapper` already calls `sizeColumnsToFit()`, which
  scales columns in proportion to their current widths, so a larger initial `width` yields the larger share.
  A saved width is restored by writing `width` back, and AG Grid gives `flex` precedence over `width`, so a
  `flex` name column would silently stop restoring.
- No change to `AgGridWrapper`, the persistence format, or any non-name column.

### Non-goals

- Runs and Analytics grids (including telemetry, consumption, queries and sessions column sets).
- Any change to how a user-resized width is stored or restored.
- New `minWidth` on Author / Created / Updated; revisited only if verification shows truncation.
- Migrating widths users have already saved: a width the operator dragged keeps winning over the new default.

## Capabilities

### New Capabilities
- `entity-list-name-column`: the default width of the name/ID column in entity lists, that a typical ID reads
  in full without resizing, that neighbouring columns stay readable, and that an operator-set width still wins.

### Modified Capabilities

## Impact

- `apps/ai-dial-admin/src/constants/grid-columns/base-columns.ts` and `grid-columns.tsx` (column definitions);
  Interceptors and Export/Import column helpers if they define their own name columns.
- Unit tests in `src/constants/grid-columns/tests/`.
- Every entity list that uses these definitions gets a wider first column and proportionally narrower others,
  bounded by each column's `minWidth`. `ai-dial-ui-kit`'s `Grid` is unchanged.
