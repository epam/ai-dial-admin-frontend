## MODIFIED Requirements

### Requirement: FE internal model uses a single shared source struct

The FE SHALL represent every entity's source (Model, Toolset, Adapter, Interceptor, Application, **AssetApp**) using the shared `SOURCE_FIELD` struct defined in `components/SourceField/types.ts`. A separate `ApplicationSource` interface MUST NOT exist. `SOURCE_FIELD` MUST include an optional `applicationTypeSchemaId?: string` field so that a `$type: 'schema'` application source fits the same struct.

`DialApplication.source` MUST be typed as `SOURCE_FIELD` (optional). The flat top-level `applicationTypeSchemaId` field MUST be removed from `DialApplication` itself. `AssetApp` MUST inherit `source: SOURCE_FIELD | undefined` from `DialApplication` (the `Omit<DialApplication, 'source'>` is dropped) and MUST NOT declare its own flat `applicationTypeSchemaId` field. The schema id is represented only at `source.applicationTypeSchemaId`. Absence of `source` MUST continue to be treated semantically identical to `{ $type: 'endpoints' }`.

The legacy enum name `ApplicationSourceType` MUST remain exported as an alias of `SOURCE_TYPE` to preserve existing imports.

#### Scenario: Model unification

- **WHEN** a consumer imports `ApplicationSource` from `@/src/models/dial/application`
- **THEN** the import fails at type-check time, because `ApplicationSource` is removed
- **AND** consumers SHALL migrate to `SOURCE_FIELD`

#### Scenario: AssetApp has no flat schema field

- **WHEN** a consumer reads `(entity as AssetApp).applicationTypeSchemaId`
- **THEN** the access fails at type-check time, because the flat field is removed
- **AND** consumers SHALL read the schema id via `getSchemaSourceId(entity.source)`

#### Scenario: Enum alias preserved

- **WHEN** a consumer imports `ApplicationSourceType` from `@/src/models/dial/application`
- **THEN** the import SHALL resolve to `SOURCE_TYPE`
- **AND** member access (`ApplicationSourceType.ENDPOINTS`, `ApplicationSourceType.SCHEMA`) SHALL work unchanged

#### Scenario: BE contract unchanged

- **WHEN** the FE sends a `DialApplication` or `AssetApp` to the backend
- **THEN** the `source` field on the wire SHALL contain only `{ $type, applicationTypeSchemaId? }` (any other `SOURCE_FIELD` fields left undefined are dropped by JSON serialization)
- **AND** the BE contract `{ $type: 'endpoints' }` or `{ $type: 'schema', applicationTypeSchemaId: string }` is preserved

### Requirement: Regular Applications use the shared SourceField component

`DialApplication` editing (every Applications-family view, **including `ApplicationRoute.AssetsApplications`**) SHALL render `components/SourceField/SourceField.tsx` as its source editor, using the same dropdown selector (`DialSelectField`) used by Models, Toolsets, Adapters, and Interceptors.

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

### Requirement: Source-type change clears stale Application fields

When the source `$type` changes in the Applications view **or the AssetsApplications view**, `SourceField.onChangeSource` SHALL clear the following fields on the entity in addition to the common `endpoint` reset used by other entities:

- `mcp`
- `viewerUrl`
- `editorUrl`
- `applicationTypeSchemaId`
- `applicationProperties`
- `responsesEndpoint`

The clearing policy MUST match the field set previously cleared by `ApplicationSource.tsx::handleRadioChange` to preserve behavior parity.

#### Scenario: Switching ENDPOINTS → SCHEMA in Applications

- **WHEN** the user switches the Applications source dropdown from `ENDPOINTS` to `SCHEMA`
- **THEN** `entity.endpoint`, `entity.mcp`, `entity.viewerUrl`, `entity.editorUrl`, `entity.applicationTypeSchemaId`, and `entity.applicationProperties` are cleared
- **AND** `entity.source.$type` is updated to `SCHEMA`

#### Scenario: Switching SCHEMA → ENDPOINTS in Applications

- **WHEN** the user switches the Applications source dropdown from `SCHEMA` to `ENDPOINTS`
- **THEN** `entity.endpoint`, `entity.mcp`, `entity.viewerUrl`, `entity.editorUrl`, `entity.applicationTypeSchemaId`, and `entity.applicationProperties` are cleared
- **AND** `entity.source.$type` is updated to `ENDPOINTS`

#### Scenario: Switching source type in AssetsApplications

- **WHEN** the user switches the AssetsApplications source dropdown between `ENDPOINTS` and `SCHEMA`
- **THEN** the same field set (`endpoint`, `mcp`, `viewerUrl`, `editorUrl`, `applicationTypeSchemaId`, `applicationProperties`, `responsesEndpoint`) is cleared
- **AND** `entity.source.$type` is updated to the newly selected type

## ADDED Requirements

### Requirement: AssetApp uses the shared SourceField with Endpoints and App Runner only

Asset applications (`AssetApp`, accessed via `ApplicationRoute.AssetsApplications`) SHALL render `components/SourceField/SourceField.tsx` as their source editor, wired with the `ASSET_APPLICATION_SOURCE_ITEMS` list. That list MUST offer exactly two options:

- `SOURCE_TYPE.ENDPOINTS` — renders the application endpoint editor.
- `SOURCE_TYPE.SCHEMA` — renders `AppRunners` (runner picker), writing the selected runner id to `entity.source.applicationTypeSchemaId`.

The AssetApp source dropdown MUST NOT offer `SOURCE_TYPE.CONTAINER`, `RUNNER`, `ADAPTER`, or `MCP_REGISTRY`. No `getContainers` prop SHALL be passed for the AssetsApplications view.

Validation SHALL be handled by the shared `isValidSourceField`: `SCHEMA` is valid iff `source.applicationTypeSchemaId` is truthy; `ENDPOINTS` is valid iff at least one of `entity.endpoint` or `entity.mcp?.endpoint` is a valid URL.

#### Scenario: AssetApp source editor offers two options

- **WHEN** the user opens an `AssetApp` via the AssetsApplications view
- **THEN** a source dropdown with options "Endpoints" and "App Runner" is displayed
- **AND** "Application Container" is NOT displayed
- **AND** selecting `ENDPOINTS` renders the application endpoint editor
- **AND** selecting `SCHEMA` renders the `AppRunners` picker

#### Scenario: AssetApp runner selection writes to source

- **WHEN** the user picks an App Runner for an `AssetApp`
- **THEN** `entity.source.$type` is set to `SCHEMA`
- **AND** `entity.source.applicationTypeSchemaId` is set to the selected runner id
- **AND** the flat `applicationTypeSchemaId` field is not written (it no longer exists)

#### Scenario: AssetApp schema id read through source

- **WHEN** any consumer (e.g. `getAppRunner`, the interceptor views) needs an AssetApp's schema id
- **THEN** it reads `getSchemaSourceId(entity.source)`
- **AND** no `|| (entity as AssetApp).applicationTypeSchemaId` fallback remains

## REMOVED Requirements

### Requirement: AssetApp editor remains the pruned ApplicationSource component

**Reason**: Backend PR epam/ai-dial-admin-backend#907 migrates the application-resource DTOs to the polymorphic `source` object, removing the wire-format difference that justified keeping AssetApp on the flat `applicationTypeSchemaId` field and the bespoke `ApplicationSource.tsx` radio editor.

**Migration**: `AssetApp` now inherits `source: SOURCE_FIELD` (see "FE internal model uses a single shared source struct") and renders the shared `SourceField` component (see "AssetApp uses the shared SourceField with Endpoints and App Runner only"). `components/SourceField/Application/ApplicationSource.tsx` and its local `constants.ts` are deleted. Read schema id via `getSchemaSourceId(entity.source)`.
