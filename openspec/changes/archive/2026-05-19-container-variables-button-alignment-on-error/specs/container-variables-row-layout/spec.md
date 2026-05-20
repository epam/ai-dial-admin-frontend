## ADDED Requirements

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
