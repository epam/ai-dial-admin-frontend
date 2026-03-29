## Context

The Analytics tab in Run Detail view (`Analytics.tsx`) renders an AG Grid of test case run results. Clicking a row opens a 750px right sidebar via the global `AppContext` sidebar system — calling `sidebar.showSidebar(<RunMetricDetailPanel .../>)`. The sidebar container itself lives in `Content.tsx` in the layout hierarchy, not inside `Analytics.tsx`. `RunMetricDetailPanel` receives a `resultId` and `onClose` callback as props.

Users need to compare multiple results side-by-side. The HTML prototype in `sandbox/ui-ux-prototyping-with-admin-styles/prototype.html` demonstrates the UX: a resizable bottom drawer with Table and Pivot views, a left field selector, pinning, and diff highlighting.

The right sidebar and bottom drawer are **mutually exclusive** detail views. A switcher control lets the user choose which layout is active. When one is shown, the other is hidden. The selected row context carries over when switching.

## Goals / Non-Goals

**Goals:**
- Switcher button on the detail panel to toggle between sidebar and bottom drawer modes
- Mutual exclusion: only one detail view is open at a time
- Bottom drawer panel as an alternative detail view
- Table view: fields as rows, test cases as columns, with section grouping
- Pivot view: test cases as rows, fields as columns
- Field selector sidebar with visibility toggles and section reorder
- Pin a test case as a reference column for comparison
- Resizable, collapsible, closable drawer
- Diff highlighting when comparing pinned vs. active test case
- Selected row context preserved when switching between modes
- Loading and error states in the drawer matching existing sidebar patterns
- "Select All / Deselect All" toggle per section in the Fields tab
- Search/filter input in the Fields tab for finding fields quickly
- Click-to-collapse section headers in the Table view (in addition to Field Selector control)
- Diff summary badge in toolbar showing total difference count when comparing
- Visual indication of spotlighted fields in Pivot view (highlighted column headers)
- Explicit resize handle visual affordance (thin bar with grip indicator, hover state)
- Smooth crossfade transition when switching between Table and Pivot views

**Non-Goals:**
- Read/prose view (only Table and Pivot)
- Persisting detail mode preference across page navigations or sessions
- Editing test case data from within the drawer
- Chart/visualization views for metric trends
- Responsive/mobile layout for the drawer (desktop-first; can be addressed later)

## Decisions

### 1. Sidebar is controlled via `AppContext`, not conditional mounting

The sidebar is a **global layout feature** managed by `useAppContext().sidebar`. `Analytics.tsx` calls `sidebar.showSidebar(content, className)` to open and `sidebar.closeSidebar()` to close. The sidebar `<aside>` DOM element always lives in `Content.tsx` — it is never mounted/unmounted by `Analytics.tsx`.

Therefore, the mutual exclusion works as:
- **Sidebar mode**: `Analytics.tsx` calls `sidebar.showSidebar()` on row click (existing behavior). Drawer component is not rendered.
- **Drawer mode**: `Analytics.tsx` does *not* call `sidebar.showSidebar()`. Instead, it renders `AnalyticsBottomDrawer` (via portal). `sidebar.closeSidebar()` is called if the sidebar was previously open.

**Ownership**: `useDetailMode` is the **single owner** of sidebar lifecycle within `Analytics.tsx`. All `sidebar.showSidebar()` and `sidebar.closeSidebar()` calls go through `useDetailMode`'s exposed methods (`openDetail`, `switchToSidebar`, `switchToDrawer`, `closeDetail`). `Analytics.tsx` must NOT call `sidebar.*` directly — it delegates to `useDetailMode` which internally coordinates with `useAppContext().sidebar`. Note: if another component calls `sidebar.closeSidebar()` externally, `useDetailMode` won't know — this is acceptable because the sidebar is only used for detail panels in the Analytics/ExtractionResult context and no other component closes it while Analytics is mounted.

**Focus management on mode switch**: When switching sidebar → drawer, focus the drawer toolbar's first focusable element. Because the drawer is rendered via portal after a state change, the DOM element won't exist synchronously — use a `ref` callback on the toolbar container (or `requestAnimationFrame`) to defer the `.focus()` call until the portal has mounted. When switching drawer → sidebar, let the sidebar manage its own focus (existing behavior — `RunMetricDetailPanel` receives focus naturally via the sidebar container).

**Row re-click toggle**: Clicking the same row that is already active **closes** the detail view (matching the existing sidebar toggle behavior). In sidebar mode, `closeDetail()` calls `sidebar.closeSidebar()`. In drawer mode, `closeDetail()` closes the drawer (clearing pinned/field state). This preserves the current UX contract. If a pinned case exists and the user clicks the active (non-pinned) row again, the drawer closes entirely (pinned state is cleared).

**Clicking the pinned row**: If the user clicks the row that is currently pinned (but is not the active row), it becomes the new active row. The drawer then shows a single column (since active === pinned, dedup applies). This is NOT a toggle-close — only clicking the *active* row toggles the drawer closed.

When switching modes:
- Sidebar → Drawer: `useDetailMode.switchToDrawer()` calls `sidebar.closeSidebar()`, then opens drawer with same `selectedResultId`
- Drawer → Sidebar: `useDetailMode.switchToSidebar()` closes drawer (clearing pinned/field state), then calls `sidebar.showSidebar()` with `<RunMetricDetailPanel resultId={selectedResultId} onClose={...} onSwitchMode={...} />`

### 2. Switcher button: new `onSwitchMode` callback prop on `RunMetricDetailPanel`

`RunMetricDetailPanel` currently accepts `{ resultId, onClose }`. Add an optional `onSwitchMode?: () => void` prop. When provided, the header renders a switcher icon button (e.g., `IconLayoutBottombar` from `@tabler/icons-react`). Clicking it calls `onSwitchMode()`, which `Analytics.tsx` handles by changing `detailMode` to `'drawer'`.

The `DrawerToolbar` has its own "Switch to Sidebar" button that calls the reverse callback.

**Alternative considered**: A shared `DetailViewSwitcher` component used in both places. Rejected — it's just an icon button with a callback; no need for a shared component.

### 3. Component location: `Runs/Details/BottomDrawer/`

Place all bottom drawer components under `src/components/Runs/Details/BottomDrawer/`. Co-located with existing detail panel components.

### 4. State management: split into focused hooks

Instead of one large `useBottomDrawer` hook, split concerns:

- **`useDetailMode`** (in `Runs/View/useDetailMode.ts`, co-located with `Analytics.tsx`): manages `detailMode` ('sidebar' | 'drawer'), `selectedResultId`, `drawerOpen` (boolean signal — NOT the drawer's internal state), mode switching logic, and sidebar open/close calls. Lives at the Analytics level because it owns sidebar lifecycle via `useAppContext().sidebar` — conceptually it belongs to the view layer, not nested inside `BottomDrawer/`. Exposes `openDetail()`, `closeDetail()`, `switchToSidebar()`, `switchToDrawer()`. When closing the drawer, `useDetailMode` sets `drawerOpen = false` — it does NOT call `useDrawerPanel` or `useFieldSelector` methods directly.
- **`useDrawerPanel`** (in `BottomDrawer/useDrawerPanel.ts`): manages drawer-specific UI — `isOpen`, `panelHeight` (default: `DEFAULT_DRAWER_HEIGHT = 380`), `isCollapsed`, `viewMode` ('table' | 'pivot'), `pinnedId`, open/close/collapse/pin/unpin. Constants: `DEFAULT_DRAWER_HEIGHT = 380`, `MIN_DRAWER_HEIGHT = 200`, `COLLAPSED_HEIGHT = 34`.
- **`useFieldSelector`** (in `BottomDrawer/useFieldSelector.ts`): manages `fieldVisibility`, `sectionOrder`, `sectionHidden`, `spotlightedFields` (renamed from "pinned fields" — see Decision #9)

**Reset orchestration**: `AnalyticsBottomDrawer` is the single owner of drawer cleanup. It watches `useDetailMode.drawerOpen` — when it transitions to `false`, it calls `useDrawerPanel.close()` AND `useFieldSelector.resetAll()`. This keeps `useDetailMode` decoupled from the drawer's internal hooks. `useDetailMode` only controls the signal; the drawer component reacts to it. On unmount, `AnalyticsBottomDrawer`'s cleanup effect also calls both resets.

Data fetching stays in `AnalyticsBottomDrawer` component using `useEffect` on `activeId`/`pinnedId`, calling the server action `getTestCaseRunResultDetails()` from `src/app/[lang]/runs/actions.ts`.

### 5. Data flow: reuse existing `AnalyticsResult` type

The detail API `getTestCaseRunResultDetails(id)` (server action in `src/app/[lang]/runs/actions.ts`) returns `AnalyticsResult | null`. This is the same type used by the existing sidebar.

**Data sharing between modes**: When switching from sidebar to drawer (or vice versa), the already-fetched `AnalyticsResult` for the active `resultId` is NOT shared — each mode fetches independently. This is acceptable because mode switches are infrequent, and the sidebar uses a different component lifecycle.

Within the drawer, the pinned result is cached in a `useRef` and reused until unpin (avoiding re-fetch when the user clicks different rows). **Important**: the ref must be cleared in all code paths that remove the pinned case — `unpin()`, `close()`, AND `clearPinIfMissing()`. Failing to clear the ref in `clearPinIfMissing` would leave stale data visible after the grid refreshes.

A utility `buildComparisonSections()` in `BottomDrawer/utils.ts` transforms one or two `AnalyticsResult` objects into a normalized structure:

```typescript
interface ComparisonSection {
  key: string;            // e.g. 'execution', 'testCaseData', 'extractedColumns', 'requestResponse', 'metric:groupName'
  label: string;          // display name for section header
  rows: ComparisonRow[];
}
interface ComparisonRow {
  fieldKey: string;
  label: string;
  badge?: 'bound' | 'info';
  isNumeric: boolean;     // true for metric values — drives diff highlight color (amber vs teal)
  values: Array<{ raw: string | null; display: ReactNode }>;
}
```

**Section generation rules:**
- "Execution" section: always present, fields = `executionStatus`, `execDurationMs`
- "Test Case Data" section: from `testCaseData` record keys — union of keys across all provided results
- "Extracted Columns" section: from `extractedColumns` record keys — union across results. If a result lacks a key present in the other, its value is `null` (rendered as "—")
- "Request / Response" section: from `requestBody`, `responseBody` — always present if either result has data
- Metric sections: one per group from `metricValues` keys (reuses `getMetricGroups()` logic). Groups are unioned across results — if one result has a metric group the other doesn't, the missing result shows null values for that group's fields
- Fields within each section are sorted alphabetically by key. Note: this means field order can change when a different active row is selected (if it has different keys in `extractedColumns` or `testCaseData`). This is acceptable — stable order based on the union is preferred over first-seen insertion order, as alpha sort is predictable and reproducible

Both Table and Pivot views consume `ComparisonSection[]`.

**Memoization stability**: `buildComparisonSections()` is wrapped in `useMemo` with deps on active result, pinned result, field visibility, and section order. To prevent unnecessary recomputation, `fieldVisibility` and `sectionOrder` in `useFieldSelector` must use stable references — use `useReducer` (or functional `setState`) so that the state object identity only changes on actual mutations, not on every render cycle.

### 6. Drawer positioning: fixed bottom with portal

Render the drawer via `createPortal` to `document.body` (matching the existing `FullscreenViewerModal` pattern). The drawer uses `z-[35]` to sit below the Header (`z-40`), notifications (`z-[100]`), and fullscreen modals (`z-50`) but above normal page content. The main grid container gets `padding-bottom` equal to the drawer's **current rendered height** (including collapsed state — 34px when collapsed, full height when expanded).

**Height communication and hook ownership**: `useDrawerPanel` is called in `Analytics.tsx` (not inside `AnalyticsBottomDrawer`). `Analytics.tsx` passes the hook's state and methods down to `AnalyticsBottomDrawer` as props. This way `Analytics.tsx` can read `currentHeight` directly for grid height adjustment without prop-drilling upward. `currentHeight` is a derived value (number in px): `panelHeight` when expanded, `COLLAPSED_HEIGHT` (34px) when collapsed, `0` when closed. No ResizeObserver needed — the hook is the single source of truth for height.

**⚠ AG Grid compatibility**: AG Grid manages its own virtual scroll viewport based on its container's dimensions. Applying `padding-bottom` on the wrapper div may NOT correctly reduce AG Grid's visible area — it calculates row virtualization from its own container height, not the parent's padding. **Preferred approach**: reduce the grid container's `height` or `max-height` (e.g., `style={{ height: \`calc(100% - ${currentHeight}px)\` }}`) rather than adding `padding-bottom`. Verify with AG Grid that virtual scrolling and row rendering update correctly when the container height changes dynamically.

**Browser resize clamping**: `useDrawerPanel` must listen for the `window` `resize` event and clamp `panelHeight` to `window.innerHeight - 100` if it exceeds the new maximum. This prevents the drawer from overflowing the viewport after the browser window shrinks.

### 7. Resize: vanilla mousedown/mousemove

The resize handle is a 6px-tall bar spanning the full drawer width at the top edge, with a centered 32px-wide grip indicator (3 horizontal lines or dots). On hover, the bar shows `bg-layer-3` background and `cursor: ns-resize`. On focus, it shows a focus ring matching the app's `focus-visible` style.

`onMouseDown` on the resize bar, `mousemove` on `document` to adjust height. Min: 200px (toolbar ~34px + field selector tabs ~32px + usable content area). Max: `window.innerHeight - 100`. Keyboard support: when the resize handle is focused, Arrow Up/Down adjusts height by 20px per press, Shift+Arrow by 100px. Arrow Up = handle moves up = drawer grows taller (follows the "drag the top edge" mental model, not the "scroll" mental model).

**Transitions**: Apply `transition: height 150ms ease` on the drawer container for collapse/expand animations. Disable the transition during active drag resize (add/remove a `dragging` class or inline style) to avoid lag.

**Why not `re-resizable`**: The project uses `re-resizable` for the sidebar (`SideBar.tsx`), but it's designed for left/right resizing on inline elements. The drawer is a fixed-bottom portal that resizes by dragging its top edge upward — `re-resizable`'s `top` handle inverts the drag direction logic and fights with fixed positioning. Vanilla mousedown/mousemove is simpler and more predictable for this specific layout.

### 8. Field selector: checkbox tree + drag reorder via `DraggableItem`

The Fields tab renders collapsible section groups with per-field checkboxes. The Order tab reuses the existing `DraggableItem` component from `src/components/Common/DraggableItem/` for drag handle + drop target behavior, wrapped in a scoped `DndProvider` + `HTML5Backend` (matching the pattern in `GridView.tsx`, `ContainerVariables.tsx`).

**Note**: `DraggableList` (`Common/Lists/DraggableList.tsx`) is NOT reused — it is designed for editable string lists with add/remove input fields (`NewItem` components), which doesn't fit section reordering. A lightweight custom list container with `useDrop` is needed to manage `ComparisonSection` keys.

**Keyboard reorder**: The existing `DraggableItem` has no keyboard handling (no `tabIndex`, no `onKeyDown` on the drag handle). Rather than modifying `DraggableItem` (which would affect all existing usages), the Order tab wraps each `DraggableItem` with an `onKeyDown` handler on a focusable container (`tabIndex={0}`, `role="listitem"`) that intercepts Arrow Up/Down and calls `moveSectionByKeyboard(sectionKey, direction)`. This keeps `DraggableItem` untouched. Note: specs that say "focuses a section's drag handle" should be read as "focuses the section row" — the keyboard handler lives on the wrapper, not the drag handle itself.

### 9. Naming: "spotlight" for field-level pins, "pin" for test case pins

**Field name truncation**: Metric group names can be long (e.g., `aidial_rag_eval.retrieval`). Field names in the 180px sidebar are truncated with `text-ellipsis overflow-hidden` and show a native `title` tooltip on hover with the full name.

Two "pin" concepts were confusing. Renamed:
- **Pin** (test case level): locks a test case as the reference column. Uses 📌 icon. Managed by `useDrawerPanel`.
- **Spotlight** (field level): highlights a specific field in the focus strip. Uses a star/eye-like icon (distinct from pin 📌). Managed by `useFieldSelector` as `spotlightedFields`. Triggered via a spotlight toggle button on each field row in the **Table view** (not in the Field Selector sidebar). The Field Selector controls visibility (show/hide); Spotlight controls emphasis (focus strip inclusion). **Pivot view**: The focus strip and spotlight toggle buttons are Table-view-only features, but spotlighted fields are visually indicated in Pivot via an accent-colored top border on the column header (`border-t-2 border-accent-primary`). Spotlighted state persists across view toggles so that switching back to Table view restores the focus strip without re-selecting fields.

### 10. Diff highlighting: simple string comparison

When a pinned test case exists, each cell in the non-pinned column is compared to the pinned column's value. Comparison rules:
- **Raw string equality** on the `raw` value from `ComparisonRow.values[]` (the serialized form, not the display ReactNode)
- **Numeric normalization**: values that parse as numbers are compared via `Number(a) === Number(b)` to avoid false diffs from formatting differences (e.g., "0.500" vs "0.5")
- **JSON normalization**: values detected as JSON (starting with `{` or `[`) are compared after `JSON.stringify(JSON.parse(v))` to normalize key ordering and whitespace
- **Null handling**: two nulls are equal; null vs non-null is a diff
- Different values get a subtle background tint — amber for numeric diffs (`isNumeric: true` on the row), teal for text diffs. Via conditional Tailwind class names in `getDiffClass()` utility.

### 11. Metric value formatting: match existing `MetricCard` behavior

The existing `MetricCard` component shows a progress bar (0-100%) without fixed color thresholds. The comparison views follow the same approach — display value with 3 decimal places and progress bar fill. No hardcoded green/amber/red thresholds (the existing sidebar doesn't have them either).

### 12. Component breakdown

```
Analytics.tsx
├── useDetailMode (Runs/View/useDetailMode.ts — detailMode, selectedResultId, mode switching, cleanup)
├── GridView (AG Grid, onRowClicked — delegates to useDetailMode.openDetail)
├── [sidebar mode] sidebar.showSidebar(<RunMetricDetailPanel onSwitchMode={...} />)
└── [drawer mode] AnalyticsBottomDrawer (portal to document.body)
    ├── DrawerToolbar (title, pin, view toggle, diff count badge, switcher, collapse/close)
    ├── FieldSelector (left sidebar, 180px)
    │   ├── FieldsTab (checkbox tree by section)
    │   └── OrderTab (DraggableList + eye toggle)
    └── ComparisonArea
        ├── FocusStrip (spotlighted field cards, Table view only)
        ├── ComparisonTableView (fields as rows, cases as columns)
        └── ComparisonPivotView (cases as rows, fields as columns)

**View switch transition**: Toggling between Table and Pivot applies a brief crossfade (opacity 0→1, 100ms ease-in) on the incoming view to smooth the layout change. CSS-only via a `key`-driven remount with an `animate-fadeIn` utility class.
```

## Risks / Trade-offs

- **Two parallel data fetches**: When both active and pinned IDs are set, two `getTestCaseRunResultDetails()` calls fire. **Mitigation**: `Promise.all`; cache pinned result until unpin. Note: if the underlying data is re-computed (e.g., new metric run), the cached pinned result will show stale data. This is accepted as a known limitation — the pinned cache is invalidated only on unpin or close, not on data refresh. A future enhancement could compare `computedAt` timestamps on grid refresh and invalidate the cache when the pinned result's data has changed.

- **Pinned case invalidation on grid refresh**: When `Analytics.tsx` refreshes grid data (e.g., new computation results), the pinned result ID may no longer exist. **Mitigation**: `Analytics.tsx` calls `useDrawerPanel.clearPinIfMissing(resultIds)` whenever the `results` state updates, passing the current array of valid IDs. The hook auto-clears the pinned case if its ID is absent.

- **Mode switch losing drawer state**: Switching from drawer to sidebar clears pinned case, field selection, etc. **Mitigation**: Acceptable for now — drawer state is transient. Could preserve in hook state later if needed.

- **Drawer cleanup on navigation**: `Analytics.tsx` currently calls `sidebar.closeSidebar()` on unmount. The same pattern is needed for the drawer — `useDetailMode` must close the drawer (and its portal) on unmount to prevent orphaned DOM nodes. The hook's cleanup effect handles both sidebar and drawer teardown.

- **Performance with many fields**: 50+ rows possible in comparison table. **Mitigation**: Sections collapsible, fields hideable. Memoize `buildComparisonSections()` with `useMemo`. For the Pivot view, horizontal scrolling with sticky headers handles wide tables; no virtualization needed initially since field count is bounded by test case schema.

- **Large JSON values in table cells**: `requestBody`/`responseBody` can be deeply nested. **Mitigation**: Render in scrollable `<pre>` blocks with `max-height: 180px` and `overflow-y: auto`. Values longer than 500 characters show a truncated preview with "Show more" expand.

- **Scoped DndProvider**: The Order tab wraps its own `DndProvider` + `HTML5Backend`. This is the established pattern in this codebase (`GridView.tsx`, `ContainerVariables.tsx`). No risk of nested DndProvider conflicts since the drawer is portaled outside the grid.

- **`onSwitchMode` prop on `RunMetricDetailPanel`**: This is a new optional prop on an existing component. It's backward-compatible (other callers don't pass it, so no switcher button appears). The ExtractionResult tab's usage of `RunMetricDetailPanel` is unaffected.

## Open Questions

- Should the detail mode preference persist within a session (e.g., via localStorage) so returning to the Analytics tab remembers the last mode? Currently scoped as a non-goal.
- Should the ExtractionResult tab also support the drawer mode, or is this Analytics-only?
- Should field selector state persist across close/reopen within the same Analytics session? Currently reset on close — users who carefully configure their view may find this frustrating. Could preserve state in `useFieldSelector` even when `isOpen` is false, only resetting on navigation away or explicit "Reset" action.
- Should a keyboard shortcut (e.g., `Ctrl+Shift+D`) toggle the drawer open/close or switch between sidebar/drawer modes?
- Should Pivot view show a hint (e.g., "Pin a test case to compare") when only one test case is displayed?

## Resolved Questions

- **Escape key guard**: The drawer's Escape handler checks `event.defaultPrevented` first. As a secondary guard, it also checks whether `document.activeElement` is inside the drawer portal — if focus is on an element outside the drawer (e.g., an AG Grid popup or external dropdown rendered to `document.body`), the drawer does not intercept Escape. This two-layer approach (defaultPrevented + focus containment check) is more robust than relying solely on `defaultPrevented`, since some third-party libraries (AG Grid popups, dropdown menus) may not call `preventDefault()` on their Escape handlers.
