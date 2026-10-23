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
- **AND** clicking the edit button SHALL open a `Popup` containing a Monaco JSON editor pre-populated with the current value
- **AND** the popup SHALL have "Apply" and "Cancel" actions
- **AND** clicking "Apply" with valid JSON SHALL close the popup and update `argumentTemplate.arguments[fieldName]`
- **AND** clicking "Apply" with invalid JSON SHALL show an inline error in the popup and keep it open
- **AND** clicking "Cancel" SHALL close the popup without changes
