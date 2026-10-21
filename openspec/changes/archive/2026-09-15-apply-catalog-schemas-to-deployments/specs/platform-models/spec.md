## ADDED Requirements

### Requirement: The Catalog model detail view exposes its catalog metadata

The system SHALL let an admin attach a catalog schema to a Catalog model and edit the catalog values
it describes, using the shared `catalog-properties-editing` mechanism. The model resource SHALL
round-trip `catalog_schema_id` and `catalog_properties` through its Core read and write.

Placement SHALL be consistent across every surface the mechanism is offered on, so an admin finds
catalog metadata in the same place on a model as on an interceptor, application, or toolset.

#### Scenario: Catalog metadata is offered on a Catalog model

- **WHEN** an admin opens a Catalog model's detail view
- **THEN** the catalog schema selection and, once a schema is selected, its values editor are offered

#### Scenario: The two fields survive a save

- **WHEN** an admin attaches a schema, fills in values, and saves the model
- **THEN** both `catalog_schema_id` and `catalog_properties` are written to Core and reappear on
  reload

#### Scenario: A model with no catalog schema is unchanged

- **WHEN** an admin opens a Catalog model carrying no `catalog_schema_id`
- **THEN** every other tab behaves exactly as before, and no values editor is shown
