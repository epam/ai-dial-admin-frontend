## Context

Execution Result today opens `AnalyticsBottomDrawer` via `createPortal(document.body)` when `useDetailMode` is in drawer mode. That drawer is only consumed by this tab. Compare already has a bottom pivot via `sidebar.showSidebar(..., SidebarPosition.Bottom)` and `CompareRowDetailPivotTable` (two runs + delta). Figma asks for a single-row pivot that reuses Compare’s shell, not its two-run table as-is.

## Goals / Non-Goals

**Goals**

- Bottom pivot by default on Execution Result; switcher still opens `RunMetricDetailPanel` on the right.
- Cell-click → scroll to field; cell → full-value popup; Display tree for visibility/order.
- Unwire and delete the unused drawer shell.

**Non-Goals**

- Changing Compare; redesigning the right sidebar panel; reintroducing pin/table/FieldSelector.

## Decisions

### 1. Show bottom panel via AppContext sidebar Bottom slot

**Decision**: Match Compare — `showSidebar(content, ROW_DETAIL_BOTTOM_CLASS, SidebarPosition.Bottom)`. `Content.tsx` already mounts the bottom slot.

**Alternatives**: Keep portal + `re-resizable` — rejected (inconsistent with Compare, more code to maintain).

### 2. `useDetailMode` owns both positions

**Decision**: Default `DetailMode.Drawer`. Bottom mode calls `showSidebar` with the new panel; Sidebar mode keeps `RunMetricDetailPanel`. `ExtractionResult` no longer renders a drawer child or calls `useDrawerPanel`.

`openDetail(resultId, focusFieldKey?)`: same-row re-click without a field key toggles closed; same-row with a field key keeps open and updates focus.

### 3. Shared shell in `Runs/Details/RowDetails/` + Execution Result UI under `Runs/View/RowDetails/`

**Decision**: Shared row-detail pieces live in `Runs/Details/RowDetails/` so Execution Result does not import from Compare. Compare’s two-run UI stays under `Runs/Compare/.../RowCompareDetails/` and imports the shared layer.

Shared: `RowDetailHeader`, `FieldValue`, `StatusValue`, `RowDetailField` / `RowDetailSection`, layout/pivot constants, `buildRowDetailSections` / `getRowDetailTitle`, `flattenPivotFields`, pivot width helpers (with `includeStickyLabelColumn`), display-tree helpers (optional `defaultHiddenFields`; Compare passes `DEFAULT_HIDDEN_ROW_DETAIL_FIELDS`, Execution Result passes `EXECUTION_RESULT_DEFAULT_HIDDEN_FIELDS` for Duration only). Execution field order is Status → Run number → HTTP → Duration; metric sections render immediately after Execution. The Execution Result pivot includes a filter row on metric columns only.

Execution-only: `ExecutionRowDetailBottomPanel`, `ExecutionRowDetailPivotTable`, `PivotValueCell`, `FullscreenValueViewer`, `ExecutionRowDetailDisplayPanel`, `map-grid-col-to-pivot-field.ts`.

### 4. Popup is single-value, not diff

**Decision**: `DialPopup` + scrollable content (`FullscreenValueViewer`). Do not reuse two-pane `FullscreenDiffViewer`.

### 5. Cleanup scope

**Delete** after unwiring: `AnalyticsBottomDrawer`, `DrawerToolbar`, `ComparisonTableView`, `ComparisonPivotView`, `FieldSelector`/`FieldsTab`/`OrderTab`, `FocusStrip`, `useDrawerPanel`, `useFieldSelector`, `ResizeHandle`, and their tests.

**Keep**: `buildComparisonSections`, `formatFieldValue`, `FullscreenDiffViewer`, `SECTION_I18N`, `EXECUTION_STATUS_FIELD_KEY` (used by Compare / new panel).

## Risks / Trade-offs

- Specs `analytics-comparison-views` and `analytics-field-selector` described the old drawer; delta will REMOVED those requirements so main specs stay truthful. Compare UI is not governed by those specs today.
- Grid `colId` → pivot `fieldKey` mapping must stay in sync with `getAnalyticsColumns` / `buildRowDetailSections` field keys.

## Migration Plan

No data migration. Behavioral change only on Execution Result detail open.
