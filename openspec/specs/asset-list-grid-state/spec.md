# Asset List Grid State — Spec

## Purpose

Defines which grid state a file-manager list (every asset list and Files) remembers for the operator across
reloads and tab closes, how that state is scoped, and what is never stored.

## Requirements

### Requirement: A file-manager list remembers the operator's grid state across reloads

Every list rendered as a file manager — Applications, Toolsets, Prompts, Conversations, Skills, the Platform
lists (Models, App Runners, Catalog Schemas, Interceptors, Translators, Routes, Roles, Keys) and Files — SHALL
remember, in the browser's persistent storage:

- the width of each column the operator resized by dragging,
- the column order the operator set,
- the sort the operator applied,
- the filters the operator applied.

A reload, a new tab, or a new browser session on the same browser SHALL restore that state. The state SHALL
apply to the list as a whole: navigating to another folder of the same list SHALL keep the same widths,
order, sort and filters.

#### Scenario: A dragged width survives a reload

- **WHEN** the operator drags the Name column of the Prompts list wider and reloads the page
- **THEN** the Name column renders at the width the operator set
- **AND** the remaining columns share the rest of the grid width

#### Scenario: Order and sort survive a reload

- **WHEN** the operator moves a column to a new position, sorts by a column, and reloads the page
- **THEN** the columns render in the order the operator set
- **AND** the rows are sorted by that column in that direction

#### Scenario: Filters survive closing the tab

- **WHEN** the operator filters a list, closes the tab, and opens the list again in a new tab
- **THEN** the filter is applied and shown in the column's filter input

#### Scenario: State is shared across folders of one list

- **WHEN** the operator resizes a column and filters the list in one folder, then opens a different folder of
  the same list
- **THEN** the column keeps its width and the filter is still applied

### Requirement: Each file-manager list keeps its own state

Stored state SHALL be scoped to one list. A change on one list SHALL NOT alter the widths, order, sort or
filters of any other list, whether another file-manager list or an entity list.

#### Scenario: Two lists do not share state

- **WHEN** the operator widens the Name column and filters the Prompts list, then opens the Files list
- **THEN** the Files list renders with its own stored state, or its defaults if it has none

### Requirement: Only what the operator chose is stored

A column width the grid computes itself — fitting the columns to the grid width, sharing remaining width
between flexible columns, or sizing to content — SHALL NOT be stored. Only a width the operator set by
dragging a column edge SHALL be stored, and only for the columns the operator dragged. This follows the same
rule as `grid-column-selection` ("Computed widths are not remembered").

Column visibility and pinning SHALL NOT be stored for a file-manager list; the list decides which columns it
shows.

#### Scenario: A fresh list stores no width

- **WHEN** the operator opens a list they have never adjusted, sorts it, and reloads the page
- **THEN** no column width is restored, and the columns fit the grid width as on first load

#### Scenario: Only the dragged column keeps its width

- **WHEN** the operator drags one column wider and the grid narrows the others to fit, then the operator
  reloads the page
- **THEN** only the dragged column is restored at a fixed width
- **AND** the other columns fit the remaining grid width rather than restoring their narrowed widths

### Requirement: Compact view always leads with the Name column

When a file-manager list is shown in compact view, which keeps only its first column and its actions, a stored
column order SHALL NOT change which column is shown: the Name column SHALL be shown. Leaving compact view SHALL
restore the stored order.

#### Scenario: Compact view ignores a stored order

- **WHEN** the operator has moved the Name column away from the first position and the list switches to compact
  view
- **THEN** the compact list shows the Name column
- **AND** widening the window back out of compact view shows the columns in the operator's order again

### Requirement: Unusable stored state falls back to defaults

Stored state that cannot be read SHALL be ignored, and the list SHALL render with its default columns and no
filters. A stored entry for a column the list no longer has SHALL be ignored, without affecting the columns the
list does have.

#### Scenario: An unreadable entry does not break the list

- **WHEN** a list's stored state is corrupted and the operator opens the list
- **THEN** the list renders with its default widths, order, sort and no filters

### Requirement: Transient file-manager grids do not persist state

Grids that show files outside a list page — the grid inside the delete-assets confirmation and the public-file
picker — SHALL NOT store or restore widths, order, sort or filters.

#### Scenario: The delete confirmation grid starts fresh

- **WHEN** the operator resizes a column in the delete-assets confirmation, closes it, and opens it again
- **THEN** the grid renders with its default widths
