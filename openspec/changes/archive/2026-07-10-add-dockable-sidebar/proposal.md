## Why

The Query Builder result opens in the shared right sidebar (`QueryBuilder.tsx` → `sidebar.showSidebar(<QueryResultSidebar/>, 'w-1/2 max-w-[800px]')`). For wide result sets the right sidebar is cramped, and users have already seen a better layout in the Evaluation → Run Analytics view: a **bottom-docked panel** that gives results the full horizontal width of the page.

The eval bottom drawer (`AnalyticsBottomDrawer`) proves the UX but is welded to the eval domain — it fetches `AnalyticsResult`, renders a pinned-vs-active comparison, field selectors, and diff counts. None of that is reusable for a plain results grid. What *is* reusable is the **docking mechanism**: a fixed bottom overlay, a right↔bottom toggle, and a resize handle.

Rather than copy that mechanism a second time, this change adds a **content-agnostic dockable capability to the shared `Common/Sidebar/Sidebar`** (opt-in, default off). The Query Builder result becomes the first consumer — same `StatChips + GridView` content, just re-dockable horizontally — and the chosen position is remembered per caller via `localStorage`. The eval view is deliberately left untouched; a future follow-up can migrate it onto the same primitive.

## What Changes

- **Dockable capability on the shared sidebar**: `Common/Sidebar/Sidebar` gains an opt-in dock mode with two positions — `Right` (current behavior, unchanged default) and `Bottom` (a fixed overlay: `position: fixed; bottom: 0; inset-x-0`, resizable height, border-top — matching the eval drawer's approach at `AnalyticsBottomDrawer.tsx:197`).
- **Opt-in via `showSidebar` options**: `AppContext.showSidebar(content, className?, options?)` gains an optional `options` argument (`{ dockable?: boolean; persistKey?: string }`). Callers that don't pass it are completely unaffected — default is `Right`, non-dockable.
- **Dock toggle exposed via context**: the sidebar context exposes `dockPosition` and `toggleDock()`. Dockable callers render a toggle icon button in their own header (mirroring eval's `onSwitchMode` prop pattern — `IconLayoutBottombar` / `IconLayoutSidebarRight`).
- **Persistence per caller**: when a `persistKey` is supplied, the chosen dock position is read from `localStorage` on mount and written on every toggle, reusing the existing `getFromLocalStorage` / `setToLocalStorage` utils (SSR-safe).
- **Query Builder result adoption**: `QueryBuilder.tsx` opens the result sidebar with `{ dockable: true, persistKey: <query-result key> }`; `QueryResultSidebar` renders the toggle button in its header. Content (`StatChips + GridView`) is unchanged.

## Capabilities

### New Capabilities
- `dockable-sidebar`: An opt-in dock mode on the shared `Common/Sidebar/Sidebar` that lets a caller's content be docked to the right (default) or as a fixed bottom overlay, with a context-driven toggle, resizable bottom height, and per-caller `localStorage` persistence of the chosen position. Content-agnostic — the caller supplies the content and renders the toggle.

### Modified Capabilities
<!-- No existing spec-level requirements change. Non-dockable callers keep the current right-sidebar behavior byte-for-byte. -->

## Impact

- **Components affected**: `Common/Sidebar/Sidebar.tsx` (render right vs. fixed-bottom overlay), `context/AppContext.tsx` (extend `showSidebar` signature, add `dockPosition` + `toggleDock` state and persistence), `Analytics/QueryBuilder/QueryBuilder.tsx` (pass dock options), `Analytics/QueryBuilder/Result/QueryResultSidebar.tsx` (render toggle in header).
- **New**: `DockPosition` enum (sidebar models), a `dockable-sidebar` localStorage key constant for the query result, i18n keys for the toggle button titles.
- **Dependencies**: reuses `re-resizable` (already in project, used by `SideBar.tsx` and `AnalyticsBottomDrawer`) and `@tabler/icons-react`. No new external deps.
- **Layout**: bottom mode is a fixed overlay floating over the page — **no change to `Content.tsx`** and no grid reflow. The query form stays put; the panel covers the bottom.
- **Eval**: **not modified**. The primitive is intentionally content-agnostic so `use-detail-mode` + `AnalyticsBottomDrawer` *could* adopt it later (and gain the position persistence they lack today), but eval shows different content per mode, so that consolidation is a separate follow-up change — explicitly out of scope here.
- **Backward compatibility**: the new `options` argument is optional and additive; every existing `showSidebar(content, className)` call keeps working with no change.
