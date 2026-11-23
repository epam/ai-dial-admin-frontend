## MODIFIED Requirements

### Requirement: Role asset list is flat with create and delete actions
The system SHALL render the role asset list as the Platform tab's flat grid of entries, with a config.json tab beside it, exposing create (header) and delete actions and
no folder-create, rename-folder, or move-into-folder controls.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/assets-roles`
- **THEN** all role resources are shown as direct grid rows with no folder-expand affordance

#### Scenario: No create-folder or move action is present
- **WHEN** a user opens the role asset list header and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered

#### Scenario: Create action opens the role create modal
- **WHEN** a user activates the header Create button
- **THEN** a modal opens requesting only the role's name — no display name or description field,
  since `Role` has neither — and submitting it creates the resource and navigates to its detail view

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the role asset list
- **THEN** no create or delete action is offered

### Requirement: Add-applications popup attaches applications by root-dependent key

The system SHALL open, for `Add applications`, a multi-select popup with the tabs described by
`tabbed-asset-listings` (a Public tree, and Platform and config.json grids) and offers only application entries as
selectable (grouping folders are browsable but never selectable). Applying SHALL add one entry to the role's
`limits` map per selected application, each with an empty limits object. The entry's key SHALL be the application's
`name` when it was picked from the Platform or config.json tab, and `applications/{path}` when it was picked from
the Public tab. A selected application whose key is already in `limits` SHALL be skipped silently and keep its
existing limits. Apply SHALL be disabled while nothing is selected, and a cancelled pick SHALL NOT carry into the
next open.

#### Scenario: A platform or config.json application is keyed by its name

- **WHEN** a user selects an application on the Platform or config.json tab and applies
- **THEN** `limits` gains an entry keyed by that application's name and it appears as a row in the Entities grid

#### Scenario: A public application is keyed with the applications prefix

- **WHEN** a user selects an application on the Public tab and applies
- **THEN** `limits` gains an entry keyed `applications/{path}` for it

#### Scenario: Several applications are attached at once

- **WHEN** a user selects three applications across the tabs and applies
- **THEN** three entries are added and the popup closes

#### Scenario: An already-attached application is skipped

- **WHEN** a user applies a selection containing an application whose key is already in `limits`
- **THEN** no duplicate row appears and the existing entry keeps its token limits

#### Scenario: Nothing selected disables Apply

- **WHEN** the popup is open with no application selected
- **THEN** the Apply action is disabled

#### Scenario: Cancelling discards the pick

- **WHEN** a user selects an application, cancels, and reopens the popup
- **THEN** no application is shown as selected and Apply is disabled
