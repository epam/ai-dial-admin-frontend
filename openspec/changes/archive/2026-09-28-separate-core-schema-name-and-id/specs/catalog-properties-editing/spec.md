## MODIFIED Requirements

### Requirement: A deployment can be pointed at a catalog schema

The system SHALL let an admin select a Catalog Schema for a deployment, store the selected schema's declared raw `$id` as `catalog_schema_id`, and clear it again. A Core resource storage name or path SHALL be used only to retrieve or navigate to the schema, never as the deployment reference. The selection SHALL survive a save and reopen.

#### Scenario: A schema is selected and persists

- **WHEN** an admin selects a Catalog Schema stored under `agent-schema` with declared `$id` `https://dial.example.com/catalog_schemas/agent` and saves
- **THEN** the deployment's `catalog_schema_id` is `https://dial.example.com/catalog_schemas/agent`
- **AND** reopening the deployment shows the same schema as selected

#### Scenario: The selection can be cleared

- **WHEN** an admin clears the selected schema and saves
- **THEN** the deployment carries no `catalog_schema_id`
- **AND** the values editor is no longer offered

#### Scenario: A read-only admin cannot change the selection

- **WHEN** a read-only admin opens a deployment carrying a catalog schema
- **THEN** the selection is shown but cannot be changed, and no values are editable

#### Scenario: The selected schema is opened by storage address but identified by declared id

- **WHEN** an admin opens the selected schema in a new tab
- **THEN** the detail route addresses the schema's Core storage path
- **AND** the opened detail view shows the schema's declared `$id`
