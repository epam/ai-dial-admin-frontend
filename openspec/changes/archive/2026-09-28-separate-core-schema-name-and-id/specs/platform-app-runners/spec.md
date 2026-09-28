## MODIFIED Requirements

### Requirement: Catalog > App Runners menu entry

The system SHALL add an `App Runners` menu item to the Catalog section of the admin menu, directly before `Catalog Schemas`, linking to `/platform-app-runners`.

#### Scenario: App Runners is reachable in the Catalog section

- **WHEN** the Catalog section of the menu renders
- **THEN** `App Runners` appears before `Catalog Schemas`
- **AND** selecting it opens `/<lang>/platform-app-runners`

### Requirement: App-runner asset list is flat with create and delete actions

The system SHALL render the Platform App Runner list as a single, non-nested list of entries under the `platform` root, built on the shared asset list, exposing create, delete, and bulk-delete actions and no folder-create, rename-folder, or move-into-folder controls. The metadata-only list SHALL label and show each resource's decoded Core storage name as `Name`; it SHALL NOT claim that a metadata row supplies the schema body's declared `$id`.

#### Scenario: List shows entries without a folder tree

- **WHEN** a user opens `/platform-app-runners`
- **THEN** all app-runner resources are shown as direct entries with no folder-expand affordance

#### Scenario: No create-folder or move action is present

- **WHEN** a user opens the app-runner list toolbar and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered

#### Scenario: The folder tree offers no folder actions

- **WHEN** a user opens the context menu on the app-runner folder tree's root
- **THEN** no add-sibling, add-child, rename, move, or manage-permissions action is offered

#### Scenario: Create action requests both identities

- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal requests required storage `name`, declared `$id`, and display name fields
- **AND** submitting valid values creates the resource and navigates to its detail view

#### Scenario: Metadata-only row shows the storage name

- **WHEN** the list renders an App Runner whose Core storage name differs from its declared body `$id`
- **THEN** the `Name` column shows the decoded storage name
- **AND** no content request is made merely to display the declared `$id`

#### Scenario: Bulk delete removes the selected runners

- **WHEN** a user selects several runners and confirms bulk delete
- **THEN** each selected runner is deleted and the list refreshes without them

### Requirement: `$id` is displayed as the runner identity and is immutable after creation

The system SHALL preserve and display the `$id` declared in an App Runner's stored schema body. Core storage `name` and `_metadata.path` SHALL address the resource's route, update, and deletion; the declared `$id` SHALL be used for resolved-schema reads and application `application_type_schema_id` references. The system SHALL allow entering both values only on creation and SHALL reject any attempt to change an existing runner's declared `$id`, including through raw JSON editing.

#### Scenario: Create keeps name and id separate

- **WHEN** a user creates a runner with storage name `quickapps2` and `$id` `https://dial.example.com/custom_application_schemas/quickapps2`
- **THEN** Core receives the create at the encoded `quickapps2` storage address
- **AND** the stored runner body carries the typed URI as `$id`

#### Scenario: Migrated runner preserves declared id

- **WHEN** a runner stored under `quickapps2` declares `$id` `https://dial.example.com/custom_application_schemas/quickapps2`
- **THEN** its detail view and JSON editor show the declared URI rather than `quickapps2`
- **AND** resolved-schema reads and application references use the URI

#### Scenario: Existing runner writes to its original storage path

- **WHEN** an admin edits and saves a runner whose storage name differs from its declared `$id`
- **THEN** the update addresses the resource's loaded `_metadata.path`
- **AND** the request preserves its original declared `$id`

#### Scenario: Existing runner deletes at its original storage path

- **WHEN** an admin deletes a runner whose storage name differs from its declared `$id`
- **THEN** the delete addresses the loaded storage path rather than a path reconstructed from `$id`

#### Scenario: Raw JSON cannot change the declared id

- **WHEN** an admin changes an existing runner's `$id` in the raw JSON editor and saves
- **THEN** the save is blocked before a Core write
- **AND** the edited JSON remains available for correction

#### Scenario: Core conflicts are visible on create

- **WHEN** Core rejects a create because either the storage name or declared `$id` is already registered
- **THEN** the modal remains open and shows Core's conflict message

## ADDED Requirements

### Requirement: Platform App Runner storage name is visible but immutable after creation

The detail view SHALL show the loaded Core storage name separately from declared `$id` and SHALL not offer a rename control for either identity.

#### Scenario: Existing runner exposes both identities

- **WHEN** an admin opens an API-written Platform App Runner whose storage name differs from `$id`
- **THEN** the Properties view shows both values distinctly
- **AND** neither value is editable
