## Purpose

Defines how wide the name column of an entity list opens by default, so an operator can read an entity's ID
or display name in full without resizing the column, and so a width the operator chose keeps winning.

## ADDED Requirements

### Requirement: The name column opens wide enough to read a typical ID

An entity list's name column — the column that carries the entity's ID or display name — SHALL open wider than
the other data columns by default. A typical entity ID, such as `bedrock.amazon.nova-pro-v1:0`, SHALL be
readable in full on first load without the operator resizing the column.

The same SHALL hold in every entity list that shows such a column, including the Entities, AI Gateway,
Artifacts and Builders sections, the test-suite, dataset and metric lists, the interceptor lists, and the
export and import entity lists. Runs and Analytics grids are not entity lists and are unaffected.

#### Scenario: A typical ID is readable on first load

- **WHEN** an entity list opens for the first time with no saved column widths
- **THEN** its name column shows an ID of about thirty characters without an ellipsis

#### Scenario: Every entity list is covered

- **WHEN** the operator opens any entity list in any section
- **THEN** its name column opens at the wider default

#### Scenario: A name longer than the column is still reachable

- **WHEN** a name is longer than the default width
- **THEN** it is truncated with an ellipsis whose full text is reachable through the grid's truncation tooltip
- **AND** the operator can still drag the column wider

### Requirement: Other columns stay readable

Widening the name column SHALL NOT leave the Author, creation time, update time or any other default-visible
column cut off at common desktop viewport widths. The columns SHALL share the remaining width, each no
narrower than its own minimum.

#### Scenario: Neighbouring columns are not cut off

- **WHEN** an entity list opens at a 1366 px or a 1920 px wide viewport
- **THEN** every default-visible column shows its header and the full value of a typical cell, or a truncation
  tooltip where the value was already long enough to truncate before this change

### Requirement: An operator-set width still wins

A width the operator set by dragging the name column SHALL still be saved and SHALL be restored after a page
reload, taking precedence over the default width. A width the operator never set SHALL NOT be saved.

#### Scenario: A dragged width survives reload

- **WHEN** the operator drags the name column to a new width and reloads the page
- **THEN** the name column opens at the width the operator set

#### Scenario: An untouched column is not frozen

- **WHEN** the operator never resizes the name column
- **THEN** no width for it is stored, and it follows the current default on the next visit
