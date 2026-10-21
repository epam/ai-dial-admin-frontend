## MODIFIED Requirements

### Requirement: Catalog-schema list is flat with create and delete actions

The system SHALL render the catalog-schema list as a single, non-nested list of entries under the `platform` root, built on the shared asset list, exposing create, delete, and bulk-delete actions and no folder-create, rename-folder, or move-into-folder controls. The metadata-only list SHALL label and show each resource's decoded Core storage name as `Name`; it SHALL NOT claim that a metadata row supplies the schema body's declared `$id`.

#### Scenario: List shows entries without a folder tree

- **WHEN** a user opens `/platform-catalog-schemas`
- **THEN** all catalog-schema resources are shown as direct entries with no folder-expand affordance

#### Scenario: No create-folder, move, or duplicate action is present

- **WHEN** a user opens the list toolbar and row actions
- **THEN** no create-folder, move-to-folder, or duplicate action is offered

#### Scenario: The folder tree offers no folder actions

- **WHEN** a user opens the context menu on the catalog-schema folder tree's root
- **THEN** no add-sibling, add-child, rename, move, or manage-permissions action is offered

#### Scenario: Create action requests both identities

- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal requests required storage `name`, declared `$id`, entity type, and display name fields
- **AND** submitting valid values creates the resource and refreshes the list

#### Scenario: Metadata-only row shows the storage name

- **WHEN** the list renders a Catalog Schema whose Core storage name differs from its declared body `$id`
- **THEN** the `Name` column shows the decoded storage name
- **AND** no content request is made merely to display the declared `$id`

#### Scenario: Bulk delete removes the selected schemas

- **WHEN** a user selects several catalog schemas and confirms bulk delete
- **THEN** each selected schema is deleted and the list refreshes without them

#### Scenario: A read-only admin is offered no mutating actions

- **WHEN** a read-only admin opens the catalog-schema list
- **THEN** no create, delete, or bulk-delete action is offered

### Requirement: `$id` is the schema identity and is immutable after creation

The system SHALL preserve and display the `$id` declared in a Catalog Schema's stored body. The loaded Core storage `name` and `_metadata.path` SHALL address the resource's route, update, and deletion; declared `$id` SHALL be used for merged-schema lookup and a deployment's `catalog_schema_id`. The system SHALL allow entering both values only on creation and SHALL reject any attempt to change an existing schema's declared `$id`, including through raw JSON editing.

#### Scenario: Create keeps name and id separate

- **WHEN** a user creates a schema with storage name `agent-schema` and `$id` `https://dial.example.com/catalog_schemas/agent`
- **THEN** Core receives the create at the encoded `agent-schema` storage address
- **AND** the stored schema body carries the typed URI as `$id`

#### Scenario: Id is read-only on the detail view

- **WHEN** a user opens an existing schema's Properties tab
- **THEN** the declared `$id` is shown but cannot be edited

#### Scenario: A duplicate id is reported as the server's conflict

- **WHEN** Core rejects a create because either the storage name or declared `$id` is already registered
- **THEN** an error notification carrying Core's conflict message is shown and the modal stays open

#### Scenario: A schema stored under a different name keeps its declared id

- **WHEN** a schema stored under `agent-schema` declares `$id` `https://dial.example.com/catalog_schemas/agent`
- **THEN** the detail view and JSON editor show the declared `$id`
- **AND** saving an unrelated edit addresses the loaded `_metadata.path` and preserves the declared `$id`

#### Scenario: Existing schema deletes at its original storage path

- **WHEN** an admin deletes a schema whose storage name differs from its declared `$id`
- **THEN** the delete addresses the loaded storage path rather than a path reconstructed from `$id`

#### Scenario: Raw JSON cannot change the declared id

- **WHEN** an admin changes an existing schema's `$id` in the raw JSON editor and saves
- **THEN** the save is blocked before a Core write
- **AND** the edited JSON remains available for correction

## ADDED Requirements

### Requirement: Catalog Schema storage name is visible but immutable after creation

The detail view SHALL show the loaded Core storage name separately from declared `$id` and SHALL not offer a rename control for either identity.

#### Scenario: Existing schema exposes both identities

- **WHEN** an admin opens an API-written Catalog Schema whose storage name differs from `$id`
- **THEN** the Properties view shows both values distinctly
- **AND** neither value is editable
