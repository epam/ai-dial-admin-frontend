## ADDED Requirements

### Requirement: Config-file reads are available for Routers
The client SHALL accept `routers` as a readable config-file entity type, listing router names from
`/v1/admin/config/file/routers` and reading one router from `/v1/admin/config/file/routers/{name}`, and
SHALL keep every other non-readable type refused as before.

#### Scenario: Router names are listed from the file population
- **WHEN** the client lists names for the `routers` type
- **THEN** it requests `/v1/admin/config/file/routers` and returns the names Core reports

#### Scenario: A file-declared router is read by name
- **WHEN** the client reads the router `r1` from the config-file population
- **THEN** it requests `/v1/admin/config/file/routers/r1` and returns the entity

#### Scenario: Non-readable types stay refused
- **WHEN** the client is asked for the `keys` type
- **THEN** it answers `TypeNotReadable` without issuing a request
