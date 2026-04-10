## ADDED Requirements

### Requirement: App Route Display Name restricted to alphanumeric and underscore
The Display Name field for App Routes SHALL only accept characters matching `^[a-zA-Z0-9_]+$` (uppercase and lowercase letters, digits, and underscore). Any other character is forbidden.

#### Scenario: Valid name accepted
- **WHEN** the user enters a name containing only letters, digits, and underscores (e.g. `my_Route_1`)
- **THEN** no validation error is shown and the form is valid

#### Scenario: Name with forbidden character shows error
- **WHEN** the user enters a name containing a character outside `[a-zA-Z0-9_]` (e.g. `my-route`, `route@1`, `route name`)
- **THEN** the Display Name field is highlighted as invalid
- **THEN** the error message "Field must not contain forbidden characters. Only alphanumeric characters and underscore are allowed." is displayed

#### Scenario: Error clears after correction
- **WHEN** the user has an invalid name showing an error
- **AND** the user changes the value to a valid name
- **THEN** the error message disappears and the field is no longer highlighted as invalid

#### Scenario: Save is blocked while name is invalid
- **WHEN** the Display Name field contains a forbidden character
- **THEN** the Save button is disabled

### Requirement: App Route Display Name validation applies in both create and edit flows
The alphanumeric + underscore constraint SHALL be enforced in both the Create Route modal and the Route Properties edit panel.

#### Scenario: Create modal blocks submission with invalid name
- **WHEN** the user opens the Create Route modal
- **AND** enters a name with a forbidden character
- **THEN** the Create button is disabled and the error message is shown

#### Scenario: Edit panel marks invalid name on load
- **WHEN** an existing App Route has a name containing forbidden characters
- **AND** the user opens the Route Properties panel
- **THEN** the Display Name field is shown as invalid with the error message on initial render

### Requirement: Duplicate name check is preserved for App Routes
The Display Name field SHALL still reject names that duplicate an existing App Route name on the same entity.

#### Scenario: Duplicate name shows existing-name error
- **WHEN** the user enters a name already used by another App Route
- **THEN** the "Display name already exists" error is shown

### Requirement: Length constraints are preserved for App Routes
The Display Name field SHALL still enforce minimum length of 2 and maximum length of 255 characters.

#### Scenario: Name too short shows length error
- **WHEN** the user enters a single character
- **THEN** the length error is shown

#### Scenario: Name at minimum length is valid
- **WHEN** the user enters exactly 2 valid characters (e.g. `ab`)
- **THEN** no error is shown
