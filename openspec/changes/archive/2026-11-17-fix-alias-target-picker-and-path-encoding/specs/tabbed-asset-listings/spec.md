## MODIFIED Requirements

### Requirement: config.json tab is a read-only flat grid

The system SHALL render the config.json tab as a flat grid with a name column and an open-in-new-tab row action,
and SHALL offer no create, import, export, delete, duplicate, rename, move or selection-mutation action. A row SHALL
open the existing config-file detail route per `config-file-entity-views`. Its empty state SHALL show the title only,
with no description naming a create or import action, since none exists on this tab.

#### Scenario: Only name and open are offered

- **WHEN** a user opens the row action menu on a config.json row
- **THEN** only open-in-new-tab is offered

#### Scenario: Empty config.json tab names no create action

- **WHEN** a user opens the config.json tab and Core lists no entities
- **THEN** the empty state shows its title and no description

### Requirement: The entity picker offers the same tabs

The system SHALL render the entity picker with the same tab rules as the listing of the entity it picks: for
Applications and Toolsets a Public tree plus Platform and config.json flat grids, for Models Platform and config.json
flat grids, where a tab is offered only for sources that exist for the caller. Public tree selection SHALL offer only
entities, never grouping folders. The picker SHALL report each selection with its source. Selecting a name on the
Platform tab and the config.json tab SHALL count as the same selection, because both store the bare name. The picker
SHALL support a multi-selection mode (role limits: Add applications) and a single-selection mode (alias target), and
in single-selection mode a selection on one tab SHALL replace any selection on another tab and the picker SHALL report
at most one entity. In the Platform and config.json grids of the picker a row's name SHALL be plain text, not a link,
with the selection control (in single-selection mode a radio inside the name cell and no separate selection column; in multi-selection mode a checkbox column), and an empty
grid SHALL show its title only, since nothing can be created from a picker. The Public tree in the picker SHALL show
the breadcrumb trail above the grid and SHALL be padded from the top of the popup although it has no heading.

#### Scenario: Picker shows the three sources

- **WHEN** an admin opens Add applications on a role
- **THEN** the popup shows the Public, Platform and config.json tabs and each tab allows selecting entities

#### Scenario: Model picker shows two sources

- **WHEN** an admin opens the target picker for a Model alias target
- **THEN** the popup shows the Platform and config.json tabs only

#### Scenario: The same name on two flat tabs is one selection

- **WHEN** an admin selects `assistant` on the Platform tab and opens the config.json tab, which also lists `assistant`
- **THEN** `assistant` is shown as selected there and applying adds one entry

#### Scenario: Selection survives tab switches

- **WHEN** an admin selects one entity on the Public tab, switches to Platform, selects another, and applies
- **THEN** both entities are reported, each with its source

#### Scenario: Single-selection replaces across tabs

- **WHEN** in single-selection mode an admin selects an entity on the Public tab and then one on the Platform tab
- **THEN** only the Platform entity is selected and applying reports exactly that one entity

#### Scenario: Role limits keep multi-selection

- **WHEN** an admin opens Add applications on a role after this change
- **THEN** several entities can still be selected across tabs and applying reports all of them

#### Scenario: Picker grid names are not links

- **WHEN** an admin opens the Platform or config.json tab of the Model target picker
- **THEN** each row shows its name as plain text with a radio button, and clicking the name selects the row instead of opening the entity

#### Scenario: Public tab shows breadcrumbs

- **WHEN** an admin opens the Public tab of an entity picker and enters a folder
- **THEN** the breadcrumb trail of the folder is shown above the grid and the tree is not flush against the top edge

#### Scenario: Picker empty grid offers no create hint

- **WHEN** an admin opens a picker tab whose source lists no entities
- **THEN** the empty state shows its title and no description
