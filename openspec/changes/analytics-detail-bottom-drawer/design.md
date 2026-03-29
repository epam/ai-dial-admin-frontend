## Context

The Analytics tab in Run Detail view (`AnalyticsTab.tsx`) currently renders an AG Grid of test case run results. Clicking a row opens a 750px right sidebar (`RunMetricDetailPanel`) showing execution info, test case data, metric cards, metric infos, and request/response JSON. This works well for inspecting one result at a time.

Users need to compare multiple results side-by-side — seeing how metric values, test case inputs, extracted outputs, and reasoning differ across test cases. The HTML prototype in `sandbox/ui-ux-prototyping-with-admin-styles/prototype.html` demonstrates the UX: a resizable bottom drawer with Table and Pivot views, a left field selector, pinning, and diff highlighting.

The right sidebar and bottom drawer are **mutually exclusive** detail views. A switcher control lets the user choose which layout is active. When one is shown, the other is hidden. The selected row context (which test case is being inspected) carries over when switching.

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

**Non-Goals:**
- Read/prose view (only Table and Pivot)
- Persisting detail mode preference across page navigations or sessions
- Editing test case data from within the drawer
- Chart/visualization views for metric trends

## Decisions

### 1. Detail mode state: `detailMode` in AnalyticsTab

Add a `detailMode: 'sidebar' | 'drawer'` state to `AnalyticsTab.tsx`. Default is `'sidebar'` (current behavior). The mode determines which detail UI renders. The `selectedResultId` is shared — both modes use the same selected row. When switching modes:
- If sidebar is open and user switches to drawer → sidebar closes, drawer opens with same `selectedResultId`
- If drawer is open and user switches to sidebar → drawer closes (clearing pinned state), sidebar opens with same `selectedResultId`

**Alternative considered**: Independent open/close states for each. Rejected — mutual exclusion is simpler and avoids confusing dual-panel states.

### 2. Switcher placement: in the sidebar header, replicated in the drawer toolbar

The switcher is a small toggle/button group rendered in:
- The `RunMetricDetailPanel` header area (sidebar mode → "Switch to Drawer" icon button)
- The `DrawerToolbar` (drawer mode → "Switch to Sidebar" icon button)

This gives the user access to switch from whichever mode they're currently in. The switcher uses `@tabler/icons-react` icons (e.g., `IconLayoutSidebarRight` for sidebar, `IconLayoutBottombar` for drawer).

**Alternative considered**: A toggle in the analytics grid toolbar. Rejected — the switcher is contextual to the detail view, not the grid.

### 3. Component location: `Runs/Details/BottomDrawer/`

Place all bottom drawer components under `src/components/Runs/Details/BottomDrawer/`. This co-locates them with the existing detail panel components (`RunMetricDetailPanel`, `MetricCard`, etc.) since they consume the same data types.

### 4. State management: local state in AnalyticsTab via a custom hook

Create a `useBottomDrawer` hook that manages: `isOpen`, `activeId`, `pinnedId`, `viewMode` ('table' | 'pivot'), `panelHeight`, `fieldVisibility`, `sectionOrder`. The hook lives in `BottomDrawer/useBottomDrawer.ts`.

The hook fetches detail data for both active and pinned results via `getTestCaseRunResultDetails()`, storing both `TestCaseRunResultDetails` objects. When `activeId` changes, it fetches the new detail. The pinned detail is cached until unpinned.

**Alternative considered**: React Context provider. Rejected — the state is only consumed within AnalyticsTab's subtree, and prop drilling is minimal (AnalyticsTab → BottomDrawer).

### 5. Data flow: reuse existing `TestCaseRunResultDetails` type

The comparison views consume the same `TestCaseRunResultDetails` returned by `getTestCaseRunResultDetails()`. A utility `buildComparisonSections()` in `BottomDrawer/utils.ts` transforms two detail objects into a normalized section/row structure:

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

This decouples data transformation from rendering. Both Table and Pivot views consume the same `ComparisonSection[]` array.

### 6. Drawer positioning: fixed bottom with portal

Render the drawer via `createPortal` to `document.body` (matching the existing `FullscreenViewerModal` pattern). This avoids layout conflicts with the grid. The main grid container gets `padding-bottom` equal to drawer height when drawer mode is active.

### 7. Resize: vanilla mousedown/mousemove

Use a simple `onMouseDown` handler on the resize bar, tracking `mousemove` on `document` to adjust height. Min height: 120px. Max height: `window.innerHeight - 100`.

### 8. Field selector: checkbox tree + drag reorder

The Fields tab renders sections as collapsible groups with per-field checkboxes. The Order tab uses `react-dnd` (already in the project) for drag-to-reorder sections, with an eye toggle for section visibility.

### 9. Diff highlighting: simple string comparison

When a pinned test case exists, each cell in the non-pinned column is compared to the pinned column's value (string equality on raw value). Different values get a subtle background tint — amber for numeric diffs, teal for text diffs. Via conditional Tailwind class names.

### 10. Component breakdown

```
AnalyticsTab
├── detailMode state ('sidebar' | 'drawer')
├── GridView (AG Grid)
├── [if sidebar mode] RunMetricDetailPanel (existing, with switcher button added)
└── [if drawer mode] AnalyticsBottomDrawer (portal)
    ├── DrawerToolbar (title, pin, view toggle, switcher button, collapse/close)
    ├── FieldSelector (left sidebar)
    │   ├── FieldsTab (checkbox tree by section)
    │   └── OrderTab (drag-to-reorder sections, eye toggle)
    └── ComparisonArea
        ├── FocusStrip (pinned field cards, only in Table view)
        ├── ComparisonTableView (fields as rows, cases as columns)
        └── ComparisonPivotView (cases as rows, fields as columns)
```

## Risks / Trade-offs

- **Two parallel data fetches**: When both active and pinned IDs are set, two `getTestCaseRunResultDetails()` calls fire. **Mitigation**: Fetch in parallel with `Promise.all`; cache pinned result so it's only fetched once.

- **Mode switch losing drawer state**: Switching from drawer to sidebar clears pinned case, field selection, etc. **Mitigation**: This is acceptable — drawer state is transient. If needed later, state could be preserved in the hook, but YAGNI for now.

- **Performance with many fields**: 50+ rows possible in comparison table. **Mitigation**: Sections collapsible, fields hideable. Memoize `buildComparisonSections()` with `useMemo`.

- **Drag-and-drop in Order tab**: `react-dnd` requires a `DndProvider`. **Mitigation**: Check for existing provider; if none, wrap only the `OrderTab` with a scoped `DndProvider` using `HTML5Backend`.
