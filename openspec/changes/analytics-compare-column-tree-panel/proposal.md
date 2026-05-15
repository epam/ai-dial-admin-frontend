## Why

In compare mode on the Run Analytics tab, the current three-level column layout groups all "Current" metric columns together and all "Compared" metric columns together, making it hard to compare a single metric side by side. The column hierarchy should place Current/Compared as the leaf pair under each individual metric key so related values are visually adjacent. Additionally, the analytics grid provides no way to hide or show column groups, making dense compare-mode tables hard to read — a tree-based column visibility panel is needed that matches the multi-level structure of the grid.

## What Changes

- **Column hierarchy flip in compare mode**: each metric group (e.g. "accuracy") now maps to `groupKey → [metricKey → [Current, Compared]]` instead of `groupKey → [Current → [metricKeys], Compared → [metricKeys]]`. The same inversion applies to the EXECUTION and EXTRACTED column groups.
- **New `TreeColumnsPanel` component**: a reusable grid utility component that renders a multi-level column tree with checkbox visibility toggles (including indeterminate state for partially-hidden groups). No drag-and-drop — users reorder columns via ag-Grid header drag as usual.
- **Column panel integration in Analytics tab**: a "Columns" button in the analytics toolbar opens the `TreeColumnsPanel`. Column state is managed in `Analytics.tsx` (no localStorage persistence for now). Current/Compared leaf columns are excluded from the panel — their parent metric key acts as the toggle unit.

## Non-goals

- Drag-and-drop reordering inside the tree panel (users can drag column headers in the grid directly).
- Persisting column visibility across page visits.
- Applying `TreeColumnsPanel` to any grid other than the analytics grid in this change.

## Capabilities

### New Capabilities

- `analytics-tree-columns-panel`: Tree-based column visibility panel for the Run Analytics grid. Renders the multi-level column definition as a collapsible tree of checkboxes. Supports group-level toggle with indeterminate state. Excludes "Current"/"Compared" leaf columns from the panel (their parent metric key is the finest manageable unit).

### Modified Capabilities

- `runs-analytics-run-compare`: The three-level compare column layout is being restructured. Previously each column group had Current/Compared as the second level with metric keys at the third level. The new layout places metric keys at the second level and Current/Compared as the leaf pair at the third level.

## Impact

- `apps/ai-dial-admin/src/components/Runs/View/utils.ts` — `getComparedMetricsColumns` and `getAnalyticsColumnsCompare` rewritten to produce the new hierarchy.
- `apps/ai-dial-admin/src/components/Runs/View/Analytics.tsx` — adds `panelColDefs` state, a "Columns" toolbar button, and renders `TreeColumnsPanel`.
- New files: `apps/ai-dial-admin/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel.tsx`, `TreeColumnNode.tsx`, `index.ts`.
- `apps/ai-dial-admin/src/components/Grid/GridView/GridView.tsx` — small tweak to re-initialize `currentColDefs` when `columnDefs` prop changes externally (needed so the grid reflects panel-driven visibility changes).
- Existing unit tests in `utils.spec.ts` that assert the compare column structure will need updating.
- No API changes, no new dependencies.
