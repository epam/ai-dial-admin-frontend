## MODIFIED Requirements

### Requirement: Edit schema field
The system SHALL allow users to edit schema field properties (name, type, required, scope, description) inline in the schema grid.

Scope SHALL be a two-state toggle between **Per turn** and **Shared**. A field with no stored scope SHALL read as Shared, so schemas authored before this capability keep their current meaning.

The Name of a field that already exists in the saved schema SHALL remain editable. Editing it is a **rename**: the field keeps its server-assigned identity, so its test case values move to the new name on save (see "Rename schema field preserves test case values").

#### Scenario: Editing field name inline
- **WHEN** user clicks on the Name cell of a schema field row and types a new name
- **THEN** the name is updated in the local schema state

#### Scenario: Renaming a saved field keeps its identity
- **WHEN** user changes the Name of a field that exists in the saved schema
- **THEN** the field's `id` is unchanged in the local schema state
- **AND** its type, required, scope, and description are unchanged

#### Scenario: A new field has no identity until saved
- **WHEN** user adds a field and types its name
- **THEN** the field carries no `id` in the local schema state, and the backend assigns one on save

#### Scenario: Changing field type
- **WHEN** user selects a different type from the Type dropdown in a schema field row
- **THEN** the type is updated in the local schema state

#### Scenario: Marking a field per-turn
- **WHEN** the user switches a field's Scope to Per turn
- **THEN** the local schema state records it as per-turn and the test cases grid renders that column per turn

#### Scenario: A pre-existing field reads as shared
- **WHEN** a schema saved before this capability is loaded
- **THEN** every field shows Scope Shared and test case behaviour is unchanged

---

### Requirement: Add schema field
The system SHALL allow users to add a new schema field via an "Add field" button in the Schema tab. A new row SHALL be added to the schema grid.

Field names SHALL be unique within the schema **case-insensitively** (`prompt` and `Prompt` collide), matching the backend's validation on `POST`/`PUT /api/v1/datasets`.

#### Scenario: Adding a new field
- **WHEN** user clicks "Add field"
- **THEN** a new editable row is appended to the schema grid with empty Name, default Type (STRING), Required unchecked, Scope defaulting to Shared, and empty Description

#### Scenario: Save blocked with incomplete field
- **WHEN** a schema field row has an empty Name or no Type selected
- **THEN** the Save button is disabled

#### Scenario: Duplicate name differing only in case
- **WHEN** two schema fields have names equal ignoring case (e.g. `prompt` and `Prompt`)
- **THEN** an inline error notification above the schema grid names the duplicated field
- **AND** the Save button is disabled

#### Scenario: Resolving a duplicate clears the error
- **WHEN** the user edits one of the colliding names so that all names are unique ignoring case
- **THEN** the error notification disappears, and Save is enabled again (if nothing else is invalid)

## ADDED Requirements

### Requirement: Rename schema field preserves test case values
When the dataset is saved, every schema field that came from the server SHALL be sent back with its `id` on `PUT /api/v1/datasets/{id}`; fields added in this session SHALL be sent without `id`. A field whose `id` is unchanged but whose `name` differs is a rename, and the backend moves each test case's stored value from the old name to the new name (in shared data and in every turn). Renames combined with other schema edits (type, scope, add, remove) in the same save SHALL be supported. A dataset create (`POST /api/v1/datasets`) SHALL never send a schema field `id`.

#### Scenario: Renamed column keeps its values after save
- **WHEN** user renames field `expected_answer` to `reference_answer` and saves
- **THEN** the request carries the field with its original `id` and the new name
- **AND** after the save, every test case shows its former `expected_answer` value under `reference_answer`

#### Scenario: Renaming a per-turn field
- **WHEN** user renames a per-turn field and saves
- **THEN** each turn's value appears under the new name after the save

#### Scenario: Rename together with an added field
- **WHEN** user renames one field, adds another, and saves in one action
- **THEN** the renamed field keeps its values and the added field is created empty

#### Scenario: Rename rejected for a shared public dataset
- **WHEN** user renames a field of a PUBLIC dataset that is bound to at least one test suite and saves
- **AND** the backend responds 409 `DATASET_FIELD_RENAME_FORBIDDEN`
- **THEN** an error toast shows the backend's message
- **AND** nothing is persisted, and the page reloads the server state as for any other save error

#### Scenario: Rename from the TestSuite schema modal
- **WHEN** user renames a field in the TestSuite "Test case schema" modal for a private dataset and applies it
- **THEN** the dataset is updated with the field's original `id`, and the test cases grid shows the existing values under the new name
- **AND** the TestSuite is reloaded so its `valid` status and `validationWarnings` reflect the updated schema

---

### Requirement: Unsaved rename is previewed in the test cases grid
While a rename on the Dataset page is unsaved, the test cases grid SHALL show each test case's existing value for that field under the field's new column name, matched by the field's `id` against the saved schema. Edits made to such a cell SHALL be saved under the new name. Discarding SHALL restore the saved name and values.

#### Scenario: Renamed column is not blank before save
- **WHEN** user renames a saved field on the Schema tab and opens the Test cases tab without saving
- **THEN** the column appears under the new name with the test cases' existing values

#### Scenario: Removing and re-adding is not a rename
- **WHEN** user removes a saved field and adds a new field with a different name
- **THEN** the new column is empty in the test cases grid, because the new field has no `id`

#### Scenario: Discard after rename
- **WHEN** user renames a field and clicks Discard
- **THEN** the schema and test cases grid show the saved name and values again
