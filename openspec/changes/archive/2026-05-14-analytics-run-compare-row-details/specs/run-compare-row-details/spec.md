## ADDED Requirements

### Requirement: Row click in compare mode opens the bottom drawer
When the Analytics tab is in run-compare mode (a second run is selected via the Compare With dropdown), clicking a grid row SHALL open the bottom drawer instead of the sidebar, regardless of the current detail mode (sidebar or drawer).

#### Scenario: Click row while sidebar is active
- **WHEN** the user is in run-compare mode and detail mode is set to sidebar
- **THEN** the bottom drawer opens with the clicked row's data
- **AND** the sidebar does NOT open

#### Scenario: Click row while drawer is already open
- **WHEN** the user is in run-compare mode and the bottom drawer is already open
- **THEN** the drawer content updates to reflect the newly clicked row
- **AND** the drawer remains open

#### Scenario: Click same row again
- **WHEN** the user is in run-compare mode and clicks a row that is already active in the drawer
- **THEN** the drawer remains open and its content does not change

### Requirement: Drawer displays two-run comparison for the clicked row
In run-compare mode, the bottom drawer SHALL display a side-by-side comparison between the current run's result and the compared run's result for the clicked test case, using the existing comparison UI (table and pivot views, field selector, diff highlights).

#### Scenario: Both runs have a matching result
- **WHEN** the user clicks a row where both the current and compared run have a result
- **THEN** the drawer shows the current run's result on the active side
- **AND** the drawer shows the compared run's result on the compared side
- **AND** diff count and diff highlighting are computed between the two sides

#### Scenario: Clicking a different row replaces both sides
- **WHEN** the drawer is open in run-compare mode and the user clicks a different grid row
- **THEN** both the active side and the compared side update to the new row's results
- **AND** diff highlighting is recomputed for the new pair

### Requirement: Drawer toolbar shows run names as column labels
In run-compare mode, the drawer toolbar SHALL display the run names (format: `{testRunName} · {startedAt}`, matching the Compare With dropdown label) as column headers instead of the test case name chips used in within-run comparison.

#### Scenario: Toolbar labels in run-compare mode
- **WHEN** the bottom drawer is open in run-compare mode
- **THEN** the active column label shows the current run's name
- **AND** the compared column label shows the compared run's name

### Requirement: Pin/unpin and sidebar-switch controls hidden in run-compare mode
In run-compare mode, the drawer toolbar SHALL hide the pin button, unpin button, and the "switch to sidebar" button. The comparison is locked to the two selected runs and cannot be modified by the user.

#### Scenario: Toolbar controls in run-compare mode
- **WHEN** the bottom drawer is open in run-compare mode
- **THEN** the pin button is not visible
- **AND** the unpin button is not visible
- **AND** the switch-to-sidebar button is not visible

### Requirement: Compared run result missing shows a placeholder
When the clicked row has no matching result in the compared run, the bottom drawer SHALL still open and display the current run's result normally, with a "No matching test case in compared run" message shown in place of the compared side's content.

#### Scenario: No match in compared run
- **WHEN** the user clicks a row whose `_compared` field is null
- **THEN** the drawer opens and shows the current run's result on the active side
- **AND** a placeholder message is shown on the compared side indicating no match was found
- **AND** the toolbar shows "No matching test case in compared run" as the compared column label

### Requirement: Exiting run-compare mode closes the drawer
When the user clears the Compare With selection while the bottom drawer is open in run-compare mode, the drawer SHALL close and the selected row highlight SHALL be removed.

#### Scenario: User clears the compare dropdown
- **WHEN** the drawer is open in run-compare mode and the user clicks the clear (×) button on the Compare With dropdown
- **THEN** the bottom drawer closes
- **AND** no row in the grid remains highlighted as active

### Requirement: Clicked row is highlighted in the grid
In run-compare mode, the grid row corresponding to the currently active pair in the drawer SHALL be highlighted with the `ag-active-detail-row` class.

#### Scenario: Row highlight on click
- **WHEN** the user clicks a row in run-compare mode
- **THEN** that row is highlighted with the active-detail styling
- **AND** any previously highlighted row loses the highlight

#### Scenario: Row highlight cleared on drawer close
- **WHEN** the drawer closes (via Escape, close button, or exiting compare mode)
- **THEN** the previously highlighted row loses the active-detail styling
