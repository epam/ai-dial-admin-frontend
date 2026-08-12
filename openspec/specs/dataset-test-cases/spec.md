# dataset-test-cases Specification

## Purpose

Defines the Test Cases and Properties tabs of the dataset detail view: a grid of dataset-scoped test cases whose columns are generated from the dataset's `testCaseSchema`. Covers adding, inline editing, and deleting cases, the save/discard state their edits participate in, and CSV export and import.
## Requirements
### Requirement: Test Cases tab displays dataset-scoped test cases
The system SHALL display a test cases grid in the Test Cases tab of the dataset detail view. Test cases SHALL be fetched from `GET /api/v1/datasets/{datasetId}/test-cases`. The grid columns SHALL be dynamically generated from the dataset's `testCaseSchema`. There SHALL be NO enabled/disabled toggle column (the `enabled` field does not exist in the dataset test case model).

A multi-turn test case SHALL be displayed as a single collapsible group row rather than one row per turn, preceded by a leading expander column. The group row SHALL show the test case name — editable exactly as on a single-turn row — with a turn-count badge. Single-turn test cases SHALL render as one plain row with no expander affordance and no badge, exactly as before.

#### Scenario: Test cases grid with schema-defined columns
- **WHEN** the user navigates to the Test Cases tab of a dataset with schema fields
- **THEN** a grid is shown with a `testCaseName` column followed by one column per schema field

#### Scenario: Test cases grid with no schema
- **WHEN** the dataset has no schema fields defined
- **THEN** only the `testCaseName` column is shown and the user sees an empty grid or placeholder

#### Scenario: No enabled column
- **WHEN** the test cases grid is rendered
- **THEN** there is no enabled/disabled checkbox or toggle column

#### Scenario: Multi-turn case renders as one collapsed group
- **WHEN** the dataset contains a test case with three turns
- **THEN** the grid shows one row for it, bearing the case name and a `3 turns` badge, with a chevron to expand it

#### Scenario: Single-turn cases are visually unchanged
- **WHEN** the dataset contains only single-turn test cases
- **THEN** the grid renders one row per case with no chevron, no badge, and no turn labels

---

### Requirement: Add test case
The system SHALL allow users to add a new test case via an "Add test case" button in the Test Cases tab header. Adding a test case SHALL mark the dataset as dirty (test case changes tracked via ref).

#### Scenario: Adding a new test case row
- **WHEN** user clicks "Add test case"
- **THEN** a new editable row is added to the grid with an empty `testCaseName` and empty data fields

---

### Requirement: Edit test case inline
The system SHALL allow users to edit test case fields inline in the grid. Changes SHALL be tracked and flushed to the backend only when the user clicks Save.

Dirty tracking SHALL be per test case, not per grid row, so that an edit to any turn marks its whole case dirty and the case is saved with all of its turns.

#### Scenario: Editing a test case field
- **WHEN** user clicks a cell in the test cases grid and changes its value
- **THEN** the row is marked dirty and Save/Discard buttons appear in the header

#### Scenario: Editing one turn marks the whole case dirty
- **WHEN** the user edits a value on turn 2 of a three-turn case
- **THEN** that test case is marked dirty and Save persists all three of its turns

#### Scenario: Renaming a multi-turn case
- **WHEN** the user edits the name on a multi-turn case's group row
- **THEN** the case is marked dirty and Save persists the case under its new name with all of its turns

---

### Requirement: Delete test case
The system SHALL allow users to delete one or more test cases. Deletion of a single test case calls `DELETE /api/v1/datasets/{datasetId}/test-cases/{id}`. Bulk deletion calls `DELETE /api/v1/datasets/{datasetId}/test-cases` with selected IDs.

Deleting a **turn** SHALL be distinct from deleting a **test case**: removing a turn is a local edit to the case's turn array, persisted on Save, and SHALL NOT issue a delete request. Only Delete test case invokes the delete endpoint.

#### Scenario: Deleting a single test case
- **WHEN** user triggers the delete action on a test case row and confirms
- **THEN** `DELETE /api/v1/datasets/{datasetId}/test-cases/{id}` is called and the row is removed from the grid

#### Scenario: Bulk deleting selected test cases
- **WHEN** user selects multiple rows and triggers bulk delete and confirms
- **THEN** the selected test cases are deleted and removed from the grid

#### Scenario: Deleting a turn does not delete the case
- **WHEN** the user deletes one turn of a three-turn case
- **THEN** no delete request is issued, the case now shows two turns, and the change is pending until Save

---

### Requirement: Save test case changes
The system SHALL persist dirty test case rows when the user clicks Save. Dirty rows SHALL be flushed via `PUT /api/v1/datasets/{datasetId}/test-cases` (batch update endpoint).

Before sending, a dirty case's grid rows SHALL be collapsed back into one test case: turns ordered by their turn index, per-turn fields written to `multiTurnData`, shared fields written to `data`, and all client-only row fields stripped. A case whose rows collapse to a single turn SHALL be sent with `data` only and no `multiTurnData`.

#### Scenario: Saving inline edits
- **WHEN** user has edited test case rows and clicks Save
- **THEN** `PUT /api/v1/datasets/{datasetId}/test-cases` is called with all dirty rows, success toast is shown, and dirty tracking is reset

#### Scenario: Saving a multi-turn case sends one entity
- **WHEN** a three-turn case is saved
- **THEN** the request contains one test case with a three-element `multiTurnData` in turn order, and no client-only fields

#### Scenario: A collapsed group is saved in full
- **WHEN** a multi-turn case is edited and then collapsed before Save
- **THEN** all of its turns are included in the request

---

### Requirement: Discard test case changes
The system SHALL revert unsaved test case changes (including newly added rows not yet saved) when the user clicks Discard.

#### Scenario: Discarding test case edits
- **WHEN** user clicks Discard after editing test cases
- **THEN** the grid reverts to the last saved state and Save/Discard buttons disappear

---

### Requirement: Export test cases to CSV
The system SHALL allow users to export dataset test cases as CSV via an Export button in the Test Cases tab header. The export calls `GET /api/v1/datasets/{datasetId}/test-cases/export.csv`.

#### Scenario: Exporting test cases
- **WHEN** user clicks the Export button
- **THEN** a CSV file download is triggered containing all test cases with columns matching the dataset schema

---

### Requirement: Import test cases from CSV
The system SHALL allow users to import test cases from a CSV file via an Import button in the Test Cases tab header. The import flow SHALL include a preview step before committing.

The preview step SHALL render the case-level warnings returned by the preview response, in addition to the per-row validity indicator. Each warning SHALL identify the column and row it concerns.

#### Scenario: Import preview step
- **WHEN** user selects a CSV file for import
- **THEN** `POST /api/v1/datasets/{datasetId}/test-cases/import/preview` is called and the user sees a preview of rows to be imported with any validation warnings

#### Scenario: Preview warnings are shown
- **WHEN** the preview response contains case-level warnings
- **THEN** each warning is displayed above the preview grid with its column name and row number

#### Scenario: No warnings renders nothing
- **WHEN** the preview response contains no warnings
- **THEN** no warnings area is rendered and the preview grid is unchanged

#### Scenario: Confirming import
- **WHEN** user confirms the import after reviewing the preview
- **THEN** `POST /api/v1/datasets/{datasetId}/test-cases/import` is called, success toast shown with import count, and the grid refreshes with imported rows

#### Scenario: Import with schema change triggers revalidation
- **WHEN** the import causes a schema change and the backend returns 202
- **THEN** the user sees a toast that test cases are being revalidated and the grid is refreshed

#### Scenario: Import conflict handling
- **WHEN** imported CSV contains a test case name that already exists
- **THEN** the preview step shows the conflict and the user can choose to proceed (OVERRIDE strategy) or cancel

### Requirement: Dataset Properties tab
The system SHALL display a Properties tab on the dataset detail view with editable `name` (Display name) and `description` fields. Changes SHALL mark the dataset as dirty and be persisted via `PUT /api/v1/datasets/{id}` on Save.

#### Scenario: Editing display name
- **WHEN** user edits the name field in the Properties tab
- **THEN** Save and Discard buttons appear in the header

#### Scenario: Saving properties
- **WHEN** user saves after editing properties
- **THEN** `PUT /api/v1/datasets/{id}` is called with updated name and description, etag is updated, dirty state cleared

#### Scenario: Name field required
- **WHEN** user clears the name field
- **THEN** the Save button is disabled or an inline validation error is shown

#### Scenario: Discard properties changes
- **WHEN** user clicks Discard after editing properties
- **THEN** the name and description fields revert to the last saved values

