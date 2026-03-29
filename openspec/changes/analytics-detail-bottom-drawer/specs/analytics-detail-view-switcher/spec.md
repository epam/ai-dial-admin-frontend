## ADDED Requirements

### Requirement: Detail mode switcher toggles between sidebar and drawer

The system SHALL provide a switcher control that allows the user to toggle between two mutually exclusive detail view modes: "Sidebar" (existing right panel via AppContext) and "Drawer" (new bottom panel). Only one detail view SHALL be visible at a time. The default mode SHALL be "Sidebar". The `useDetailMode` hook SHALL be the sole owner of `sidebar.showSidebar()` / `sidebar.closeSidebar()` calls — `Analytics.tsx` SHALL NOT call these APIs directly.

#### Scenario: Default mode is sidebar
- **WHEN** the user opens the Analytics tab and clicks a grid row
- **THEN** the right sidebar opens via `sidebar.showSidebar()` (existing behavior) and no bottom drawer is shown

#### Scenario: Switch from sidebar to drawer
- **WHEN** the sidebar detail panel is open and the user clicks the "Switch to Drawer" button
- **THEN** `sidebar.closeSidebar()` is called, the sidebar disappears, and the bottom drawer opens displaying the same selected test case

#### Scenario: Switch from drawer to sidebar
- **WHEN** the bottom drawer is open and the user clicks the "Switch to Sidebar" button
- **THEN** the bottom drawer closes (clearing pinned state and field selector state) and `sidebar.showSidebar()` is called with the same selected test case's `resultId`

### Requirement: Switcher button in sidebar via `onSwitchMode` prop

`RunMetricDetailPanel` SHALL accept an optional `onSwitchMode?: () => void` prop. When provided, the panel header SHALL render an icon button (e.g., `IconLayoutBottombar`) that calls `onSwitchMode()`. When not provided, no switcher button is rendered (preserving backward compatibility with other usages).

#### Scenario: Switcher visible in sidebar header
- **WHEN** the sidebar is open and `onSwitchMode` prop was provided
- **THEN** the sidebar header contains a switcher icon button titled "Switch to Drawer"

#### Scenario: No switcher when prop absent
- **WHEN** `RunMetricDetailPanel` is rendered without `onSwitchMode` prop (e.g., from ExtractionResult tab)
- **THEN** no switcher button appears in the header

### Requirement: Switcher button in drawer toolbar

The `DrawerToolbar` SHALL include a "Switch to Sidebar" icon button (e.g., `IconLayoutSidebarRight`) that triggers the mode switch callback.

#### Scenario: Switcher visible in drawer toolbar
- **WHEN** the drawer is the active detail mode
- **THEN** the drawer toolbar contains a button titled "Switch to Sidebar"

### Requirement: Selected row context is preserved when switching modes

The system SHALL preserve the currently selected `resultId` when the user switches detail modes. The newly activated detail view SHALL display data for the same test case. When switching from drawer to sidebar, the `resultId` used SHALL be the drawer's active ID (not the pinned ID).

#### Scenario: Context preserved sidebar to drawer
- **WHEN** the sidebar shows details for "Row 000029" and the user switches to drawer mode
- **THEN** the drawer opens with "Row 000029" as the active detail and focus moves to the drawer toolbar's first focusable element

#### Scenario: Context preserved drawer to sidebar
- **WHEN** the drawer shows details for "Row 000030" (with "Row 000029" pinned) and the user switches to sidebar mode
- **THEN** `sidebar.showSidebar()` is called with `resultId="Row 000030"` (the active, not the pinned) and the sidebar manages its own focus

### Requirement: Mutual exclusion between sidebar and drawer

The sidebar (via AppContext) and the drawer (portaled to body) SHALL NOT both be visible simultaneously. When `detailMode` is "sidebar", the drawer component SHALL not be rendered. When `detailMode` is "drawer", `sidebar.closeSidebar()` SHALL be called to ensure the sidebar is hidden.

#### Scenario: Only sidebar visible in sidebar mode
- **WHEN** the detail mode is "sidebar" and a row is selected
- **THEN** the sidebar shows content and the drawer portal is not rendered

#### Scenario: Only drawer visible in drawer mode
- **WHEN** the detail mode is "drawer" and a row is selected
- **THEN** the drawer is rendered via portal and the sidebar has been closed via `sidebar.closeSidebar()`

### Requirement: Row click opens the active detail mode

When the user clicks a row in the Analytics grid, the system SHALL open whichever detail mode is currently active. In sidebar mode, it calls `sidebar.showSidebar()`. In drawer mode, it opens/updates the drawer component.

#### Scenario: Row click in sidebar mode
- **WHEN** the detail mode is "sidebar" and the user clicks a grid row
- **THEN** `sidebar.showSidebar(<RunMetricDetailPanel resultId={...} onClose={...} onSwitchMode={...} />)` is called

#### Scenario: Row click in drawer mode
- **WHEN** the detail mode is "drawer" and the user clicks a grid row
- **THEN** the drawer updates its active ID to the clicked row's ID

#### Scenario: Re-click same row in sidebar mode
- **WHEN** the sidebar is showing details for a row and the user clicks the same row again
- **THEN** the sidebar closes, but the detail mode remains "sidebar"

#### Scenario: Re-click same row in drawer mode
- **WHEN** the drawer is showing details for a row and the user clicks the same row again
- **THEN** the drawer closes (clearing pinned and field selector state), but the detail mode remains "drawer"

### Requirement: Closing the active detail view does not change mode preference

When the user closes the sidebar (X button) or the drawer (X button), the detail view closes but the `detailMode` preference remains. The next row click SHALL open the same mode.

#### Scenario: Close drawer then click row
- **WHEN** the user is in drawer mode, closes the drawer, then clicks a grid row
- **THEN** the drawer reopens for the clicked row (not the sidebar)

#### Scenario: Close sidebar then click row
- **WHEN** the user is in sidebar mode, closes the sidebar, then clicks a grid row
- **THEN** the sidebar reopens for the clicked row

### Requirement: Switcher is keyboard accessible

The switcher button SHALL be keyboard-focusable and activatable via Enter or Space.

#### Scenario: Activate switcher with keyboard
- **WHEN** the user focuses the switcher button and presses Enter
- **THEN** the detail mode toggles to the other mode
