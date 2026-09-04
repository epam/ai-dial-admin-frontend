## Why

Compare Execution Results row details still open in the right sidebar by default, allow overriding table/pivot in Display, open a two-pane diff from pivot cells, and do not scroll the detail panel to the clicked grid column. Design and the single-run Execution Result redesign now expect the same bottom-default pivot UX on Compare.

## What Changes

- Default row-detail position becomes **bottom** (pivot); closing preserves bottom so the next row click reopens the bottom panel. Switch to sidebar / switch to bottom remain.
- Main grid **cell click** opens the detail panel (if needed) and horizontally scrolls to the related pivot field; row click / Enter still open without a field focus.
- Compare pivot value cells **truncate**, show an “open in popup” icon on hover, and open a single-value `FullscreenValueViewer` popup (not `FullscreenDiffViewer`).
- Remove the table/pivot segmented control from row-detail Display; **bottom = pivot**, **right = table**.

## Non-goals

- Heat map / summary tabs.
- Main Execution Results Display panel (grid column visibility).
- Table-mode `FullscreenDiffViewer` affordances on `DetailRow`.
- Changing single-run Execution Result row details.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `run-compare-row-details`: Replace stale Analytics compare-with drawer requirements with dedicated Compare page row-detail behavior (default bottom, cell scroll, pivot popup, position-locked view mode).

## Impact

- **Components**: `CompareView`, `ExecutionResultsTab`, `CompareRowDetailPanel`, `CompareRowDetailDisplayPanel`, `CompareRowDetailPivotTable`, `CompareRowDetailBottomPanel`, `CompareTabsContent`.
- **Reuse**: `PivotValueCell` / `FullscreenValueViewer` / `scrollPivotToField` / `mapGridColToPivotField` from single-run `View/RowDetails` (extended for compare colIds).
- **Tests**: `CompareView.spec.tsx`, `ExecutionResultsTab.spec.tsx`, mapping/scroll/pivot specs.
