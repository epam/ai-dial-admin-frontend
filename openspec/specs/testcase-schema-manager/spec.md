### Requirement: Schema tab in TestSuite view is read-only
The Schema tab in the TestSuite view SHALL display the bound dataset's `testCaseSchema` as a read-only list. Editing schema fields SHALL NOT be possible from the TestSuite context. The tab SHALL include a link button ("Edit on Dataset page") that opens the bound dataset's detail page in a new tab.

#### Scenario: Schema tab shows linked dataset's schema
- **WHEN** the user opens the Schema tab of a bound TestSuite
- **THEN** the list of schema fields from the linked dataset is displayed
- **THEN** fields are not editable (no add/remove/edit controls)

#### Scenario: Edit on Dataset page link
- **WHEN** user clicks "Edit on Dataset page" in the Schema tab
- **THEN** the bound dataset's detail page (`/datasets/{datasetId}`) opens in a new tab

#### Scenario: Schema tab hidden for unbound suite
- **WHEN** the suite has `datasetId = null`
- **THEN** the Schema tab is not visible in the tab navigation

---

### Requirement: Editable schema manager on Dataset page
The Dataset detail page SHALL provide a full schema editor (SchemaManager) allowing users to add, edit, rename, and remove `testCaseSchema` fields inline in the grid. All schema modifications are persisted via `updateDataset`. Every field loaded from the server SHALL keep its server-assigned `id` through all edits so that a changed name is persisted as a rename rather than a delete + add.

#### Scenario: Schema panel toggle
The Dataset Schema tab header SHALL display schema fields in an ag-grid with columns: Name, Type, Required, Scope, Description. Each row SHALL have a Remove action column.

#### Scenario: Display existing schema fields
- **WHEN** the schema panel is open and the dataset has `testCaseSchema` with fields
- **THEN** the grid SHALL display one row per schema field showing name, type, required, scope, and description

#### Scenario: Empty schema
- **WHEN** the schema panel is open and `testCaseSchema` is empty or undefined
- **THEN** the grid SHALL display an empty state message

#### Scenario: Add new field
- **WHEN** user clicks the Add button
- **THEN** a new field with empty name, type STRING, required false, and empty description SHALL be appended to the schema array
- **AND** the new field SHALL carry no `id`

#### Scenario: Rename existing field
- **WHEN** user edits the Name cell of a field that exists in the saved schema
- **THEN** the Name SHALL be editable
- **AND** the field SHALL keep its `id`, so the rename preserves the field's test case values on save

#### Scenario: Edit field properties
- **WHEN** user modifies Type, Required, Scope, or Description of a field
- **THEN** the schema field SHALL be updated in the `testCaseSchema` array, keeping its `id`

#### Scenario: Remove field
- **WHEN** user clicks Remove on a schema field row
- **THEN** the field SHALL be removed from the `testCaseSchema` array
- **AND** the dataset SHALL be updated via `updateDataset`

#### Scenario: Save validation
- **WHEN** the Name field is empty
- **THEN** the Save button SHALL be disabled

#### Scenario: Duplicate name validation
- **WHEN** user enters a name that equals another schema field's name ignoring case
- **THEN** an inline error notification SHALL name the duplicate
- **AND** the Save button SHALL be disabled
