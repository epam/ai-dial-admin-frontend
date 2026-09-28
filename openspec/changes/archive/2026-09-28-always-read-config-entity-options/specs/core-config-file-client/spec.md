## MODIFIED Requirements

### Requirement: The two Core populations of one entity type are read as a union
DIAL Core keeps the entities of a given type in two places, and its merged runtime configuration is the union of both: entities written through its API, listed by the metadata route, and entities defined in configuration files, listed by the config-file route. Core validates a reference against that merged set. The system SHALL compose both reads when offering an entity as a selectable option, so the offered set matches the set Core will accept. Both reads SHALL be issued independently of whether the admin backend is configured (`DIAL_ADMIN_API_URL` set or unset). The API-written read is unaffected by that flag and SHALL always be issued. An optional `showOnlyConfigFiles` parameter (default `false`) inverts this behaviour: when `true`, the API-written (metadata) read is skipped entirely and the config-file read is always issued.

#### Scenario: Both populations appear as options
- **WHEN** options of a given entity type are requested for a picker
- **THEN** the result contains entries from both the API-written population and the config-file population

#### Scenario: The union is not sourced from the admin backend
- **WHEN** the union is composed
- **THEN** both halves come from DIAL Core, and no admin-backend request contributes to it — an admin-backend list may contain entities not yet present in Core, which would be offered and then rejected on write

#### Scenario: One population failing does not empty the picker
- **WHEN** one of the two reads fails and the other succeeds
- **THEN** the successful population is still offered, and the failure is reported rather than silently reducing the option set

#### Scenario: Both populations failing is reported
- **WHEN** both reads fail
- **THEN** the caller receives a failure rather than an empty option set

#### Scenario: The config-file read runs without the admin backend
- **WHEN** `DIAL_ADMIN_API_URL` is unset and options of any entity type are requested
- **THEN** both the API-written and config-file reads are issued
- **AND** the result includes any config-file population returned by DIAL Core

#### Scenario: The config-file read runs with the admin backend configured
- **WHEN** `DIAL_ADMIN_API_URL` is set and options of any entity type are requested
- **THEN** both the API-written and config-file reads are issued

#### Scenario: `showOnlyConfigFiles=true` skips the API-written read
- **WHEN** options of a given entity type are requested with `showOnlyConfigFiles: true`
- **THEN** the API-written (metadata) read is not issued, and the result contains only entries from the config-file population

#### Scenario: `showOnlyConfigFiles=true` always issues the config-file read
- **WHEN** options are requested with `showOnlyConfigFiles: true`
- **THEN** the config-file read is issued regardless of whether `DIAL_ADMIN_API_URL` is configured
- **AND** the API-written read is still skipped

### Requirement: A picker read can be scoped to config-file entities only
The `getConfigEntityOptions` and `readConfigEntities` functions SHALL accept an optional
`showOnlyConfigFiles: boolean` parameter (default `false`). When `true`, the function SHALL skip the
API-written (asset-metadata) read and SHALL always issue the config-file read. When `false` (or absent),
the function SHALL issue both the API-written and config-file reads regardless of whether
`DIAL_ADMIN_API_URL` is set.

#### Scenario: `showOnlyConfigFiles: true` skips the asset-metadata read
- **WHEN** `getConfigEntityOptions` or `readConfigEntities` is called with `showOnlyConfigFiles: true`
- **THEN** no asset-metadata (API-written) request is issued for that entity type

#### Scenario: `showOnlyConfigFiles: true` issues the config-file read
- **WHEN** `getConfigEntityOptions` is called with `showOnlyConfigFiles: true`
- **THEN** the config-file read is issued regardless of whether `DIAL_ADMIN_API_URL` is configured

#### Scenario: Omitting the parameter reads both Core populations
- **WHEN** `getConfigEntityOptions` or `readConfigEntities` is called without the parameter
- **THEN** both the asset-metadata and config-file reads are issued regardless of whether `DIAL_ADMIN_API_URL` is configured
