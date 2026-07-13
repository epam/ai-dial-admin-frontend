## Context

The shared right sidebar is a **context-driven singleton**. `AppContext` holds `{ show, content, className }` and exposes `showSidebar(content, className?)` / `closeSidebar()` (`context/AppContext.tsx:38-39, 95-104`). A single `Common/Sidebar/Sidebar.tsx` reads that state and renders an `<aside>` inside a flex **row** in `Content.tsx:83-89`:

```
Content.tsx  (flex-row)
┌────────────────────────────┬──────────────┐
│  {children}  (the page)    │  <aside>     │  ← Common/Sidebar/Sidebar
│  flex-1                    │  content     │     reads AppContext.sidebar
└────────────────────────────┴──────────────┘
```

The Query Builder opens its result here: `sidebar.showSidebar(<QueryResultSidebar request={...} />, 'w-1/2 max-w-[800px]')` (`QueryBuilder.tsx:189`). `QueryResultSidebar` renders its own header (`<h3>` + `DialCloseButton`) and body (`StatChips + <GridView>`).

Eval's bottom drawer (`AnalyticsBottomDrawer.tsx:197`) is a **fixed overlay** — `position: fixed; bottom: 0; inset-x-0; z-[35]`, portaled to `document.body`, resizable in height. That is the exact "horizontal" layout requested. Eval reaches it via a separate `use-detail-mode` state machine (`DetailMode.Sidebar | DetailMode.Drawer`) and shows **different content per mode** (single detail vs. pinned/active comparison), and it does **not** persist the choice (`use-detail-mode.tsx:26` is a plain `useState`).

## Goals / Non-Goals

**Goals:**
- Add an opt-in dock mode to the shared `Common/Sidebar/Sidebar` with two positions: `Right` (default, unchanged) and `Bottom` (fixed overlay, eval-identical).
- Let callers opt in without affecting any other sidebar usage (default off).
- Expose a context-driven `toggleDock()` + `dockPosition` so callers render the toggle in their own header.
- Persist the chosen position per caller in `localStorage`.
- Make Query Builder the first consumer; keep its content identical.
- Keep the primitive content-agnostic so eval can adopt it later.

**Non-Goals:**
- Reflow/split layout (grid shrinking) — explicitly chosen against; bottom mode is a floating overlay.
- Migrating eval's `use-detail-mode` / `AnalyticsBottomDrawer` onto the primitive (future follow-up).
- Persisting the bottom-drawer **height** (only the dock **position** is persisted; height uses a default with in-session resize).
- Multiple simultaneous dockable sidebars (the sidebar is a singleton — one at a time).
- Responsive/mobile tuning of the bottom overlay (desktop-first, matching eval).

## Decisions

### 1. Dock state lives in `AppContext`, threaded through `showSidebar` options

Because `Common/Sidebar/Sidebar` is a singleton that only renders "whatever `showSidebar` last set", a per-caller opt-in has to travel with the `showSidebar` call. Extend the signature additively:

```ts
// context/AppContext.tsx
showSidebar: (content: ReactNode, className?: string, options?: ShowSidebarOptions) => void;

interface ShowSidebarOptions {
  dockable?: boolean;   // default false — enables the right/bottom toggle
  persistKey?: string;  // when set, dock position is read/written to localStorage under this key
}
```

Context state adds `dockable: boolean`, `dockPosition: DockPosition`, `persistKey?: string`, and `toggleDock(): void`. `showSidebar` sets `dockable`/`persistKey` and initializes `dockPosition` (see Decision 4). `closeSidebar` resets `dockable` to `false`. Every existing `showSidebar(content, className)` call is untouched (third arg optional).

**Why context, not a local prop:** the render component receives no props (it reads context). Threading through `showSidebar` keeps the opt-in at the call site while the singleton stays prop-free, consistent with how `className` already flows.

### 2. `DockPosition` enum, not a string union

Per repo standard (enums over string-literal unions). Placed in a sidebar models file:

```ts
// components/Common/Sidebar/models.ts
export enum DockPosition {
  Right = 'right',
  Bottom = 'bottom',
}
```

### 3. Bottom mode is an absolute overlay scoped to the content area, so `Content.tsx` is untouched

`Common/Sidebar/Sidebar` branches on `dockPosition`:

- **`Right`** (default): current `<aside>` in the flex row, honoring the `className` width (`w-1/2 max-w-[800px]`, etc.). No behavior change.
- **`Bottom`**: render the same `content` inside a `re-resizable` `Resizable` positioned `absolute; bottom:0; left:0; right:0; top:auto; z-[35]`, with `border-t border-primary bg-layer-0`, a top resize handle, default height, `MIN`/`MAX` height clamps mirroring `AnalyticsBottomDrawer` constants. Width `className` is ignored in this mode.

`position: absolute` (not `fixed`) is deliberate: the sidebar renders inside `Content.tsx`'s content region (`layout.tsx:90-95` places `<Menu>` and `<Content>` as flex-row siblings; `Content.tsx`'s root is `relative overflow-hidden`). Absolute-positioning the overlay against that region makes it span **only the main content area** — it does not cover the left navigation menu. A `fixed` overlay (viewport-relative, as the eval drawer uses) would sit on top of the menu; `absolute` respects it. Because the overlay is taken out of flow, the page content in `Content.tsx` still needs **no change** and does not reflow.

```
 Right (default)                         Bottom (absolute overlay, right of menu)
┌──────────────┬──────────┐             ┌──────┬─────────────────────────┐
│  page        │  aside   │             │ menu │  page (unchanged)       │
│  flex-1      │  content │             │      │░░ overlay over content ░│
└──────────────┴──────────┘             │      ├─────────────────────────┤ ← resize
                                        │      │  content  [Resizable]   │
                                        └──────┴─────────────────────────┘
```

### 3a. Collapse for the bottom overlay

Because the bottom overlay covers the lower part of the query form, the user needs a way to peek at the full form without closing the results. The overlay supports a **collapse** state: `AppContext` holds `dockCollapsed` + `toggleDockCollapsed()`, reset to `false` on `showSidebar`, `closeSidebar`, and `toggleDock` (position change). When collapsed, the overlay shrinks to `COLLAPSED_DOCK_HEIGHT` (just the caller's header row, via `overflow-hidden`) and the top resize handle is disabled. Mirroring the dock toggle, the caller renders the collapse/expand button in its own header (shown only in `Bottom` position): `IconChevronDown` (collapse) when expanded, `IconChevronUp` (expand) when collapsed.

### 4. Persistence: position only, per-caller key, SSR-safe

Reuse `getFromLocalStorage` / `setToLocalStorage` (`utils/local-storage.ts` — both guard `typeof window`). Follow the exact pattern `SideBar.tsx:136-140` uses for width:

- Initialize `dockPosition` state to `DockPosition.Right` (stable server render → no hydration mismatch).
- In a `useEffect` (client only), if `persistKey` is set, read the stored value and, if valid, apply it.
- `toggleDock()` flips `Right ↔ Bottom` and, when `persistKey` is set, writes the new value.

The query result uses a dedicated constant key (query-builder scoped) so it remembers its choice independently of any future dockable caller:

```ts
// constants for the query builder
export const LOCAL_STORAGE_QUERY_RESULT_DOCK_KEY = 'query-result-dock-position';
```

**Why per-caller (not one global key):** the two surfaces are conceptually separate; a global key would make toggling one move the other. The key is supplied by the caller, keeping the primitive generic.

### 5. Toggle rendered by the caller, mechanism owned by the sidebar

Mirroring eval's proven `onSwitchMode` pattern, the toggle button lives in the caller's header, not injected by the wrapper (the wrapper renders no chrome today — the caller owns its header). Dockable callers read `{ dockPosition, toggleDock }` from context and render a `DialGhostIconButton` next to their existing close button:

- position `Right` → show `IconLayoutBottombar`, title "Dock to bottom"
- position `Bottom` → show `IconLayoutSidebarRight`, title "Dock to right"

The button is keyboard-focusable/activatable (ui-kit button default). Non-dockable callers render nothing new.

### 6. Query Builder wiring

- `QueryBuilder.tsx:189` → `sidebar.showSidebar(<QueryResultSidebar request={request} />, 'w-1/2 max-w-[800px]', { dockable: true, persistKey: LOCAL_STORAGE_QUERY_RESULT_DOCK_KEY })`.
- `QueryResultSidebar` adds the toggle button in its header row (`QueryResultSidebar.tsx:62-65`), reading `dockPosition` / `toggleDock` from `useAppContext().sidebar`. Content below is unchanged; `min-h-0 flex-1` already lets the `GridView` fill whatever container (right or bottom) it lands in.

## Risks / Trade-offs

- **Signature change to `showSidebar`** touches a widely-used context method. Mitigated by making `options` optional and additive; no existing call site changes. A quick audit of `showSidebar(` call sites confirms all pass ≤2 args.
- **Fixed overlay z-index / footer overlap**: bottom overlay uses `z-[35]` (same as eval, below the header at `z-40`). Verify it sits above the `Footer` (`Content.tsx:90`) or accept covering it, matching eval behavior.
- **Singleton means one dockable sidebar at a time**: acceptable — only one sidebar is ever open.
- **Height not persisted**: intentional scope trim; can be added later with a second key if requested.

## Migration / Rollout

Purely additive. Default path (`dockable` absent) is unchanged, so no migration for existing callers. Query Builder is the only opt-in. Feature is discoverable via the new header toggle.

## Future Work (out of scope)

- Migrate eval's `use-detail-mode` + `AnalyticsBottomDrawer` onto this primitive. Eval shows *different* content per mode (single detail vs. comparison), so it would supply mode-specific content to the primitive rather than "same content re-docked"; the payoff is a single docking implementation and eval gaining the position persistence it lacks today.
- Optional bottom-drawer height persistence via a companion key.
