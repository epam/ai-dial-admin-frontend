## MODIFIED Requirements

### Requirement: Detail mode switcher toggles between sidebar and drawer

The system SHALL provide a switcher control that allows the user to toggle between two mutually exclusive detail view modes: "Sidebar" (right panel via AppContext `sidebar.showSidebar` with `SidebarPosition.Right`) and "Drawer"/bottom (via `sidebar.showSidebar` with `SidebarPosition.Bottom`). Only one detail view SHALL be visible at a time. The default mode SHALL be "Drawer" (bottom). The `useDetailMode` hook SHALL be the sole owner of `sidebar.showSidebar()` / `sidebar.closeSidebar()` calls for Execution Result detail — `ExtractionResult.tsx` SHALL NOT call these APIs directly.

#### Scenario: Default mode is bottom drawer
- **WHEN** the user opens the Execution Result tab and clicks a grid row
- **THEN** the bottom detail panel opens via `sidebar.showSidebar(..., SidebarPosition.Bottom)` and the right sidebar is not shown

#### Scenario: Switch from sidebar to drawer
- **WHEN** the right sidebar detail panel is open and the user clicks the "Switch to Bottom" button
- **THEN** the right sidebar is replaced by the bottom panel for the same selected test case

#### Scenario: Switch from drawer to sidebar
- **WHEN** the bottom panel is open and the user clicks the "Switch to Sidebar" button
- **THEN** the bottom panel closes and `sidebar.showSidebar` is called with the Field | Values row-detail panel for the same `resultId` at `SidebarPosition.Right`

### Requirement: Selected row context is preserved when switching modes

The system SHALL preserve the currently selected `resultId` when the user switches detail modes. The newly activated detail view SHALL display data for the same test case.

#### Scenario: Context preserved sidebar to drawer
- **WHEN** the sidebar shows details for a result and the user switches to drawer mode
- **THEN** the bottom panel opens for the same `resultId`

#### Scenario: Context preserved drawer to sidebar
- **WHEN** the bottom panel shows details for a result and the user switches to sidebar mode
- **THEN** `sidebar.showSidebar` is called with that same `resultId` and the Field | Values row-detail panel at `SidebarPosition.Right`

### Requirement: Mutual exclusion between sidebar and drawer

The right and bottom AppContext sidebar slots SHALL NOT both show Execution Result detail content simultaneously. Opening one mode SHALL close the other via `sidebar.showSidebar` / position replacement.

#### Scenario: Only sidebar visible in sidebar mode
- **WHEN** the detail mode is "sidebar" and a row is selected
- **THEN** the right sidebar shows the Field | Values row-detail panel and the bottom slot does not show the pivot panel

#### Scenario: Only drawer visible in drawer mode
- **WHEN** the detail mode is "drawer" and a row is selected
- **THEN** the bottom slot shows the pivot panel and the right sidebar is closed

### Requirement: Row click opens the active detail mode

When the user clicks a row in the Execution Result grid, the system SHALL open whichever detail mode is currently active. When the user clicks a grid cell that maps to a detail field, the system SHALL open (or keep open) the active panel and focus that field: horizontally in the bottom pivot, vertically in the right sidebar table.

#### Scenario: Row click in sidebar mode
- **WHEN** the detail mode is "sidebar" and the user clicks a grid row
- **THEN** `sidebar.showSidebar(<row-detail panel ...>)` is called at `SidebarPosition.Right`

#### Scenario: Row click in drawer mode
- **WHEN** the detail mode is "drawer" and the user clicks a grid row
- **THEN** the bottom panel opens or updates to the clicked row's `resultId`

#### Scenario: Cell click focuses pivot field in drawer mode
- **WHEN** the detail mode is "drawer" and the user clicks a grid cell whose column maps to a pivot field
- **THEN** the bottom panel is open for that row and horizontally scrolls so the matching pivot column is visible

#### Scenario: Cell click focuses table field in sidebar mode
- **WHEN** the detail mode is "sidebar" and the user clicks a grid cell whose column maps to a detail field
- **THEN** the right sidebar is open for that row and scrolls vertically so the matching field row is visible

#### Scenario: Re-click same row in drawer mode without a new field focus
- **WHEN** the bottom panel is showing a row and the user clicks the same row again without a field focus key
- **THEN** the bottom panel closes, but the detail mode remains "drawer"

#### Scenario: Same-row cell click with field focus does not close
- **WHEN** the bottom panel is showing a row and the user clicks a cell on the same row with a mapped field key
- **THEN** the panel stays open and updates the focused field

## REMOVED Requirements

### Requirement: Switcher button in sidebar via `onSwitchMode` prop
**Reason**: The side panel no longer has an optional `onSwitchMode` prop; its header is the shared row-detail header, which always shows the switch button.
**Migration**: See "Switcher button in side panel header" below and the `run-row-details` capability.

## ADDED Requirements

### Requirement: Switcher button in side panel header

The right side panel header SHALL include a "Switch to Bottom" icon button that moves the detail to the bottom drawer for the same row. The button SHALL always be present in the side panel.

#### Scenario: Switcher visible in side panel header
- **WHEN** the right side panel is the active detail mode
- **THEN** the panel header contains a button titled "Switch to Bottom"
