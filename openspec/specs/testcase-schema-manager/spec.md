## ADDED Requirements

### Requirement: Schema panel toggle
The Test Cases tab header SHALL display a toggle button that shows/hides the Test Case Schema Manager panel. The button SHALL use a recognizable icon (settings or columns) and ghost appearance consistent with existing header buttons.

#### Scenario: Toggle schema panel open
- **WHEN** user clicks the schema toggle button and the panel is hidden
- **THEN** the schema manager panel SHALL appear above the test cases grid

#### Scenario: Toggle schema panel closed
- **WHEN** user clicks the schema toggle button and the panel is visible
- **THEN** the schema manager panel SHALL collapse and hide

#### Scenario: Panel state does not persist across navigation
- **WHEN** user navigates away from the Test Cases tab and returns
- **THEN** the schema panel SHALL be collapsed by default

### Requirement: Schema fields grid display
The schema manager panel SHALL display an ag-grid listing all `testCaseSchema` fields with columns: Name, Type, Required, Description. Each row SHALL have Edit and Remove action columns.

#### Scenario: Display existing schema fields
- **WHEN** the schema panel is open and the test suite has `testCaseSchema` with fields
- **THEN** the grid SHALL display one row per schema field showing name, type (lowercase), required (boolean), and description

#### Scenario: Empty schema
- **WHEN** the schema panel is open and `testCaseSchema` is empty or undefined
- **THEN** the grid SHALL display an empty state message

### Requirement: Add schema field
The schema manager panel SHALL have an Add button that creates a new blank schema field and opens the edit panel for it.

#### Scenario: Add new field
- **WHEN** user clicks the Add button
- **THEN** a new field with empty name, type STRING, required false, and empty description SHALL be appended to the schema array
- **AND** the edit panel SHALL open for this new field with the Name input focused and editable

#### Scenario: Add button disabled during invalid edit
- **WHEN** the edit panel is open and has validation errors (empty name)
- **THEN** the Add button SHALL be disabled

### Requirement: Edit schema field
Clicking the Edit action on a schema field row SHALL open the inline edit panel below the grid.

#### Scenario: Open edit panel for existing field
- **WHEN** user clicks Edit on a schema field row
- **THEN** the edit panel SHALL appear below the grid with the field's current values populated
- **AND** the Name input SHALL be disabled (read-only)

#### Scenario: Edit field properties
- **WHEN** user modifies Type, Required, or Description in the edit panel and clicks Save
- **THEN** the schema field SHALL be updated in the `testCaseSchema` array
- **AND** the edit panel SHALL close
- **AND** the parent `onChange` SHALL be called with the updated test suite

#### Scenario: Cancel edit
- **WHEN** user clicks Cancel in the edit panel
- **THEN** the edit panel SHALL close without modifying the schema

### Requirement: Edit panel form fields
The edit panel SHALL contain: Name (text input), Type (dropdown select), Required (checkbox), Description (text input). All user-facing labels SHALL be internationalized.

#### Scenario: Type dropdown options
- **WHEN** the edit panel is displayed
- **THEN** the Type dropdown SHALL offer options: STRING, NUMBER, BOOLEAN, OBJECT, ARRAY, FILE matching the `TestCaseItemType` enum

#### Scenario: Save validation
- **WHEN** the Name field is empty
- **THEN** the Save button SHALL be disabled

#### Scenario: Duplicate name validation
- **WHEN** user enters a name that already exists in another schema field
- **THEN** the Save button SHALL be disabled

### Requirement: Remove schema field
Clicking the Remove action on a schema field row SHALL remove it from the schema array.

#### Scenario: Remove field
- **WHEN** user clicks Remove on a schema field row
- **THEN** the field SHALL be removed from the `testCaseSchema` array
- **AND** the parent `onChange` SHALL be called with the updated test suite
- **AND** if the edit panel was open for the removed field, it SHALL close

### Requirement: Schema changes persisted via test suite save
Schema modifications SHALL NOT be sent to the backend immediately. They SHALL be included in the `testCaseSchema` property when the user saves the test suite via the existing Save button.

#### Scenario: Save with schema changes
- **WHEN** user modifies schema fields and clicks the test suite Save button
- **THEN** the `updateTestSuite` API call SHALL include the updated `testCaseSchema` array

#### Scenario: Discard schema changes
- **WHEN** user modifies schema fields but navigates away without saving
- **THEN** schema changes SHALL be discarded (not persisted)

### Requirement: Accessibility
All interactive elements in the schema manager SHALL be keyboard-accessible and have appropriate aria labels.

#### Scenario: Keyboard navigation
- **WHEN** user navigates the schema panel using keyboard (Tab, Enter, Escape)
- **THEN** focus SHALL move logically through toggle button, grid rows, edit panel fields, and action buttons

#### Scenario: Screen reader support
- **WHEN** a screen reader encounters the schema panel
- **THEN** the toggle button, grid, and form fields SHALL have descriptive labels
