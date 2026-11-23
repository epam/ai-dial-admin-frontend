## MODIFIED Requirements

### Requirement: Router asset list is flat with create and delete actions
The system SHALL render the router asset list with a flat Platform tab and a config.json tab, built on the
shared tabbed listing. The Platform tab SHALL offer create (header), duplicate, and delete actions and no
create-folder, move, or rename action. The config.json tab SHALL list config-file-defined routers and
expose no mutating action.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/platform-routers`
- **THEN** all router resources are shown as direct grid rows with no folder-expand affordance

#### Scenario: Create opens a modal with identity fields
- **WHEN** a user activates the header Create button
- **THEN** a modal opens requesting the router's id, display name, display version, and description, and submitting
  it creates the resource under `routers/platform/{name}` and navigates to its detail view

#### Scenario: config.json tab is read-only
- **WHEN** a user opens the config.json tab on `/platform-routers`
- **THEN** config-file router names are listed and no create, delete, duplicate, move,
  rename, or folder action is offered

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the router asset list
- **THEN** no create or delete action is offered
