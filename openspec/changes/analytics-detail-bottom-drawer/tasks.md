## 1. Types and data utilities

- [ ] 1.1 Create `src/components/Runs/Details/BottomDrawer/types.ts` — define `ComparisonSection`, `ComparisonRow`, `DrawerPanelState` interfaces, `ViewMode` type ('table' | 'pivot'), and `DetailMode` type ('sidebar' | 'drawer')
- [ ] 1.2 Create `src/components/Runs/Details/BottomDrawer/utils.ts` — implement `buildComparisonSections()` that transforms one or two `AnalyticsResult` objects + field visibility/section order into `ComparisonSection[]` (union keys across results for extractedColumns and metric groups, null for missing fields), plus `formatFieldValue()`, `getDiffClass()` (with numeric normalization via `Number()` comparison and JSON normalization via parse/stringify), and `valuesAreEqual()` helpers
- [ ] 1.3 Add i18n keys to `src/constants/i18n.ts` under `RunsI18nKey` for: Analysis, Fields, Order, Table, Pivot, Pin, Unpin, Collapse, Close, SwitchToDrawer, SwitchToSidebar, Spotlight, RemoveSpotlight, NoFieldsVisible, ShowMore, and field section names (Execution, TestCaseData, ExtractedColumns, RequestResponse); note: add new keys incrementally during component tasks if labels change
- [ ] 1.4 Add i18n values to `src/locales/en.ts` for all new keys (including "No fields visible. Use the Fields panel to show fields." for NoFieldsVisible)
- [ ] 1.5 Unit tests for `buildComparisonSections()` — test with single `AnalyticsResult`, two results (pinned + active), same result for both (dedup), null/missing values, metric sections with infos, field visibility filtering, section reorder, union of keys across results with null for missing fields; also test `valuesAreEqual()` with numeric normalization ("0.500" vs "0.5"), JSON normalization (different key order), null vs non-null; file: `src/components/Runs/Details/BottomDrawer/tests/utils.spec.ts`

## 2. Hooks

- [ ] 2.1 Create `src/components/Runs/View/useDetailMode.ts` (co-located with `Analytics.tsx`) — manages `detailMode` ('sidebar' | 'drawer'), **sole owner** of `sidebar.showSidebar()`/`sidebar.closeSidebar()` calls within Analytics.tsx (Analytics.tsx must NOT call sidebar APIs directly), exposes `switchToDrawer()`, `switchToSidebar(resultId)`, `openDetail(resultId)`, `closeDetail()`; preserves mode preference across close/reopen; clicking the same active row toggles the detail view closed (matching existing sidebar toggle behavior); cleanup effect on unmount closes both sidebar and drawer
- [ ] 2.2 Create `src/components/Runs/Details/BottomDrawer/useDrawerPanel.ts` — manages drawer-specific UI: `isOpen`, `panelHeight`, `isCollapsed`, `viewMode`, `activeId`, `pinnedId`, `currentHeight` (computed: panelHeight when expanded, 34px when collapsed, 0 when closed — used by Analytics.tsx for grid padding-bottom); exposes `open(id)`, `close()`, `collapse()`, `expand()`, `pin()`, `unpin()`, `setView()`, `clearPinIfMissing(resultIds: string[])`; handles dedup when active === pinned
- [ ] 2.3 Create `src/components/Runs/Details/BottomDrawer/useFieldSelector.ts` — manages `fieldVisibility`, `sectionOrder`, `sectionHidden`, `spotlightedFields` (triggered from Table view rows, NOT from the FieldSelector sidebar); exposes `toggleField()`, `toggleSectionCollapse()`, `toggleSectionHidden()`, `reorderSections()`, `moveSectionByKeyboard(sectionKey, direction)`, `toggleSpotlight()`, `resetAll()`, `allFieldsHidden` (computed boolean for empty state)
- [ ] 2.4 Unit tests for all three hooks — test state transitions, mode switching with sidebar calls, same-row toggle closes detail, pinned===active dedup, clearPinIfMissing with valid/invalid IDs, field visibility toggling, section reorder, spotlight toggle, reset on close, cleanup on unmount; files: `src/components/Runs/View/tests/useDetailMode.spec.ts` and `src/components/Runs/Details/BottomDrawer/tests/hooks.spec.ts`

## 3. Detail mode integration in Analytics.tsx

- [ ] 3.1 Update `src/components/Runs/View/Analytics.tsx` — integrate `useDetailMode` hook; change `onRowClicked` to call `openDetail(resultId)` which routes to sidebar or drawer based on mode
- [ ] 3.2 In sidebar mode: call `sidebar.showSidebar(<RunMetricDetailPanel resultId={...} onClose={...} onSwitchMode={switchToDrawer} />, 'w-[750px]')`; in drawer mode: render `AnalyticsBottomDrawer` and do NOT call `sidebar.showSidebar()`
- [ ] 3.3 Add dynamic `padding-bottom` to the grid container using `useDrawerPanel.currentHeight` (computed value: panelHeight when expanded, 34px when collapsed, 0 when closed) via inline style `style={{ paddingBottom: currentHeight }}`; no ResizeObserver needed
- [ ] 3.3a Call `useDrawerPanel.clearPinIfMissing(resultIds)` whenever the grid `results` state updates — pass the current array of valid result IDs so the pinned case auto-clears if its ID no longer exists after a grid data refresh
- [ ] 3.4 Add optional `onSwitchMode?: () => void` prop to `RunMetricDetailPanel` (`src/components/Runs/Details/RunMetricDetailPanel.tsx`); when provided, render a switcher icon button (`IconLayoutBottombar`) in the header next to the close button
- [ ] 3.5 Update/extend existing Analytics tests to verify: row click opens sidebar in default mode, re-click same row closes sidebar (toggle), mode switch closes sidebar and opens drawer, mode switch from drawer closes drawer and opens sidebar, close preserves mode preference, grid padding tracks drawer height, clearPinIfMissing called on grid refresh, unmount cleans up both sidebar and drawer; file: `src/components/Runs/View/tests/Analytics.spec.tsx` (extend existing or create)

## 4. AnalyticsBottomDrawer shell component

- [ ] 4.1 Create `src/components/Runs/Details/BottomDrawer/AnalyticsBottomDrawer.tsx` — portal-rendered (`createPortal` to `document.body`) fixed-bottom panel; receives `useDrawerPanel` and `useFieldSelector` state as props or uses hooks internally; contains resize handle, `DrawerToolbar`, and body with `FieldSelector` + comparison area
- [ ] 4.2 Implement data fetching: `useEffect` on `activeId`/`pinnedId` calling `getTestCaseRunResultDetails()` from `src/app/[lang]/runs/actions.ts`; parallel fetch with `Promise.all`; cache pinned result in `useRef` until unpin (avoid re-fetch on row clicks); show pinned column data immediately while active column loads; handle loading state (`DialLoader`) and error state (null result → error message; pinned fetch failure → show warning + active-only view)
- [ ] 4.3 Implement resize drag logic on the resize handle (mousedown/mousemove/mouseup on document, min 200px, max viewport - 100px); add keyboard resize support (Arrow Up/Down ±20px, Shift+Arrow ±100px) when handle is focused; handle must be focusable (`tabIndex={0}`, `role="separator"`, `aria-orientation="horizontal"`)
- [ ] 4.4 Implement collapse/expand toggle (hide body + resize bar, height → ~34px; restore on second click; report current height to parent for padding-bottom)
- [ ] 4.5 Implement Escape key handler to close the drawer when focus is within the drawer and no inner overlay (tooltip, dropdown, FullscreenViewer modal) is currently open; check FullscreenViewer context state before closing — if fullscreen modal is open, let it handle Escape first
- [ ] 4.6 Component test for `AnalyticsBottomDrawer` — test renders via portal, loading state shown during fetch, error state on null result, collapse/expand, Escape closes; file: `src/components/Runs/Details/BottomDrawer/tests/AnalyticsBottomDrawer.spec.tsx`

## 5. DrawerToolbar component

- [ ] 5.1 Create `src/components/Runs/Details/BottomDrawer/DrawerToolbar.tsx` — renders: title ("Analysis"), case count, Pin/Unpin controls (badge with pinned case name + X), view toggle buttons (Table | Pivot), "Switch to Sidebar" icon button (`IconLayoutSidebarRight`), Collapse button, Close button
- [ ] 5.2 Component test for `DrawerToolbar` — test pin/unpin badge display, view toggle active state, switcher callback fires, button click callbacks fire; file: `src/components/Runs/Details/BottomDrawer/tests/DrawerToolbar.spec.tsx`

## 6. FieldSelector component

- [ ] 6.1 Create `src/components/Runs/Details/BottomDrawer/FieldSelector.tsx` — 180px left sidebar with Fields/Order tabs
- [ ] 6.2 Implement Fields tab: collapsible section headers with arrow + count, per-field checkbox rows with monospace field names; all fields enabled by default
- [ ] 6.3 Implement Order tab: draggable section rows using existing `DraggableItem` component (NOT `DraggableList` — it's for editable string lists) with a lightweight custom list container using `useDrop`, scoped `DndProvider` + `HTML5Backend`, numbered positions, eye toggle for section visibility; add keyboard reorder via `onKeyDown` on a focusable wrapper around each `DraggableItem` (`tabIndex={0}`, `role="listitem"`) that intercepts Arrow Up/Down and calls `moveSectionByKeyboard` — keeps `DraggableItem` unmodified
- [ ] 6.4 Component test for `FieldSelector` — test tab switching, checkbox toggle updates parent callback, section collapse/expand, eye toggle hides section; file: `src/components/Runs/Details/BottomDrawer/tests/FieldSelector.spec.tsx`

## 7. ComparisonTableView component

- [ ] 7.1 Create `src/components/Runs/Details/BottomDrawer/ComparisonTableView.tsx` — renders comparison table from `ComparisonSection[]`: sticky header row with test case column headers (name, status, duration), section group rows, field rows with values; render empty state ("No fields visible. Use the Fields panel to show fields.") when `allFieldsHidden` is true; long values (>500 chars) show first 200 chars as truncated preview with "Show more" link that expands inline to scrollable pre block (max-height 180px); expanded state is transient (resets on row switch or view toggle)
- [ ] 7.2 Implement diff highlighting: compare raw values between pinned and active columns using `valuesAreEqual()` (with numeric normalization and JSON normalization), apply amber (numeric, based on `ComparisonRow.isNumeric`) or teal (text) background tint via `getDiffClass()` Tailwind classes
- [ ] 7.3 Implement per-row spotlight button (distinct icon from pin 📌) to toggle focus strip inclusion
- [ ] 7.4 Create `src/components/Runs/Details/BottomDrawer/FocusStrip.tsx` — horizontal scrollable strip of spotlighted field cards above the table; each card shows field label, badge, and values per test case; close button to remove from spotlight
- [ ] 7.5 Component test for `ComparisonTableView` — test section grouping, diff class application for numeric and text diffs, no diff when values equal, spotlight toggle, focus strip rendering; file: `src/components/Runs/Details/BottomDrawer/tests/ComparisonTableView.spec.tsx`

## 8. ComparisonPivotView component

- [ ] 8.1 Create `src/components/Runs/Details/BottomDrawer/ComparisonPivotView.tsx` — transposed table: test cases as rows (sticky left column with name + status), fields as columns with section/field name headers (sticky top); scrollable both directions; diff highlighting on active row cells using same `getDiffClass()` logic as Table view (amber for numeric, teal for text diffs)
- [ ] 8.2 Component test for `ComparisonPivotView` — test row per test case, column per visible field, sticky positioning classes, single row when pinned === active, diff highlighting applied on active row cells when pinned case exists; file: `src/components/Runs/Details/BottomDrawer/tests/ComparisonPivotView.spec.tsx`

## 9. Styling

Note: Styling is folded into each component task above (Tailwind utility classes applied directly in component JSX). No standalone styling task — all components use existing theme tokens (`bg-layer-*`, `text-secondary`, `border-primary`, `stroke-accent-primary`, etc.). The drawer portal uses `z-40`.

## 10. Quality checks

- [ ] 10.1 Run `npm run lint` and fix any lint errors
- [ ] 10.2 Run `npm run format:write` to apply formatting
- [ ] 10.3 Run `npm run test` and ensure all tests pass (existing + new)
