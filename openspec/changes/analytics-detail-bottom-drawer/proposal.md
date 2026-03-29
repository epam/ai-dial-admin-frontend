## Why

The Analytics tab in Run Results currently shows a right sidebar panel for inspecting one test case at a time. Users need to compare multiple test case results side-by-side to understand patterns across metric values, test case inputs, extracted outputs, and metric reasoning. A bottom drawer with Table and Pivot views enables structured multi-case comparison with field-level control, pinning, reordering, and diff highlighting — capabilities that don't fit in a sidebar.

Different users prefer different detail layouts depending on their workflow and screen size. Rather than forcing one layout, users should be able to switch between the sidebar and the bottom drawer as the active detail view.

## What Changes

- **Detail view switcher**: a toggle control on the detail panel header that lets the user switch between "Sidebar" (existing right panel) and "Drawer" (new bottom panel) modes. Only one is visible at a time — they are mutually exclusive.
- **New bottom drawer panel** in the Analytics tab (Run Detail view) as an alternative detail view, activated via the switcher
- **Table view**: vertical layout with fields as rows, test cases as columns, section grouping (Execution, Test Case Data, Extracted Columns, Request/Response, per-metric groups), diff highlighting, and field-level pin-to-focus-strip
- **Pivot view**: transposed layout with test cases as rows, fields as columns, section headers in column headers
- **Field selector sidebar** (left of drawer): Fields tab with checkboxes per section/field, Order tab with drag-to-reorder and hide/show sections
- **Pin functionality**: pin a test case for side-by-side comparison; pinned case persists as a reference column while navigating other rows
- **Resizable drawer**: drag handle to resize, collapse/expand, close

## Capabilities

### New Capabilities
- `analytics-detail-view-switcher`: Switcher control that toggles between sidebar and bottom drawer detail modes; manages mutual exclusion, preserves selected row context when switching
- `analytics-bottom-drawer`: Bottom drawer panel component with resize, collapse, open/close lifecycle, and integration with the Analytics tab grid row selection
- `analytics-comparison-views`: Table and Pivot view renderers consuming analytics result data, with section grouping, field filtering, diff highlighting, and pin-to-focus-strip
- `analytics-field-selector`: Left sidebar within the drawer for field visibility toggles (Fields tab) and section reorder via drag-and-drop (Order tab)

### Modified Capabilities
<!-- No existing spec-level requirements are changing. The right sidebar detail panel remains as-is; it is just conditionally shown/hidden based on the switcher. -->

## Impact

- **Components affected**: `AnalyticsTab.tsx` (detail mode state, switcher integration), `RunMetricDetailPanel.tsx` header area (switcher button added)
- **New components**: `DetailViewSwitcher`, `AnalyticsBottomDrawer`, `ComparisonTableView`, `ComparisonPivotView`, `FieldSelector`, `FocusStrip`
- **Data**: Reuses existing `getTestCaseRunResultDetails()` server action and `AnalyticsResult` / `MetricGroup` types; may need to fetch 2 results in parallel for comparison in drawer mode
- **Dependencies**: `react-dnd` (already in project) for section drag-reorder; no new external deps
- **Layout**: When drawer is the active detail view, the sidebar is hidden and the grid gets padding-bottom equal to drawer height. When sidebar is active, drawer is hidden and grid has no extra padding.
