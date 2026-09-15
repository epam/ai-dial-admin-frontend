## ADDED Requirements

### Requirement: A platform-bucket toolset exposes its catalog metadata

The system SHALL let an admin attach a catalog schema to a platform-bucket toolset and edit the
catalog values it describes, using the shared `catalog-properties-editing` mechanism. The
platform-toolset resource SHALL round-trip `catalog_schema_id` and `catalog_properties`.

A user-bucket toolset SHALL be offered the same editing, with the same split in who rejects an
invalid write that applies to applications: Core answers `400` for a user-bucket resource, while a
platform-bucket one is rejected only at merged-configuration assembly.

#### Scenario: Catalog metadata is offered on a toolset

- **WHEN** an admin opens a toolset's detail view in either bucket
- **THEN** the catalog schema selection and, once a schema is selected, its values editor are offered

#### Scenario: The two fields survive a save

- **WHEN** an admin attaches a schema, fills in values, and saves the toolset
- **THEN** both `catalog_schema_id` and `catalog_properties` are written to Core and reappear on
  reload

#### Scenario: The Tools tab is unaffected

- **WHEN** an admin opens a toolset carrying catalog metadata
- **THEN** its Tools tab behaves exactly as before
