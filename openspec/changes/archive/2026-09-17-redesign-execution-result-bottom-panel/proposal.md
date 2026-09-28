## Why

The Execution Result tab’s bottom detail experience is a portaled Analytics drawer built for in-run pinning, table/pivot toggle, and a left field selector. Design now calls for a Compare-style single-row pivot panel that opens by default, scrolls to the clicked grid field, and opens a full-content popup on cell click — while keeping the existing right-side `RunMetricDetailPanel`.

## What Changes

- Replace the portaled `AnalyticsBottomDrawer` on the Execution Result tab with a bottom pivot panel shown via AppContext sidebar (`SidebarPosition.Bottom`), matching Compare’s shell pattern.
- **Default detail mode becomes bottom** (was sidebar). Right sidebar remains `RunMetricDetailPanel`.
- Pivot-only body: section headers, field labels, one value row; Display overlay for field visibility/order (no table/pivot toggle, pin, DiffMiniMap, or per-column filters).
- Grid cell click opens/keeps the panel and horizontally scrolls to the matching pivot column.
- Truncated pivot cells show an “open in popup” affordance on hover; cell click opens a `DialPopup` with the full value.
- **BREAKING** (Execution Result only): remove pin-two-cases, table view, FieldSelector, portal resize/collapse from this tab. Delete the unused drawer shell after unwiring.
- Compare Execution Results are unchanged.

## Non-goals

- Restyle `RunMetricDetailPanel`.
- Change Compare Execution Results UI.
- In-run pin of a second test case on Execution Result.
- Table view, DiffMiniMap, or per-column search/filter in the new pivot.

## Capabilities

### New Capabilities

<!-- none — reuse existing analytics-* capabilities -->

### Modified Capabilities

- `analytics-detail-view-switcher`: Default mode is bottom; both modes use `sidebar.showSidebar` with a position; cell-click focus field support.
- `analytics-bottom-drawer`: Replace pin / table-pivot / FieldSelector / portal-resize with single-row pivot, Display overlay, cell-click scroll, and value popup.
- `analytics-comparison-views`: Drop requirements that only described the old Execution Result drawer (Compare has its own UI).
- `analytics-field-selector`: Drop requirements that only described the old drawer FieldSelector (replaced by Display `TreeColumnsPanel` on Execution Result).

## Impact

- **Components**: `ExtractionResult.tsx`, `use-detail-mode.tsx`; new `Runs/View/RowDetails/*`; delete unused `Runs/Details/BottomDrawer` shell pieces.
- **Reuse**: Shared row-detail shell under `Runs/Details/RowDetails/` (`RowDetailHeader`, `FieldValue`/`StatusValue`, `buildRowDetailSections`, pivot flatten/width helpers, `ROW_DETAIL_BOTTOM_CLASS`); Compare keeps two-run UI and imports from there.
- **Layout**: Bottom panel via existing `<Sidebar slot={Bottom} />` in `Content.tsx` — no portal/`re-resizable`.
- **Data**: Same `getTestCaseRunResultDetails()` server action.
