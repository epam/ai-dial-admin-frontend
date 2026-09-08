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

When source `$type === 'schema'` for a `DialApplication`, the `AppRunners` component SHALL own the runner-selection side-effects, resolving the selected runner's scheme through the shared `resolveAppRunnerScheme` helper rather than calling a resolver inline:

1. On runner selection, it resolves the picked runner via `resolveAppRunnerScheme(runner)`:
   - For a `Config`-origin runner (`AppRunnerOrigin.Config`), this fetches the resolved application scheme via `getResolvedApplicationScheme(runner.$id)` — unchanged from today.
   - For a `Platform`-origin runner (`AppRunnerOrigin.Platform`), this first fetches the runner's full content (`getRunner(path, DEFAULT_ETAG)`) and uses **that resource's own `$id`** — not the picker option's list-derived `$id` — to call `getResolvedRunnerSchema`. The list-derived `$id` MUST NOT be passed to `getResolvedRunnerSchema` directly, since it reflects the runner's id at creation time and can be stale if the runner's `$id` was edited afterwards through its content.
2. If the schema fetch succeeds, it derives default `applicationProperties` via `getSchemaDefaults(scheme)`.
3. It calls `onChange` once with the combined update: `{ ...entity, source: { $type: SCHEMA, applicationTypeSchemaId: resolvedId }, applicationProperties }`, where `resolvedId` is the runner id returned by `resolveAppRunnerScheme` — the corrected content `$id` for a `Platform`-origin runner, or the picked `$id` unchanged for a `Config`-origin one.

If the schema fetch fails, the component SHALL fall back to using the non-resolved runner (current behavior). If the `Platform`-origin content fetch itself fails, the component SHALL fall back to the picker option as originally listed (its list-derived `$id`), so a transient failure degrades to today's behavior rather than blocking selection.

#### Scenario: Runner selection with successful schema fetch

- **WHEN** the user picks a `Config`-origin runner and `getResolvedApplicationScheme` returns a schema
- **THEN** `entity.source.$type` is set to `SCHEMA`
- **AND** `entity.source.applicationTypeSchemaId` is set to the runner id
- **AND** `entity.applicationProperties` is set to `getSchemaDefaults(schema)`

#### Scenario: Runner selection with fetch failure

- **WHEN** the user picks a `Config`-origin runner and `getResolvedApplicationScheme` fails
- **THEN** `entity.source.$type` is set to `SCHEMA`
- **AND** `entity.source.applicationTypeSchemaId` is set to the runner id
- **AND** `entity.applicationProperties` is derived from the unresolved runner

#### Scenario: Platform runner selection resolves against its content `$id`

- **WHEN** the user picks a `Platform`-origin runner whose picker-option `$id` (derived from its Core resource name) differs from the `$id` currently stored in its content
- **THEN** the component fetches the runner's content via `getRunner`
- **AND** calls `getResolvedRunnerSchema` with the content's `$id`, not the picker option's `$id`
- **AND** `entity.source.applicationTypeSchemaId` is set to the content's `$id`

#### Scenario: Platform runner selection with a failed content fetch

- **WHEN** the user picks a `Platform`-origin runner and the `getRunner` content fetch fails
- **THEN** the component falls back to the picker option's own `$id` for both `getResolvedRunnerSchema` and `entity.source.applicationTypeSchemaId`, matching today's behavior

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

### Requirement: Runner editor keeps EndpointAndMCPContainer

The application runner editor (`DialApplicationScheme`, accessed via `ApplicationRoute.ApplicationRunners`) SHALL continue to use `components/SourceField/Application/EndpointAndMCPContainer.tsx` for editing the runner's chat endpoint and MCP endpoint. The runner editor MUST NOT gain a source-type dropdown. `EndpointAndMCPContainer.tsx` MAY be simplified after the DialApplication branches are removed, but continues to write `dial:applicationTypeCompletionEndpoint` and `dial:applicationTypeMcp` fields as today.

#### Scenario: Runner editor unchanged

- **WHEN** the user edits a `DialApplicationScheme`
- **THEN** the endpoint + MCP editor renders via `EndpointAndMCPContainer.tsx`
- **AND** no source-type selector is shown
