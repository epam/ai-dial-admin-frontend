## 1. Shared pivot / display helpers

- [x] 1.1 Extend `getPivotGridTemplateColumns` with `includeStickyLabelColumn` (default `true`) so Compare keeps the left column and Execution Result can omit it
- [x] 1.2 Allow `buildRowDetailDisplayTree` to accept an optional default-hidden field set (Execution Result: Duration; Compare keeps `DEFAULT_HIDDEN_ROW_DETAIL_FIELDS`)
- [x] 1.3 Unit tests for the template-columns flag and default-hidden set behavior

## 2. Execution Result row detail UI

- [x] 2.1 Add `map-grid-col-to-pivot-field.ts` and unit tests (`status`→`executionStatus`, `runIndex`→`runNumber`, `http`→`httpStatusCode`, `duration`→`execDurationMs`, metric/extracted mappings)
- [x] 2.2 Build `FullscreenValueViewer` (`DialPopup` + full value content)
- [x] 2.3 Build `PivotValueCell` (truncate, hover open-popup icon, click opens popup)
- [x] 2.4 Build `ExecutionRowDetailPivotTable` (section + field headers, one value row, `data-field-key`, scroll-to-field)
- [x] 2.5 Build `ExecutionRowDetailDisplayPanel` (`TreeColumnsPanel` only — no view-mode / diffs)
- [x] 2.6 Build `ExecutionRowDetailBottomPanel` (fetch details, header via shared `RowDetailHeader`, pivot, Display overlay, loading/error)
- [x] 2.7 Component tests for pivot (one value row, popup on click) and scroll helper

## 3. Wire Execution Result tab

- [x] 3.1 Refactor `useDetailMode`: default Drawer; both modes via `showSidebar` with position; `openDetail(resultId, focusFieldKey?)` toggle/focus rules; render bottom panel content from the hook
- [x] 3.2 Update `ExtractionResult`: `onCellClicked` + `onRowClicked` → `openDetail` with mapped field; remove `AnalyticsBottomDrawer` / `useDrawerPanel`
- [x] 3.3 Update `use-detail-mode` and `ExtractionResult` tests

## 4. Cleanup unused drawer shell

- [x] 4.1 Delete unused BottomDrawer shell components and hooks (`AnalyticsBottomDrawer`, `DrawerToolbar`, `ComparisonTableView`, `ComparisonPivotView`, `FieldSelector`/`FieldsTab`/`OrderTab`, `FocusStrip`, `useDrawerPanel`, `useFieldSelector`, `ResizeHandle`) and their tests
- [x] 4.2 Keep shared utils/constants (`buildComparisonSections`, `formatFieldValue`, `FullscreenDiffViewer`, `SECTION_I18N`, `EXECUTION_STATUS_FIELD_KEY`, models still needed by Compare)
- [x] 4.3 Sync main specs from deltas (`analytics-bottom-drawer`, `analytics-detail-view-switcher`, `analytics-comparison-views`, `analytics-field-selector`)

## 5. Lift shared row-detail out of Compare

- [x] 5.1 Move shared header / FieldValue / StatusValue / models / constants / utils (+ tests) to `Runs/Details/RowDetails/`; rename Compare* types to `RowDetail*`
- [x] 5.2 Rewire Compare and `View/RowDetails` (+ `use-detail-mode`) to import from the shared folder; no View → Compare `RowCompareDetails` imports

## 6. Quality

- [x] 6.1 Run lint, format, and targeted vitest for touched files; fix failures

<!-- Browser verification: not added — confirmation was not received when asked. -->
