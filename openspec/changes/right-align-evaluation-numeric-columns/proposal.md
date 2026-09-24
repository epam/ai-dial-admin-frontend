## Why

Numeric values in Evaluation tables — run counts, test-case counts, run/request/turn indices, HTTP
status codes, and durations — render left-aligned like every other column. Left alignment lines up
the first digit instead of the last, so a reader scanning a column of numbers gets no help comparing
magnitudes at a glance; right alignment is the standard fix for exactly this kind of column.

The codebase already has this mechanism in one place — `numericColumn`
(`cellClass`/`headerClass: 'align-right'`, backed by an `ag-grid.scss` rule) — spread across roughly
30 grid columns elsewhere in the app (Usage Log, Analytics). Evaluation's grids largely predate that
convention, or build their columns through code paths that never reach it, so they were never opted
in.

## What Changes

- Extract the alignment pair out of `numericColumn` into a standalone `rightAlignedColumn` fragment
  (`constants/grid-columns/configs.ts`) so a column that already carries its own
  formatter/comparator/`valueGetter` can opt into alignment without inheriting `numericColumn`'s other
  behavior (thousands-separator formatting, its own comparator, its own filter value getter).
- Apply that alignment (or an equivalent inline `cellClass`/`headerClass`) to the numeric, HTTP, and
  duration columns across:
  - `RUNS_COLUMN` (`Number of runs`, `Number of test cases`) — shared by the Test Suite Runs tab, the
    Compare Against modal, and the standalone Runs list, so one edit covers all three.
  - The Extraction Result tab's execution columns (`Runs/View/utils.ts`): `# Run number`, `Request`,
    `Total requests`, `Turn`, `Total turns`, `HTTP`, `Duration`. HTTP and Duration already compute
    `cellClass` from the response status (for status coloring); the fix composes the alignment class
    with that existing one rather than replacing it.
  - The Run Comparison Execution Results grid's paired execution columns
    (`Runs/Compare/ExecutionResults/utils/columns.ts`): the same five fields, for both the primary and
    the `cmp_`-prefixed secondary column of each pair.
  - Dataset (and, as a consequence of sharing the same schema-column builder, Test Suite) Test Cases
    grids: any column whose schema type is `NUMBER` or `INTEGER`
    (`Grid/columns/turn-columns.tsx#getGroupedSchemaColumn`). The renderer behind these columns is an
    editable `<input>` that already fills the cell, so alignment here is a `text-right` passed into
    `EditableCellRenderer`, not a ColDef class.
- Right-align the Run Comparison "expanded row" panel's `# Run number`, `HTTP`, and `execDurationMs`
  (Duration) fields, in both its pivot and list layouts. These render through CSS-grid/flex markup,
  not ag-grid, so the fix is a small fieldKey-based predicate feeding `text-right` / `justify-end`
  rather than a ColDef class.
- Right-align Heat Map and Test Case Stability cell values by changing the shared
  `Common/HeatMap/HeatMapValueCellRenderer` from `justify-center` to `justify-end`. Its only two
  current consumers — Run Comparison Heat Map and Test Suite Trends' Test Case Stability — both want
  this, and no other feature renders through it today.
- Text, boolean, object, array, and file columns are untouched — none of the above changes reaches a
  non-numeric column.

## Non-goals

- Metric/score columns and other numeric grid columns outside the areas listed above (for example the
  Extraction Result grid's per-metric score columns, which already render through a dedicated score
  renderer). This change does not do a codebase-wide numeric-column audit.
- Backfilling spec coverage for grids that have none today. `RUNS_COLUMN` (Runs tab / Compare Against
  modal) and the Run Comparison Execution Results grid's own column set are not documented in any
  `openspec/specs/` capability — the one spec whose content shape matches the latter,
  `runs-analytics-run-compare`, actually describes a superseded inline "Compare with" dropdown that no
  longer exists in source. This change records its alignment behavior here and in `tasks.md`, but does
  not attempt to write the missing spec from scratch.
- No change to column widths, sort/filter behavior, which columns are hidden by default, or any
  non-visual behavior.

## Impact

- Affected specs: `run-results-turn-columns`, `run-compare-row-details`, `dataset-test-cases`,
  `test-suite-trends`
- Affected code: `constants/grid-columns/configs.ts`, `constants/grid-columns/grid-columns.tsx`,
  `components/Runs/View/utils.ts`, `components/Runs/Compare/ExecutionResults/utils/columns.ts`,
  `components/Runs/View/RowDetails/PivotValueCell.tsx`,
  `components/Runs/Compare/ExecutionResults/RowCompareDetails/DetailRow.tsx`,
  `components/Runs/Details/RowDetails/` (new alignment predicate),
  `components/Grid/columns/turn-columns.tsx`, `components/Grid/CellRenderers/EditableCellRenderer.tsx`,
  `components/Common/HeatMap/HeatMapValueCellRenderer.tsx`
- Purely presentational: no API, filter, sort, or persisted-state changes.
