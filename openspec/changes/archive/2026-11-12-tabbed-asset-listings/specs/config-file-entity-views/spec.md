## ADDED Requirements

### Requirement: Config-file entity population is exposed through a config.json tab

The system SHALL expose DIAL Core configuration-file entities through a flat, read-only **config.json** tab on the
listing, rather than through a global `showConfigFiles` toggle, a swapped list component, or a synthetic `file`
folder in the file manager. The tab SHALL be available for Models, Interceptors, Translators, Routers, Routes,
Roles, App Runners, Catalog Schemas, Applications, and Toolsets, regardless of whether the admin API is configured.
Keys and every unsupported route SHALL NOT offer a config.json tab.

#### Scenario: Platform Models shows a config.json tab
- **WHEN** a user opens `platform-models`
- **THEN** the listing offers Platform and config.json tabs, with no config-file display toggle

#### Scenario: Keys has no config.json tab
- **WHEN** a user opens `platform-keys`
- **THEN** no config.json tab or config-file display toggle is rendered

#### Scenario: Applications and Toolsets expose three tabs
- **WHEN** a user opens Assets Applications or Assets Toolsets
- **THEN** the listing offers Public, Platform, and config.json tabs in that order

### Requirement: config.json names load when the listing mounts and without resource-body fan-out

The system SHALL request `GET /v1/admin/config/file/{type}` once when a supported listing mounts, so the config.json
tab's badge is known before the tab is opened. It SHALL use the names response directly and SHALL NOT make a
per-name detail read to populate the grid. Opening the tab SHALL reuse the loaded names without another request. A
failed names read SHALL leave the other tabs available, SHALL NOT be represented as a successful empty list, and
SHALL follow the listing's established request-error notification behavior.

#### Scenario: Initial listing reads config.json names once
- **WHEN** a user opens a supported listing
- **THEN** one names-only request for the view's mapped config-file type is made and no entity-body request is made for each name

#### Scenario: Opening config.json reuses the initial names read
- **WHEN** a user opens the config.json tab of an already-mounted listing
- **THEN** the system displays the loaded names without another request

#### Scenario: A failed config.json read is visible
- **WHEN** the config-file names request fails
- **THEN** the user receives the established error notification and the system does not represent the failed request as a successful empty result

### Requirement: config.json entries are name-only and immutable

The system SHALL render config.json entries with only a name data column and an open-in-new-tab row action. While
the config.json tab is active, it SHALL offer no create, import, export, delete, bulk delete, duplicate, rename,
move, drag-and-drop, selection mutation, folder creation, or folder-management action.

#### Scenario: config.json has no metadata columns
- **WHEN** a user opens the config.json tab
- **THEN** the grid shows the entity names and does not show resource author, timestamp, version, etag, folder, or provenance fields

#### Scenario: config.json row actions are read-only
- **WHEN** a user opens a config.json row action menu
- **THEN** open-in-new-tab is available and no mutating action is available

### Requirement: config.json rows preserve existing detail source behavior

The system SHALL open a config.json row through its existing platform or asset detail route. Except for Catalog
Schemas, the route SHALL append `configFile=true`, using `&` if a query string already exists. Applications and
Toolsets SHALL use the bare `{id}` detail path with the flag and SHALL NOT carry a public-bucket `path` parameter.
Catalog Schema config.json rows SHALL navigate to the ordinary encoded `$id` detail route without
`configFile=true`, preserving its API-first/file-fallback resolver.

#### Scenario: A config.json application opens the platform-shaped detail URL
- **WHEN** a user opens an application from the config.json tab
- **THEN** the system navigates to `/assets-applications/{id}?configFile=true` without a `path` parameter

#### Scenario: Open in new tab preserves config.json source
- **WHEN** a user activates open-in-new-tab for a non-Catalog config.json row
- **THEN** the new tab URL includes `configFile=true` exactly as a row click would

#### Scenario: A Catalog Schema config.json row uses its existing fallback address
- **WHEN** a user opens a Catalog Schema from the config.json tab
- **THEN** the system navigates to `/platform-catalog-schemas/{encoded-id}` without `configFile=true`

### Requirement: The config.json tab needs config-file access

The config.json tab SHALL be offered, in the listing and in the entity picker, only to callers who can read the
config-file endpoints. A caller without full admin access SHALL NOT see it, and no names read SHALL be made for it.

#### Scenario: Non-admin opens Assets Applications
- **WHEN** a caller without full admin access opens Assets Applications
- **THEN** the tabs exclude config.json, and no `GET /v1/admin/config/file/{type}` request is made

## MODIFIED Requirements

### Requirement: Config-file detail views remain read-only

When a non-Catalog config.json row opens a supported platform or asset detail route with `configFile=true`, the system SHALL retain the existing `configFileApi` body read, read-only fields and actions, and hidden ADMIN|CORE JSON format selector. Leaving that route SHALL restore ordinary editability on subsequent views.

#### Scenario: A config.json model detail is read-only
- **WHEN** a user opens a model from the config.json tab
- **THEN** the model body is read through `configFileApi`, no mutating control is enabled, and the JSON editor has no ADMIN|CORE selector

#### Scenario: Read-only state does not leak
- **WHEN** a user leaves a config-file-sourced detail view
- **THEN** a subsequently opened ordinary resource detail view remains editable according to its normal permissions

### Requirement: App Runners map to Core application-type schemas

The system SHALL map Platform App Runners' config.json tab to Core's `schemas` config-file type, representing application-type schemas rather than a standalone app-runner configuration collection.

#### Scenario: App Runner names come from schemas
- **WHEN** a user opens Platform App Runners' config.json tab
- **THEN** the system requests Core's `schemas` config-file type

## REMOVED Requirements

### Requirement: Config-file entity population is exposed through file roots
**Reason**: The synthetic `file` root no longer exists; the file manager has a single `public/` root.
**Migration**: Replaced by "Config-file entity population is exposed through a config.json tab".

### Requirement: File-root names load with the initial root batch and without resource-body fan-out
**Reason**: There is no root batch; names load when the listing mounts for the tab badge.
**Migration**: Replaced by "config.json names load when the listing mounts and without resource-body fan-out".

### Requirement: File-root entries are name-only and immutable
**Reason**: Entries are rendered by the config.json grid, not a file-manager root.
**Migration**: Replaced by "config.json entries are name-only and immutable".

### Requirement: File-root rows preserve existing detail source behavior
**Reason**: Renamed with the tab; behavior is unchanged.
**Migration**: Replaced by "config.json rows preserve existing detail source behavior".

### Requirement: The file root needs config-file access
**Reason**: Access now gates the config.json tab, not a root.
**Migration**: Replaced by "The config.json tab needs config-file access".
