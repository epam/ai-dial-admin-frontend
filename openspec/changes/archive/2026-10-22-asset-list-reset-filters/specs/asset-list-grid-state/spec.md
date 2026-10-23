## ADDED Requirements

### Requirement: A file-manager list can clear its filters in one step

Every file-manager list — Applications, Toolsets, Prompts, Conversations, Skills, the Platform lists and Files —
SHALL offer a "Reset filters" control in its header, immediately before the Create (Add on Files) button. The
control SHALL be shown only while at least one filter is applied to the list, and SHALL disappear once no filter
is applied.

Activating the control SHALL clear every filter of the list. It SHALL NOT change the column widths, column
order or sort, whether currently shown or stored. The cleared filters SHALL be stored as the list's filters, so
a reload shows the list unfiltered.

#### Scenario: No filter, no control

- **WHEN** the operator opens a list that has no filter applied
- **THEN** no "Reset filters" control is shown in the header

#### Scenario: The control appears with the first filter

- **WHEN** the operator applies a filter to a column of a list
- **THEN** a "Reset filters" control is shown in the header before the Create button

#### Scenario: Resetting clears filters only

- **WHEN** the operator has widened a column, sorted the list and filtered it, and activates "Reset filters"
- **THEN** every row is shown again and no column carries a filter
- **AND** the widened column keeps its width and the list keeps its sort
- **AND** the control is no longer shown

#### Scenario: A cleared filter stays cleared after a reload

- **WHEN** the operator activates "Reset filters" and reloads the page
- **THEN** the list renders without filters and the control is not shown

#### Scenario: A restored filter offers the control

- **WHEN** the operator reloads a list whose filter was stored
- **THEN** the filter is applied and the "Reset filters" control is shown
