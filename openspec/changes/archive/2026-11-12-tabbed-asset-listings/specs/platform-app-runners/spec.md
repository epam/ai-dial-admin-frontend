## MODIFIED Requirements

### Requirement: App-runner asset list is flat with create and delete actions

The system SHALL render the Platform App Runner list as the Platform tab's flat grid of entries, with a config.json tab beside it, exposing create (header) and delete actions and no folder-create, rename-folder, or move-into-folder controls. The metadata-only list SHALL label and show each resource's decoded Core storage name as `Name`; it SHALL NOT claim that a metadata row supplies the schema body's declared `$id`.

#### Scenario: List shows entries without a folder tree

- **WHEN** a user opens `/platform-app-runners`
- **THEN** all app-runner resources are shown as direct grid rows with no folder-expand affordance

#### Scenario: No create-folder or move action is present

- **WHEN** a user opens the app-runner list header and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered

#### Scenario: Create action requests both identities

- **WHEN** a user activates the header Create button
- **THEN** a modal requests required storage `name`, declared `$id`, and display name fields
- **AND** submitting valid values creates the resource and navigates to its detail view

#### Scenario: Metadata-only row shows the storage name

- **WHEN** the list renders an App Runner whose Core storage name differs from its declared body `$id`
- **THEN** the `Name` column shows the decoded storage name
- **AND** no content request is made merely to display the declared `$id`

