## MODIFIED Requirements

### Requirement: File-upload button is a peer of the Value input, not absolutely positioned

The file-upload button SHALL be rendered as a real flex sibling of the Value input inside the row's Value grid cell. It SHALL NOT use `position: absolute` for placement, and the Value cell SHALL NOT reserve right-side padding to make room for it.

#### Scenario: File-upload button visible next to the Value input
- **WHEN** any variable row is rendered at a viewport width ≥ 1024 px
- **THEN** the file-upload `OutlinedButton` SHALL be rendered immediately to the right of the Value input within the same grid cell, with a small (~8 px) gap between them

#### Scenario: File-upload triggers file selection and updates the variable value
- **WHEN** the user clicks the file-upload button in a variable row and selects a file
- **THEN** the variable's value SHALL be updated to a file-typed value containing the selected file's name and base64-encoded content

#### Scenario: Value cell shows file chip for file-typed values without stretching the row
- **WHEN** a variable's value is file-typed
- **THEN** the Value cell SHALL render the `ValueFile` chip with file name and a remove control, and the chip SHALL NOT cause the other cells in the row to grow vertically beyond the input row track

### Requirement: File-upload button is rendered inside the Value cell, aligned with the input/pill row

The `FileButton` SHALL be rendered as a direct flex sibling of the input/pill *inside* the `Value` component's own column, not as a flex sibling of `Value` itself. The inner row containing the input/pill and the file-upload button SHALL use cross-axis alignment `items-start`. Because the `Value` component renders the field's label (when present) *above* the inner row — not inside `DialInput` / `ValueFile` — the top edge of the inner row is the input/pill's top edge. As a result, the file-upload button's top edge SHALL stay aligned with the input/pill's top edge regardless of whether the field component renders a validation error caption below the input/pill.

#### Scenario: File-upload button stays aligned with the file pill when an error caption is shown

- **WHEN** a variable row holds a file-typed value whose `fileName` fails validation and the field component renders the inline error caption below the file pill, at any viewport width
- **THEN** the file-upload `OutlinedButton`'s `getBoundingClientRect().top` SHALL equal the file pill's `getBoundingClientRect().top` (within 1 px tolerance)

#### Scenario: File-upload button stays aligned with the text input regardless of mount type

- **WHEN** a variable row holds a simple text value (secure or non-secure) at any viewport width
- **THEN** the file-upload `OutlinedButton`'s `getBoundingClientRect().top` SHALL equal the value input's `getBoundingClientRect().top` (within 1 px tolerance)

#### Scenario: Field component continues to own its error caption

- **WHEN** any inline validation error is shown for the Value (file pill)
- **THEN** the error caption SHALL be rendered by the field component itself (`ValueFile`'s `DialErrorText`); the `Value` component and the `Variable` row SHALL NOT render an external `DialErrorText` for the field
