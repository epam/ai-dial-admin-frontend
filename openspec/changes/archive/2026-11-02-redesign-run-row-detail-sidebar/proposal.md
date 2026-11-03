## Why

The single run's Execution Results tab opens a row-detail panel in two modes. The bottom drawer
already renders the shared row-detail model (`buildRowDetailSections`, display tree, pivot). The
**right side panel** (`RunMetricDetailPanel`) is still a separate card layout — status bar, adaptive
value grids, metric cards, code viewers, JSON switch — that shares neither data model nor visuals
with the drawer or with the Compare side panel. Design has reworked it into a Field | Values table
(Figma `DIAL-Admin-Evaluation--Run`, nodes `1131:23633` and `1131:23379`) with a long-content
truncation pattern, so the panel needs to move to the shared model and the new visuals.

## What Changes

- Replace the single-run right side panel body with a two-column **Field | Values** table: sticky
  40px header, 40px search + filter row, collapsible sections (`execution`, `testCaseData`,
  `extractedColumns`, `metric:*`, `requestResponse`), field rows indented under their section,
  heat-map score cells, and a row hover highlight across both cells.
- Value cells **truncate** content that does not fit (clamped to 3 lines). A truncated cell is
  one clickable button; on hover/focus it shows an "open in pop-up" icon at the bottom-right, and
  clicking anywhere on the cell opens a pop-up with the full value (existing `FullscreenValueViewer`).
- The panel header becomes `RowDetailHeader` in right-sidebar position (Grafana link, Display,
  switch-to-bottom, divider, Close) and the Display overlay is the existing
  `ExecutionRowDetailDisplayPanel`. Display settings are shared with the bottom drawer through the
  display tree already held in `use-detail-mode`.
- Sidebar width follows the Compare side panel (`ROW_DETAIL_SIDEBAR_CLASS`, half of the viewport)
  instead of the fixed 750px.
- Extract the pieces the single-run table shares with Compare's table (section header row, filter
  cell, cell constants) so the two tables do not diverge by copy-paste.
- **BREAKING (UI)**: remove `RunMetricDetailPanel` and the card components only it used
  (`MetricGroup`, `MetricCardsGrid`, `MetricCard`, `MetricInfoPanel`, `AdaptiveValue*`,
  `ExecutionStatusBar`, and the already-unreferenced `DetailRequestAccordion` / `DetailSection`),
  together with their specs. What the old panel showed that the design does not — see Open questions.

## Capabilities

### New Capabilities
- `run-row-details`: how the single run's row-detail panel behaves in the right side panel — table
  structure, sections and filtering, truncation, the open-in-pop-up cell, header actions, Display
  settings shared with the bottom drawer, and focus-to-field on grid cell click. No capability spec
  covers single-run row details today; `run-compare-row-details` covers Compare only.

### Modified Capabilities
- `analytics-detail-view-switcher`: the right side panel is the Field | Values row-detail panel; its switch button is always present; a grid cell click now scrolls the side panel to the field too.
- `progressive-depth-detail-panel`: the status bar, key-value grid, metric cards, metric info panel, `RunMetricDetailPanel` and `getMetricGroups` requirements are removed with the components; the code viewer and fullscreen viewer requirements stay.
- `detail-panel-extracted-columns`: the panel-specific section requirements are removed (the section is now specified by `run-row-details`); the i18n key requirement stays.
- `analytics-metric-bindings-display`: bindings loading and display requirements are removed; the i18n key requirement stays.

`run-compare-row-details` is untouched: its cells scroll rather than truncate and that stays as is.
`analytics-bottom-drawer` needs only a Purpose wording fix (it named the old panel); no requirement changes.
These four deltas were missing from the first draft of this proposal and were added during apply, when a
search of `openspec/specs` for the removed component names found them.

## Non-goals

- The bottom drawer (`ExecutionRowDetailPanel` in `Bottom` position, `PivotValueCell`) and every Compare
  panel keep their current behavior; no change to Compare's filter row height or cell overflow.
- No change to `buildRowDetailSections`, the display tree model, or any server action / API.
- No change to which fields are hidden by default (see Open questions).
- Browser-verification tasks are not part of this proposal; per `openspec/config.yaml` that is
  asked separately before one is added.

## Open questions

Raised before drafting; the user did not answer, so the proposal assumes the stated default.
Each needs confirmation from the designer or user before or during apply.

1. **Where the open-in-pop-up affordance applies.** Assumed: only cells whose content actually
   overflows (detected through `FieldValue.onOverflowChange`). A cell that fits is plain text, not a
   button. The designer's comment does not say.
2. **Content the design drops.** The old panel also showed the JSON viewer switch, HTTP code and
   "Computed" timestamp, per-metric info (reasoning), group error messages, and config/input
   bindings. Decided with the user at proposal time: follow the design, so these are removed;
   Request/Response and HTTP remain reachable through Display. The designer has not been asked, so
   if any of it is wanted back it becomes a follow-up rather than a reason to keep the old panel.
3. **Section chevron direction.** In Figma frame `1131:23633` sections drawn with a down chevron are
   empty and those with a right chevron show rows, which is the opposite of our convention
   (down = expanded, `aria-expanded`). Assumed: keep ours; confirm with the designer.
4. **Default Execution rows.** The design's Execution section shows only Status and Duration, while
   single run currently hides Duration and shows Run number and HTTP (Compare defaults are the
   opposite). Assumed: keep current defaults, because the display tree is shared with the bottom
   drawer and changing them would change that panel too.
5. **Filter row height.** Design shows 40px; Compare's is 28px. Assumed: parameterize for single run
   and leave Compare unchanged.

Not covered by the Figma frames and therefore unspecified: loading, error and empty states, the
text-filter dropdown popovers, and narrow widths. Border tokens (`stroke/secondary` in the design,
`border-tertiary` in Compare's table) must be checked against the design variables during apply.

## Impact

- New: `Runs/View/RowDetails/` table, value cell and side panel components; shared pieces moved
  under `Runs/Details/RowDetails/`; a `run-row-details` spec; component specs for the new files.
- Modified: `Runs/View/use-detail-mode.tsx` (sidebar branch renders the new panel with the shared
  display tree and `focusFieldKey`), its spec; `Compare/.../RowCompareDetails` imports where shared
  pieces move (behavior unchanged); `FieldValue` gains a clamp-lines option without changing its
  existing callers.
- Removed: the card components listed above and their specs in `Runs/Details/` and `Runs/Details/tests/`,
  plus `Runs/Details/{utils,constants,types}.ts` (only the card components used them) and the metric
  snapshot fetch and `snapshots` tab state in the Extraction Result tab (fetched only to build bindings).
  `getDetailEntries`, `getMetricGroups`, `getPanelTitle` and `snapshotsToBindingsMap` in
  `Runs/View/utils.ts` were used only by the old panel and go with it, as do the `MetricGroup` /
  `MetricEntry` models and the `Runs.*` i18n keys only the cards used.
- Specs: four existing capabilities get delta specs (see Capabilities); the Purpose lines that named the old
  panel were corrected directly in `analytics-detail-view-switcher`, `analytics-bottom-drawer`,
  `progressive-depth-detail-panel`, `detail-panel-extracted-columns` and `analytics-metric-bindings-display`.
- `useDetailMode`'s `metricBindings` argument and `ExtractionResult`'s `snapshotsToBindingsMap`
  call existed only to feed the old panel and were removed.
- Shared surface to watch: `FieldValue`, `RowDetailHeader`, `TextFilterCell`, `filterRowDetailSections`
  are also used by the bottom drawer and Compare.
