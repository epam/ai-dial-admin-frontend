## ADDED Requirements

### Requirement: Config-file reads are available for Aliases
The client SHALL accept `aliases` as a readable config-file entity type, listing alias names from
`/v1/admin/config/file/aliases` and reading one alias from `/v1/admin/config/file/aliases/{name}`, and SHALL keep
every other non-readable type refused as before.

#### Scenario: Alias names are listed from the file population
- **WHEN** the client lists names for the `aliases` type
- **THEN** it requests `/v1/admin/config/file/aliases` and returns the names Core reports

#### Scenario: A file-declared alias is read by name
- **WHEN** the client reads the alias `assistant-v1` from the config-file population
- **THEN** it requests `/v1/admin/config/file/aliases/assistant-v1` and returns the entity

#### Scenario: Non-readable types stay refused
- **WHEN** the client is asked for the `keys` type
- **THEN** it answers `TypeNotReadable` without issuing a request
