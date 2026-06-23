## ADDED Requirements

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
- **WHEN** a row is schema-derived
- **THEN** the Type column shows the type defined in the schema regardless of the actual value

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

#### Scenario: Schema row type selector is read-only
- **WHEN** a user views a schema-derived row
- **THEN** the type selector shows the schema type and cannot be changed

### Requirement: Save path uses applicationProperties directly
Server actions SHALL use `applicationProperties: Record<string, unknown>` directly when saving. No `applicationPropertiesTemp` conversion step SHALL exist in any save path.

#### Scenario: Saved entity contains no applicationPropertiesTemp field
- **WHEN** the user saves an application with properties set via the table
- **THEN** the entity sent to the server contains `applicationProperties` with the correct key-value pairs and does NOT contain an `applicationPropertiesTemp` field
