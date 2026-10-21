## MODIFIED Requirements

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
