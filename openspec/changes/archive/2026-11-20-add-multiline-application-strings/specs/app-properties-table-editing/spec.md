## ADDED Requirements

### Requirement: String parameter values support inline and multiline editing

For a named string row in the Parameters Table, whether user-added or schema-derived, the system SHALL show a string value control with an accessible action to open a multiline editor when the user can edit the table. A single-line value SHALL remain editable inline and each edit SHALL update the application draft without a full grid refresh. A value containing a line break SHALL appear as a non-editable inline preview; opening the editor SHALL expose the complete value for editing. A pending empty-key row and non-string rows SHALL retain their existing behavior.

#### Scenario: Edit a single-line value inline
- **WHEN** a user edits a named string parameter whose current value has no line break
- **THEN** the input reflects the edit and the application draft contains the updated string
- **AND** the edited row retains its position and focus

#### Scenario: Edit a multiline value in the popup
- **WHEN** a named string parameter contains multiple lines
- **THEN** the inline value is a non-editable preview with an action to open the multiline editor
- **AND** opening the editor presents the complete current string, not a truncated or flattened preview

#### Scenario: Multiline editor fills its available space
- **WHEN** a user opens the multiline editor
- **THEN** the textarea fills the popup's available body height while the popup remains bounded and its header and footer remain accessible

#### Scenario: A multiline value becomes single-line
- **WHEN** a user applies a popup edit that removes every line break
- **THEN** the resulting value is editable inline

#### Scenario: Schema-derived string supports the same editor
- **WHEN** a schema-derived row's active type is string and the user can edit the table
- **THEN** the row uses the same inline and popup string editor as a user-added string row
- **AND** its key and allowed types remain governed by the schema

#### Scenario: Read-only access prevents edits
- **WHEN** a read-only administrator views a string parameter
- **THEN** the table does not allow inline or popup edits to the value

#### Scenario: Number and pending-key rows retain existing behavior
- **WHEN** a row has a number value or is a pending row with an empty key
- **THEN** it does not use the new string editor

### Requirement: Multiline popup edits are staged and preserve string content

The multiline editor SHALL start with the current raw string and maintain a separate draft. Apply SHALL update the application's property draft with the entered string; Cancel, Escape, or closing the popup SHALL discard popup edits. Opening and applying without editing SHALL preserve the original string, including its original line endings. Applying a changed draft SHALL preserve its logical line breaks, leading and trailing whitespace, indentation, and blank lines; the system need not preserve CRLF versus LF representation after editing. The editor SHALL treat content as an arbitrary string and SHALL NOT parse, validate, or automatically format it as YAML or another structured language. Empty strings SHALL be accepted by the popup; existing required-field indication SHALL continue to apply. Applying or canceling SHALL NOT itself produce a success or error notification or persist the application.

#### Scenario: Apply multiline text
- **WHEN** a user enters text with indentation, blank lines, trailing spaces, and a trailing newline in the popup and selects Apply
- **THEN** the application draft holds that string with the logical line breaks and whitespace intact
- **AND** the popup closes without saving the application or showing a notification

#### Scenario: Cancel or close discards edits
- **WHEN** a user changes the popup draft and selects Cancel, presses Escape, or closes the popup
- **THEN** the previously committed application draft value remains unchanged
- **AND** reopening the popup shows that committed value

#### Scenario: Applying without editing preserves original line endings
- **WHEN** a string contains CRLF line endings and the user opens the popup and applies without changing it
- **THEN** the application draft retains the original string including its CRLF line endings

#### Scenario: Arbitrary non-YAML text is accepted
- **WHEN** a user applies a string that is not valid YAML
- **THEN** the text is accepted unchanged without YAML validation or automatic formatting

#### Scenario: Empty string and required indication
- **WHEN** a user clears the popup and selects Apply
- **THEN** the value becomes the empty string
- **AND** a required row retains its existing empty-value indication

### Requirement: Application save receives the edited string

The table SHALL write the applied string into the existing property map without converting it into an object. The existing application Save and Discard flow SHALL remain authoritative. Entity applications use `applicationProperties`; asset applications use `application_properties` through their existing backend mappings. This change SHALL NOT introduce a new API contract.

#### Scenario: Save a multiline string
- **WHEN** a user applies a multiline string and saves the application
- **THEN** the existing save path receives the string in the appropriate application property map, retaining its logical line breaks and whitespace

#### Scenario: Discard an applied popup edit
- **WHEN** a user applies a popup edit and then discards application changes
- **THEN** the table returns to the previously saved property value

#### Scenario: Editing one row does not change another
- **WHEN** a user applies a multiline edit to one string row and then opens another row
- **THEN** only the edited row's property has changed and the other popup shows its own current value
