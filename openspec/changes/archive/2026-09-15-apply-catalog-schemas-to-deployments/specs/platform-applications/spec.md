## ADDED Requirements

### Requirement: A platform-bucket application exposes its catalog metadata

The system SHALL let an admin attach a catalog schema to a platform-bucket application and edit the
catalog values it describes, using the shared `catalog-properties-editing` mechanism. The
platform-application resource SHALL round-trip `catalog_schema_id` and `catalog_properties`.

A user-bucket application SHALL be offered the same editing, with one difference in who rejects an
invalid write: DIAL Core validates a user-bucket resource on write and answers `400`, whereas a
platform-bucket resource is only rejected later, when Core assembles its merged configuration. The
client-side gate applies to both.

#### Scenario: Catalog metadata is offered on an application

- **WHEN** an admin opens an application's detail view in either bucket
- **THEN** the catalog schema selection and, once a schema is selected, its values editor are offered

#### Scenario: The two fields survive a save

- **WHEN** an admin attaches a schema, fills in values, and saves the application
- **THEN** both `catalog_schema_id` and `catalog_properties` are written to Core and reappear on
  reload

#### Scenario: Core's own rejection is surfaced for a user-bucket application

- **WHEN** Core rejects a user-bucket application's catalog values with a `400`
- **THEN** the error notification carries Core's message rather than a generic failure
