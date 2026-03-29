## ADDED Requirements

### Requirement: Detail mode switcher toggles between sidebar and drawer

The system SHALL provide a switcher control that allows the user to toggle between two mutually exclusive detail view modes: "Sidebar" (existing right panel) and "Drawer" (new bottom panel). Only one detail view SHALL be visible at a time. The default mode SHALL be "Sidebar".

#### Scenario: Default mode is sidebar
- **WHEN** the user opens the Analytics tab and clicks a grid row
- **THEN** the right sidebar detail panel opens (existing behavior) and no bottom drawer is shown

#### Scenario: Switch from sidebar to drawer
- **WHEN** the sidebar detail panel is open and the user clicks the "Switch to Drawer" button
- **THEN** the sidebar closes and the bottom drawer opens, displaying the same selected test case

#### Scenario: Switch from drawer to sidebar
- **WHEN** the bottom drawer is open and the user clicks the "Switch to Sidebar" button
- **THEN** the bottom drawer closes (clearing pinned state and field selector state) and the sidebar opens for the same selected test case

### Requirement: Switcher button is placed in the active detail view header

The switcher button SHALL appear in the header area of whichever detail view is currently active:
- In sidebar mode: a button in the `RunMetricDetailPanel` header that switches to drawer mode
- In drawer mode: a button in the `DrawerToolbar` that switches to sidebar mode

#### Scenario: Switcher visible in sidebar header
- **WHEN** the sidebar is the active detail mode and a test case is selected
- **THEN** the sidebar header contains a button with a bottom-panel icon labeled/titled "Switch to Drawer"

#### Scenario: Switcher visible in drawer toolbar
- **WHEN** the drawer is the active detail mode
- **THEN** the drawer toolbar contains a button with a sidebar icon labeled/titled "Switch to Sidebar"

### Requirement: Selected row context is preserved when switching modes

The system SHALL preserve the currently selected `resultId` when the user switches detail modes. The newly activated detail view SHALL display data for the same test case that was selected in the previous mode.

#### Scenario: Context preserved sidebar to drawer
- **WHEN** the sidebar shows details for "Row 000029" and the user switches to drawer mode
- **THEN** the drawer opens with "Row 000029" as the active detail

#### Scenario: Context preserved drawer to sidebar
- **WHEN** the drawer shows details for "Row 000030" (with "Row 000029" pinned) and the user switches to sidebar mode
- **THEN** the sidebar opens showing details for "Row 000030" (the active, not the pinned)

### Requirement: Mutual exclusion is enforced

The system SHALL NOT render both the sidebar and the drawer simultaneously. When one mode is active, the other's component SHALL not be mounted.

#### Scenario: Only sidebar rendered in sidebar mode
- **WHEN** the detail mode is "sidebar"
- **THEN** the sidebar component is rendered and the drawer component is not mounted in the DOM

#### Scenario: Only drawer rendered in drawer mode
- **WHEN** the detail mode is "drawer"
- **THEN** the drawer component is rendered (via portal) and the sidebar component is not mounted in the DOM

### Requirement: Row click opens the active detail mode

When the user clicks a row in the Analytics grid, the system SHALL open whichever detail mode is currently active (sidebar or drawer). If no detail view is open, the system SHALL open the currently selected mode.

#### Scenario: Row click in sidebar mode
- **WHEN** the detail mode is "sidebar" and the user clicks a grid row
- **THEN** the sidebar opens/updates with the clicked row's details

#### Scenario: Row click in drawer mode
- **WHEN** the detail mode is "drawer" and the user clicks a grid row
- **THEN** the drawer opens/updates with the clicked row's details

### Requirement: Closing the active detail view does not change mode preference

When the user closes the sidebar (X button) or the drawer (X button), the detail view closes but the mode preference remains. The next row click SHALL open the same mode.

#### Scenario: Close drawer then click row
- **WHEN** the user is in drawer mode, closes the drawer, then clicks a grid row
- **THEN** the drawer reopens for the clicked row (not the sidebar)

### Requirement: Switcher is keyboard accessible

The switcher button SHALL be keyboard-focusable and activatable via Enter or Space.

#### Scenario: Activate switcher with keyboard
- **WHEN** the user focuses the switcher button and presses Enter
- **THEN** the detail mode toggles to the other mode
