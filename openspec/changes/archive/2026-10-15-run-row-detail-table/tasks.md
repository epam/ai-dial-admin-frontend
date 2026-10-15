## 1. Single-run panel for both positions

- [x] 1.1 Rename `View/RowDetails/ExecutionRowDetailBottomPanel.tsx` to `ExecutionRowDetailPanel.tsx` (and its spec/imports), add `position: SidebarPosition`, rename `onSwitchToSidebar` to `onSwitchDisplayMode`, pass `position` to `RowDetailHeader`, and render `ExecutionRowDetailPivotTable` for `SidebarPosition.Bottom` and `ExecutionRowDetailTable` otherwise. Verify `npm run typecheck` is clean and the bottom position still renders the pivot.
- [x] 1.2 In `View/use-detail-mode.tsx`, render `ExecutionRowDetailPanel` for both modes (`ROW_DETAIL_BOTTOM_CLASS` at the bottom, `ROW_DETAIL_SIDEBAR_CLASS` on the right), pass `fieldKey`, `focusRequestId`, `initialDisplayTree` and `onDisplayTreeChange` to both, and drop the `metricBindings` parameter and `RunMetricDetailPanel` import. Verify `switchToSidebar` shows `ExecutionRowDetailPanel` at `SidebarPosition.Right` with the sidebar class, and a mapped cell click in sidebar mode forwards its field key.

## 2. Right table

- [x] 2.1 Add `RunsI18nKey.ValueColumn` (`Values`) to `constants/i18n.ts` and `locales/en.ts`. Verify the key resolves in the table header test.
- [x] 2.2 Create `View/RowDetails/ExecutionRowDetailRow.tsx`: label cell (`ROW_DETAIL_FIELD_INDENT`, `DialEllipsisTooltip`, `data-field-key`, `scrollMarginTop`), value cell with `StatusValue` / `FieldValue`, score fill and right alignment as in the compare row, and a hover/focus `IconMaximize` button (aria-labelled, shown only when `FieldValue` reports overflow) that opens `FullscreenValueViewer`. Verify the button appears only for an overflowing value.
- [x] 2.3 Create `View/RowDetails/ExecutionRowDetailTable.tsx`: two-column grid (`ROW_DETAIL_FIELD_COL_MIN` + `minmax(0, 1fr)`), sticky `Field` / `Values` header, filter row built from two `TextFilterCell`s, collapsible section rows (`aria-expanded`, `SECTION_I18N` labels, expanded by default), `filterRowDetailSections` with field and primary options only, and `scrollPivotToField` on `focusFieldKey` / `focusRequestId`. No delta, action, minimap or legend. Verify filtering by field and by value narrows rows and hides empty sections.
- [x] 2.4 Verify `ExecutionRowDetailPanel` keys the table by `resultId` so collapse state and filters reset on row change, and that loading and error states keep the header usable in the right position.

## 3. Remove the legacy panel

- [x] 3.1 Delete `Details/RunMetricDetailPanel.tsx`, `AdaptiveValueGrid`, `AdaptiveValueRow`, `AdaptiveArrayValueContent`, `AdaptivePrimitiveValueContent`, `AdaptiveStructuredValueContent`, `AdaptiveValueTypeChip`, `ExecutionStatusBar`, `MetricGroup`, `MetricCardsGrid`, `Details/MetricCard` and `MetricInfoPanel`, with their specs. Run `grep -rw` for each name first and confirm no non-spec importer remains; do not touch `Common/MetricCard` or `Deployments/Common/MetricCard`.
- [x] 3.2 Remove `getDetailEntries`, `getMetricGroups`, `getPanelTitle` and `snapshotsToBindingsMap` from `View/utils.ts` and the `MetricGroup` type from `View/models.ts`, with their `utils.spec.ts` cases. Verify `npm run typecheck` is clean.
- [x] 3.3 Remove the `getMetricSnapshots` fetch from `View/ExtractionResult.tsx` and `snapshots` from `View/use-run-view-tab-state.ts` / `ExtractionResultTabUiState`. Keep the `getMetricSnapshots` action and API method. Verify the tab fetches results only.
- [x] 3.4 Remove `RunsI18nKey.Computed`, `RunsI18nKey.MetricBindings` and `EntitiesI18nKey.JSONViewer` from `constants/i18n.ts` and `locales/en.ts` once a grep shows no reference; keep `ExtractedColumns` and `TestCaseData`. Verify no key is referenced but missing.

## 4. Specs

- [x] 4.1 In the main specs `progressive-depth-detail-panel` and `detail-panel-extracted-columns`, replace the stray `## ADDED Requirements` header with a `# <name> Specification` title, a `## Purpose` and a `## Requirements` header (no requirement text changed), so the deltas can be archived. `analytics-metric-bindings-display` loses every requirement and its main file cannot be parsed (so a REMOVED delta could not be archived): delete the main spec directory directly and carry no delta for it.
- [x] 4.2 Update the stale Purpose lines in `analytics-detail-view-switcher` and `analytics-bottom-drawer`, which still name `RunMetricDetailPanel`, to describe the shared panel. Verify `openspec validate run-row-detail-table --strict` prints no archive-refusal INFO.

## 5. Tests

- [x] 5.1 `ExecutionRowDetailTable.spec.tsx`: header and filter row render, one Values column and no delta column, section collapse (`aria-expanded`), field search, value search, Equals filter, no-match state, focus scroll, dash for missing values.
- [x] 5.2 `ExecutionRowDetailRow.spec.tsx`: status badge, score fill, numeric right alignment, clipped value shows the open control and opens `FullscreenValueViewer` with the field label and full value, short value shows none.
- [x] 5.3 `ExecutionRowDetailPanel` spec (renamed from the bottom-panel spec): bottom renders the pivot, right renders the table, header switch title per position, loading and error states, Display tree shared across positions, table remount on `resultId` change.
- [x] 5.4 Update `View/tests/use-detail-mode.spec.tsx` (sidebar shows `ExecutionRowDetailPanel` with `ROW_DETAIL_SIDEBAR_CLASS` at the right position, field key forwarded, Display tree persisted across a position switch) and `View/tests/ExtractionResult.spec.tsx` (no snapshot fetch).
- [x] 5.5 `npm run typecheck:specs` stays at zero after deleting and adding specs.

## 6. Final quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and the full `npm run test`, and fix every failure.

<!-- No browser-verification task: the user was asked and chose to skip it; the browser-observable scenarios are covered by the component tests in section 5. -->
