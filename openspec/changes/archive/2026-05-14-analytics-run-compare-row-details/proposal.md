## Why

When comparing two runs in the Analytics tab, clicking a grid row currently opens the single-result sidebar — which ignores the compared run's data entirely. Users have no way to inspect how a specific test case performed across both runs from the grid row level.

## What Changes

- In run-compare mode (a second run is selected in the Compare With dropdown), clicking any grid row opens the bottom drawer instead of the sidebar.
- The drawer shows a side-by-side comparison of that test case's results across the two selected runs using the existing diff/comparison UI.
- Column labels in the drawer toolbar show the run names (e.g. "Run A · May 12" vs "Run B · May 14") instead of test case name chips.
- Pin/unpin controls and the "switch to sidebar" button are hidden in this mode — the comparison is implicitly the two runs, not two user-selected rows.
- Clicking a different row updates both sides of the comparison simultaneously.
- If the test case has no matching result in the compared run, the drawer opens with a "No matching test case in compared run" placeholder on the compared side.
- Exiting compare mode (clearing the Compare With dropdown) closes the drawer.

## Capabilities

### New Capabilities

- `run-compare-row-details`: Row click in run-compare mode opens the bottom drawer with a locked two-run comparison — active side is the current run's result, compared side is the other run's result for the same test case. No pin interaction; clicking a different row replaces both sides.

### Modified Capabilities

_(none — existing specs are not changing)_

## Impact

- `Analytics.tsx` — `onRowClicked` branches on `isCompareMode`; bridge `useLayoutEffect` guarded; exit-compare cleanup added; run names passed to drawer.
- `useDrawerPanel.ts` — new `isRunCompareMode` flag, `openRunCompare(activeId, comparedId)` method; `clearPinIfMissing` skips when in run-compare mode.
- `useDetailMode.tsx` — new `setSelectedForCompare(id)` for row-highlight tracking without sidebar/drawer side-effects.
- `AnalyticsBottomDrawer.tsx` — accepts optional run name props; renders placeholder when compared side is null in run-compare mode.
- `DrawerToolbar.tsx` — shows run names as column labels, hides pin/unpin and sidebar-switch when run-compare names are provided.
