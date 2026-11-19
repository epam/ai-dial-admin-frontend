# delete-button Specification

## Purpose
The single shared delete/remove control (`components/Common/RemoveButton/`): borderless when it shows only an icon, bordered when it carries a label, so every delete action in the app is drawn the same way.

## Requirements

### Requirement: Icon-only delete button has no border
A delete or remove control that shows only an icon SHALL render through `Common/RemoveButton` as a
borderless ghost button with the trash icon in the error color, an accessible name of Delete (unless the
caller supplies another), and the icon marked `aria-hidden`. No other component in `src/components/` SHALL
hand-roll an icon-only trash button.

#### Scenario: Icon-only delete in a row editor
- **WHEN** a row editor renders a delete control without a label
- **THEN** it is a ghost icon button with no border, a red trash icon, and the accessible name Delete

#### Scenario: Disabled icon-only delete
- **WHEN** the control is disabled
- **THEN** it stays borderless and is not clickable

### Requirement: Labelled delete button has a border
A delete or remove control that shows text SHALL render through `Common/RemoveButton` with a `label` as a
bordered danger button with the trash icon before the text.

#### Scenario: Entity header Delete
- **WHEN** an entity header shows a Delete action with the text Delete
- **THEN** it is a bordered danger button with a trash icon before the text

#### Scenario: Previously unbordered labelled delete
- **WHEN** the Metric card, the saved-query Delete or the file field Delete all control is shown
- **THEN** it has a border like every other labelled delete button

### Requirement: Clear is not delete
A control that empties a selection without deleting an entity SHALL NOT use the trash icon or
`RemoveButton`.

#### Scenario: Clearing the application runner
- **WHEN** an application runner is selected in the source field
- **THEN** the control that clears it shows a close icon and the accessible name Clear
