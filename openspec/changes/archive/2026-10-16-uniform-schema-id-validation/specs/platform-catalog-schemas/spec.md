## MODIFIED Requirements

### Requirement: Catalog-schema list is flat with create, duplicate, and delete actions

The system SHALL render the catalog-schema list as a single, non-nested list of entries under the `platform` root, built on the shared asset list, exposing create, duplicate, delete, and bulk-delete actions and no folder-create, rename-folder, or move-into-folder controls. The metadata-only list SHALL label and show each resource's decoded Core storage name as `Name`; it SHALL NOT claim that a metadata row supplies the schema body's declared `$id`.

#### Scenario: List shows entries without a folder tree

- **WHEN** a user opens `/platform-catalog-schemas`
- **THEN** all catalog-schema resources are shown as direct entries with no folder-expand affordance

#### Scenario: Duplicate action creates a copy with separate identities

- **WHEN** a user opens Duplicate for a Catalog Schema with storage name `agent-schema`, declared `$id` `https://dial.example.com/catalog_schemas/agent`, and display name `Agent`
- **THEN** the modal shows Name `agent-schema-copy`, ID `https://dial.example.com/catalog_schemas/agent-copy`, and display name `Agent`
- **AND** submitting valid values sends the edited Name and ID with the source schema's remaining properties through the existing Core-backed create flow

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
- **THEN** no create, duplicate, delete, or bulk-delete action is offered

## ADDED Requirements

### Requirement: Catalog Schema create and duplicate actions check the declared ID with Core

When the user activates Create or Duplicate for an otherwise locally valid Catalog Schema form, the system SHALL call `getCatalogSchemaById` with the proposed declared `$id` before invoking the existing Core-backed create callback. The resolver SHALL treat both API-written and configuration-file Catalog Schemas as occupied declared IDs.

If the resolver returns a Catalog Schema, the system SHALL show the standard existing-ID error inline under ID, keep the active modal open, and SHALL NOT invoke the Core-backed create callback. This error SHALL participate in the form validity state and SHALL clear when the user edits ID.

If the resolver returns no Catalog Schema or fails, the system SHALL use the existing Core-backed create callback. The normal Core success or error result, including a write-time conflict response, SHALL remain visible.

#### Scenario: Core-resolved ID blocks Catalog Schema creation

- **WHEN** a user activates Create for a valid Catalog Schema form and Core resolves the proposed `$id`
- **THEN** the Create modal shows the standard existing-ID error under ID
- **AND** Create is disabled
- **AND** the Core-backed create callback is not invoked

#### Scenario: Core-resolved ID blocks Catalog Schema duplication

- **WHEN** a user activates Duplicate for a valid Catalog Schema form and Core resolves the proposed `$id`
- **THEN** the Duplicate modal shows the standard existing-ID error under ID
- **AND** Duplicate is disabled
- **AND** the Core-backed create callback is not invoked

#### Scenario: Editing an occupied Catalog Schema ID restores the active action

- **WHEN** a Catalog Schema Create or Duplicate modal displays the resolved existing-ID error
- **AND** the user changes ID to a locally valid value
- **THEN** the resolved existing-ID error is removed
- **AND** the active action is enabled when every other required field is valid

#### Scenario: An unresolved or unavailable Catalog Schema ID uses the normal action flow

- **WHEN** a user activates Create or Duplicate for a valid Catalog Schema form and the resolver returns no schema or fails
- **THEN** the system invokes the existing Core-backed create callback with the edited schema values
- **AND** the normal Core success or error result remains visible
