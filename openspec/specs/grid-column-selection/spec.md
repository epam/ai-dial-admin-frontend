# Grid Column Selection — Spec

## Purpose

Defines how a grid lets the operator choose which columns are shown and in what order — the shared columns
panel, its behaviour on grids whose columns sit inside header groups, and how that choice is remembered per
view across reloads.

## Requirements

### Requirement: The columns panel lists leaf columns, including on grouped grids

A grid that opts into column selection SHALL render a panel listing one entry per **leaf** column — the
columns the operator actually sees — with a checkbox for its visibility and a label taken from its header
name. A grid whose column definitions are header groups SHALL list the columns inside those groups, not the
groups themselves: a group definition carries no field of its own, so listing top-level definitions would
present an empty panel on exactly the grids that need it most.

A column that opts out of the panel, or that carries no field or no header name, SHALL NOT be listed — such a
column has nothing to label a checkbox with.

On a grouped grid the panel SHALL show which group each column belongs to, so a name that is ambiguous on its
own is readable in the panel.

#### Scenario: A grouped grid lists its columns

- **WHEN** the panel opens on a grid whose columns are defined inside header groups
- **THEN** it lists one entry per column inside those groups
- **AND** it lists no entry for a group itself

#### Scenario: A flat grid is unaffected

- **WHEN** the panel opens on a grid whose columns are a flat list
- **THEN** it lists the same entries, in the same order, as it did before grouped grids were supported

#### Scenario: Panel-suppressed and unlabelled columns are omitted

- **WHEN** a column opts out of the panel, or has no field or no header name
- **THEN** the panel does not list it

### Requirement: A column cannot be reordered out of its group

Reordering in the panel SHALL move a column only within the group it belongs to. A drop that would place a
column outside its own group SHALL leave the order unchanged rather than being applied partially.

The grid itself already forbids dragging a column out of its header group; a panel that allowed it would either
be silently ignored by the grid or would break the group's meaning, and on a grid whose groups state where the
data came from that meaning is a correctness claim, not decoration.

#### Scenario: Reordering within a group applies

- **WHEN** the operator drags a column above another column of the same group
- **THEN** the two exchange positions and the grid reflects the new order

#### Scenario: Reordering across groups does not apply

- **WHEN** the operator drags a column onto a position belonging to another group
- **THEN** the column stays in its own group and the order is unchanged

### Requirement: Hiding a column clears its sort and its filter

When a column becomes hidden, any sort and any filter applied to it SHALL be cleared, and the result SHALL be
re-resolved without them. A hidden column's filter otherwise keeps narrowing the result with nothing on screen
to explain it, and a hidden column's sort keeps ordering rows by a value the operator cannot see.

Making the column visible again SHALL NOT restore the cleared sort or filter: they were cleared, not
suspended.

#### Scenario: A filtered column is hidden

- **WHEN** the operator hides a column that carries an active filter
- **THEN** that filter is cleared and the result no longer excludes the rows it was excluding

#### Scenario: A sorted column is hidden

- **WHEN** the operator hides the column the result is ordered by
- **THEN** that sort is cleared and the result returns to the grid's default ordering

#### Scenario: Showing the column again does not revive its filter

- **WHEN** the operator shows a column whose filter was cleared when it was hidden
- **THEN** the column carries no filter

### Requirement: Column choice persists per view and can be reset

A grid that opts into column selection SHALL remember its column visibility and order per view, so a reload
restores the operator's choice. The panel SHALL offer a reset that returns the grid to the view's own defaults
and SHALL offer it only when the current state differs from those defaults.

Persistence SHALL be keyed per view, so two grids in the app cannot overwrite each other's choice.

#### Scenario: A reload restores the chosen columns

- **WHEN** the operator hides a column, reorders another, and reloads the page
- **THEN** the grid renders with that visibility and that order

#### Scenario: Reset returns to the view's defaults

- **WHEN** the operator resets the panel
- **THEN** the grid's default visible set and default order are restored
- **AND** the reset affordance is no longer offered until the state differs from the defaults again

### Requirement: Restored sort and filter reach a server-paged grid's first request

On a grid that fetches its rows page by page from the backend, restored sort and filter state SHALL be applied
before the first page is requested, so that first request carries them.

A grid that requested its first page before restoring the state would render rows that do not match the
controls shown alongside them — the filter inputs would be populated while the rows were fetched unfiltered —
and it would then need a second request to correct itself.

#### Scenario: The first request carries the restored state

- **WHEN** a server-paged grid mounts with a persisted sort and filter
- **THEN** the first page request carries that sort and those predicates
- **AND** no request is issued without them

#### Scenario: The controls agree with the rows on mount

- **WHEN** a server-paged grid mounts with a persisted filter
- **THEN** the rows shown satisfy the filter shown in the controls
