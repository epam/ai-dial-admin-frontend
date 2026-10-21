## ADDED Requirements

### Requirement: The Catalog interceptor detail view exposes its catalog metadata

The system SHALL let an admin attach a catalog schema to a Catalog interceptor and edit the catalog
values it describes, using the shared `catalog-properties-editing` mechanism. The interceptor
resource SHALL round-trip `catalog_schema_id` and `catalog_properties` through its Core read and
write, and its model SHALL carry both fields, which it does not today.

#### Scenario: Catalog metadata is offered on a Catalog interceptor

- **WHEN** an admin opens a Catalog interceptor's detail view
- **THEN** the catalog schema selection and, once a schema is selected, its values editor are offered

#### Scenario: The two fields survive a save

- **WHEN** an admin attaches a schema, fills in values, and saves the interceptor
- **THEN** both `catalog_schema_id` and `catalog_properties` are written to Core and reappear on
  reload

#### Scenario: An interceptor with no catalog schema is unchanged

- **WHEN** an admin opens a Catalog interceptor carrying no `catalog_schema_id`
- **THEN** the Properties and parameter-schema tabs behave exactly as before
