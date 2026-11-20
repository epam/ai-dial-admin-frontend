# app-properties-table-editing Specification

## Purpose
Table-view editing of an application's `applicationProperties` on the Parameters tab: how display rows
are derived from the stored map plus the App Runner's schema, which of them are editable, how a key is
committed and validated, and what the save path sends. Schema-derived rows are read-only in key and
type; user-added rows are fully editable.
## Requirements
### Requirement: Display rows derived from applicationProperties and scheme
The table SHALL derive display rows at render time from `applicationProperties: Record<string, unknown>` and `schemeProperties: ApplicationPropertyRow[]`. Schema-derived rows SHALL appear first (in schema order), followed by user-added rows in insertion order. No intermediate temp structure SHALL be stored on the entity model.

#### Scenario: Schema rows render before user rows
- **WHEN** an application has both schema-defined properties and user-added properties
- **THEN** schema-derived rows appear at the top of the table, followed by user-added rows in the order they were added

#### Scenario: Type inferred from value for user-added rows
- **WHEN** a user-added row has a value of type string
- **THEN** the Type column shows "String"

#### Scenario: Type inferred as object for null or undefined values
- **WHEN** a user-added row has a null or undefined value
- **THEN** the Type column shows "Object"

#### Scenario: Schema row type comes from schema
- **WHEN** a row is schema-derived and its schema allows a single type
- **THEN** the Type column shows that type regardless of the actual value

#### Scenario: Multi-type schema row shows the type matching its value
- **WHEN** a row is schema-derived and its `anyOf` / `oneOf` allows several types (for example `object` and `string`)
- **THEN** the Type column shows the allowed type matching the current value, or the first allowed type when there is no value
- **AND** the value cell uses the editor for that type (a JSON editor for `object`, a text input for `string`)

#### Scenario: Multi-type schema row offers only its allowed types
- **WHEN** a user opens the Type selector of a multi-type schema row
- **THEN** it lists exactly the types the schema allows, and `null` is not offered

#### Scenario: Switching a multi-type schema row resets the value
- **WHEN** a user picks another allowed type on a multi-type schema row
- **THEN** the value is reset to the default for that type and the row keeps its position and its key

### Requirement: Add row guarded against duplicate empty-key rows
Clicking Add SHALL add a new empty-key row only if no empty-key row already exists. Subsequent Add clicks while an empty-key row is present SHALL be ignored silently.

#### Scenario: First Add creates an empty row
- **WHEN** no empty-key row exists and the user clicks Add
- **THEN** a new row appears at the bottom of the user-added rows with an empty key field and an empty string value

#### Scenario: Second Add ignored while empty row exists
- **WHEN** an empty-key row already exists in the table and the user clicks Add again
- **THEN** no additional empty row is created

### Requirement: Key editing committed on blur
The key cell for user-added rows SHALL use an on-blur renderer. Intermediate keystrokes SHALL NOT propagate to the parent or trigger grid refresh. The key value SHALL be committed to `applicationProperties` only when the input loses focus.

#### Scenario: Key committed on blur with valid value
- **WHEN** a user types a non-empty, non-duplicate key in a key cell and moves focus away
- **THEN** the key is saved, the row retains its position in the table, and the value is preserved

#### Scenario: Draft characters visible during typing
- **WHEN** a user is typing in a key cell
- **THEN** the typed characters are visible in the cell before blur

### Requirement: Empty key blocks save
An empty key field SHALL prevent the form from being saved. The save button SHALL remain blocked as long as any key is empty.

#### Scenario: Save blocked with empty key
- **WHEN** a row has an empty key field
- **THEN** the save action is blocked and cannot be submitted

#### Scenario: Save unblocked after key entered
- **WHEN** all key fields have non-empty values
- **THEN** the save action is available

### Requirement: Duplicate key shows inline error and blocks save
If the user enters a key that already exists in the table (either from the schema or another user-added row), an inline error SHALL be shown in the key cell and the save action SHALL be blocked.

#### Scenario: Duplicate key inline error on blur
- **WHEN** a user enters a key that matches an existing row's key and moves focus away
- **THEN** an inline error message is shown in the key cell

#### Scenario: Duplicate key blocks save
- **WHEN** a key cell contains a value that duplicates another row's key
- **THEN** the save action is blocked

#### Scenario: Error clears when key is made unique
- **WHEN** a user corrects a duplicate key to a unique value and blurs the cell
- **THEN** the inline error is removed and save is unblocked (assuming no other issues)

### Requirement: Type change resets value to type default
When the user changes the Type selector for a user-added row, the value SHALL be reset to the default for the new type. Changing type SHALL NOT change the row's position in the table.

#### Scenario: Switching to number resets value to 0
- **WHEN** a user changes the type selector from "String" to "Number"
- **THEN** the value cell shows `0` and the row remains in its current position

#### Scenario: Switching to boolean resets value to false
- **WHEN** a user changes the type selector to "Boolean"
- **THEN** the value cell shows a boolean selector defaulting to `false`

#### Scenario: Switching to object resets value to empty object
- **WHEN** a user changes the type selector to "Object"
- **THEN** the value cell shows a JSON editor with an empty object `{}`

### Requirement: Row removal preserves ordering of remaining rows
Removing a user-added row SHALL remove it from `applicationProperties` and from the ordered key list. The positions of remaining rows SHALL NOT change.

#### Scenario: Remove middle row preserves surrounding order
- **WHEN** a user removes a row that is not the first or last user-added row
- **THEN** the rows above and below it retain their relative positions

### Requirement: Key rename preserves row position
When a user renames a key of a user-added row (enters a new valid key on blur), the row SHALL remain at the same position in the table. The old key SHALL be removed from `applicationProperties` and the new key added with the same value.

#### Scenario: Renamed key stays in same position
- **WHEN** a user edits a key cell and blurs with a valid new key
- **THEN** the row stays at its current index in the user-added rows section

### Requirement: Discard resets table state
When the parent triggers a discard (via `discardKey` change), `TableView` SHALL reinitialise its `orderedUserKeys` from the reset `applicationProperties` and clear any pending-row state.

#### Scenario: Discard removes pending empty row
- **WHEN** the user has an unsaved empty-key row and discards all changes
- **THEN** the empty-key row is removed and the table reflects the original saved state

### Requirement: Schema rows are read-only for key and type
Schema-derived rows SHALL NOT render an editable key cell or an editable type selector. Their key and type are fixed by the schema.

#### Scenario: Schema row key is not editable
- **WHEN** a user views a schema-derived row
- **THEN** the key cell is displayed as plain text, not an input field

#### Scenario: Schema row type selector is limited to the schema
- **WHEN** a user views a schema-derived row with a single allowed type
- **THEN** the type selector shows only that type
- **AND** a row whose schema allows several types lets the user choose among those types only

### Requirement: Save path uses applicationProperties directly
Server actions SHALL use `applicationProperties: Record<string, unknown>` directly when saving. No `applicationPropertiesTemp` conversion step SHALL exist in any save path.

#### Scenario: Saved entity contains no applicationPropertiesTemp field
- **WHEN** the user saves an application with properties set via the table
- **THEN** the entity sent to the server contains `applicationProperties` with the correct key-value pairs and does NOT contain an `applicationPropertiesTemp` field

### Requirement: Asset-origin runner preset parameters are treated as schema rows
The table's schema-derived rows SHALL be built from an Asset-origin App Runner's Core-resolved
schema, the same way they are built from the admin-BE-resolved schema for other runners, when the
application's currently-selected App Runner is Asset-origin (see the Parameters-tab
scheme-resolution requirement in `platform-app-runners`). A parameter contributed by an Asset-origin
runner's resolved schema is therefore a schema row, not a user-added row: it renders read-only
key/type and hides the Remove action, per the existing "Schema rows are read-only for key and type"
requirement.

#### Scenario: Preset parameter from an Asset-origin runner cannot be removed
- **WHEN** a user opens the Parameters Table view of an application whose selected App Runner was
  created through `Assets > App Runners` and defines a configuration schema
- **THEN** each parameter contributed by that schema appears as a schema row
- **AND** its row's Remove action is hidden, matching schema rows from admin-BE-origin runners

#### Scenario: A user-added parameter on the same application remains removable
- **WHEN** the same application also has a user-added parameter not defined by the runner's schema
- **THEN** that row's Remove action remains available

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

