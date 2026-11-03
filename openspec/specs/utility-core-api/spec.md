# utility-core-api Specification

## Purpose
`CoreUtilityApi`'s direct-to-Core deployment listing/lookup and user-identity read (`id` and `email`
only; roles and access come from `user-org-units-access`). Created as part of migrating `UtilityApi`'s admin-backend proxy endpoints
to DIAL Core directly, alongside the global-settings singleton now owned by `SettingsApi`.

## Requirements

### Requirement: Deployment listing and lookup read DIAL Core directly
The system SHALL provide a server-side client (`CoreUtilityApi`) that lists deployments and checks a single deployment by name against DIAL Core (`GET /v1/deployments` and `GET /v1/deployments/{name}`), authenticated with the caller's JWT through the existing Core client pipeline, instead of the admin backend's proxy of the same routes.

#### Scenario: Deployment listing goes to Core, not the admin backend
- **WHEN** all deployments are requested
- **THEN** the request goes to `DIAL_CORE_API_URL`, never to the admin-backend host

#### Scenario: A single deployment is checked by name with a GET, not a HEAD
- **WHEN** a caller checks whether a deployment name already exists
- **THEN** the client issues a `GET` request to Core's deployment-by-name route, because Core registers only `GET` for that route and a `HEAD` request would 404 unconditionally
- **AND** a 404 response resolves to `null`, matching the existing "name is unique" contract

### Requirement: A caller's own identity read comes from DIAL Core
The system SHALL read the caller's own identity only from DIAL Core's `GET /v1/user/info` through
`CoreUtilityApi.getUserInfo`, whatever `DIAL_ADMIN_API_URL` is. The returned `UserInfo` SHALL carry `id`
(`userId`, else `project`) and `email` (the `email` claim) and SHALL NOT carry roles. The admin backend's
identity endpoint and the `getUserInfo` picker in `src/app/api/api.ts` SHALL NOT exist.

#### Scenario: Admin backend configured still reads identity from Core
- **WHEN** `DIAL_ADMIN_API_URL` is set and a caller requests the current user's identity
- **THEN** the request goes to DIAL Core's `GET /v1/user/info`, never to the admin backend

#### Scenario: Identity is derived from Core's response
- **WHEN** Core answers `/v1/user/info`
- **THEN** `id` comes from `userId` or `project` and `email` from the `email` claim
- **AND** the result has no `roles` field

### Requirement: The global-settings singleton has one owner
The system SHALL expose reads and writes of DIAL Core's global-settings singleton (`v1/settings/platform/global`) — the unconditional read used by `getGlobalInterceptors`, and the etag-conditional read/write the System Properties page uses — from a single client (`SettingsApi`), sharing one URL constant. No other client SHALL address this resource.

#### Scenario: System properties are read and written through SettingsApi
- **WHEN** the System Properties page reads or updates global settings
- **THEN** the request goes through `SettingsApi`, conditional on the given etag (`If-None-Match` for reads, `If-Match` for writes)

#### Scenario: The unconditional read used for global interceptors is unaffected
- **WHEN** `getGlobalInterceptors` reads the global-settings blob
- **THEN** it uses `SettingsApi.globalSettings`, with no etag header, exactly as before this change

### Requirement: The System Properties interceptor picker reads Core's unioned populations
The System Properties page's interceptor picker SHALL read from the same Core-direct, two-population union other Core-populated pickers use (`readConfigEntities`), instead of the admin-backend-only entity listing, and SHALL surface a partial-read warning the same way those other pages do.

#### Scenario: The picker includes config-file-declared interceptors
- **WHEN** the System Properties page loads its interceptor picker
- **THEN** the offered interceptors include both API-written and config-file-declared ones, matching what `platform-models`' interceptor picker offers

#### Scenario: A partial read surfaces a warning
- **WHEN** one of the two population reads fails while the other succeeds
- **THEN** the page still renders the surviving population
- **AND** shows the same "incomplete option list" notification `ModelView` shows for the same condition

### Requirement: Caller-scoped option reads come from DIAL Core
`CoreUtilityApi` SHALL read runner schemas from `GET /v1/application_type_schemas/schemas` and the caller's deployments from `GET /openai/models` and `GET /openai/applications`. These lists are readable by any user, and the deployment lists SHALL be treated as exactly the valid dependency choices for that caller. A server helper SHALL map them to the picker shapes and degrade a failed read to an empty list with an option-list-unavailable warning.

#### Scenario: Deployment list read
- **WHEN** the caller's models are requested
- **THEN** `GET /openai/models` is called and each `{id, display_name}` becomes a picker option, falling back to the id for the label

#### Scenario: Failed read
- **WHEN** a caller-scoped read fails
- **THEN** that picker is empty and the warning is raised, and the other pickers still load
