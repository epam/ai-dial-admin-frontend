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
The Dataset detail page SHALL provide a full schema editor (SchemaManager) allowing users to add, edit, and remove `testCaseSchema` fields. All schema modifications are persisted via `updateDataset`.

#### Scenario: Schema panel toggle
The Dataset Schema tab header SHALL display schema fields in an ag-grid with columns: Name, Type, Required, Description. Each row SHALL have Edit and Remove action columns.

#### Scenario: Display existing schema fields
- **WHEN** the schema panel is open and the dataset has `testCaseSchema` with fields
- **THEN** the grid SHALL display one row per schema field showing name, type (lowercase), required (boolean), and description

#### Scenario: Empty schema
- **WHEN** the schema panel is open and `testCaseSchema` is empty or undefined
- **THEN** the grid SHALL display an empty state message

#### Scenario: Add new field
- **WHEN** user clicks the Add button
- **THEN** a new field with empty name, type STRING, required false, and empty description SHALL be appended to the schema array
- **AND** the edit panel SHALL open for this new field with the Name input focused and editable

#### Scenario: Open edit panel for existing field
- **WHEN** user clicks Edit on a schema field row
- **THEN** the edit panel SHALL appear below the grid with the field's current values populated
- **AND** the Name input SHALL be disabled (read-only)

#### Scenario: Edit field properties
- **WHEN** user modifies Type, Required, or Description in the edit panel and clicks Save
- **THEN** the schema field SHALL be updated in the `testCaseSchema` array
- **AND** the edit panel SHALL close
- **AND** the dataset SHALL be updated via `updateDataset`

#### Scenario: Remove field
- **WHEN** user clicks Remove on a schema field row
- **THEN** the field SHALL be removed from the `testCaseSchema` array
- **AND** the dataset SHALL be updated via `updateDataset`

#### Scenario: Save validation
- **WHEN** the Name field is empty
- **THEN** the Save button SHALL be disabled

#### Scenario: Duplicate name validation
- **WHEN** user enters a name that already exists in another schema field
- **THEN** the Save button SHALL be disabled
