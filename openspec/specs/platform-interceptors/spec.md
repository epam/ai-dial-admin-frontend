## Purpose

The `Assets > Interceptors` admin surface: a flat, unversioned list and two-tab detail view over DIAL Core's `interceptors/platform` config resources — a first-class, server-validated Core resource type — read and written directly through Core rather than the admin backend. It also introduces `AssetInterceptorOrigin`, widening every entity-surface interceptor-attach picker to offer both the admin-BE-tracked population and this Core-only asset population.

## Requirements

### Requirement: Assets > Interceptors menu entry
The system SHALL add an `Interceptors` menu item to the Assets section of the admin menu, directly
after `App Runners`, linking to a new `/assets-interceptors` route.

#### Scenario: Interceptors follows App Runners in the Assets section
- **WHEN** the Assets section of the menu renders
- **THEN** `Interceptors` appears immediately after `App Runners` and before `Applications`

### Requirement: Interceptor asset list is flat with create and delete actions
The system SHALL render the interceptor asset list as a single, non-nested list of entries under the
`platform` root, built on the shared asset list, exposing create, delete, and bulk-delete actions and
no folder-create, rename-folder, or move-into-folder controls.

#### Scenario: List shows entries without a folder tree
- **WHEN** a user opens `/assets-interceptors`
- **THEN** all interceptor resources are shown as direct entries with no folder-expand affordance

#### Scenario: No create-folder or move action is present
- **WHEN** a user opens the interceptor asset list toolbar and row actions
- **THEN** neither a create-folder action nor a move-to-folder action is offered

#### Scenario: Create action opens the interceptor create modal
- **WHEN** a user activates the create action in the list toolbar
- **THEN** a modal opens requesting the interceptor's name and display name, and submitting it
  creates the resource and navigates to its detail view

#### Scenario: Bulk delete removes the selected interceptors
- **WHEN** a user selects several interceptors and confirms bulk delete
- **THEN** each selected interceptor is deleted and the list refreshes without them

#### Scenario: A read-only admin is offered no mutating actions
- **WHEN** a read-only admin opens the interceptor asset list
- **THEN** no create, delete, or bulk-delete action is offered

### Requirement: Interceptor asset list columns are metadata-only
The system SHALL show name, author, created-at, and updated-at columns for interceptor assets, all
sourced from Core's resource metadata, and SHALL NOT fetch each row's content to populate the list.

#### Scenario: Listing issues no per-row content request
- **WHEN** the interceptor asset list loads
- **THEN** only metadata requests are issued, with no content request per row

#### Scenario: Timestamps come from Core metadata
- **WHEN** the interceptor asset list renders
- **THEN** the created-at and updated-at columns are populated from the Core metadata node's
  `createdAt` and `updatedAt` fields, each rendered as a localized date rather than raw epoch
  milliseconds

### Requirement: Interceptor names follow Core's plain entity-name rule
The system SHALL treat an interceptor's name as a plain Core entity name — using the same shared name field and validation the `Assets > Models` create form already uses — and SHALL NOT apply any URI-encoding or `$id`-style handling to it, unlike an app runner's URI-shaped `$id`.

#### Scenario: The create form uses the shared name field
- **WHEN** a user opens the interceptor create form
- **THEN** the same name/display-name fields and validation `Assets > Models` uses are shown, not a
  bespoke id control

#### Scenario: A valid name creates the resource
- **WHEN** a user submits a valid name
- **THEN** the resource is created under `interceptors/platform/{name}` and the list/detail view
  address it by that plain name

### Requirement: Interceptor asset detail view tab set
The system SHALL render an interceptor asset's detail view with exactly two tabs, `Properties` and `Configuration`, and SHALL NOT include a `Features` tab, an `Audit` tab, a Core-sync status banner, or any reverse-index tab showing which other entities reference this interceptor.

#### Scenario: Detail view renders exactly Properties and Configuration
- **WHEN** a user opens an interceptor asset's detail view
- **THEN** the tab list contains exactly `Properties` and `Configuration`

#### Scenario: No Audit tab, sync banner, or reverse-index tab
- **WHEN** a user opens an interceptor asset's detail view
- **THEN** no `Audit` tab, Core-sync status banner, `Applications`, `ApplicationRunners`, or
  `Entities` tab is shown, since no admin-BE index of references exists for a Core-only resource

### Requirement: Properties tab content
The system SHALL render the interceptor asset's Properties tab with display name, description, icon,
endpoint (or the typed `interfaces` alternative), override name, forward-auth-token, and topics,
composed from the same individual controls `Assets > Models`' Properties tab uses rather than
reusing the entity-side `InterceptorProperties` wrapper, which renders a container/deployment
`SourceField` that has no meaning for a Core-only resource.

#### Scenario: Properties are editable and persist
- **WHEN** a user edits a Properties field and saves
- **THEN** the value is stored on the interceptor resource and reappears on reload

### Requirement: No Features tab
DIAL Core never reads an interceptor's `features` switches — every request-handling controller for interceptors reads only `overrideName`; the model-capability switches and `rate`/`tokenize`/`truncate_prompt` endpoints exist on the shared `Deployment` base class but are consulted only on the chat-completion/responses pipeline for Models and Applications, which an interceptor does not participate in as the invoked deployment. The system SHALL NOT render a Features tab on the interceptor asset detail view, since its switches would control nothing.

#### Scenario: No Features tab is present
- **WHEN** a user opens an interceptor asset's detail view
- **THEN** no Features tab is shown

### Requirement: Configuration tab is Core-direct
The system SHALL populate the interceptor asset's Configuration tab by reading its schema from DIAL Core's own generic deployment-configuration route (`GET v1/deployments/{name}/configuration`), which proxies to the `features.configurationEndpoint` of whichever deployment Core resolves the name against — including an interceptor, since `Config.selectDeployment` checks interceptors as one of its populations. The system SHALL NOT read this schema through the admin backend's equivalent (`interceptorsApi.getConfigurationSchema`, an admin-BE lookup by name that does not resolve a Core-only interceptor).

#### Scenario: Configuration schema renders from Core, not the admin backend
- **WHEN** an interceptor asset declares `features.configurationEndpoint` and its Configuration tab is opened
- **THEN** the schema is read from Core's `v1/deployments/{name}/configuration` route
- **AND** no admin-backend request is made

#### Scenario: No declared endpoint shows the empty state
- **WHEN** an interceptor asset has no `features.configurationEndpoint`
- **THEN** the tab shows its empty state rather than attempting a fetch

#### Scenario: Configuration values round-trip
- **WHEN** a user edits the configuration form and saves
- **THEN** the values persist under `defaults.custom_fields.interceptor_configuration` and reappear on reload

### Requirement: Core validates a write; the client adds no meta-schema layer
The system SHALL rely on Core's own server-side validation — Core deserializes an interceptor write into its `Interceptor` entity class and rejects an invalid one itself — rather than adding a client-side meta-schema-validation layer, and SHALL surface Core's rejection message to the user verbatim.

#### Scenario: A rejected write surfaces Core's message
- **WHEN** a save is rejected by Core
- **THEN** an error notification shows Core's error message rather than a generic failure

### Requirement: Configuring an interceptor asset requires no admin-backend call
Every field this surface reads or writes is owned by DIAL Core. The system SHALL NOT require any
admin-backend request in order to view, create, edit, or delete an interceptor asset.

#### Scenario: The surface is configurable without the admin backend
- **WHEN** a user opens an interceptor asset and edits any field this surface exposes
- **THEN** no admin-backend request is required for the edit to be made or saved

### Requirement: Entities > Interceptors is unaffected
The system SHALL leave the admin-BE-backed `Entities > Interceptors` surface — its route, storage,
Audit tab, and the existing CORE-format JSON toggle — unchanged by this capability.

#### Scenario: Entity interceptor view keeps all of its tabs and behavior
- **WHEN** a user opens an entity-side interceptor
- **THEN** its Properties, Configuration, ApplicationRunners, Entities, and Audit tabs, and the
  CORE-format JSON toggle, all behave exactly as before

### Requirement: Interceptor-attach pickers offer both populations
The system SHALL make every surface that lets a user attach an interceptor to an entity — `Entities > Applications`, `Entities > Models`, and `Entities > Application Runners` — offer both the admin-BE-tracked population and the `Assets > Interceptors` population in a single list, each option carrying an explicit `AssetInterceptorOrigin` of `Entity` or `Asset` rather than one inferred from the option's shape. A failure to read the asset population SHALL degrade to the admin-BE-only list rather than failing the page. (The entity `Interceptors` view's own `ApplicationRunners`/`Entities` tabs are reverse-index lookups — which entities already reference one specific, already-resolved admin-BE interceptor — not attach pickers, so no origin widening applies to them.)

`Assets > Models` and `Assets > App Runners` are excluded from this widening: both read Core's own Api/ConfigFile-merged population directly (see the `assets-models` capability's own requirement), and that population's `Api`-origin half already *is* `Assets > Interceptors`' population — merging `AssetInterceptorOrigin` in on top would double-count the same Core resources as two rows.

#### Scenario: Both populations appear in an attach picker
- **WHEN** a user opens the interceptor-attach picker on an entity Application, Model, or Application
  Runner, and interceptors exist in both `Entities > Interceptors` and `Assets > Interceptors`
- **THEN** both are offered
- **AND** each option's Source reads `Entity` or `Asset` accordingly

#### Scenario: Attaching an asset interceptor round-trips
- **WHEN** a user attaches an interceptor whose origin is `Asset` and saves
- **THEN** its name is stored in the entity's interceptor list and reappears on reload, identically
  to an `Entity`-origin attachment

#### Scenario: Core read failure leaves the picker usable
- **WHEN** the `Assets > Interceptors` population cannot be read
- **THEN** the picker still offers the admin-BE population
- **AND** the page renders rather than erroring

#### Scenario: Assets > Models and Assets > App Runners are unaffected by this requirement
- **WHEN** the Interceptors tab renders on `Assets > Models` or `Assets > App Runners`, both of which
  read Core's Api/ConfigFile-merged population directly
- **THEN** their existing behavior and `ConfigEntityOrigin` Source column are unchanged by this
  requirement — `Assets > Models`' own widening onto that Core-direct population is specified under
  the `assets-models` capability, not here

### Requirement: An asset-origin row opens its own detail view
The system SHALL make an `AssetInterceptorOrigin.Asset` row's open-in-new-tab action navigate to
`/assets-interceptors/{path}`, unlike a `ConfigEntityOrigin.Api`-only row (no `AssetInterceptorOrigin`
attached), which has no admin-facing detail view to open.

#### Scenario: Opening an asset-origin row navigates to its detail view
- **WHEN** a user opens an interceptor row whose origin is `Asset` in a new tab
- **THEN** the interceptor's `Assets > Interceptors` detail view opens

#### Scenario: An admin-BE-origin row keeps its existing target
- **WHEN** a user opens an interceptor row whose origin is `Entity` in a new tab
- **THEN** the entity's `Entities > Interceptors` detail view opens, unchanged from today

### Requirement: The two origin dimensions stay independent
The system SHALL track an interceptor option's `AssetInterceptorOrigin` (which surface wrote it — admin backend or the Core asset resource) and `ConfigEntityOrigin` (which of Core's own populations it lives in — API-written or configuration-file) independently, and SHALL NOT collapse them into a single field.

#### Scenario: An option carries at most the dimensions that apply to it
- **WHEN** an interceptor option is built for a widened attach picker
- **THEN** an admin-BE-origin option carries `AssetInterceptorOrigin.Entity` and no
  `ConfigEntityOrigin`
- **AND** a Core-API-written option carries both `AssetInterceptorOrigin.Asset` and
  `ConfigEntityOrigin.Api`
- **AND** a configuration-file option carries `ConfigEntityOrigin.ConfigFile` and no
  `AssetInterceptorOrigin`
