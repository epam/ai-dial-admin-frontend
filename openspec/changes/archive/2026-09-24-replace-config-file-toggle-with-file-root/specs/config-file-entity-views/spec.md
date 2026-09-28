## MODIFIED Requirements

### Requirement: Config-file entity population is exposed through file roots
The system SHALL expose DIAL Core configuration-file entities through a synthetic, flat, read-only `file` root in the shared FileManager rather than through a global `showConfigFiles` toggle or a swapped list component. The root SHALL be available for Models, Interceptors, Translators, Routes, Roles, App Runners, Catalog Schemas, Applications, and Toolsets, regardless of whether the admin API is configured. Keys and every unsupported route SHALL NOT expose a `file` root.

#### Scenario: Platform Models shows a file root
- **WHEN** a user opens `platform-models`
- **THEN** the FileManager shows `file` and `platform` roots, with no config-file display toggle

#### Scenario: Keys has no file root
- **WHEN** a user opens `platform-keys`
- **THEN** no `file` root or config-file display toggle is rendered

#### Scenario: Applications and Toolsets expose three roots
- **WHEN** Catalog is enabled and a user opens Assets Applications or Assets Toolsets
- **THEN** the FileManager shows `file`, `platform`, and `public` roots in that order

#### Scenario: File root remains when Catalog is disabled
- **WHEN** Catalog is disabled and a user opens Assets Applications or Assets Toolsets
- **THEN** the FileManager shows `file` and `public` roots, does not show `platform`, and does not request platform resources

### Requirement: File-root names load with the initial root batch and without resource-body fan-out
The system SHALL request `GET /v1/admin/config/file/{type}` once when a supported listing mounts, alongside its physical-root reads. It SHALL use the names response directly and SHALL NOT make a per-name detail read to populate the list. Selecting the already-loaded `file` root SHALL reuse the mounted-listing cache without another names request. A failed names read SHALL leave successful physical roots available, shall not be represented as a successful empty root, and SHALL follow the listing's established request-error notification behavior.

#### Scenario: Initial listing reads file names once
- **WHEN** a user opens a supported listing
- **THEN** one names-only request for the view's mapped config-file type is made with its physical-root reads and no entity-body request is made for each name

#### Scenario: Opening file reuses the initial names read
- **WHEN** a user opens an already-mounted supported `file` root
- **THEN** the system displays the cached names without another request

#### Scenario: A failed file-root read is visible
- **WHEN** the config-file names request fails
- **THEN** the user receives the established error notification and the system does not represent the failed request as a successful empty result

### Requirement: File-root entries are name-only and immutable
The system SHALL render file-root entries with only a name data column and an open-in-new-tab row action. While the file root is active, it SHALL offer no create, import, export, delete, bulk delete, duplicate, rename, move, drag-and-drop, selection mutation, folder creation, or folder-management action.

#### Scenario: File root has no metadata columns
- **WHEN** a user browses a file root
- **THEN** the list shows the entity names and does not show resource author, timestamp, version, etag, folder, or provenance fields

#### Scenario: File row actions are read-only
- **WHEN** a user opens a file-root row action menu
- **THEN** open-in-new-tab is available and no mutating action is available

### Requirement: File-root rows preserve existing detail source behavior
The system SHALL open a file-root row through its existing platform or asset detail route. Except for Catalog Schemas, the route SHALL append `configFile=true`, using `&` if a query string already exists. Applications and Toolsets SHALL use the bare `{id}` detail path with the flag and SHALL NOT carry a public-bucket `path` parameter. Catalog Schema file rows SHALL navigate to the ordinary encoded `$id` detail route without `configFile=true`, preserving its API-first/file-fallback resolver.

#### Scenario: A file-backed application opens the platform-shaped detail URL
- **WHEN** a user opens an application from the file root
- **THEN** the system navigates to `/assets-applications/{id}?configFile=true` without a `path` parameter

#### Scenario: Open in new tab preserves file source
- **WHEN** a user activates open-in-new-tab for a non-Catalog file row
- **THEN** the new tab URL includes `configFile=true` exactly as a row click would

#### Scenario: A Catalog Schema file row uses its existing fallback address
- **WHEN** a user opens a Catalog Schema from the file root
- **THEN** the system navigates to `/platform-catalog-schemas/{encoded-id}` without `configFile=true`

### Requirement: Config-file detail views remain read-only
When a non-Catalog file-root row opens a supported platform or asset detail route with `configFile=true`, the system SHALL retain the existing `configFileApi` body read, read-only fields and actions, and hidden ADMIN|CORE JSON format selector. Leaving that route SHALL restore ordinary editability on subsequent views.

#### Scenario: A file-root model detail is read-only
- **WHEN** a user opens a model from the file root
- **THEN** the model body is read through `configFileApi`, no mutating control is enabled, and the JSON editor has no ADMIN|CORE selector

#### Scenario: Read-only state does not leak
- **WHEN** a user leaves a config-file-sourced detail view
- **THEN** a subsequently opened ordinary resource detail view remains editable according to its normal permissions

## REMOVED Requirements

### Requirement: `showConfigFiles` toggle exists in `AppContext`
**Reason**: Config-file population is represented by the per-view `file` root instead of global persisted display state.
**Migration**: Remove the context field, toggle function, and local-storage key; use the FileManager root selection.

### Requirement: The toggle control is rendered only where it applies
**Reason**: The `file` root replaces the title-adjacent toggle.
**Migration**: Use the supported-route source registry to determine whether a FileManager includes `file`.

### Requirement: Toggling swaps the list component in place
**Reason**: FileManager renders all sources in one hierarchy.
**Migration**: Remove `ConfigFileListSwap`, `ConfigFileEntityList`, and view wrappers that only compose the swapped list.

### Requirement: Config-file entity data is fetched lazily, only when the toggle is on
**Reason**: Lazy access is now associated with opening `file/`, not toggling a global mode.
**Migration**: Use source-aware lazy root loading.

### Requirement: The config-file-backed list shows only entity names
**Reason**: The name-only behavior is now a FileManager file-root requirement.
**Migration**: Use the source-aware file-root column/action configuration.

### Requirement: A config-file entity row links to its platform/asset detail route
**Reason**: Navigation is now defined for source-aware FileManager rows, including Catalog Schema's fallback route.
**Migration**: Use file-row navigation instead of the retired standalone grid link handler.

### Requirement: A detail page opened with `configFile=true` renders read-only, sourced from Core's config file
**Reason**: The behavior remains but is restated for file-root navigation and expanded to Translators.
**Migration**: Preserve existing detail handling and add Translator support.

### Requirement: App Runners is a covered config-file entity type
**Reason**: App Runner file-root coverage is included in the supported source registry.
**Migration**: Keep the `schemas` mapping, representing Core application-type schemas.
