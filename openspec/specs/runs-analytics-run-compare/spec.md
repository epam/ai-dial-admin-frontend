## ADDED Requirements

### Requirement: Sibling run dropdown is shown above the Analytics grid
The Analytics tab SHALL render a "Compare with" dropdown control above the AG Grid, populated with completed (`COMPLETED` status) runs from the same test suite as the current run, excluding the current run itself. Each option SHALL display the run's `testRunName` (or `id` if `testRunName` is absent) together with its formatted `startedAt` date.

#### Scenario: Dropdown renders with completed sibling runs
- **WHEN** the Analytics tab mounts and the current run has `testSuiteId`
- **THEN** the dropdown is populated with all sibling runs that have status `COMPLETED`, excluding the current run

#### Scenario: Dropdown is empty when no sibling runs exist
- **WHEN** the current run is the only completed run in its test suite
- **THEN** the dropdown renders with a placeholder and no selectable options

#### Scenario: Current run is excluded from dropdown options
- **WHEN** the dropdown options are populated
- **THEN** the current run's id does not appear as a selectable option

---

### Requirement: Selecting a run activates compare mode
The system SHALL fetch `AnalyticsResult[]` for the selected run and merge them with the current run's results. The grid SHALL re-render in compare mode with three-level column headers once the compared data is loaded.

#### Scenario: Compare mode activates on run selection
- **WHEN** a user selects a run from the "Compare with" dropdown
- **THEN** the system fetches analytics results for the selected run and the grid columns switch to the three-level compare layout

#### Scenario: Loading state during comparison fetch
- **WHEN** a comparison run has been selected and its results are being fetched
- **THEN** the grid shows a loading indicator until the data is ready

---

### Requirement: Three-level column headers in compare mode
When compare mode is active, the Analytics grid SHALL display three levels of column headers. The `[blank]` group (execution status icon and test case name) SHALL remain unchanged. All other column groups (EXECUTION, each metric group, EXTRACTED) SHALL each contain two sub-groups: **Current** (reading from the current run's row data) and **Compared** (reading from the matched compared run row data).

#### Scenario: Column header levels in compare mode
- **WHEN** compare mode is active
- **THEN** EXECUTION, metric groups, and EXTRACTED columns each show a "Current" and a "Compared" child group

#### Scenario: Blank group stays single-level in compare mode
- **WHEN** compare mode is active
- **THEN** the execution status icon column and test case name column are not duplicated

---

### Requirement: Rows are joined by test case identity
The system SHALL merge current and compared result sets into a single row array using `testCaseId` as the primary join key, falling back to `testCaseName` when `testCaseId` is absent. Only rows present in the current run are shown; test cases that exist only in the compared run are omitted.

#### Scenario: Matched test case shows both current and compared data
- **WHEN** compare mode is active and a test case exists in both result sets
- **THEN** the row shows current run values in Current columns and compared run values in Compared columns

#### Scenario: Unmatched test case shows dash in Compared columns
- **WHEN** compare mode is active and a test case from the current run has no matching entry in the compared run
- **THEN** all Compared columns for that row render `—`

---

### Requirement: Clearing comparison reverts the grid
The system SHALL provide a way to deselect the comparison run (dropdown clear / null selection). When cleared, the grid SHALL revert to the normal two-level column layout and the row data SHALL return to the current run's results only.

#### Scenario: Grid reverts to normal mode on clear
- **WHEN** the user clears the "Compare with" dropdown selection
- **THEN** the grid re-renders with the standard two-level column headers and compare data is removed from all rows

---

### Requirement: Compared columns have unique identifiers
Each column generated for the Compared sub-group SHALL have a `colId` prefixed with `cmp_` to prevent AG Grid key collisions with the corresponding Current columns.

#### Scenario: No colId collision in compare mode
- **WHEN** compare mode is active
- **THEN** every Compared column has a distinct `colId` from its Current counterpart
