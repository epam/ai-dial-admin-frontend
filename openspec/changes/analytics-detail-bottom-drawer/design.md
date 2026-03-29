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

When switching modes:
- Sidebar → Drawer: call `sidebar.closeSidebar()`, then open drawer with same `selectedResultId`
- Drawer → Sidebar: close drawer (clearing pinned/field state), then call `sidebar.showSidebar()` with `<RunMetricDetailPanel resultId={selectedResultId} onClose={...} onSwitchMode={...} />`

### 2. Switcher button: new `onSwitchMode` callback prop on `RunMetricDetailPanel`

`RunMetricDetailPanel` currently accepts `{ resultId, onClose }`. Add an optional `onSwitchMode?: () => void` prop. When provided, the header renders a switcher icon button (e.g., `IconLayoutBottombar` from `@tabler/icons-react`). Clicking it calls `onSwitchMode()`, which `Analytics.tsx` handles by changing `detailMode` to `'drawer'`.

The `DrawerToolbar` has its own "Switch to Sidebar" button that calls the reverse callback.

**Alternative considered**: A shared `DetailViewSwitcher` component used in both places. Rejected — it's just an icon button with a callback; no need for a shared component.

### 3. Component location: `Runs/Details/BottomDrawer/`

Place all bottom drawer components under `src/components/Runs/Details/BottomDrawer/`. Co-located with existing detail panel components.

### 4. State management: split into focused hooks

Instead of one large `useBottomDrawer` hook, split concerns:

- **`useDetailMode`** (in `Analytics.tsx` or `BottomDrawer/useDetailMode.ts`): manages `detailMode` ('sidebar' | 'drawer'), `selectedResultId`, mode switching logic, and sidebar open/close calls
- **`useDrawerPanel`** (in `BottomDrawer/useDrawerPanel.ts`): manages drawer-specific UI — `isOpen`, `panelHeight`, `isCollapsed`, `viewMode` ('table' | 'pivot'), `pinnedId`, open/close/collapse/pin/unpin
- **`useFieldSelector`** (in `BottomDrawer/useFieldSelector.ts`): manages `fieldVisibility`, `sectionOrder`, `sectionHidden`, `focusSpotlightedFields` (renamed from "pinned fields" — see Decision #9)

Data fetching stays in `AnalyticsBottomDrawer` component using `useEffect` on `activeId`/`pinnedId`, calling the server action `getTestCaseRunResultDetails()` from `src/app/[lang]/runs/actions.ts`.

### 5. Data flow: reuse existing `AnalyticsResult` type

The detail API `getTestCaseRunResultDetails(id)` (server action in `src/app/[lang]/runs/actions.ts`) returns `AnalyticsResult | null`. This is the same type used by the existing sidebar. A utility `buildComparisonSections()` in `BottomDrawer/utils.ts` transforms two `AnalyticsResult` objects into a normalized structure:

```typescript
interface ComparisonSection {
  key: string;
  rows: ComparisonRow[];
}
interface ComparisonRow {
  fieldKey: string;
  label: string;
  badge?: 'bound' | 'info';
  values: Array<{ raw: string | null; display: ReactNode }>;
}
```

Both Table and Pivot views consume `ComparisonSection[]`.

### 6. Drawer positioning: fixed bottom with portal

Render the drawer via `createPortal` to `document.body` (matching the existing `FullscreenViewerModal` pattern). The main grid container gets `padding-bottom` equal to the drawer's **current rendered height** (including collapsed state — 34px when collapsed, full height when expanded).

### 7. Resize: vanilla mousedown/mousemove

`onMouseDown` on the resize bar, `mousemove` on `document` to adjust height. Min: 120px. Max: `window.innerHeight - 100`.

### 8. Field selector: checkbox tree + drag reorder via existing `DraggableList`/`DraggableItem`

The Fields tab renders collapsible section groups with per-field checkboxes. The Order tab reuses the existing `DraggableList` + `DraggableItem` components from `src/components/Common/` with a scoped `DndProvider` + `HTML5Backend` (matching the pattern in `GridView.tsx`, `ContainerVariables.tsx`).

### 9. Naming: "spotlight" for field-level pins, "pin" for test case pins

Two "pin" concepts were confusing. Renamed:
- **Pin** (test case level): locks a test case as the reference column. Uses 📌 icon. Managed by `useDrawerPanel`.
- **Spotlight** (field level): highlights a specific field in the focus strip. Uses ⭐ or a distinct icon. Managed by `useFieldSelector` as `focusSpotlightedFields`.

### 10. Diff highlighting: simple string comparison

When a pinned test case exists, each cell in the non-pinned column is compared to the pinned column's value (string equality on raw value). Different values get a subtle background tint — amber for numeric diffs, teal for text diffs. Via conditional Tailwind class names.

### 11. Metric value formatting: match existing `MetricCard` behavior

The existing `MetricCard` component shows a progress bar (0-100%) without fixed color thresholds. The comparison views follow the same approach — display value with 3 decimal places and progress bar fill. No hardcoded green/amber/red thresholds (the existing sidebar doesn't have them either).

### 12. Component breakdown

```
Analytics.tsx
├── useDetailMode (detailMode, selectedResultId, mode switching)
├── GridView (AG Grid, onRowClicked)
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

- **Mode switch losing drawer state**: Switching from drawer to sidebar clears pinned case, field selection, etc. **Mitigation**: Acceptable for now — drawer state is transient. Could preserve in hook state later if needed.

- **Performance with many fields**: 50+ rows possible in comparison table. **Mitigation**: Sections collapsible, fields hideable. Memoize `buildComparisonSections()` with `useMemo`.

- **Scoped DndProvider**: The Order tab wraps its own `DndProvider` + `HTML5Backend`. This is the established pattern in this codebase (`GridView.tsx`, `ContainerVariables.tsx`). No risk of nested DndProvider conflicts since the drawer is portaled outside the grid.

- **`onSwitchMode` prop on `RunMetricDetailPanel`**: This is a new optional prop on an existing component. It's backward-compatible (other callers don't pass it, so no switcher button appears). The ExtractionResult tab's usage of `RunMetricDetailPanel` is unaffected.

## Open Questions

- Should the detail mode preference persist within a session (e.g., via localStorage) so returning to the Analytics tab remembers the last mode? Currently scoped as a non-goal.
- Should the ExtractionResult tab also support the drawer mode, or is this Analytics-only?
