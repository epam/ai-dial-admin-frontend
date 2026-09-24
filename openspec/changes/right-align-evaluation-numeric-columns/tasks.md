## 1. Shared alignment fragment

- [x] 1.1 In `constants/grid-columns/configs.ts`, extract `rightAlignedColumn: Partial<ColDef>`
      (`cellClass`/`headerClass: 'align-right'`) out of `numericColumn`, and have `numericColumn`
      spread it. Verify `grid-columns.tsx`'s `USAGE_LOG_NUMERIC_COLUMNS` filter
      (`c.cellClass === 'align-right'`) still matches.

## 2. Test Suite Runs tab and Compare Against modal

- [x] 2.1 In `constants/grid-columns/grid-columns.tsx`, spread `rightAlignedColumn` onto
      `RUNS_COLUMN`'s `runConfig.numberOfRuns` ("Number of runs") and `numberOfTestCases` ("Number of
      test cases") columns. Confirm this also reaches `SelectCompareRunModal` (Compare Against modal)
      and the standalone Runs list, which all consume `RUNS_COLUMN`.

## 3. Extraction Result tab

- [x] 3.1 In `components/Runs/View/utils.ts`, right-align `buildIndexColumn`'s output (`# Run number`,
      `Request`, `Turn`) and the `totalRequests` / `totalTurns` columns.
- [x] 3.2 Compose `align-right` into the existing status-based `cellClass` functions on
      `responseStatusCode` (HTTP) and `durationMs` (Duration), and add `headerClass: 'align-right'` to
      both.

## 4. Run Comparison Execution Results grid

- [x] 4.1 In `components/Runs/Compare/ExecutionResults/utils/columns.ts`, right-align both columns of
      each pair `buildCompareIndexColumnPair` builds (`# Run number`, `Request`, `Turn`) and the
      primary/secondary HTTP and Duration columns in `getComparedExecutionColumns`, alongside their
      existing `cellClassRules`.

## 5. Run Comparison expanded row view

- [x] 5.1 Add a fieldKey-based `isRightAlignedRowDetailField` predicate (Run number, HTTP, Duration)
      next to the existing fieldKey constants under `components/Runs/Details/RowDetails/`.
- [x] 5.2 Apply it in `components/Runs/View/RowDetails/PivotValueCell.tsx` (`justify-end`/`text-right`
      on the value button) for the pivot layout — shared with the single-run row-detail pivot.
- [x] 5.3 Apply it in `components/Runs/Compare/ExecutionResults/RowCompareDetails/DetailRow.tsx`
      (`text-right` on the primary/secondary value cells) for the list layout.

## 6. Dataset (and Test Suite) Test Cases numeric schema columns

- [x] 6.1 Add an optional `isRightAligned` prop to `EditableCellRenderer`
      (`components/Grid/CellRenderers/EditableCellRenderer.tsx`), applied to both the editable
      `<input>` and the read-only `<div>` fallback.
- [x] 6.2 In `getGroupedSchemaColumn` (`components/Grid/columns/turn-columns.tsx`), pass
      `isRightAligned: true` in `cellRendererParams` for the `INTEGER`/`NUMBER` branch, and add
      `cellClass`/`headerClass: 'align-right'` to that column's `ColDef`.

## 7. Heat Map and Test Case Stability

- [x] 7.1 In `components/Common/HeatMap/HeatMapValueCellRenderer.tsx`, change the value wrapper from
      `justify-center` to `justify-end`.

## 8. Tests

- [x] 8.1 Update/extend unit tests for each touched util and component: `configs.spec.ts`
      (`rightAlignedColumn`/`numericColumn`), `Runs/View/tests/utils.spec.ts` (execution column
      classes), `Runs/Compare/ExecutionResults/utils/tests/columns.spec.ts` (compare pair classes),
      a new spec for `isRightAlignedRowDetailField`, `PivotValueCell.spec.tsx` and `DetailRow.spec.tsx`
      (right-aligned vs. unaffected fields), `EditableCellRenderer.spec.tsx` (`isRightAligned` prop),
      `turn-columns` schema-column tests (INTEGER/NUMBER vs. other types), and the `HeatMap`/stability
      column-builder specs.

## 9. Quality gate

- [x] 9.1 Run lint, both typecheck gates (`typecheck`, `typecheck:specs`), and the full test suite with
      coverage; fix any regressions before considering this change complete.
