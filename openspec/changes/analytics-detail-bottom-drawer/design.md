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

**Ownership**: `useDetailMode` is the **single owner** of sidebar lifecycle within `Analytics.tsx`. All `sidebar.showSidebar()` and `sidebar.closeSidebar()` calls go through `useDetailMode`'s exposed methods (`openDetail`, `switchToSidebar`, `switchToDrawer`, `closeDetail`). `Analytics.tsx` must NOT call `sidebar.*` directly — it delegates to `useDetailMode` which internally coordinates with `useAppContext().sidebar`.

**Row re-click toggle**: Clicking the same row that is already active **closes** the detail view (matching the existing sidebar toggle behavior). In sidebar mode, `closeDetail()` calls `sidebar.closeSidebar()`. In drawer mode, `closeDetail()` closes the drawer (clearing pinned/field state). This preserves the current UX contract. If a pinned case exists and the user clicks the active (non-pinned) row again, the drawer closes entirely (pinned state is cleared).

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

- **`useDetailMode`** (in `Runs/View/useDetailMode.ts`, co-located with `Analytics.tsx`): manages `detailMode` ('sidebar' | 'drawer'), `selectedResultId`, mode switching logic, and sidebar open/close calls. Lives at the Analytics level because it owns sidebar lifecycle via `useAppContext().sidebar` — conceptually it belongs to the view layer, not nested inside `BottomDrawer/`
- **`useDrawerPanel`** (in `BottomDrawer/useDrawerPanel.ts`): manages drawer-specific UI — `isOpen`, `panelHeight`, `isCollapsed`, `viewMode` ('table' | 'pivot'), `pinnedId`, open/close/collapse/pin/unpin
- **`useFieldSelector`** (in `BottomDrawer/useFieldSelector.ts`): manages `fieldVisibility`, `sectionOrder`, `sectionHidden`, `spotlightedFields` (renamed from "pinned fields" — see Decision #9)

Data fetching stays in `AnalyticsBottomDrawer` component using `useEffect` on `activeId`/`pinnedId`, calling the server action `getTestCaseRunResultDetails()` from `src/app/[lang]/runs/actions.ts`.

### 5. Data flow: reuse existing `AnalyticsResult` type

The detail API `getTestCaseRunResultDetails(id)` (server action in `src/app/[lang]/runs/actions.ts`) returns `AnalyticsResult | null`. This is the same type used by the existing sidebar.

**Data sharing between modes**: When switching from sidebar to drawer (or vice versa), the already-fetched `AnalyticsResult` for the active `resultId` is NOT shared — each mode fetches independently. This is acceptable because mode switches are infrequent, and the sidebar uses a different component lifecycle. Within the drawer, the pinned result is cached in a `useRef` and reused until unpin (avoiding re-fetch when the user clicks different rows).

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
- Fields within each section are sorted alphabetically by key

Both Table and Pivot views consume `ComparisonSection[]`.

### 6. Drawer positioning: fixed bottom with portal

Render the drawer via `createPortal` to `document.body` (matching the existing `FullscreenViewerModal` pattern). The drawer uses `z-40` to sit below notifications (`z-[100]`) and fullscreen modals (`z-50`) but above normal page content. The main grid container gets `padding-bottom` equal to the drawer's **current rendered height** (including collapsed state — 34px when collapsed, full height when expanded).

**Height communication**: `useDrawerPanel` exposes a `currentHeight` value (number in px) that reflects the actual rendered height: `panelHeight` when expanded, `COLLAPSED_HEIGHT` (34px) when collapsed, `0` when closed. `Analytics.tsx` reads this value and applies it as `style={{ paddingBottom: currentHeight }}` on the grid container div. No ResizeObserver needed — the hook is the single source of truth for height.

### 7. Resize: vanilla mousedown/mousemove

`onMouseDown` on the resize bar, `mousemove` on `document` to adjust height. Min: 200px (toolbar ~34px + field selector tabs ~32px + usable content area). Max: `window.innerHeight - 100`. Keyboard support: when the resize handle is focused, Arrow Up/Down adjusts height by 20px per press, Shift+Arrow by 100px.

**Why not `re-resizable`**: The project uses `re-resizable` for the sidebar (`SideBar.tsx`), but it's designed for left/right resizing on inline elements. The drawer is a fixed-bottom portal that resizes by dragging its top edge upward — `re-resizable`'s `top` handle inverts the drag direction logic and fights with fixed positioning. Vanilla mousedown/mousemove is simpler and more predictable for this specific layout.

### 8. Field selector: checkbox tree + drag reorder via `DraggableItem`

The Fields tab renders collapsible section groups with per-field checkboxes. The Order tab reuses the existing `DraggableItem` component from `src/components/Common/DraggableItem/` for drag handle + drop target behavior, wrapped in a scoped `DndProvider` + `HTML5Backend` (matching the pattern in `GridView.tsx`, `ContainerVariables.tsx`).

**Note**: `DraggableList` (`Common/Lists/DraggableList.tsx`) is NOT reused — it is designed for editable string lists with add/remove input fields (`NewItem` components), which doesn't fit section reordering. A lightweight custom list container with `useDrop` is needed to manage `ComparisonSection` keys.

**Keyboard reorder**: The existing `DraggableItem` has no keyboard handling (no `tabIndex`, no `onKeyDown` on the drag handle). Rather than modifying `DraggableItem` (which would affect all existing usages), the Order tab wraps each `DraggableItem` with an `onKeyDown` handler on a focusable container (`tabIndex={0}`, `role="listitem"`) that intercepts Arrow Up/Down and calls `moveSectionByKeyboard(sectionKey, direction)`. This keeps `DraggableItem` untouched.

### 9. Naming: "spotlight" for field-level pins, "pin" for test case pins

**Field name truncation**: Metric group names can be long (e.g., `aidial_rag_eval.retrieval`). Field names in the 180px sidebar are truncated with `text-ellipsis overflow-hidden` and show a native `title` tooltip on hover with the full name.

Two "pin" concepts were confusing. Renamed:
- **Pin** (test case level): locks a test case as the reference column. Uses 📌 icon. Managed by `useDrawerPanel`.
- **Spotlight** (field level): highlights a specific field in the focus strip. Uses a star/eye-like icon (distinct from pin 📌). Managed by `useFieldSelector` as `spotlightedFields`. Triggered via a spotlight toggle button on each field row in the **Table view** (not in the Field Selector sidebar). The Field Selector controls visibility (show/hide); Spotlight controls emphasis (focus strip inclusion). **Pivot view**: The focus strip and spotlight toggle buttons are Table-view-only features. Spotlighted state persists across view toggles so that switching back to Table view restores the focus strip without re-selecting fields.

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
    ├── DrawerToolbar (title, pin, view toggle, switcher, collapse/close)
    ├── FieldSelector (left sidebar, 180px)
    │   ├── FieldsTab (checkbox tree by section)
    │   └── OrderTab (DraggableList + eye toggle)
    └── ComparisonArea
        ├── FocusStrip (spotlighted field cards, Table view only)
        ├── ComparisonTableView (fields as rows, cases as columns)
        └── ComparisonPivotView (cases as rows, fields as columns)
```

## Risks / Trade-offs

- **Two parallel data fetches**: When both active and pinned IDs are set, two `getTestCaseRunResultDetails()` calls fire. **Mitigation**: `Promise.all`; cache pinned result until unpin.

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
