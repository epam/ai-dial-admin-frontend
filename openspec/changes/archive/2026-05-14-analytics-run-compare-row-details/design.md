## Context

The Analytics tab has two detail-viewing modes (sidebar and bottom drawer) coordinated by `useDetailMode`, plus a `useDrawerPanel` hook that owns drawer state including `activeId` (currently selected row) and `pinnedId` (user-pinned row for within-run comparison). When the user selects a second run via the Compare With dropdown, `isCompareMode` becomes true and each grid row is a `CompareAnalyticsRow` — it carries both the current run's `AnalyticsResult` and `_compared?: AnalyticsResult` from the other run.

The existing bottom drawer already supports side-by-side comparison between `activeId` and `pinnedId`. The challenge is extending it so that in run-compare mode the two sides are set atomically on each row click (not user-initiated pin), and the toolbar reflects runs rather than test case names.

## Goals / Non-Goals

**Goals:**
- Row click in run-compare mode always opens the bottom drawer with both run sides populated.
- Toolbar shows run names as column labels; pin/unpin and sidebar-switch controls are hidden.
- Clicking a different row replaces both sides simultaneously.
- Exiting compare mode closes the drawer cleanly.
- No matching result in the compared run renders a clear placeholder.

**Non-Goals:**
- No new components; reuse `AnalyticsBottomDrawer`, `ComparisonTableView`, `ComparisonPivotView`, `DrawerToolbar` as-is where possible.
- No changes to the within-run pin comparison flow.
- No changes to the ExtractionResult tab.

## Decisions

### 1. Extend `useDrawerPanel` with `isRunCompareMode` flag

**Decision**: Add `isRunCompareMode: boolean`, `openRunCompare(activeId, comparedId | null)` to `useDrawerPanel`. Guard `clearPinIfMissing` to no-op when `isRunCompareMode` (otherwise it would wipe `pinnedId` because the compared run's result IDs aren't in the current run's `resultIds`). `close()` resets the flag.

**Alternative considered**: New `useRunCompareDrawer` hook. Rejected — would duplicate all resize, collapse, viewMode, and fieldSelector integration that `useDrawerPanel` already handles.

### 2. Row click routing stays in `Analytics.tsx`; `useDetailMode` gets `setSelectedForCompare`

**Decision**: `onRowClicked` in `Analytics.tsx` branches on `isCompareMode`. When true, it calls `detailMode.setSelectedForCompare(id)` (updates `selectedResultId` for row highlighting only, no sidebar/drawer side-effects) and `drawerPanel.openRunCompare(id, _compared?.id)` directly. The existing `useLayoutEffect` bridge is guarded to skip when `drawerPanel.isRunCompareMode`.

**Alternative considered**: Route all logic through `useDetailMode`. Rejected — `useDetailMode` doesn't know about the compared run's result ID and would need to accept it as a parameter, coupling the detail-mode hook to the compare feature.

### 3. Run names flow as props from `Analytics.tsx` down to `AnalyticsBottomDrawer`

**Decision**: `Analytics.tsx` derives `currentRunName` (`run.testRunName || run.id`) and `comparedRunName` (from `siblingRuns`) and passes them as an optional `runCompareNames?: { current: string; compared: string }` prop to `AnalyticsBottomDrawer`, which forwards it to `DrawerToolbar`. `DrawerToolbar` uses presence of `runCompareNames` to switch label rendering and hide pin/unpin/sidebar-switch.

**Alternative considered**: Pass via a new context. Rejected — the data flow is shallow (3 levels) and a direct prop is cleaner.

### 4. Exit compare mode via `useEffect` watching `isCompareMode`

**Decision**: A `useEffect` in `Analytics.tsx` watches `isCompareMode`. When it transitions `true → false` and `drawerPanel.isRunCompareMode` is true, call `drawerPanel.close()` and `detailMode.clearSelected()`. This handles both the clear-button path and any future path that clears `comparedRunId`.

### 5. Null compared result renders a placeholder inside the drawer

**Decision**: When `drawerPanel.isRunCompareMode && drawerPanel.pinnedId === null`, `AnalyticsBottomDrawer` renders a muted text message ("No matching test case in compared run") in place of the pinned column content. The active side still loads and displays normally. This is handled by passing `comparedMissing: boolean` to `ComparisonTableView` / `ComparisonPivotView` via an existing or new header slot in `DrawerToolbar`.

Simpler alternative: show the message as the `pinnedName` label in the toolbar. Rejected — it's easy to miss when the drawer is collapsed; a visible placeholder in the content area is clearer.

## Risks / Trade-offs

- **`clearPinIfMissing` guard**: if this guard is accidentally left active after the drawer closes, a stale `pinnedId` from the compared run could persist. Mitigated by `close()` resetting `isRunCompareMode` and clearing `pinnedId` as it already does.
- **Bridge guard**: the `useLayoutEffect` bridge skip on `isRunCompareMode` means if a bug leaves `isRunCompareMode=true` after compare mode exits, the bridge will stop syncing the drawer. The exit-compare `useEffect` clears this before any normal row click can fire.
- **i18n**: run name labels are dynamic values, not translatable strings — only the "No matching test case" placeholder needs an i18n key.
