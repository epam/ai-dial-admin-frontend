## MODIFIED Requirements

### Requirement: Column choice persists per view and can be reset

A grid that opts into column selection SHALL remember its column visibility and order per view, so a reload
restores the operator's choice. The panel SHALL offer a reset that returns the grid to the view's own defaults
and SHALL offer it only when the current state differs from those defaults.

Persistence SHALL be keyed per view, so two grids in the app cannot overwrite each other's choice.

Only a change the operator made SHALL be persisted. A column width the grid computed itself — sizing columns
to their content or to the grid width — SHALL NOT be stored as a remembered choice: storing it would freeze
the first render's measurements in place of the sizing the view asks for on every load, and would present a
width the operator never chose as one they can reset.

A view whose stored state no longer describes its columns — because the view's column set changed
incompatibly — SHALL start from the view's new defaults rather than applying that state. Restored visibility,
order, and widths from a superseded column set would otherwise leave new columns hidden and misordered, with
nothing on screen to explain it.

#### Scenario: A reload restores the chosen columns

- **WHEN** the operator hides a column, reorders another, and reloads the page
- **THEN** the grid renders with that visibility and that order

#### Scenario: Reset returns to the view's defaults

- **WHEN** the operator resets the panel
- **THEN** the grid's default visible set and default order are restored
- **AND** the reset affordance is no longer offered until the state differs from the defaults again

#### Scenario: Computed widths are not remembered

- **WHEN** a grid sizes its columns to their content on load
- **THEN** those widths are not written to the view's stored state
- **AND** a reload sizes the columns to content again rather than restoring the earlier measurements

#### Scenario: An operator's own resize is still remembered

- **WHEN** the operator drags a column's edge to resize it and reloads the page
- **THEN** the grid renders that column at the width the operator set

#### Scenario: A view's reworked column set starts from its defaults

- **WHEN** a view's column set has changed incompatibly since the operator's state was stored
- **THEN** the grid renders the view's new default visible set, order, and sizing
- **AND** the stored state from the superseded column set is not applied
