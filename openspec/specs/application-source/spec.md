## MODIFIED Requirements

### Requirement: FE internal model uses a single shared source struct

The FE SHALL represent every entity's source (Model, Toolset, Adapter, Interceptor, Application) using the shared `SOURCE_FIELD` struct defined in `components/SourceField/types.ts`. A separate `ApplicationSource` interface MUST NOT exist. `SOURCE_FIELD` MUST include an optional `applicationTypeSchemaId?: string` field so that a `$type: 'schema'` application source fits the same struct.

`DialApplication.source` MUST be typed as `SOURCE_FIELD` (optional). Absence of `source` MUST continue to be treated semantically identical to `{ $type: 'endpoints' }`.

The legacy enum name `ApplicationSourceType` MUST remain exported as an alias of `SOURCE_TYPE` to preserve existing imports.

#### Scenario: Model unification

- **WHEN** a consumer imports `ApplicationSource` from `@/src/models/dial/application`
- **THEN** the import fails at type-check time, because `ApplicationSource` is removed
- **AND** consumers SHALL migrate to `SOURCE_FIELD`

#### Scenario: Enum alias preserved

- **WHEN** a consumer imports `ApplicationSourceType` from `@/src/models/dial/application`
- **THEN** the import SHALL resolve to `SOURCE_TYPE`
- **AND** member access (`ApplicationSourceType.ENDPOINTS`, `ApplicationSourceType.SCHEMA`) SHALL work unchanged

#### Scenario: BE contract unchanged

- **WHEN** the FE sends `DialApplication` to the backend
- **THEN** the `source` field on the wire SHALL contain only `{ $type, applicationTypeSchemaId? }` (any other `SOURCE_FIELD` fields left undefined are dropped by JSON serialization)
- **AND** the BE contract `{ $type: 'endpoints' }` or `{ $type: 'schema', applicationTypeSchemaId: string }` is preserved without change

### Requirement: Regular Applications use the shared SourceField component

Regular `DialApplication` editing (i.e. every view except `ApplicationRoute.AssetsApplications`) SHALL render `components/SourceField/SourceField.tsx` as its source editor, using the same dropdown selector (`DialSelectField`) used by Models, Toolsets, Adapters, and Interceptors.

The Applications source dropdown MUST offer exactly three options in this scope:

- `SOURCE_TYPE.ENDPOINTS` — renders `ApplicationEndpoint` (chat + MCP inputs with full URLs) in the panel below.
- `SOURCE_TYPE.SCHEMA` — renders `AppRunners` (runner picker) in the panel below.
- `SOURCE_TYPE.CONTAINER` — renders `Containers` which in turn renders `ApplicationEndpoint` with `prefix={containerUrl}` (path inputs with container URL prefix) in the panel below.

The Applications source dropdown MUST NOT offer `RUNNER`, `ADAPTER`, or `MCP_REGISTRY` in this scope.

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

### Requirement: Applications Endpoints panel writes to flat entity fields

When source `$type === 'endpoints'` for a `DialApplication`, the `ApplicationEndpoint` component SHALL write chat endpoint to `entity.endpoint: string | undefined` and MCP endpoint data to `entity.mcp: ApplicationMCPContainer | undefined` — exactly as today. No migration of these fields into `source` is performed.

The user MUST be able to enable chat endpoint and/or MCP endpoint independently via checkboxes (at least one must remain checked). MCP endpoint sub-fields (`transport`, `forwardPerRequestKey`, `configDelivery`) continue to live inside `entity.mcp`.

#### Scenario: Chat endpoint toggled on

- **WHEN** the user checks "Chat endpoint" and enters a URL
- **THEN** the URL is written to `entity.endpoint`
- **AND** `entity.mcp` is left untouched

#### Scenario: MCP endpoint toggled on

- **WHEN** the user checks "MCP endpoint" and enters a URL
- **THEN** the URL is written to `entity.mcp.endpoint`
- **AND** `entity.endpoint` is left untouched

#### Scenario: At least one endpoint required

- **WHEN** the user attempts to disable both chat and MCP endpoint checkboxes
- **THEN** the UI prevents disabling the last remaining one (matches today's behavior)

### Requirement: Applications Schema panel owns runner-scheme side-effects

When source `$type === 'schema'` for a `DialApplication`, the `AppRunners` component SHALL own the runner-selection side-effects:

1. On runner selection, it fetches the resolved application scheme via `getResolvedApplicationScheme(runnerId)`.
2. If the fetch succeeds, it derives default `applicationProperties` via `getSchemaDefaults(scheme)`.
3. It calls `onChange` once with the combined update: `{ ...entity, source: { $type: SCHEMA, applicationTypeSchemaId: runnerId }, applicationProperties }`.

If the fetch fails, the component SHALL fall back to using the non-resolved runner (current behavior).

#### Scenario: Runner selection with successful schema fetch

- **WHEN** the user picks a runner and `getResolvedApplicationScheme` returns a schema
- **THEN** `entity.source.$type` is set to `SCHEMA`
- **AND** `entity.source.applicationTypeSchemaId` is set to the runner id
- **AND** `entity.applicationProperties` is set to `getSchemaDefaults(schema)`

#### Scenario: Runner selection with fetch failure

- **WHEN** the user picks a runner and `getResolvedApplicationScheme` fails
- **THEN** `entity.source.$type` is set to `SCHEMA`
- **AND** `entity.source.applicationTypeSchemaId` is set to the runner id
- **AND** `entity.applicationProperties` is derived from the unresolved runner

### Requirement: Source-type change clears stale Application fields

When the source `$type` changes in the Applications view, `SourceField.onChangeSource` SHALL clear the following fields on the entity in addition to the common `endpoint: ''` reset used by other entities:

- `mcp`
- `viewerUrl`
- `editorUrl`
- `applicationTypeSchemaId`
- `applicationProperties`

The clearing policy MUST match the field set previously cleared by `ApplicationSource.tsx::handleRadioChange` to preserve behavior parity.

#### Scenario: Switching ENDPOINTS → SCHEMA

- **WHEN** the user switches the Applications source dropdown from `ENDPOINTS` to `SCHEMA`
- **THEN** `entity.endpoint`, `entity.mcp`, `entity.viewerUrl`, `entity.editorUrl`, `entity.applicationTypeSchemaId`, and `entity.applicationProperties` are cleared
- **AND** `entity.source.$type` is updated to `SCHEMA`

#### Scenario: Switching SCHEMA → ENDPOINTS

- **WHEN** the user switches the Applications source dropdown from `SCHEMA` to `ENDPOINTS`
- **THEN** `entity.endpoint`, `entity.mcp`, `entity.viewerUrl`, `entity.editorUrl`, `entity.applicationTypeSchemaId`, and `entity.applicationProperties` are cleared
- **AND** `entity.source.$type` is updated to `ENDPOINTS`

### Requirement: Unified validation via isValidSourceField

The single validator `isValidSourceField` (in `components/SourceField/utils.ts`) SHALL handle every entity's source validation. It MUST include:

- `CONTAINER`: valid iff `source.containerId` is truthy.
- `ADAPTER`: valid iff `source.adapterName` and `source.completionEndpointPath` are both truthy.
- `RUNNER`: valid iff `source.runnerName` is truthy.
- `MCP_REGISTRY`: valid iff `source.serverName` is truthy.
- `SCHEMA`: valid iff `source.applicationTypeSchemaId` is truthy (new branch).
- `ENDPOINTS`:
  - For Applications: valid iff at least one of `entity.endpoint` or `entity.mcp?.endpoint` is a valid URL (via `getUrlError`).
  - For other entities: valid iff `entity.endpoint` or `entity.baseEndpoint` is a valid URL (unchanged from today).

A separate `isValidApplicationSource` helper MUST NOT be introduced.

#### Scenario: SCHEMA validation

- **WHEN** `entity.source.$type === SCHEMA` and `entity.source.applicationTypeSchemaId` is set
- **THEN** `isValidSourceField(entity)` returns `true`
- **AND** when `applicationTypeSchemaId` is empty or undefined, it returns `false`

#### Scenario: Applications ENDPOINTS validation — chat only

- **WHEN** `entity` is a `DialApplication` with `source.$type === ENDPOINTS`, `entity.endpoint` is a valid URL, and `entity.mcp` is undefined
- **THEN** `isValidSourceField(entity)` returns `true`

#### Scenario: Applications ENDPOINTS validation — MCP only

- **WHEN** `entity` is a `DialApplication` with `source.$type === ENDPOINTS`, `entity.endpoint` is undefined, and `entity.mcp.endpoint` is a valid URL
- **THEN** `isValidSourceField(entity)` returns `true`

#### Scenario: Applications ENDPOINTS validation — both invalid

- **WHEN** `entity` is a `DialApplication` with `source.$type === ENDPOINTS` and neither `entity.endpoint` nor `entity.mcp?.endpoint` is a valid URL
- **THEN** `isValidSourceField(entity)` returns `false`

### Requirement: AssetApp editor remains the pruned ApplicationSource component

Asset applications (`AssetApp`, accessed via `ApplicationRoute.AssetsApplications`) SHALL continue to use `components/SourceField/Application/ApplicationSource.tsx` as their source editor. That component MUST be stripped of all `DialApplication`-specific branches; only the AssetApp path (which reads/writes the flat `(entity as AssetApp).applicationTypeSchemaId`) remains.

`AssetApp` MUST NOT gain a `source` field. The BE/asset-snapshot format is unchanged.

#### Scenario: AssetApp editing unaffected

- **WHEN** the user opens an `AssetApp` via the AssetsApplications view
- **THEN** the source editor continues to be `ApplicationSource.tsx`
- **AND** changes are written to the flat `applicationTypeSchemaId` field as before

#### Scenario: Regular DialApplication no longer routes through ApplicationSource

- **WHEN** the user opens a regular `DialApplication`
- **THEN** `ApplicationSource.tsx` is NOT rendered
- **AND** `SourceField.tsx` is rendered instead

### Requirement: Runner editor keeps EndpointAndMCPContainer

The application runner editor (`DialApplicationScheme`, accessed via `ApplicationRoute.ApplicationRunners`) SHALL continue to use `components/SourceField/Application/EndpointAndMCPContainer.tsx` for editing the runner's chat endpoint and MCP endpoint. The runner editor MUST NOT gain a source-type dropdown. `EndpointAndMCPContainer.tsx` MAY be simplified after the DialApplication branches are removed, but continues to write `dial:applicationTypeCompletionEndpoint` and `dial:applicationTypeMcp` fields as today.

#### Scenario: Runner editor unchanged

- **WHEN** the user edits a `DialApplicationScheme`
- **THEN** the endpoint + MCP editor renders via `EndpointAndMCPContainer.tsx`
- **AND** no source-type selector is shown
