## MODIFIED Requirements

### Requirement: Route asset list is flat with create and delete actions
The system SHALL render the route asset list as a single, non-nested list of entries under the
`platform` root, built on the shared asset list, exposing create, delete, and bulk-delete actions and
no folder-create, rename-folder, or move-into-folder controls.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/platform-routes`
- **THEN** all route resources are shown as direct entries with no folder-expand affordance

#### Scenario: No create-folder or move action is present
- **WHEN** a user opens the route asset list toolbar and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered

#### Scenario: Create action opens the route create modal
- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal opens requesting the route's name and one required Path, with no Display Name or Description field
- **AND** the Path input uses the existing route-path validation and shows its inline validation error when empty or invalid
- **AND** Create remains unavailable until both the name and Path are valid

#### Scenario: A valid initial path is persisted when creating a route
- **WHEN** a user submits the create modal with a valid name and Path
- **THEN** the system creates the resource with the entered Path as the sole initial item in its `paths` array
- **AND** the existing success notification is shown and the user is navigated to the route detail view

#### Scenario: Bulk delete removes the selected routes
- **WHEN** a user selects several routes and confirms bulk delete
- **THEN** each selected route is deleted and the list refreshes without them

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the route asset list
- **THEN** no create, delete, or bulk-delete action is offered
