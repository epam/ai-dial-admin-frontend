# Argument Template Editor

## Purpose

Defines the UI for editing `argumentTemplate` on MCP_TOOL test suites. The editor is table-based (one row per tool input field from `toolRef.inputSchema`) with a JSON editor toggle as an escape hatch for raw editing.

## ADDED Requirements

### Requirement: MCP method tab shows Argument Template editor

The Method tab of an MCP_TOOL test suite SHALL show an `ArgumentTemplate` section in place of the `RequestTemplate` and `EndpointSchema` sections. The section title is "Argument Template" and includes a JSON editor toggle.

#### Scenario: MCP method tab renders ArgumentTemplate for MCP_TOOL suite
- **WHEN** user opens the Method tab of an `MCP_TOOL` test suite
- **THEN** the system SHALL render `McpMethodContent` containing:
  - A tool call header with deployment name and tool name
  - "Change Toolset / Tool" button
  - `ArgumentTemplate` section
  - Tool Output Schema section (read-only, from `toolRef.outputSchema`)

#### Scenario: DEPLOYMENT suite method tab is unchanged
- **WHEN** user opens the Method tab of a `DEPLOYMENT` test suite
- **THEN** the existing `RequestTemplate` + `EndpointSchema` components SHALL render unchanged

### Requirement: Argument table rows driven by toolRef.inputSchema

The `ArgumentTemplate` table SHALL have one row per property in `toolRef.inputSchema.properties`. Rows are non-reorderable and non-addable (schema defines the available arguments).

#### Scenario: Table renders one row per schema property
- **WHEN** `toolRef.inputSchema.properties` contains N properties
- **THEN** the table SHALL render exactly N rows
- **AND** each row SHALL display: argument name, type badge, mode control, value editor

#### Scenario: Table renders empty state when no schema properties
- **WHEN** `toolRef.inputSchema.properties` is empty or absent
- **THEN** the table SHALL render a "No arguments defined" empty state message
- **AND** the JSON editor toggle SHALL still be available

#### Scenario: Type badge shows property type
- **WHEN** a schema property has `type: "string"`
- **THEN** the row SHALL display a "string" type badge using the theme's success color tokens
- **AND** `integer`/`number` types SHALL use warning color tokens
- **AND** `boolean` types SHALL use accent-tertiary color tokens
- **AND** `object`/`array` types SHALL use secondary color tokens

### Requirement: Per-field Binding/Constant mode toggle

Each argument row SHALL have a mode toggle (Binding or Constant). The selected mode determines how the field's value is stored in `argumentTemplate.arguments`.

#### Scenario: Binding mode stores template placeholder
- **WHEN** a field is in Binding mode and the user selects test case schema field `queryField`
- **THEN** `argumentTemplate.arguments[fieldName]` SHALL be set to `"${{queryField}}"`

#### Scenario: Binding mode with default value stores placeholder with default
- **WHEN** a field is in Binding mode, bound to column `queryField`, and `toolRef.inputSchema.properties[fieldName].default` exists with value `"hello"`
- **THEN** `argumentTemplate.arguments[fieldName]` SHALL be set to `"${{queryField:hello}}"`

#### Scenario: Constant mode stores literal value
- **WHEN** a field is in Constant mode with user-entered value `10`
- **THEN** `argumentTemplate.arguments[fieldName]` SHALL be set to the literal value `10` (number, not string)

#### Scenario: Object and array fields are forced to Constant mode
- **WHEN** a schema property has `type: "object"` or `type: "array"`
- **THEN** the mode control for that row SHALL NOT render a Binding/Constant toggle
- **AND** SHALL render a static "Constant" label
- **AND** the field SHALL always behave as Constant mode

#### Scenario: Switching from Binding to Constant clears binding
- **WHEN** user switches a field from Binding to Constant mode
- **THEN** the binding column selection SHALL be cleared
- **AND** `argumentTemplate.arguments[fieldName]` SHALL be set to an empty value appropriate for the type

#### Scenario: Switching from Constant to Binding clears constant value
- **WHEN** user switches a field from Constant to Binding mode
- **THEN** the constant value input SHALL be cleared
- **AND** `argumentTemplate.arguments[fieldName]` SHALL be set to `"${{}}"`  (empty placeholder, user must select column)

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
- **THEN** the value editor SHALL be a `DialSwitch` or checkbox control

#### Scenario: Object/array field shows inline Monaco editor
- **WHEN** an object or array-typed field is in Constant mode
- **THEN** the value editor SHALL be an inline Monaco JSON editor (compact height)
- **AND** invalid JSON in the editor SHALL show an inline error indicator

### Requirement: Binding mode value editor is a column selector

When a field is in Binding mode, the value editor SHALL be a dropdown/select allowing the user to pick from the test suite's `testCaseSchema` field names.

#### Scenario: Column selector lists testCaseSchema fields
- **WHEN** a field is in Binding mode
- **THEN** the value editor SHALL be a select/dropdown
- **AND** its options SHALL be the field names from `testSuite.testCaseSchema`

#### Scenario: Empty testCaseSchema shows placeholder in column selector
- **WHEN** `testSuite.testCaseSchema` is empty
- **THEN** the column selector SHALL show a placeholder "No schema fields defined"
- **AND** the selector SHALL be disabled

### Requirement: JSON editor toggle switches to raw argumentTemplate editing

A `DialSwitch` labeled "JSON Editor" in the ArgumentTemplate section header SHALL toggle between table view and a Monaco JSON editor editing `argumentTemplate.arguments` directly.

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

### Requirement: Required fields are visually indicated

Fields marked `required` in `toolRef.inputSchema.required` array SHALL be visually distinguished in the table.

#### Scenario: Required field marked with asterisk
- **WHEN** a schema property name appears in `toolRef.inputSchema.required`
- **THEN** the argument name in the table row SHALL display a `*` suffix or required indicator

#### Scenario: Required binding field with no column selected shows warning
- **WHEN** a required field is in Binding mode with no column selected
- **THEN** the row SHALL display a warning indicator
- **AND** the suite's `isValid` reflects this (managed by backend validation on save)

### Requirement: Tool output schema displayed read-only

Below the ArgumentTemplate section, the Method tab for MCP suites SHALL show the tool's output schema as a read-only Monaco JSON viewer.

#### Scenario: Output schema section shows when toolRef has outputSchema
- **WHEN** `toolRef.outputSchema` is present and non-empty
- **THEN** the "Tool Output Schema" section SHALL render a read-only Monaco viewer with the schema JSON

#### Scenario: Output schema section hidden when absent
- **WHEN** `toolRef.outputSchema` is absent or null
- **THEN** the "Tool Output Schema" section SHALL NOT render
