## Why

In a single run's Extraction Result tab, the bottom detail panel already uses the redesigned Field/Values pivot, but the **right** panel still shows the legacy card layout (`RunMetricDetailPanel`: status badges, key/value lists, metric cards, request/response code viewers). The Run Comparison page's right panel was redesigned as a Field/Values table with section rows, search and filter inputs, and bucket-coloured score cells. The two screens now look and behave differently for the same data. The design asks for the single-run right panel to match the compare one, minus the comparison.

## What Changes

- The single-run right detail panel renders the same table as the compare right panel, with one Values column: sticky `Field` / `Values` header, a search + filter row under each header, collapsible section rows (Execution, Test Case Data, Extracted, metric groups, Request/Response), and score cells coloured like the grid.
- No comparison chrome: no second run column, no Delta column, no diff highlighting, no diff legend or minimap, no view-differences / hide-highlights toggles.
- Truncated values open the same full-value popup the bottom pivot uses, from a hover/focus control on the cell.
- The panel header, Display overlay and bottom/right switch are shared with the bottom panel. One panel component serves both positions, as `CompareRowDetailPanel` does; the Display selection is kept across the switch and across close/reopen.
- A grid cell click now scrolls the right table to the field its column maps to, as it already does in the bottom pivot and the compare table.
- The right panel width follows the compare sidebar (half the screen) instead of a fixed 750px.
- **BREAKING (UI):** the legacy right panel is removed with the features only it had: the JSON Viewer switch, the Grafana trace link, and the per-metric bindings/info cards. Request and response bodies stay available as table fields. The components, helpers, i18n keys and specs that only served it go too.

## Capabilities

### New Capabilities

- `run-result-row-details`: the single run's right-hand row-detail table — layout, filters, sections, value popup, field focus, Display persistence.

### Modified Capabilities

- `analytics-detail-view-switcher`: the sidebar mode shows the new table panel (not `RunMetricDetailPanel`), the switcher lives in the shared panel header, and a cell click focuses its field in either mode.
- `progressive-depth-detail-panel`: remove the requirements for the components deleted with the legacy panel (`ExecutionStatusBar`, `AdaptiveValueGrid`, `MetricCardsGrid`, `MetricCard` error variant, `MetricInfoPanel`, `RunResultDetailPanel`/`RunMetricDetailPanel` usage, `getMetricGroups`). `CodeViewer` and `FullscreenViewer` stay; other screens use them.
- `detail-panel-extracted-columns`: remove the two panel requirements; the `ExtractedColumns` i18n key requirement stays, the bottom pivot still uses the key.
- `analytics-metric-bindings-display`: retired. Every requirement described bindings in the legacy panel, and the main spec was unparseable, so its directory is deleted instead of carrying a REMOVED delta.

## Impact

- `components/Runs/View/use-detail-mode.tsx` (renders one panel for both positions), `View/ExtractionResult.tsx` and `View/use-run-view-tab-state.ts` (no more snapshot fetch/state), `View/RowDetails/ExecutionRowDetailBottomPanel.tsx` (renamed and given a `position`), new `View/RowDetails/ExecutionRowDetailTable.tsx` and its row component, `View/utils.ts` and `View/models.ts` (legacy helpers removed).
- Reuses, without moving: `RowDetailHeader`, `FieldValue`, `StatusValue`, `FullscreenValueViewer`, `filterRowDetailSections`, `scrollPivotToField` and the `ROW_DETAIL_*` constants; `TextFilterCell` from the compare folder.
- Removed: `Details/RunMetricDetailPanel.tsx`, `AdaptiveValueGrid` and its row/content/chip components, `ExecutionStatusBar`, `MetricGroup`, `MetricCardsGrid`, `Details/MetricCard`, `MetricInfoPanel`, their specs, and the i18n keys left with no reference.
- `locales/en.ts` / `constants/i18n.ts`: one new key for the Values header.
- Compare screens and the bottom pivot are untouched apart from sharing the panel shell. `getMetricSnapshots` and its API method stay; they are no longer called from this tab.

## Non-goals

- No change to the Run Comparison page, the bottom pivot's layout, or the Execution Result grid.
- No new filters beyond the text search/filter the compare table has. A numeric filter on the Values column is not added.
- No relocation of the compare row-detail files into a shared folder.
- No attempt to bring the JSON Viewer, Grafana link or metric bindings back in a new form; a later change can add them to the shared header if needed.
- `DetailSection` and `DetailRequestAccordion` are already unused; they are left alone.
