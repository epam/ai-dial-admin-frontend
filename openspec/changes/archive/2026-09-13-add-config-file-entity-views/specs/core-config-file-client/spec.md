## ADDED Requirements

### Requirement: A full-entity population can be read for a config-file type
The system SHALL provide a way to read the full population of a config-file entity type — not just its names — because a grid displaying these entities needs their fields, and building that from the name-only listing plus a second per-name read for every consumer would mean fetching each entity twice. This SHALL be implemented as a composite over the existing name listing and per-entity read: list the names, then read each one, since Core's config-file list route itself never returns more than a name per entry. A name that fails to read SHALL be reported as a partial-population failure — the same distinction the existing union read already makes — rather than silently dropped.

#### Scenario: The full population of a readable type is returned
- **WHEN** the full population of a readable config-file type is requested
- **THEN** every entity of that type declared in Core's configuration file is returned in full, not reduced to a name

#### Scenario: One entity failing to read does not fail the whole population
- **WHEN** one entity's read fails while reading a type's full population
- **THEN** the successfully read entities are still returned, and the failure is reported alongside them

#### Scenario: A non-readable type is still rejected before any request
- **WHEN** a full-population read is requested for a type outside the readable allow-list
- **THEN** the client refuses without issuing any request, exactly as the existing name listing does

### Requirement: Config-file reads are available for Models, Routes, Applications, and Toolsets
The readable-type allow-list SHALL include `Models`, `Routes`, `Applications`, and `Toolsets`, in addition to the `Interceptors`, `Roles`, and `Settings` it already includes. `Keys` SHALL remain excluded — Core refuses that route unconditionally for every caller.

#### Scenario: A model can be read from the config-file route
- **WHEN** a config-file read is issued for the `Models` type
- **THEN** the client issues the request rather than refusing it locally

#### Scenario: Keys stays refused
- **WHEN** a config-file read is issued for the `Keys` type
- **THEN** the client refuses locally, as it does today

### Requirement: A picker read can be scoped to config-file entities only
`getConfigEntityOptions` and `readConfigEntities` SHALL accept a `showOnlyConfigFiles: boolean` parameter, defaulting to `false`. When `true`: the asset-metadata (API-written) half of the union SHALL be skipped, and the config-file half SHALL always be requested regardless of whether `DIAL_ADMIN_API_URL` is set. When omitted or `false`, behavior SHALL be unchanged from before this parameter existed.

#### Scenario: Requesting config-file-only options skips the asset-metadata read
- **WHEN** `getConfigEntityOptions` is called with `showOnlyConfigFiles: true`
- **THEN** no asset-metadata request is issued, and the result contains only config-file-origin options

#### Scenario: The config-file read runs even without the admin backend when requested
- **WHEN** `DIAL_ADMIN_API_URL` is unset and `getConfigEntityOptions` is called with `showOnlyConfigFiles: true`
- **THEN** the config-file read is issued and its results are returned, rather than resolving to an empty population

#### Scenario: Omitting the parameter changes nothing
- **WHEN** `getConfigEntityOptions` is called without `showOnlyConfigFiles`
- **THEN** the result is identical to what this function returned before the parameter was added

## MODIFIED Requirements

### Requirement: The two Core populations of one entity type are read as a union
DIAL Core keeps the entities of a given type in two places, and its merged runtime configuration is the union of both: entities written through its API, listed by the metadata route, and entities defined in configuration files, listed by the config-file route. Core validates a reference against that merged set. The system SHALL therefore compose both reads when offering an entity as a selectable option, so the offered set matches the set Core will accept. The config-file route is the admin console's own configuration surface: when the admin backend is not configured (`DIAL_ADMIN_API_URL` unset) and the caller has not requested `showOnlyConfigFiles`, the system SHALL skip that read and resolve it as an empty population rather than issuing the request or reporting a failure. The API-written read is unaffected by that flag and SHALL always be issued, unless the caller has requested `showOnlyConfigFiles`, in which case the API-written read is itself skipped (see "A picker read can be scoped to config-file entities only").

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

#### Scenario: The config-file read is skipped without the admin backend, when not requested
- **WHEN** `DIAL_ADMIN_API_URL` is unset, `showOnlyConfigFiles` is not requested, and options of any entity type are requested
- **THEN** the config-file read is never issued
- **AND** the result still contains the API-written population
- **AND** no failure is reported for the missing config-file half

#### Scenario: The config-file read runs normally with the admin backend configured
- **WHEN** `DIAL_ADMIN_API_URL` is set and options of any entity type are requested
- **THEN** both the API-written and config-file reads are issued, as before this change
