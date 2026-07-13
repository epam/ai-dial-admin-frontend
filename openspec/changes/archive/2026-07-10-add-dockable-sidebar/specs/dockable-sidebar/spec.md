## ADDED Requirements

### Requirement: Opt-in dock mode on the shared sidebar

The shared `Common/Sidebar/Sidebar` SHALL support two dock positions, modeled by a `DockPosition` enum: `Right` (the existing right-side `<aside>`) and `Bottom` (a fixed overlay). Dock mode SHALL be **opt-in per caller** and disabled by default. When a caller does not opt in, the sidebar SHALL render exactly as it does today (right-side `<aside>`, honoring the width `className`) with no toggle affordance.

#### Scenario: Default caller is unaffected

- **WHEN** a caller invokes `sidebar.showSidebar(content, className)` with no dock options
- **THEN** the sidebar renders as a right-side `<aside>` honoring `className`, no dock toggle is shown, and behavior is identical to before this change

#### Scenario: Caller opts into dock mode

- **WHEN** a caller invokes `sidebar.showSidebar(content, className, { dockable: true })`
- **THEN** the sidebar renders dockable, exposing `dockPosition` and `toggleDock()` via the sidebar context for the caller's header to consume

### Requirement: `showSidebar` accepts optional dock options additively

`AppContext.showSidebar` SHALL accept an optional third argument `options` of shape `{ dockable?: boolean; persistKey?: string }`. The argument SHALL be optional so that every existing `showSidebar(content, className)` call site continues to work unchanged. The sidebar context SHALL expose `dockable: boolean`, `dockPosition: DockPosition`, and `toggleDock: () => void`.

#### Scenario: Existing two-argument calls keep working

- **WHEN** existing code calls `showSidebar(content, className)` without the options argument
- **THEN** the sidebar opens as a non-dockable right sidebar and no runtime error occurs

#### Scenario: closeSidebar resets dock opt-in

- **WHEN** `closeSidebar()` is called
- **THEN** `dockable` is reset to `false` so a subsequent non-dockable caller does not inherit the previous caller's toggle

### Requirement: Bottom position renders as an overlay scoped to the content area

When `dockPosition` is `Bottom`, the sidebar content SHALL be rendered inside a resizable container positioned `absolute` to the bottom of the main content region (`bottom: 0; left: 0; right: 0; top: auto`), with a top border and a top resize handle, layered above page content (e.g. `z-[35]`). The overlay SHALL span only the main content area and SHALL NOT cover the left navigation menu. The width `className` SHALL be ignored in this mode. The page content behind the overlay SHALL NOT reflow.

#### Scenario: Bottom overlay floats over the content, not the menu

- **WHEN** a dockable sidebar's `dockPosition` is `Bottom`
- **THEN** the content appears as a panel docked to the bottom of the main content area (to the right of the left navigation menu), floating over the page, and the page layout (e.g. the query form) does not shift or shrink

#### Scenario: Bottom overlay is resizable in height

- **WHEN** the sidebar is docked to the bottom and the user drags the top resize handle
- **THEN** the panel height changes between a minimum and a maximum clamp, and the content area adjusts to the new height

### Requirement: Bottom overlay can be collapsed to its header

When docked to the bottom, the overlay SHALL support a collapsed state exposed via the sidebar context (`dockCollapsed` + `toggleDockCollapsed()`). When collapsed, the overlay SHALL shrink to a height that shows only the caller's header row and SHALL disable the resize handle, so the user can see the page content behind it. The collapsed state SHALL reset to expanded when the sidebar is opened, closed, or the dock position changes. A dockable caller SHALL render a collapse/expand control in its header only while docked to the bottom.

#### Scenario: Collapse reveals the page behind the overlay

- **WHEN** the sidebar is docked to the bottom and the user activates the collapse control
- **THEN** the overlay shrinks to its header row and the previously covered page content (e.g. the full query form) becomes visible

#### Scenario: Expand restores the overlay

- **WHEN** the bottom overlay is collapsed and the user activates the expand control
- **THEN** the overlay returns to its prior height and the content area is shown again

#### Scenario: Switching dock position clears the collapsed state

- **WHEN** the bottom overlay is collapsed and the user toggles the dock position to `Right`
- **THEN** the collapsed state is reset so the right sidebar shows its content normally

### Requirement: Dock toggle switches position and is caller-rendered

A dockable caller SHALL render a toggle control in its own header that calls `toggleDock()`. `toggleDock()` SHALL switch `dockPosition` between `Right` and `Bottom`. The toggle SHALL indicate the target position: showing a "dock to bottom" affordance when currently `Right`, and a "dock to right" affordance when currently `Bottom`. The toggle SHALL be keyboard-focusable and activatable via Enter or Space.

#### Scenario: Toggle from right to bottom

- **WHEN** the sidebar is docked `Right` and the user activates the dock toggle
- **THEN** `dockPosition` becomes `Bottom` and the content re-renders as the fixed bottom overlay

#### Scenario: Toggle from bottom to right

- **WHEN** the sidebar is docked `Bottom` and the user activates the dock toggle
- **THEN** `dockPosition` becomes `Right` and the content re-renders as the right-side `<aside>`

#### Scenario: Toggle is keyboard operable

- **WHEN** the user focuses the dock toggle and presses Enter or Space
- **THEN** the dock position toggles, identically to a click

### Requirement: Dock position persists per caller

When a `persistKey` is supplied via the dock options, the sidebar SHALL read the persisted `dockPosition` from `localStorage` under that key on mount and SHALL write the new value on every toggle, reusing the shared `getFromLocalStorage` / `setToLocalStorage` utilities. Reads and writes SHALL be SSR-safe: the initial (server) render SHALL use the `Right` default and the persisted value SHALL be applied on the client after mount, avoiding hydration mismatch. When no `persistKey` is supplied, the position SHALL NOT be persisted and SHALL default to `Right` on each open.

#### Scenario: Persisted bottom position is restored

- **WHEN** a caller with `persistKey` previously toggled to `Bottom`, and the caller opens the sidebar again (including after a page reload)
- **THEN** the sidebar opens docked to `Bottom`

#### Scenario: No persistKey means no persistence

- **WHEN** a dockable caller supplies no `persistKey` and toggles to `Bottom`, then closes and reopens the sidebar
- **THEN** the sidebar opens docked to `Right` (the default) and nothing is written to `localStorage`

#### Scenario: Per-caller isolation

- **WHEN** two different dockable callers use different `persistKey` values
- **THEN** toggling the dock position for one caller does not change the persisted position of the other

### Requirement: Query Builder result is dockable and remembers its position

The Query Builder result sidebar SHALL opt into dock mode with a dedicated `persistKey`, and `QueryResultSidebar` SHALL render the dock toggle in its header alongside the close button. The result content (row/total stat chips and the results grid) SHALL be unchanged and SHALL fill the available area in both dock positions.

#### Scenario: Query result can be docked to the bottom

- **WHEN** the user runs a query and activates the dock toggle in the result sidebar header
- **THEN** the same result content (stat chips + grid) moves to a full-width fixed bottom overlay, and the query form above is not reflowed

#### Scenario: Query result remembers the bottom choice

- **WHEN** the user has docked the query result to the bottom, then runs another query (or reloads the page)
- **THEN** the result opens docked to the bottom again

#### Scenario: Result content is identical across positions

- **WHEN** the query result is shown in either the right or the bottom position
- **THEN** it renders the same stat chips and the same `GridView` of result rows, with the grid filling the panel
