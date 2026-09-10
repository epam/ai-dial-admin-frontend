## MODIFIED Requirements

### Requirement: The two Core populations of one entity type are read as a union
DIAL Core keeps the entities of a given type in two places, and its merged runtime configuration is the union of both: entities written through its API, listed by the metadata route, and entities defined in configuration files, listed by the config-file route. Core validates a reference against that merged set. The system SHALL therefore compose both reads when offering an entity as a selectable option, so the offered set matches the set Core will accept. The config-file route is the admin console's own configuration surface: when the admin backend is not configured (`DIAL_ADMIN_API_URL` unset), the system SHALL skip that read and resolve it as an empty population rather than issuing the request or reporting a failure. The API-written read is unaffected by that flag and SHALL always be issued.

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

#### Scenario: The config-file read is skipped without the admin backend
- **WHEN** `DIAL_ADMIN_API_URL` is unset and options of any entity type are requested
- **THEN** the config-file read is never issued
- **AND** the result still contains the API-written population
- **AND** no failure is reported for the missing config-file half

#### Scenario: The config-file read runs normally with the admin backend configured
- **WHEN** `DIAL_ADMIN_API_URL` is set and options of any entity type are requested
- **THEN** both the API-written and config-file reads are issued, as before this change
