## 1. Extend `useDrawerPanel` with run-compare mode

- [x] 1.1 Add `isRunCompareMode: boolean` state to `useDrawerPanel` in `apps/ai-dial-admin/src/components/Runs/Details/BottomDrawer/useDrawerPanel.ts`
- [x] 1.2 Add `openRunCompare(activeId: string, comparedId: string | null)` method that sets `activeId`, `pinnedId`, `isRunCompareMode = true`, and `isOpen = true`
- [x] 1.3 Update `close()` to reset `isRunCompareMode = false` (it already clears `activeId` and `pinnedId`)
- [x] 1.4 Guard `clearPinIfMissing` to no-op when `isRunCompareMode` is true
- [x] 1.5 Expose `isRunCompareMode` and `openRunCompare` in the `UseDrawerPanelReturn` interface

## 2. Extend `useDetailMode` with row-highlight-only selection

- [x] 2.1 Add `setSelectedForCompare(id: string)` to `useDetailMode` in `apps/ai-dial-admin/src/components/Runs/View/use-detail-mode.tsx` — sets `selectedResultId` only, no sidebar/drawer side-effects
- [x] 2.2 Add `clearSelected()` to `useDetailMode` — sets `selectedResultId = null` without closing sidebar or drawer
- [x] 2.3 Expose both methods in the `UseDetailModeReturn` interface

## 3. Add i18n key for missing compared result

- [x] 3.1 Add `RunCompareNoMatch` key (value: `"No matching test case in compared run"`) to `RunsI18nKey` enum in `apps/ai-dial-admin/src/constants/i18n.ts` and its translation in `apps/ai-dial-admin/src/locales/en.ts`

## 4. Update `DrawerToolbar` to support run-compare labels

- [x] 4.1 Add optional `runCompareNames?: { current: string; compared: string }` prop to `DrawerToolbar` in `apps/ai-dial-admin/src/components/Runs/Details/BottomDrawer/DrawerToolbar.tsx`
- [x] 4.2 When `runCompareNames` is present, render run names as the active/compared column labels instead of test case name chips
- [x] 4.3 When `runCompareNames` is present, hide the pin button, unpin button, and switch-to-sidebar button

## 5. Update `AnalyticsBottomDrawer` to handle run-compare mode

- [x] 5.1 Add optional `runCompareNames?: { current: string; compared: string }` prop to `AnalyticsBottomDrawer` in `apps/ai-dial-admin/src/components/Runs/Details/BottomDrawer/AnalyticsBottomDrawer.tsx`
- [x] 5.2 Forward `runCompareNames` to `DrawerToolbar`
- [x] 5.3 When `drawerPanel.isRunCompareMode && drawerPanel.pinnedId === null`, render the `RunCompareNoMatch` i18n string as the compared column label in `DrawerToolbar` (override `runCompareNames.compared`)

## 6. Wire run-compare row click in `Analytics.tsx`

- [x] 6.1 In `onRowClicked` in `apps/ai-dial-admin/src/components/Runs/View/Analytics.tsx`, branch on `isCompareMode`: call `detailMode.setSelectedForCompare(event.data.id)` and `drawerPanel.openRunCompare(event.data.id, event.data._compared?.id ?? null)` when in compare mode; keep existing `detailMode.openDetail` path otherwise
- [x] 6.2 Guard the `useLayoutEffect` bridge (`detailMode.drawerOpen → drawerPanel.open`) to skip when `drawerPanel.isRunCompareMode` is true
- [x] 6.3 Add a `useEffect` that watches `isCompareMode`: when it transitions from `true` to `false` and `drawerPanel.isRunCompareMode` is true, call `drawerPanel.close()` and `detailMode.clearSelected()`
- [x] 6.4 Derive `currentRunName` (`run.testRunName || run.id`) and `comparedRunName` (from `siblingRuns.find(r => r.id === comparedRunId)`) in `Analytics.tsx`
- [x] 6.5 Pass `runCompareNames` (when `isCompareMode`) to `AnalyticsBottomDrawer`
- [x] 6.6 Update the `AnalyticsBottomDrawer` render condition to also show the drawer when `drawerPanel.isRunCompareMode` (currently only renders when `detailMode.detailMode === DetailMode.Drawer && detailMode.drawerOpen`)

## 7. Code quality

- [x] 7.1 Run `npm run lint` and `npm run format` from the repo root; fix any issues
- [x] 7.2 Run `npm run test` from `apps/ai-dial-admin/` and confirm all existing tests pass

## 8. Show run names in table and pivot column/row headers

- [x] 8.1 Add optional `runCompareNames?: { current: string; compared: string }` prop to `ComparisonTableView` and use it as column header labels instead of `testCaseName` when present; also apply to `FullscreenDiffViewer` labels
- [x] 8.2 Add optional `runCompareNames?: { current: string; compared: string }` prop to `ComparisonPivotView` and use it as row labels (`_testCaseName`) instead of `testCaseName` when present; also apply to `FullscreenDiffViewer` labels
- [x] 8.3 Forward `runCompareNames` from `AnalyticsBottomDrawer` to both `ComparisonTableView` and `ComparisonPivotView`
- [x] 8.4 Run lint, format, and tests; fix any issues
