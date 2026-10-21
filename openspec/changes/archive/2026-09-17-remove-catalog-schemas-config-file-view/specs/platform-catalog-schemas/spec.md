## ADDED Requirements

### Requirement: A file-declared schema is reachable at its own address, not through a list

This surface owns the catalog schemas written through DIAL Core's API. It SHALL NOT offer the
`showConfigFiles` toggle and SHALL NOT present a config-file-backed list: the file-declared half of
the population is operator-managed in `aidial.config.json`, and nothing here can create, edit, or
delete it.

A file-declared schema SHALL still open at the ordinary detail address. Because Core keys its
configuration-file catalog schemas by `$id` — the same identity this surface uses in the route — one
address resolves either population: the system SHALL read the API-written resource first and, when
none exists, SHALL read the configuration-file half by that `$id`. A schema resolved that way SHALL
render read-only, and a `$id` in neither population SHALL be reported as not found.

#### Scenario: The list offers no config-file toggle

- **WHEN** a user opens `/platform-catalog-schemas`
- **THEN** no `Show config entities` toggle is rendered next to the page title, and the list shows
  the API-written schemas only

#### Scenario: A schema a deployment points at opens even when only the configuration file declares it

- **WHEN** a user follows a deployment's catalog-schema selection to its detail view, and that `$id`
  has no API-written resource
- **THEN** the schema the configuration file declares is shown

#### Scenario: A file-declared schema is read-only

- **WHEN** the detail view resolves a schema from the configuration file
- **THEN** it renders with no save, delete, or create action

#### Scenario: An unknown id is not found

- **WHEN** a user opens a detail address whose `$id` is in neither population
- **THEN** the page reports it as not found rather than rendering an empty schema

## REMOVED Requirements

### Requirement: The config-file population is read on the same terms as every other covered view

**Reason**: Issue #4605 — the toggle this required does not belong on `Catalog ▸ Catalog Schemas`.
The requirement was written because Core exposes `catalog_schemas` on its file-config route, which
says what Core can answer, not which views the `config-file-entity-views` surface covers.

**Migration**: None. Nothing was written through the config-file list, and the file-declared half
stays readable at the detail address per the requirement added above.
