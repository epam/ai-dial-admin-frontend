# Analytics Detail View Switcher — Spec

## Purpose

Defines the switcher control that lets a user toggle the Execution Result tab's test-case detail view
between the right "Sidebar" panel (`RunMetricDetailPanel` via AppContext) and the bottom pivot panel
(also via AppContext at `SidebarPosition.Bottom`). Owns the mutual-exclusion invariant (only one
detail view visible at a time), preserves the selected row's `resultId` across mode switches, and
centralizes all sidebar open/close calls in the `useDetailMode` hook so `ExtractionResult.tsx` never
calls those APIs directly.

## Requirements

### Requirement: Detail mode switcher toggles between sidebar and drawer

The system SHALL provide a switcher control that allows the user to toggle between two mutually exclusive detail view modes: "Sidebar" (right panel via AppContext `sidebar.showSidebar` with `SidebarPosition.Right`) and "Drawer"/bottom (via `sidebar.showSidebar` with `SidebarPosition.Bottom`). Only one detail view SHALL be visible at a time. The default mode SHALL be "Drawer" (bottom). The `useDetailMode` hook SHALL be the sole owner of `sidebar.showSidebar()` / `sidebar.closeSidebar()` calls for Execution Result detail — `ExtractionResult.tsx` SHALL NOT call these APIs directly.

#### Scenario: Default mode is bottom drawer
- **WHEN** the user opens the Execution Result tab and clicks a grid row
- **THEN** the bottom detail panel opens via `sidebar.showSidebar(..., SidebarPosition.Bottom)` and the right sidebar is not shown

#### Scenario: Switch from sidebar to drawer
- **WHEN** the right sidebar detail panel is open and the user clicks the "Switch to Drawer" button
- **THEN** the right sidebar is replaced by the bottom panel for the same selected test case

#### Scenario: Switch from drawer to sidebar
- **WHEN** the bottom panel is open and the user clicks the "Switch to Sidebar" button
- **THEN** the bottom panel closes and `sidebar.showSidebar` is called with `RunMetricDetailPanel` for the same `resultId` at `SidebarPosition.Right`

### Requirement: Switcher button in sidebar via `onSwitchMode` prop

`RunMetricDetailPanel` SHALL accept an optional `onSwitchMode?: () => void` prop. When provided, the panel header SHALL render an icon button (e.g., `IconLayoutBottombar`) that calls `onSwitchMode()`. When not provided, no switcher button is rendered (preserving backward compatibility with other usages).

#### Scenario: Switcher visible in sidebar header
- **WHEN** the sidebar is open and `onSwitchMode` prop was provided
- **THEN** the sidebar header contains a switcher icon button titled "Switch to Drawer"

#### Scenario: No switcher when prop absent
- **WHEN** `RunMetricDetailPanel` is rendered without `onSwitchMode` prop
- **THEN** no switcher button appears in the header

### Requirement: Switcher button in drawer toolbar

The bottom panel header SHALL include a "Switch to Sidebar" icon button that triggers the mode switch callback.

#### Scenario: Switcher visible in drawer toolbar
- **WHEN** the bottom panel is the active detail mode
- **THEN** the panel header contains a button titled "Switch to Sidebar"

### Requirement: Selected row context is preserved when switching modes

The system SHALL preserve the currently selected `resultId` when the user switches detail modes. The newly activated detail view SHALL display data for the same test case.

#### Scenario: Context preserved sidebar to drawer
- **WHEN** the sidebar shows details for a result and the user switches to drawer mode
- **THEN** the bottom panel opens for the same `resultId`

#### Scenario: Context preserved drawer to sidebar
- **WHEN** the bottom panel shows details for a result and the user switches to sidebar mode
- **THEN** `sidebar.showSidebar` is called with that same `resultId` and `RunMetricDetailPanel`

### Requirement: Mutual exclusion between sidebar and drawer

The right and bottom AppContext sidebar slots SHALL NOT both show Execution Result detail content simultaneously. Opening one mode SHALL close the other via `sidebar.showSidebar` / position replacement.

#### Scenario: Only sidebar visible in sidebar mode
- **WHEN** the detail mode is "sidebar" and a row is selected
- **THEN** the right sidebar shows `RunMetricDetailPanel` and the bottom slot does not show the pivot panel

#### Scenario: Only drawer visible in drawer mode
- **WHEN** the detail mode is "drawer" and a row is selected
- **THEN** the bottom slot shows the pivot panel and the right sidebar is closed

### Requirement: Row click opens the active detail mode

When the user clicks a row in the Execution Result grid, the system SHALL open whichever detail mode is currently active. When the user clicks a grid cell that maps to a pivot field, the system SHALL open (or keep open) the bottom panel and focus that field when in drawer mode.

#### Scenario: Row click in sidebar mode
- **WHEN** the detail mode is "sidebar" and the user clicks a grid row
- **THEN** `sidebar.showSidebar(<RunMetricDetailPanel ...>)` is called at `SidebarPosition.Right`

#### Scenario: Row click in drawer mode
- **WHEN** the detail mode is "drawer" and the user clicks a grid row
- **THEN** the bottom panel opens or updates to the clicked row's `resultId`

#### Scenario: Cell click focuses pivot field in drawer mode
- **WHEN** the detail mode is "drawer" and the user clicks a grid cell whose column maps to a pivot field
- **THEN** the bottom panel is open for that row and horizontally scrolls so the matching pivot column is visible

#### Scenario: Re-click same row in drawer mode without a new field focus
- **WHEN** the bottom panel is showing a row and the user clicks the same row again without a field focus key
- **THEN** the bottom panel closes, but the detail mode remains "drawer"

#### Scenario: Same-row cell click with field focus does not close
- **WHEN** the bottom panel is showing a row and the user clicks a cell on the same row with a mapped field key
- **THEN** the panel stays open and updates the focused field

### Requirement: Closing the active detail view does not change mode preference

When the user closes the sidebar (X button) or the bottom panel (X button), the detail view closes but the `detailMode` preference remains. The next row click SHALL open the same mode.

#### Scenario: Close drawer then click row
- **WHEN** the user is in drawer mode, closes the bottom panel, then clicks a grid row
- **THEN** the bottom panel reopens for the clicked row (not the sidebar)

#### Scenario: Close sidebar then click row
- **WHEN** the user is in sidebar mode, closes the sidebar, then clicks a grid row
- **THEN** the sidebar reopens for the clicked row

### Requirement: Switcher is keyboard accessible

The switcher button SHALL be keyboard-focusable and activatable via Enter or Space.

#### Scenario: Activate switcher with keyboard
- **WHEN** the user focuses the switcher button and presses Enter
- **THEN** the detail mode toggles to the other mode
