# dataset-schema Specification

## Purpose

Defines the Schema tab of the dataset detail view: a full-page editor, built on the `SchemaManager` component, for the schema fields that describe a dataset's test cases. Covers adding, editing, and removing fields, and the save/discard state those edits participate in — schema changes are not persisted until the user saves.
## Requirements
### Requirement: Schema tab displays full schema editor
The system SHALL display a full-page schema editor in the Schema tab of the dataset detail view. The editor SHALL use the existing `SchemaManager` component (promoted from modal to tab). It SHALL show all current schema fields and allow adding, editing, and removing fields. Schema changes SHALL participate in the dataset's save/discard state — changes are not persisted until the user clicks Save.

The grid SHALL include a **Scope** column indicating whether the field varies per turn or is shared across the whole test case.

#### Scenario: Schema tab with existing fields
- **WHEN** user navigates to the Schema tab of a dataset that has schema fields
- **THEN** a grid of schema fields is displayed with columns: Name, Type, Required, Scope, Description, and a remove action

#### Scenario: Schema tab with no fields
- **WHEN** user navigates to the Schema tab of a dataset with no schema fields
- **THEN** an empty grid is displayed with an "Add field" button

#### Scenario: Schema changes mark dataset as dirty
- **WHEN** the user adds, edits, or removes a schema field
- **THEN** the Save and Discard buttons appear in the header

---

### Requirement: Add schema field
The system SHALL allow users to add a new schema field via an "Add field" button in the Schema tab. A new row SHALL be added to the schema grid.

#### Scenario: Adding a new field
- **WHEN** user clicks "Add field"
- **THEN** a new editable row is appended to the schema grid with empty Name, default Type (STRING), Required unchecked, Scope defaulting to Shared, and empty Description

#### Scenario: Save blocked with incomplete field
- **WHEN** a schema field row has an empty Name or no Type selected
- **THEN** the Save button is disabled

---

### Requirement: Edit schema field
The system SHALL allow users to edit schema field properties (name, type, required, scope, description) inline in the schema grid.

Scope SHALL be a two-state toggle between **Per turn** and **Shared**. A field with no stored scope SHALL read as Shared, so schemas authored before this capability keep their current meaning.

#### Scenario: Editing field name inline
- **WHEN** user clicks on the Name cell of a schema field row and types a new name
- **THEN** the name is updated in the local schema state

#### Scenario: Changing field type
- **WHEN** user selects a different type from the Type dropdown in a schema field row
- **THEN** the type is updated in the local schema state

#### Scenario: Marking a field per-turn
- **WHEN** the user switches a field's Scope to Per turn
- **THEN** the local schema state records it as per-turn and the test cases grid renders that column per turn

#### Scenario: A pre-existing field reads as shared
- **WHEN** a schema saved before this capability is loaded
- **THEN** every field shows Scope Shared and test case behaviour is unchanged

### Requirement: Remove schema field
The system SHALL allow users to remove a schema field via a remove action in the schema grid row.

#### Scenario: Removing a field
- **WHEN** user clicks the remove action on a schema field row
- **THEN** the field is removed from the local schema state and the grid updates immediately

---

### Requirement: Save schema changes
The system SHALL persist schema changes when the user clicks Save. If only schema/properties changed (no test case changes), `PUT /api/v1/datasets/{id}` is called with the updated `testCaseSchema`. The request SHALL include the `If-Match` header with the current dataset version.

#### Scenario: Schema-only save returns 200
- **WHEN** user saves and the backend returns 200
- **THEN** the dataset version (etag) is updated, dirty state is cleared, and a success toast is shown

#### Scenario: Schema save triggers async revalidation (202)
- **WHEN** user saves schema changes and the backend returns 202
- **THEN** a toast is shown informing the user that test cases are being revalidated, and the dirty state is cleared

#### Scenario: Concurrent edit conflict (412)
- **WHEN** the backend returns 412 (precondition failed, version mismatch)
- **THEN** an error toast is shown telling the user the dataset was modified elsewhere and they should reload

---

### Requirement: Discard schema changes
The system SHALL revert schema changes to the last saved state when the user clicks Discard.

#### Scenario: Discarding schema edits
- **WHEN** user clicks Discard after making schema changes
- **THEN** the schema grid reverts to the server-state schema fields and the Save/Discard buttons disappear

