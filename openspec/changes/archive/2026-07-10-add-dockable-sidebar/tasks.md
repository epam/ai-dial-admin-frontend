## 1. Types, constants, and i18n

- [x] 1.1 Create `src/components/Common/Sidebar/models.ts` — define `DockPosition` enum (`Right = 'right'`, `Bottom = 'bottom'`) and a `ShowSidebarOptions` interface (`{ dockable?: boolean; persistKey?: string }`).
- [x] 1.2 Add bottom-overlay layout constants to `src/components/Common/Sidebar/constants.ts` — `DEFAULT_DOCK_HEIGHT`, `MIN_DOCK_HEIGHT`, `MAX_DOCK_OFFSET` (mirror the values used by `Runs/Details/BottomDrawer/constants.ts` so the overlay matches eval).
- [x] 1.3 Add the Query Builder dock persistence key constant `LOCAL_STORAGE_QUERY_RESULT_DOCK_KEY = 'query-result-dock-position'`. **Deviation:** placed in `src/constants/main-layout.ts` alongside the other `LOCAL_STORAGE_*` keys (no query-builder `constants.ts` exists; this keeps all localStorage keys together per existing convention).
- [x] 1.4 Add i18n keys for the toggle button titles under `QueryBuilderI18nKey` (`DockToBottom`, `DockToRight`) with English values in `src/locales/en.ts`. Also added `BasicI18nKey.ResizePanel` for the generic bottom-dock resize handle aria-label (domain-free, lives in the Common component).

## 2. AppContext: dock state, options, and persistence

- [x] 2.1 Extend `AppContextSidebar` in `src/context/AppContext.tsx`: add `dockable: boolean`, `dockPosition: DockPosition`, and `toggleDock: () => void`; change `showSidebar` type to `(content: ReactNode, className?: string, options?: ShowSidebarOptions) => void`. (`persistKey` is held in private provider state `dockPersistKey`, not exposed on the context surface.)
- [x] 2.2 Implement state: `showSidebar` stores `dockable`/`persistKey` from `options` and initializes `dockPosition` (`Right` by default); `closeSidebar` resets `dockable` to `false`, clears the persist key, and resets position to `Right`. `content`/`className`/`show` behavior unchanged.
- [x] 2.3 Implement persistence with `getFromLocalStorage`/`setToLocalStorage`: `showSidebar` applies the persisted position when a `persistKey` is supplied (SSR-safe — `showSidebar` only runs client-side via events/effects, and the initial state is `Right`); `toggleDock` flips `Right ↔ Bottom` and writes the new value when a `persistKey` is set.
- [x] 2.4 Add AppContext tests: default `dockPosition` is `Right`; `showSidebar` with `{ dockable, persistKey }` sets state; `toggleDock` flips and persists only when `persistKey` present; `closeSidebar` resets `dockable`; persisted value restored on next open; per-key isolation. File: `src/context/tests/AppContext.spec.tsx`.

## 3. Common/Sidebar: render right vs. bottom overlay

- [x] 3.1 Update `src/components/Common/Sidebar/Sidebar.tsx` to read `dockable` / `dockPosition` / `dockCollapsed` from context and branch: `Right` → existing `<aside>` honoring `className` (unchanged); `Bottom` → render `content` inside a `re-resizable` `Resizable` positioned **`absolute`** to the bottom (`bottom:0; left:0; right:0; top:auto; z-[35]`, `border-t border-primary bg-layer-0`), using the dock height constants; width `className` ignored in bottom mode. `SaveValidationContextProvider` wrapper kept in both branches. **Refinement (from verification):** `absolute` (not `fixed`) so the overlay stays within `Content.tsx`'s content region and does not cover the left navigation menu.
- [x] 3.2 Implement the top resize handle for bottom mode (drag to resize between `MIN_DOCK_HEIGHT` and viewport − `MAX_DOCK_OFFSET`); reuses the `re-resizable` `enable`/`handleComponent` pattern from `AnalyticsBottomDrawer`. No `Content.tsx` change — the overlay does not reflow page content. Collapse: height → `COLLAPSED_DOCK_HEIGHT` and resize handle disabled when `dockCollapsed`.
- [x] 3.3 Component tests for `Common/Sidebar/Sidebar`: renders right `<aside>` when not dockable (including when a stale `Bottom` position is present but `dockable` is false); renders bottom overlay with a resize `separator` when `dockPosition === Bottom`. File: `src/components/Common/Sidebar/tests/Sidebar.spec.tsx`.
- [x] 3.4 Collapse support (added during verification — "can't see full query UI"): `AppContext` holds `dockCollapsed` + `toggleDockCollapsed()`, reset on `showSidebar`/`closeSidebar`/`toggleDock`; `COLLAPSED_DOCK_HEIGHT` constant added. Covered by an AppContext test.

## 4. Query Builder adoption

- [x] 4.1 Update `QueryBuilder.tsx` `showSidebar` call to pass `{ dockable: true, persistKey: LOCAL_STORAGE_QUERY_RESULT_DOCK_KEY }`.
- [x] 4.2 Update `QueryResultSidebar.tsx` header: read `dockPosition` / `dockCollapsed` / `toggleDock` / `toggleDockCollapsed` from `useAppContext().sidebar`; render the dock `DialGhostIconButton` next to the `DialCloseButton` — `IconLayoutBottombar` ("Dock to bottom") when `Right`, `IconLayoutSidebarRight` ("Dock to right") when `Bottom` — and, only when `Bottom`, a collapse/expand button (`IconChevronDown`/`IconChevronUp`, `BasicI18nKey.Collapse`/`Expand`). Body (`StatChip`s + `GridView`) unchanged.
- [x] 4.3 Update `QueryResultSidebar.spec.tsx`: dock toggle renders and calls `toggleDock`; icon/title reflects `dockPosition`; collapse control shown only when `Bottom` and calls `toggleDockCollapsed`; expand shown when collapsed. Also added `dockable`/`dockPosition`/`dockCollapsed`/`toggleDock`/`toggleDockCollapsed` to the central `AppContext` mock in `test-setup.tsx`.

## 5. Verification

- [x] 5.1 Ran the affected suites from `apps/ai-dial-admin/` — `AppContext` (7), `Common/Sidebar` (4), `QueryResultSidebar` (8). `eslint` on changed source files → 0 errors. Note: full-project `tsc` fails only on stale `.next` project-reference artifacts unrelated to this change; type-aware lint and the vitest transform of all touched files pass.
- [x] 5.2 Browser verification via Playwright against the running app (`localhost:4200`): ran a query → result opens in the right sidebar with the dock toggle; toggled to bottom → full-width overlay over the content area (does **not** cover the left menu), resizable, query form not reflowed, content (Result heading + row count + grid) intact; collapse → overlay shrinks to its header revealing the full query form; reloaded + re-ran → opened docked to the bottom (position persisted). 0 console errors on fresh load.
