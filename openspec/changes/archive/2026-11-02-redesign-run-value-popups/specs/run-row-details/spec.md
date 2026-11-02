## REMOVED Requirements

### Requirement: Long values are truncated and open in a pop-up
**Reason**: Only truncated cells were clickable. Every value cell is now clickable, and the popups are defined by `run-value-popups`.
**Migration**: See "Value cells truncate long content and open a popup" below.

## ADDED Requirements

### Requirement: Value cells truncate long content and open a popup

A value cell SHALL show at most three lines of its content, ending with an ellipsis when the content
does not fit, instead of growing the row or scrolling inside the cell. Every value cell SHALL be one
control over the whole cell, whether or not its content is truncated, and activating it SHALL open the
popup defined by `run-value-popups`: the score popup for a metric field and the text popup for any other.
While the pointer is over a cell, or keyboard focus is on it, an "open in pop-up" icon SHALL appear at its
bottom-right. The popup SHALL close on its close control or Escape.

#### Scenario: Long value is clamped
- **WHEN** a field value needs more than three lines at the current width
- **THEN** the cell shows three lines ending in an ellipsis and the row is no taller than a three-line row

#### Scenario: Hover reveals the pop-up icon
- **WHEN** the pointer is over a value cell
- **THEN** an open-in-pop-up icon appears at the bottom-right of the cell

#### Scenario: Focus reveals the pop-up icon
- **WHEN** keyboard focus moves onto a value cell
- **THEN** the same icon is shown, and Enter or Space opens the popup

#### Scenario: Clicking anywhere on a text cell opens the text popup
- **WHEN** the user clicks any part of a non-metric value cell
- **THEN** the text popup opens with the field name as its title and the complete value in it

#### Scenario: A metric cell opens the score popup
- **WHEN** the user clicks a metric value cell
- **THEN** the score popup opens with the metric name as its title

#### Scenario: A short value is clickable too
- **WHEN** a field value fits within its cell and the user clicks the cell
- **THEN** the text popup opens with the value

#### Scenario: The execution status cell is clickable
- **WHEN** the user clicks the Execution status cell
- **THEN** the text popup opens with the status value

#### Scenario: Widening the panel can remove truncation
- **WHEN** a truncated value fits after the panel width changes
- **THEN** the cell stops showing the ellipsis and keeps the icon on hover
