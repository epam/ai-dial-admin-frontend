## 1. Types and data utilities

- [ ] 1.1 Create `src/components/Runs/Details/BottomDrawer/types.ts` — define `ComparisonSection`, `ComparisonRow`, `BottomDrawerState` interfaces, `ViewMode` type ('table' | 'pivot'), and `DetailMode` type ('sidebar' | 'drawer')
- [ ] 1.2 Create `src/components/Runs/Details/BottomDrawer/utils.ts` — implement `buildComparisonSections()` that transforms two `TestCaseRunResultDetails` objects + `MetricGroup[]` into `ComparisonSection[]`, plus `formatFieldValue()` and `getDiffClass()` helpers
- [ ] 1.3 Add i18n keys to `src/constants/i18n.ts` under `RunsI18nKey` for: Analysis, Fields, Order, Table, Pivot, Pin, Unpin, Collapse, Close, SwitchToDrawer, SwitchToSidebar, and field section names
- [ ] 1.4 Add i18n values to `src/locales/en.ts` for all new keys
- [ ] 1.5 Unit tests for `buildComparisonSections()` — test with single detail, two details (pinned + active), null/missing values, metric sections with infos; file: `src/components/Runs/Details/BottomDrawer/tests/utils.spec.ts`

## 2. Detail mode state and switcher

- [ ] 2.1 Add `detailMode` ('sidebar' | 'drawer') state to `src/components/Runs/View/AnalyticsTab.tsx`; default to 'sidebar'; wire row click to open whichever mode is active
- [ ] 2.2 Conditionally render `RunMetricDetailPanel` (sidebar) or `AnalyticsBottomDrawer` (drawer) based on `detailMode` — mutual exclusion, only one mounted at a time
- [ ] 2.3 When switching modes, preserve `selectedResultId`; when switching from drawer to sidebar, clear pinned state
- [ ] 2.4 Add switcher button to `RunMetricDetailPanel` header — icon button (e.g. `IconLayoutBottombar`) that sets `detailMode` to 'drawer'; passed as a prop or callback from `AnalyticsTab`
- [ ] 2.5 Ensure closing the active detail view (X button) preserves the mode preference — next row click reopens the same mode
- [ ] 2.6 Unit tests for detail mode switching — test mutual exclusion, context preservation, close-then-reopen behavior; file: `src/components/Runs/View/tests/AnalyticsTab.spec.tsx` (extend existing)

## 3. useBottomDrawer hook

- [ ] 3.1 Create `src/components/Runs/Details/BottomDrawer/useBottomDrawer.ts` — manages `isOpen`, `activeId`, `pinnedId`, `viewMode`, `panelHeight`, `fieldVisibility`, `sectionOrder`, `sectionHidden`, `focusPinnedFields` state; exposes `open(id)`, `close()`, `collapse()`, `pin()`, `unpin()`, `setView()`, `toggleField()`, `toggleSection()`, `reorderSections()`, `toggleFocusPin()`
- [ ] 3.2 Implement parallel detail fetching: when `activeId` or `pinnedId` changes, call `getTestCaseRunResultDetails()` for each; cache pinned detail until unpin
- [ ] 3.3 Unit tests for `useBottomDrawer` hook — test open/close/pin/unpin state transitions, detail fetch triggering, field visibility toggling; file: `src/components/Runs/Details/BottomDrawer/tests/useBottomDrawer.spec.ts`

## 4. AnalyticsBottomDrawer shell component

- [ ] 4.1 Create `src/components/Runs/Details/BottomDrawer/AnalyticsBottomDrawer.tsx` — portal-rendered fixed-bottom panel with resize handle, toolbar (`DrawerToolbar`), and body containing `FieldSelector` + comparison area
- [ ] 4.2 Implement resize drag logic on the resize handle (mousedown/mousemove/mouseup on document, min 120px, max viewport - 100px)
- [ ] 4.3 Implement collapse/expand toggle (hide body + resize bar, reduce to ~34px; restore on second click)
- [ ] 4.4 Implement Escape key handler to close the drawer when focus is within
- [ ] 4.5 Component test for `AnalyticsBottomDrawer` — test renders via portal, open/close lifecycle, collapse/expand; file: `src/components/Runs/Details/BottomDrawer/tests/AnalyticsBottomDrawer.spec.tsx`

## 5. DrawerToolbar component

- [ ] 5.1 Create `src/components/Runs/Details/BottomDrawer/DrawerToolbar.tsx` — renders title ("Analysis"), case count, Pin/Unpin controls, view toggle buttons (Table | Pivot), "Switch to Sidebar" button, Collapse button, Close button
- [ ] 5.2 Component test for `DrawerToolbar` — test pin/unpin badge display, view toggle active state, switcher callback, button click callbacks; file: `src/components/Runs/Details/BottomDrawer/tests/DrawerToolbar.spec.tsx`

## 6. FieldSelector component

- [ ] 6.1 Create `src/components/Runs/Details/BottomDrawer/FieldSelector.tsx` — 180px left sidebar with Fields/Order tabs
- [ ] 6.2 Implement Fields tab: collapsible section headers with arrow + count, per-field checkbox rows with monospace field names
- [ ] 6.3 Implement Order tab: draggable section rows using `react-dnd` (HTML5Backend, scoped `DndProvider`), numbered positions, eye toggle for section visibility
- [ ] 6.4 Component test for `FieldSelector` — test tab switching, checkbox toggle updates parent state, section collapse/expand, drag reorder; file: `src/components/Runs/Details/BottomDrawer/tests/FieldSelector.spec.tsx`

## 7. ComparisonTableView component

- [ ] 7.1 Create `src/components/Runs/Details/BottomDrawer/ComparisonTableView.tsx` — renders comparison table from `ComparisonSection[]`: sticky header row with test case column headers, section group rows, field rows with values
- [ ] 7.2 Implement diff highlighting: compare raw values between pinned and active columns, apply amber (numeric) or teal (text) background tint via Tailwind classes
- [ ] 7.3 Implement per-row pin button to toggle focus strip inclusion
- [ ] 7.4 Create `src/components/Runs/Details/BottomDrawer/FocusStrip.tsx` — horizontal scrollable strip of pinned field cards above the table; each card shows field label, badge, and values per test case
- [ ] 7.5 Component test for `ComparisonTableView` — test section grouping, diff class application, focus strip rendering; file: `src/components/Runs/Details/BottomDrawer/tests/ComparisonTableView.spec.tsx`

## 8. ComparisonPivotView component

- [ ] 8.1 Create `src/components/Runs/Details/BottomDrawer/ComparisonPivotView.tsx` — transposed table: test cases as rows (sticky left column), fields as columns with section/field name headers (sticky top)
- [ ] 8.2 Component test for `ComparisonPivotView` — test row per test case, column per visible field, sticky positioning classes; file: `src/components/Runs/Details/BottomDrawer/tests/ComparisonPivotView.spec.tsx`

## 9. Integration and layout

- [ ] 9.1 Wire `AnalyticsTab` row click to call `useBottomDrawer.open(resultId)` when `detailMode === 'drawer'`
- [ ] 9.2 Add dynamic `padding-bottom` to the analytics grid container matching drawer height when drawer mode is active and drawer is open; no extra padding in sidebar mode
- [ ] 9.3 Update existing `AnalyticsTab` tests to verify drawer opens on row click in drawer mode, grid padding adjusts, and sidebar opens in sidebar mode

## 10. Styling

- [ ] 10.1 Add Tailwind utility classes or component-scoped styles for drawer layout, resize handle, field selector, comparison table, pivot table, focus strip, diff highlighting, and switcher button — use existing theme tokens (`bg-layer-*`, `text-secondary`, `border-primary`, etc.)

## 11. Quality checks

- [ ] 11.1 Run `npm run lint` and fix any lint errors
- [ ] 11.2 Run `npm run format:write` to apply formatting
- [ ] 11.3 Run `npm run test` and ensure all tests pass (existing + new)
