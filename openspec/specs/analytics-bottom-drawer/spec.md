# Analytics Bottom Drawer — Spec

## Purpose

Provides the bottom detail panel for the Execution Result tab (Run Detail view) as an alternative
to the right sidebar (`RunMetricDetailPanel`). The panel is a single-row pivot of the selected test
case’s fields, shown via AppContext sidebar at `SidebarPosition.Bottom`. It supports Display-based
field visibility/order, horizontal scroll-to-field from grid cell clicks, and a full-value popup.

## Requirements

### Requirement: Bottom pivot panel displays when detail mode is drawer

The system SHALL display the bottom pivot panel when the detail mode is "drawer" and a test case row is selected, via `sidebar.showSidebar` with `SidebarPosition.Bottom`. The panel SHALL NOT be visible when the detail mode is "sidebar".

#### Scenario: Panel visible in drawer mode
- **WHEN** the detail mode is "drawer" and a row is selected in the Execution Result grid
- **THEN** the bottom pivot panel is displayed in the bottom sidebar slot

#### Scenario: Panel hidden in sidebar mode
- **WHEN** the detail mode is "sidebar"
- **THEN** the bottom pivot panel is not shown

#### Scenario: Row click in drawer mode updates active detail
- **WHEN** the panel is open and the user clicks a different row in the grid
- **THEN** the panel updates to show the newly selected test case's data without closing

### Requirement: Bottom panel shows a single-row pivot

The bottom panel body SHALL render a pivot with a section-header row, a field-label row, a metric-only filter row when metric columns are present, and exactly one value row for the selected test case. Execution columns SHALL appear as Execution Status → `# Run number` → HTTP (Duration available but hidden by default). Metric sections SHALL appear immediately after Execution. It SHALL NOT render a sticky run-name column, a second run row, a delta row, a DiffMiniMap, or a table/pivot view toggle.

#### Scenario: Pivot layout for one test case
- **WHEN** the bottom panel opens for a test case with Execution, metric, and Extracted sections
- **THEN** the pivot shows Execution then metric sections as column groups, with search/filter controls on metric columns only, and one value row of truncated cell values

### Requirement: Display overlay controls field visibility and order

The panel header SHALL provide a Display control that opens an overlay `TreeColumnsPanel` for reordering and hiding fields/sections. By default, Execution Status, `# Run number`, HTTP, and Request / Response body fields SHALL be visible; Duration SHALL be hidden. Closing the panel SHALL discard Display session state.

#### Scenario: Display opens field tree
- **WHEN** the user clicks Display
- **THEN** an overlay tree of sections and fields is shown for visibility and order changes

#### Scenario: Default field visibility
- **WHEN** the bottom panel opens
- **THEN** Duration is hidden until shown via Display, and Request / Response body fields are visible

#### Scenario: Hide a field
- **WHEN** the user hides a field in Display
- **THEN** that field’s column is removed from the pivot until shown again or the panel is reopened

### Requirement: Grid cell click scrolls to the related pivot column

When the user clicks a cell in the main Execution Result grid whose column maps to a pivot field, the system SHALL open the bottom panel for that row (if needed) and horizontally scroll so the related pivot column is visible.

#### Scenario: Cell click scrolls to field
- **WHEN** the user clicks the HTTP column cell for a row while in drawer mode
- **THEN** the bottom panel shows that row and scrolls to the HTTP pivot column

#### Scenario: Unmapped column still opens panel
- **WHEN** the user clicks a column that has no pivot mapping (e.g. test case name)
- **THEN** the bottom panel opens for the row without scrolling to a specific field

### Requirement: Pivot cells truncate and open a full-value popup

Pivot value cells SHALL truncate content that does not fit. On hover, the cell SHALL show an “open in popup” affordance at the bottom-right. Clicking the cell SHALL open a `DialPopup` titled with the field label and showing the full value (not a two-pane diff viewer).

#### Scenario: Truncate long value
- **WHEN** a field value exceeds the cell width
- **THEN** the cell displays truncated text with overflow hidden

#### Scenario: Hover shows open-popup icon
- **WHEN** the user hovers a value cell
- **THEN** an open-in-popup icon appears at the bottom-right of the cell

#### Scenario: Click opens full-value popup
- **WHEN** the user clicks a value cell
- **THEN** a popup opens with the field label as title and the full cell content

### Requirement: Panel shows loading and error states

The system SHALL show a loading indicator while `getTestCaseRunResultDetails` is in progress and an error message when the fetch fails. The header SHALL remain usable (close / switch mode).

#### Scenario: Loading on open
- **WHEN** the panel opens and detail data has not loaded yet
- **THEN** the body shows a loader and the header shows the panel chrome

#### Scenario: Fetch returns null
- **WHEN** `getTestCaseRunResultDetails(resultId)` returns null
- **THEN** the body shows an error message and the panel remains open

### Requirement: Panel can be closed

The system SHALL provide a Close button in the panel header. Closing SHALL hide the panel but preserve detail mode as "drawer" so the next row click reopens the bottom panel.

#### Scenario: Close the panel
- **WHEN** the user clicks Close
- **THEN** the bottom panel is hidden and detail mode remains "drawer"

### Requirement: Panel cleans up on navigation away

The system SHALL close the AppContext sidebar (including bottom slot content) when the Execution Result detail owner unmounts.

#### Scenario: Navigate away while panel is open
- **WHEN** the bottom panel is open and the user navigates away from the Run view
- **THEN** `sidebar.closeSidebar()` runs and no orphaned bottom-slot content remains
