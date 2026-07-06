## ADDED Requirements

### Requirement: Change Tool modal reflects the current tool selection

The Change Tool modal (Evaluation → Test suite → MCP suite → Method tab → "Change tool") SHALL visually mark exactly one tool's radio button as checked at all times, corresponding to the tool that would be applied on Save. When the modal opens, the currently-saved tool SHALL be pre-selected and scrolled into view. When the user picks a different tool, that tool's radio button SHALL immediately become the checked one and the previously-checked radio SHALL clear.

#### Scenario: Saved tool pre-selected on open

- **WHEN** the user opens the Change Tool modal for an MCP test suite that already references a tool
- **THEN** the radio button for the saved tool is shown as checked
- **AND** the saved tool's row is scrolled into view

#### Scenario: Selecting a different tool updates the radio

- **WHEN** the user clicks a tool row other than the currently-checked one
- **THEN** the clicked tool's radio button becomes checked
- **AND** the previously-checked tool's radio button becomes unchecked

#### Scenario: Save applies the visually-selected tool

- **WHEN** a tool's radio button is shown as checked and the user clicks Save
- **THEN** the test suite is updated to reference that tool
- **AND** the modal closes

#### Scenario: Save disabled with no selection

- **WHEN** the modal is open and the user has not picked any tool
- **THEN** the Save button is disabled
