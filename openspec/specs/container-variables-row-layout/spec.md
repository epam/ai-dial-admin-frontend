## Purpose

Define the visual layout, alignment, label placement, drag-and-drop behavior, validation-state rendering, and responsive (mobile vs lg+) structure of an Environment Variables row in the deployment container view. The capability covers Name, Description, Value (text and file), Mount type, file-upload button, drag-grip, trash button, and the surrounding list-level header.

## Requirements

### Requirement: Variable row fields share a single horizontal alignment axis at lg+ viewports

At viewport widths of `lg` (≥ 1024px) and above, every editable control in a variable row (Name input, Description input, Value control, file-upload button, Mount type select, delete button) SHALL have its top edge on the same y-coordinate as the corresponding control in every other variable row. The y-coordinate SHALL be determined by the list-level grid, not by the internal label-to-input spacing of any individual ui-kit component.

#### Scenario: Single variable row with text Value at desktop width
- **WHEN** the user opens a container's Environment Variables section at a viewport width ≥ 1024px and adds one variable with a text Value
- **THEN** the Name input, Description input, Value text input, file-upload button, and Mount type select SHALL all have the same `getBoundingClientRect().top` value (within 1 px tolerance)

#### Scenario: Multiple variables align across rows
- **WHEN** the user has added at least two variables at a viewport width ≥ 1024 px
- **THEN** the Name input of row N SHALL share the same column track as the Name input of every other row, and the same SHALL hold for Description, Value (with file-upload), and Mount type (with trash) columns

#### Scenario: Mount type select aligns with text inputs in the same row
- **WHEN** any variable row is rendered at a viewport width ≥ 1024 px
- **THEN** the Mount type `DialSelectField` control SHALL have the same top y-coordinate as the Name input in the same row (regression test for the 6 px drift in issue #3223)

### Requirement: Column labels render once per list

At viewport widths of `lg` and above, the labels "Variable Name", "Description", "Value", and "Mount type" SHALL be rendered exactly once for the entire Environment Variables list — in a dedicated header row above the first variable row — and SHALL NOT be repeated per variable.

#### Scenario: Header row visible with at least one variable
- **WHEN** the Environment Variables section contains one or more variables at a viewport width ≥ 1024 px
- **THEN** the DOM SHALL contain exactly one element labeled "Variable Name", one labeled "Description", one labeled "Value", and one labeled "Mount type" within the variables list region

#### Scenario: Header row absent when list is empty
- **WHEN** the Environment Variables section contains zero variables
- **THEN** the column header row SHALL NOT be rendered

#### Scenario: Header row hidden on mobile
- **WHEN** the viewport width is less than 1024 px
- **THEN** the column header row SHALL NOT be rendered; each variable SHALL render its own collapsible header with the existing mobile layout

#### Scenario: Name header label aligned with Name input
- **WHEN** the column header row is visible
- **THEN** the "Variable Name" header label SHALL be positioned over the Name input (offset from the column's left edge by the width of the drag handle plus the in-cell gap), not over the drag handle

### Requirement: Drag handle remains the only drag source

For each variable row at viewport widths of `lg` and above, the drag handle (grip icon) SHALL be rendered as the first interactive element in the row, paired with the Name input inside the row's leading grid cell. Dragging SHALL be initiated only from the grip element; the rest of the row SHALL accept drops but not initiate drags.

#### Scenario: Grip element initiates drag
- **WHEN** the user presses and drags the grip element of a variable row
- **THEN** the row SHALL enter a dragging state (opacity reduced) and SHALL reorder when dropped onto another row's drop area

#### Scenario: Non-grip elements do not initiate drag
- **WHEN** the user presses and drags any element other than the grip element within a variable row
- **THEN** no drag SHALL be initiated

#### Scenario: Reorder by dropping
- **WHEN** a dragged row hovers over another variable row
- **THEN** the hovered row's index SHALL be passed to the `moveColumn` callback so the list reorders consistently with the prior behavior

### Requirement: File-upload button is a peer of the Value input, not absolutely positioned

The file-upload button SHALL be rendered as a real flex sibling of the Value input inside the row's Value grid cell. It SHALL NOT use `position: absolute` for placement, and the Value cell SHALL NOT reserve right-side padding to make room for it.

#### Scenario: File-upload button visible next to the Value input
- **WHEN** any variable row is rendered at a viewport width ≥ 1024 px
- **THEN** the file-upload `DialNeutralButton` SHALL be rendered immediately to the right of the Value input within the same grid cell, with a small (~8 px) gap between them

#### Scenario: File-upload triggers file selection and updates the variable value
- **WHEN** the user clicks the file-upload button in a variable row and selects a file
- **THEN** the variable's value SHALL be updated to a file-typed value containing the selected file's name and base64-encoded content

#### Scenario: Value cell shows file chip for file-typed values without stretching the row
- **WHEN** a variable's value is file-typed
- **THEN** the Value cell SHALL render the `ValueFile` chip with file name and a remove control, and the chip SHALL NOT cause the other cells in the row to grow vertically beyond the input row track

### Requirement: Trash button paired with Mount type cell at lg+ viewports

At viewport widths of `lg` and above, the trash (delete-row) button SHALL be rendered as a flex sibling of the Mount type select inside the row's trailing grid cell. It SHALL always be visible within the form's content area, including at the minimum supported desktop width.

#### Scenario: Trash visible at minimum desktop width
- **WHEN** the viewport width is exactly 1024 px and at least one variable exists
- **THEN** the trash button SHALL be fully within the viewport (not clipped on the right edge of the form content area)

#### Scenario: Trash removes the correct variable
- **WHEN** the user clicks the trash button on row N
- **THEN** the variable at index N SHALL be removed from the list

### Requirement: Consistent visual rhythm of gaps at lg+ viewports

At viewport widths of `lg` and above, the gaps between elements in the variable row SHALL follow a consistent visual rhythm: a small (~8 px) gap between elements that belong together (drag handle ↔ Name input, Value input ↔ file-upload button, Mount type select ↔ trash button), and a larger (~16 px) gap between independent logical groups. Vertical row gap SHALL be ~4 px between the header row and the first variable row, and ~8 px between consecutive variable rows.

#### Scenario: Intra-pair horizontal gaps
- **WHEN** a variable row is rendered at a viewport width ≥ 1024 px
- **THEN** the gap between drag handle and Name input, between Value input and file-upload button, and between Mount type select and trash button SHALL each be ~8 px (within 2 px tolerance)

#### Scenario: Inter-group horizontal gaps
- **WHEN** a variable row is rendered at a viewport width ≥ 1024 px
- **THEN** the gap between the Name cell and the Description cell, between Description and Value, and between Value-with-file-button and Mount-with-trash SHALL each be ~16 px (within 2 px tolerance)

#### Scenario: Vertical row gaps
- **WHEN** at least two variables exist at a viewport width ≥ 1024 px
- **THEN** the vertical gap between the header row and the first variable row SHALL be ~4 px, and the vertical gap between consecutive variable rows SHALL be ~8 px

### Requirement: Mobile (<lg) layout preserved

At viewport widths below `lg`, each variable SHALL render with the existing vertical (`flex-col`) layout including the collapsible header, and SHALL NOT use the list-level grid.

#### Scenario: Mobile collapsible header still rendered
- **WHEN** the viewport width is less than 1024 px
- **THEN** each variable SHALL render a collapsible header showing "Env variable N" with a chevron, expanding/collapsing the variable's fields on click

#### Scenario: Mobile fields stack vertically
- **WHEN** the viewport width is less than 1024 px and a variable is expanded
- **THEN** the Name, Description, Value, and Mount type controls SHALL stack vertically with the existing spacing

### Requirement: Validation behavior unaffected

The duplicate-name validation, required-name validation, and the error indicator on the Environment Variables accordion SHALL behave identically to the prior implementation. The `SaveValidationContext` interactions, error highlighting on the Name input, and the section-level error indicator SHALL continue to function for the new layout.

#### Scenario: Duplicate name shows error in new layout
- **WHEN** two variables share the same name at a viewport width ≥ 1024 px
- **THEN** both Name inputs SHALL display the duplicate error and the section header SHALL display the error indicator

#### Scenario: Empty required name still flagged
- **WHEN** a variable Name is empty
- **THEN** the Name input SHALL display the required-field error

### Requirement: Accessibility of input controls

Each input control in a variable row SHALL carry an `aria-label` naming its column (e.g. "EnvVariables.Name", "EnvVariables.Description", "Basic.Value", "EnvVariables.MountType"), so screen readers announce the field purpose without relying on placeholder text.

#### Scenario: Inputs retain accessible names
- **WHEN** a screen reader focuses any input in a variable row at a viewport width ≥ 1024 px
- **THEN** the reader SHALL announce the input's purpose via its `aria-label` attribute (or via the per-row `labelProps` label at mobile widths)

### Requirement: File-upload button is rendered inside the Value cell, aligned with the input/pill row

The `FileButton` SHALL be rendered as a direct flex sibling of the input/pill *inside* the `Value` component's own column, not as a flex sibling of `Value` itself. The inner row containing the input/pill and the file-upload button SHALL use cross-axis alignment `items-start`. Because the `Value` component renders the field's label (when present) *above* the inner row — not inside `DialInput` / `ValueFile` — the top edge of the inner row is the input/pill's top edge. As a result, the file-upload button's top edge SHALL stay aligned with the input/pill's top edge regardless of whether the field component renders a validation error caption below the input/pill.

#### Scenario: File-upload button stays aligned with the file pill when an error caption is shown

- **WHEN** a variable row holds a file-typed value whose `fileName` fails validation and the field component renders the inline error caption below the file pill, at any viewport width
- **THEN** the file-upload `DialNeutralButton`'s `getBoundingClientRect().top` SHALL equal the file pill's `getBoundingClientRect().top` (within 1 px tolerance)

#### Scenario: File-upload button stays aligned with the text input regardless of mount type

- **WHEN** a variable row holds a simple text value (secure or non-secure) at any viewport width
- **THEN** the file-upload `DialNeutralButton`'s `getBoundingClientRect().top` SHALL equal the value input's `getBoundingClientRect().top` (within 1 px tolerance)

#### Scenario: Field component continues to own its error caption

- **WHEN** any inline validation error is shown for the Value (file pill)
- **THEN** the error caption SHALL be rendered by the field component itself (`ValueFile`'s `DialErrorText`); the `Value` component and the `Variable` row SHALL NOT render an external `DialErrorText` for the field

### Requirement: Drag-grip stays aligned to the Name input top at lg+ when an error caption is shown

At viewport widths ≥ `lg` (1024 px), the Name + drag-grip cell SHALL use cross-axis alignment `items-start` so that the drag-grip's top edge stays anchored to the Name input top regardless of whether the field component renders a validation error caption below the input. Below `lg`, the cell MAY retain `items-end` (the drag-grip is hidden on mobile, so the alignment is a no-op).

#### Scenario: Drag-grip stays aligned when Name has a validation error at lg+

- **WHEN** a variable row at a viewport width ≥ 1024 px contains a Name value that fails validation (empty, invalid characters, or duplicate) and the field component renders the inline error caption below the Name input
- **THEN** the drag-grip icon's `getBoundingClientRect().top` SHALL equal the Name input's `getBoundingClientRect().top` (within 1 px tolerance), identical to the no-error state

### Requirement: Trash button rendered as vertically-centered sibling of the fields stack at mobile

At viewport widths < `lg` (1024 px), the trash (delete-row) button SHALL be rendered as a flex sibling of the fields stack on the right side of the variable card, vertically centered with the fields stack. The trash button inside the Mount-type cell SHALL be hidden on mobile and visible only at lg+.

#### Scenario: Trash button vertically centered on mobile

- **WHEN** a variable row is rendered at a viewport width < 1024 px
- **THEN** the trash button SHALL be rendered as a direct flex sibling of the fields stack inside the bordered card, with the parent flex container using `items-center` so the trash's vertical centre aligns approximately with the fields stack's vertical centre
- **AND** the trash button MUST NOT appear inline with the Mount-type select on mobile

#### Scenario: Trash button stays inline with Mount type at lg+

- **WHEN** a variable row is rendered at a viewport width ≥ 1024 px
- **THEN** the trash button SHALL be rendered as a flex sibling of the Mount-type select inside the row's trailing grid cell (preserving the prior `container-variables-row-layout` behavior at lg+)

### Requirement: Field labels render on every variable at mobile

At viewport widths < `lg`, every variable card SHALL render the field labels "Variable Name", "Description", "Value", and "Mount type" above the corresponding inputs, regardless of the variable's index in the list.

#### Scenario: Mobile labels visible on the second-and-later variables

- **WHEN** at least two variables are present at a viewport width < 1024 px
- **THEN** the second variable (and every subsequent variable) SHALL render the four field labels above its inputs, in the same way as the first variable

#### Scenario: Desktop labels still live in the list header only

- **WHEN** the viewport width is ≥ 1024 px
- **THEN** no field label SHALL be rendered inside any individual variable row (the list header continues to be the single source of column labels per the existing `container-variables-row-layout` requirements)
