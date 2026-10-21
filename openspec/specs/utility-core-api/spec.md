# utility-core-api Specification

## Purpose
`CoreUtilityApi`'s direct-to-Core deployment listing/lookup and user-identity read, and the
`getUserInfo` picker in `src/app/api/api.ts` that chooses between it and the admin-backend-routed
`UtilityApi.getUserInfo`. Created as part of migrating `UtilityApi`'s admin-backend proxy endpoints
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

### Requirement: A caller's own identity read prefers the admin backend when configured
The system SHALL expose a single `getUserInfo(token)` entry point (in `src/app/api/api.ts`) that every consumer calls, which routes to the admin backend's identity endpoint when `DIAL_ADMIN_API_URL` is configured, and to DIAL Core's `GET /v1/user/info` directly otherwise. No consumer SHALL call either underlying client's `getUserInfo` directly.

#### Scenario: Admin backend configured routes to the admin backend
- **WHEN** `DIAL_ADMIN_API_URL` is set and a caller requests the current user's identity
- **THEN** the request goes to the admin backend's security-info endpoint
- **AND** the returned `roles` reflect the admin backend's own `FULL_ADMIN`/`READ_ONLY_ADMIN` mapping

#### Scenario: Admin backend not configured routes to Core directly
- **WHEN** `DIAL_ADMIN_API_URL` is unset and a caller requests the current user's identity
- **THEN** the request goes to DIAL Core's `GET /v1/user/info`
- **AND** the returned `id`/`email` are derived from Core's response (`userId`/`project` for `id`, the `email` claim for `email`)
- **AND** `roles` is empty — DIAL Core reports only raw, unmapped roles, which are not translated into `FULL_ADMIN`/`READ_ONLY_ADMIN`

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
