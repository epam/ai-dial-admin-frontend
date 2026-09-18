## 1. Open / position defaults

- [x] 1.1 Default `detailPosition` to Bottom in `CompareView`; stop resetting to Right on close
- [x] 1.2 Update `CompareView` tests for bottom default and close-preserves-bottom

## 2. Cell click → scroll

- [x] 2.1 Extend `mapGridColToPivotField` (or compare wrapper) for `cmp_` / `delta_` / `extracted_` colIds; add unit tests
- [x] 2.2 Extract or share `scrollPivotToField` for Compare pivot import
- [x] 2.3 Thread optional `focusFieldKey` through `openRowDetail` → panels → `CompareRowDetailPivotTable`; add `data-field-key` and scroll effect
- [x] 2.4 Wire `onCellClicked` + `cellClickHandledRef` in `ExecutionResultsTab`; update tab tests

## 3. Pivot popup cells

- [x] 3.1 Parameterize `PivotValueCell` with explicit `raw` / `isFailed` (default primary)
- [x] 3.2 Use `PivotValueCell` in `CompareRowDetailPivotTable`; remove pivot `FullscreenDiffViewer`; keep delta row non-clickable
- [x] 3.3 Pivot component tests for popup / hover affordance

## 4. Display view-mode lock

- [x] 4.1 Remove table/pivot switcher from `CompareRowDetailDisplayPanel`
- [x] 4.2 Derive view from `position` only in `CompareRowDetailPanel` (drop `viewMode` state)
- [x] 4.3 Update CompareView / Display-related tests

## 5. Quality

- [x] 5.1 Run lint and targeted vitest for touched files; fix failures
