## MODIFIED Requirements

### Requirement: Catalog-schema list is flat with create, duplicate, and delete actions

The system SHALL render the catalog-schema list as the Platform tab's flat grid of entries, with a config.json tab beside it, exposing create (header), duplicate, and delete actions and no folder-create, rename-folder, or move-into-folder controls. The metadata-only list SHALL label and show each resource's decoded Core storage name as `Name`; it SHALL NOT claim that a metadata row supplies the schema body's declared `$id`.

#### Scenario: List shows entries without a folder tree

- **WHEN** a user opens `/platform-catalog-schemas`
- **THEN** all catalog-schema resources are shown as direct grid rows with no folder-expand affordance

#### Scenario: Duplicate action creates a copy with separate identities

- **WHEN** a user opens Duplicate for a Catalog Schema with storage name `agent-schema`, declared `$id` `https://dial.example.com/catalog_schemas/agent`, and display name `Agent`
- **THEN** the modal shows Name `agent-schema-copy`, ID `https://dial.example.com/catalog_schemas/agent-copy`, and display name `Agent`
- **AND** submitting valid values sends the edited Name and ID with the source schema's remaining properties through the existing Core-backed create flow

#### Scenario: Create action requests both identities

- **WHEN** a user activates the header Create button
- **THEN** a modal requests required storage `name`, declared `$id`, entity type, and display name fields
- **AND** submitting valid values creates the resource and refreshes the list

#### Scenario: Metadata-only row shows the storage name

- **WHEN** the list renders a Catalog Schema whose Core storage name differs from its declared body `$id`
- **THEN** the `Name` column shows the decoded storage name
- **AND** no content request is made merely to display the declared `$id`

#### Scenario: A read-only admin is offered no mutating actions

- **WHEN** a read-only admin opens the catalog-schema list
- **THEN** no create, duplicate, or delete action is offered
