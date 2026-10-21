## MODIFIED Requirements

### Requirement: Regular Applications use the shared SourceField component

`DialApplication` editing (every Applications-family view **except `ApplicationRoute.AssetsApplications`**, which renders `ResourceSourceField` instead) SHALL render `components/SourceField/SourceField.tsx` as its source editor, using the same dropdown selector (`DialSelectField`) used by Models, Toolsets, Adapters, and Interceptors.

The regular Applications source dropdown (`ApplicationRoute.Applications`) MUST offer exactly three options in this scope:

- `SOURCE_TYPE.ENDPOINTS` — renders `ApplicationEndpoint` (chat + MCP inputs with full URLs) in the panel below.
- `SOURCE_TYPE.SCHEMA` — renders `AppRunners` (runner picker) in the panel below.
- `SOURCE_TYPE.CONTAINER` — renders `Containers` which in turn renders `ApplicationEndpoint` with `prefix={containerUrl}` (path inputs with container URL prefix) in the panel below.

The regular Applications source dropdown MUST NOT offer `RUNNER`, `ADAPTER`, or `MCP_REGISTRY` in this scope.

The `CONTAINER` option SHALL be disabled when `featureFlags.deploymentsEnabled` is false.

#### Scenario: Dropdown selection in Applications view — three options

- **WHEN** a user opens a DialApplication with `deploymentsEnabled: true` and views the source section
- **THEN** a dropdown with options "Endpoints", "App Runner", and "Application Container" is displayed
- **AND** selecting `ENDPOINTS` renders `ApplicationEndpoint` without a prefix
- **AND** selecting `SCHEMA` renders `AppRunners`
- **AND** selecting `CONTAINER` renders `Containers` → `ApplicationEndpoint` with prefix

#### Scenario: Radio group removed

- **WHEN** a user opens a `DialApplication`
- **THEN** the previous `DialRadioGroup` labeled "Source type" is NOT displayed
- **AND** the equivalent choice is expressed via the shared source dropdown

### Requirement: AssetApp uses ResourceSourceField with Endpoints and App Runner only

Asset applications (`AssetApp`, accessed via `ApplicationRoute.AssetsApplications`) SHALL render `components/Assets/Resources/ResourceSourceField.tsx` — not `components/SourceField/SourceField.tsx` — as their source editor, both on the detail view and in the creation modal, wired with the `ASSET_APPLICATION_CREATE_SOURCE_ITEMS` list. Existing application editing SHALL continue to offer `SOURCE_TYPE.ENDPOINTS` — rendering the application endpoint editor — and `SOURCE_TYPE.SCHEMA` — rendering `AppRunnersResource` and writing the selected runner id to `entity.application_type_schema_id`.

The dedicated Assets Application creation modal SHALL offer source modes in this order:

1. Interfaces, selected by default, which renders the existing asset interfaces editor and writes the existing `interfaces` resource field.
2. Endpoints, which renders the application endpoint editor.
3. App Runner, which renders the `AppRunnersResource` picker.
4. Code App, only when the existing Code App editor URL configuration makes it available.

Interfaces SHALL be a creation-editor mode and MUST NOT introduce or persist a new Core `source` discriminator. The asset source selector MUST NOT offer `SOURCE_TYPE.CONTAINER`, `RUNNER`, `ADAPTER`, or `MCP_REGISTRY`. No `getContainers` prop SHALL be passed for the AssetsApplications view.

Validation SHALL treat `SCHEMA` as valid iff `entity.application_type_schema_id` is truthy; `ENDPOINTS` is valid iff `entity.endpoint` is a valid URL. The default Interfaces mode SHALL be valid when the resource identity fields are valid; interfaces remain optional until a configured interface imposes its own field validation.

#### Scenario: AssetApp source editor offers two options

- **WHEN** the user opens an `AssetApp` via the AssetsApplications view
- **THEN** a source dropdown with options "Endpoints" and "App Runner" is displayed
- **AND** "Application Container" is NOT displayed
- **AND** selecting `ENDPOINTS` renders the application endpoint editor
- **AND** selecting `SCHEMA` renders the `AppRunnersResource` picker

#### Scenario: Assets Application creation defaults to Interfaces

- **WHEN** an administrator advances to source configuration while creating an Assets Application
- **THEN** Interfaces is the first available source mode and is selected by default
- **AND** the existing asset interfaces editor is displayed
- **AND** the available modes after Interfaces are Endpoints, App Runner, and Code App only when its editor URL is configured

#### Scenario: Creation Interfaces mode writes the existing resource field

- **WHEN** an administrator configures an interface while creating an Assets Application
- **THEN** the created resource carries the interface configuration in its existing `interfaces` field
- **AND** no new source discriminator is written for Interfaces

#### Scenario: AssetApp runner selection writes to resource

- **WHEN** the user picks an App Runner for an `AssetApp`
- **THEN** `entity.application_type_schema_id` is set to the selected runner id
- **AND** `entity.application_properties` preserves its existing values while adding defaults from the selected runner
- **AND** no `entity.source.$type` or camelCase `applicationTypeSchemaId` field is written

#### Scenario: AssetApp schema id read through resource

- **WHEN** any consumer (e.g. `getAppRunner`, the interceptor views) needs an AssetApp's schema id
- **THEN** it reads `entity.application_type_schema_id`
- **AND** no legacy `entity.source.applicationTypeSchemaId` fallback remains

