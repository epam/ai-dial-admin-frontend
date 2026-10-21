## MODIFIED Requirements

### Requirement: AssetApp uses the shared SourceField with Endpoints and App Runner only

Asset applications (`AssetApp`, accessed via `ApplicationRoute.AssetsApplications`) SHALL render `components/SourceField/SourceField.tsx` as their source editor, wired with the `ASSET_APPLICATION_SOURCE_ITEMS` list. Existing application editing SHALL continue to offer `SOURCE_TYPE.ENDPOINTS` — rendering the application endpoint editor — and `SOURCE_TYPE.SCHEMA` — rendering `AppRunners` and writing the selected runner id to `entity.application_type_schema_id`.

The dedicated Assets Application creation modal SHALL offer source modes in this order:

1. Interfaces, selected by default, which renders the existing asset interfaces editor and writes the existing `interfaces` resource field.
2. Endpoints, which renders the application endpoint editor.
3. App Runner, which renders the `AppRunners` picker.
4. Code App, only when the existing Code App editor URL configuration makes it available.

Interfaces SHALL be a creation-editor mode and MUST NOT introduce or persist a new Core `source` discriminator. The asset source selector MUST NOT offer `SOURCE_TYPE.CONTAINER`, `RUNNER`, `ADAPTER`, or `MCP_REGISTRY`. No `getContainers` prop SHALL be passed for the AssetsApplications view.

Validation SHALL be handled by the shared `isValidSourceField`: `SCHEMA` is valid iff `source.applicationTypeSchemaId` is truthy; `ENDPOINTS` is valid iff at least one of `entity.endpoint` or `entity.mcp?.endpoint` is a valid URL. The default Interfaces mode SHALL be valid when the resource identity fields are valid; interfaces remain optional until a configured interface imposes its own field validation.

#### Scenario: AssetApp source editor offers two options

- **WHEN** the user opens an `AssetApp` via the AssetsApplications view
- **THEN** a source dropdown with options "Endpoints" and "App Runner" is displayed
- **AND** "Application Container" is NOT displayed
- **AND** selecting `ENDPOINTS` renders the application endpoint editor
- **AND** selecting `SCHEMA` renders the `AppRunners` picker

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
