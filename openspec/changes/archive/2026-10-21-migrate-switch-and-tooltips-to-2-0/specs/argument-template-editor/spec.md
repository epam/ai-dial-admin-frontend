## MODIFIED Requirements

### Requirement: Value editor is type-aware in Constant mode

The value editor rendered for a field in Constant mode SHALL match the field's schema type.

#### Scenario: String field shows text input
- **WHEN** a string-typed field is in Constant mode
- **THEN** the value editor SHALL be a text input

#### Scenario: Number/integer field shows number input
- **WHEN** an integer or number-typed field is in Constant mode
- **THEN** the value editor SHALL be a number input

#### Scenario: Boolean field shows toggle/switch
- **WHEN** a boolean-typed field is in Constant mode
- **THEN** the value editor SHALL be a `Switch` or checkbox control

#### Scenario: Object/array field shows truncated JSON preview with edit button
- **WHEN** an object or array-typed field is in Constant mode
- **THEN** the value cell SHALL display a truncated JSON string preview (e.g. `{ "key": ...}`) and an edit icon button
- **AND** clicking the edit button SHALL open a `DialPopup` containing a Monaco JSON editor pre-populated with the current value
- **AND** the popup SHALL have "Apply" and "Cancel" actions
- **AND** clicking "Apply" with valid JSON SHALL close the popup and update `argumentTemplate.arguments[fieldName]`
- **AND** clicking "Apply" with invalid JSON SHALL show an inline error in the popup and keep it open
- **AND** clicking "Cancel" SHALL close the popup without changes

### Requirement: JSON editor toggle switches to raw argumentTemplate editing

A `Switch` labeled "JSON Editor" in the ArgumentTemplate section header SHALL toggle between table view and a Monaco JSON editor editing `argumentTemplate.arguments` directly.

#### Scenario: JSON toggle switches to Monaco editor
- **WHEN** user toggles "JSON Editor" on
- **THEN** the table SHALL be hidden
- **AND** a Monaco JSON editor SHALL appear with the current `argumentTemplate.arguments` serialized as pretty-printed JSON

#### Scenario: JSON editor changes update argumentTemplate
- **WHEN** user edits the JSON in the Monaco editor and the JSON is valid
- **THEN** `argumentTemplate.arguments` SHALL be updated on valid JSON parse

#### Scenario: JSON editor with invalid JSON blocks table switch
- **WHEN** the Monaco editor contains invalid JSON
- **THEN** the user SHALL NOT be able to toggle back to table view
- **AND** the toggle SHALL remain in JSON editor mode
- **AND** an error message SHALL be displayed

#### Scenario: Switching from JSON to table re-derives table rows
- **WHEN** user toggles "JSON Editor" off with valid JSON
- **THEN** the table rows SHALL reflect the current `argumentTemplate.arguments` values
- **AND** mode (Binding/Constant) for each field SHALL be inferred: values matching `${{...}}` pattern are Binding, all other values are Constant
