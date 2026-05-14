## ADDED Requirements

### Requirement: Audit detail page resolves container activities from the deployment-manager backend

For activities whose `resourceType` is one of `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, or `InferenceDeployment`, the audit detail route at `/activity-audit/{activityId}` SHALL resolve the activity via `deploymentAuditApi.getActivityById` after the admin-backend lookup returns null. The page SHALL fetch the current and previous revision snapshots from `GET /api/v1/deployments/{id}/revision/{revision}` on `DIAL_DEPLOYMENTS_API_URL` and render the result through `AuditView`. Sibling-activity lookup for the latest-revision-as-current SHALL use `deploymentAuditApi.getActivitiesList` exactly as it does for image and firewall activities.

#### Scenario: Container activity resolves via the deployment-manager backend
- **GIVEN** an `activityId` whose `resourceType` is `McpDeployment` and `revision: 12`
- **WHEN** the user opens `/activity-audit/{activityId}`
- **THEN** the admin-backend lookup returns null
- **AND** the deployment-manager lookup returns the activity
- **AND** the page issues `GET /api/v1/deployments/<resourceId>/revision/12` and `GET /api/v1/deployments/<resourceId>/revision/11`
- **AND** `AuditView` renders the diff body using the resolved `Container` snapshots

#### Scenario: Container activity with no previous revision
- **GIVEN** an activity with `resourceType: "ApplicationDeployment"` and `revision: 1`
- **WHEN** the detail page resolves snapshots
- **THEN** the current-revision request issues `GET /api/v1/deployments/<resourceId>/revision/1`
- **AND** the previous-revision request is suppressed or returns null without producing an error
- **AND** the diff body renders the snapshot with no "Before" side

#### Scenario: Container resource-route helper returns the deployments URL prefix
- **WHEN** `getRevisionRouteForEntityType` is called with each of `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment` and a resource id `<uuid>`
- **THEN** it returns `/deployments/<uuid>/revision/` in every case

### Requirement: Container detail renders the editor's accordion sections

For container activities, the diff body SHALL render sections in the existing `Accordion` (default-open) in this fixed order:

1. **Properties** — primitive top-level fields (`displayName`, `description`, `maintainer`, `topics`, `status`, `url`, `command`, `args`, `modelFormat`) and the flattened `source` object. Plus, for MCP containers, `transport` and `mcpEndpointPath`. Plus container port fields (`containerPort`, `containerPorts`, `containerGrpcPort`) when the section is not Endpoint configuration (see below).
2. **Endpoint configuration** — `transport`, `mcpEndpointPath`, `containerPort`, `containerPorts`, `containerGrpcPort`. (Routes the MCP/port fields into this dedicated section instead of Properties.)
3. **Autoscaling** — `scaling.minReplicas`, `scaling.maxReplicas`, `scaling.scaleToZeroDelaySeconds`, and the flattened `scaling.strategy.$type` and `scaling.strategy.threshold`.
4. **Environment variables** — one row per element of `metadata.envs`.
5. **Resources** — six flat rows derived from `resources.requests.{cpu, memory, gpu}` and `resources.limits.{cpu, memory, gpu}`.
6. **Configuration** — `command` and `args`. (Routes the configuration fields into this dedicated section instead of Properties.)
7. **Startup probe** — `probeProperties.enabled`, `initialDelaySeconds`, `periodSeconds`, `timeoutSeconds`, `failureThreshold`, and the flattened `probe.$type`, `probe.path`, `probe.port`.
8. **Firewall settings** — reuses the existing `allowedDomains` handler from the previous change, including the synthesized `Domain access policy` row.

Sections SHALL render only when at least one of their underlying fields is present in either the before or after snapshot. Sections whose every field is absent SHALL NOT render a header.

#### Scenario: NIM Model Serving activity hides Autoscaling
- **GIVEN** a `NimDeployment` activity whose snapshots have no `scaling` field
- **WHEN** the diff body renders
- **THEN** no `Autoscaling` section header appears
- **AND** the remaining sections render in the documented order

#### Scenario: Non-MCP container hides MCP-only endpoint fields
- **GIVEN** an `AdapterDeployment` activity whose snapshots have no `transport` or `mcpEndpointPath`
- **WHEN** the Endpoint configuration section renders
- **THEN** the section shows only container-port rows (or hides entirely if no port fields are present)
- **AND** no `transport` or `mcpEndpointPath` row appears

#### Scenario: Section order is fixed regardless of which sections render
- **GIVEN** any container activity whose snapshots include `metadata.envs`, `resources`, and `probeProperties` but no `scaling`
- **WHEN** the diff body renders
- **THEN** the section headers appear in the order `Properties`, `Endpoint configuration` (if applicable), `Environment variables`, `Resources`, `Configuration` (if applicable), `Startup probe`, `Firewall settings` (if `allowedDomains` present)
- **AND** no `Autoscaling` header appears between `Endpoint configuration` and `Environment variables`

### Requirement: Environment variables render as per-variable sub-tables

The Environment variables section SHALL render **one sub-table per env** (matching the upstreams / defaults pattern). Each sub-table SHALL be labelled `Variable {N} {Before|After|Current}` where `N` is the 1-based index in the alphabetically-sorted union of envs across both snapshots. Each sub-table SHALL contain four rows in this fixed order:

1. `envName` — the env's `name`
2. `envDescription` — the env's `description`
3. `envValue` — the env's value, sourced from `env.value.value` for `$type: simple` and `env.value.fileName` for `$type: file`
4. `envMountType` — the env's `mountType`

The row data for `envValue` SHALL carry `mountType`, `valueType`, and (for files) `fileContent` so the cell renderer can adapt its rendering. The `envValue` cell SHALL use `EnvVarValueCellRenderer`, which branches by value type and mount type:

- `valueType === file` and a filename is present → render the filename styled as a clickable link (file icon + accent-blue text). When `fileContent` is present, the link SHALL download the base-64-decoded file via `Uint8Array.from(atob(...), c => c.charCodeAt(0))` → `Blob` → `downloadFile(blob, fileName)`. When `fileContent` is missing, the filename SHALL still render as a styled link but SHALL NOT be clickable. Decode failures SHALL be logged via `console.warn` (never thrown).
- `mountType === secure_content` OR `secure_file` (and not a file with filename) → render the literal placeholder `••••••` in `text-primary`, with a `title` tooltip `"Secret values are not stored in audit history"`. No reveal toggle is rendered (the BE strips secret values from audit snapshots, so there is nothing to unmask).
- Otherwise (plain `content` value) → render the value as plain text.

The `envMountType` row's raw value (`content` / `secure_content` / `secure_file`) SHALL be formatted through `EnvVariablesI18nKey.MountType{Content,SecureContent,SecureFile}` keys.

Diff status:
- Identical envs across snapshots produce four rows with no `diffStatus`.
- A value or mount-type change between snapshots marks the `envValue` row (or `envMountType` row) with `CHANGED`; unchanged rows keep no status.
- An env present only in the latest snapshot produces an **empty bucket** on the BEFORE pass and a four-row bucket with `ADDED` on the AFTER pass.
- An env present only in the previous snapshot produces a four-row bucket with `REMOVED` on the BEFORE pass and an **empty bucket** on the AFTER pass.

#### Scenario: Each env emits one sub-table with four rows in fixed order
- **GIVEN** an env `{ name: "PORT", description: "listen port", value: { $type: "simple", value: "8080" }, mountType: "content" }`
- **WHEN** the Environment variables section renders for an unchanged snapshot
- **THEN** the bucket at index 0 contains rows with parameters `envName`, `envDescription`, `envValue`, `envMountType` in that order
- **AND** the sub-table header is `Variable 1 Before` on the left column and `Variable 1 After` on the right column

#### Scenario: Secure-content env renders dotted placeholder, no reveal toggle
- **GIVEN** an env with `mountType: "secure_content"` and `value.$type: "simple"`
- **WHEN** the `envValue` cell renders
- **THEN** the cell content is the six-dot placeholder `••••••` in `text-primary`
- **AND** no reveal button is rendered
- **AND** the cell carries a `title` attribute explaining secrets are not stored in audit history

#### Scenario: File env renders filename as a clickable download link when fileContent is present
- **GIVEN** an env with `value.$type: "file"`, `value.fileName: "server.crt"`, `value.fileContent: "<base64>"`
- **WHEN** the `envValue` cell renders
- **THEN** the filename `server.crt` renders with a file icon, accent-blue text, and underline
- **AND** clicking the filename decodes the base64 into a `Uint8Array`, wraps it in a `Blob`, and triggers `downloadFile(blob, "server.crt")`

#### Scenario: File env without fileContent renders as a non-clickable styled link
- **GIVEN** an env with `value.$type: "file"`, `value.fileName: "server.crt"`, `value.fileContent` absent
- **WHEN** the `envValue` cell renders
- **THEN** the filename renders with file icon and accent-blue text but no underline and no click handler

#### Scenario: Added env emits ADDED rows only on the AFTER pass
- **GIVEN** the previous snapshot has no env named `LOG_LEVEL` and the latest snapshot has it
- **WHEN** the diff renders
- **THEN** the BEFORE pass's bucket for that index is empty (no rows pushed)
- **AND** the AFTER pass's bucket contains four rows, each tagged `diffStatus: ADDED`

#### Scenario: Removed env emits REMOVED rows only on the BEFORE pass
- **GIVEN** the previous snapshot has an env named `DEPRECATED_FLAG` and the latest snapshot omits it
- **WHEN** the diff renders
- **THEN** the BEFORE pass's bucket contains four rows, each tagged `diffStatus: REMOVED`
- **AND** the AFTER pass's bucket for that index is empty

#### Scenario: envValue row carries mountType / valueType / fileContent for the renderer
- **GIVEN** any env row
- **WHEN** the `envValue` diff row is pushed
- **THEN** the row data carries `mountType`, `valueType` (the source value `$type`), and `fileContent` when the env is a file
- **AND** the cell renderer receives these via `params.data` and branches accordingly

### Requirement: Resources section renders five flat rows with normalized values

The Resources section SHALL render up to five flat diff rows derived from `resources.requests` and `resources.limits`. Row parameters SHALL be `cpuRequest`, `memoryRequest`, `gpuRequest`, `cpuLimit`, `memoryLimit` — in that order. A `gpuLimit` row SHALL NOT be rendered: the editor exposes a single GPU input that writes the same value to both `requests` and `limits`, so showing both would duplicate the same number.

GPU values SHALL be read from `resources.{requests,limits}["nvidia.com/gpu"]` (the Kubernetes resource key the editor writes), falling back to plain `.gpu` for any legacy snapshot that uses the un-namespaced key.

Each row's `value` SHALL be formatted for display:
- CPU rows (`cpuRequest`, `cpuLimit`) — values are normalized to millicores with an `m` suffix via `formatCpuValue`. A bare numeric value (e.g. `"0.5"`) becomes `"500m"`; a value already ending in `m` is left intact.
- Memory rows (`memoryRequest`, `memoryLimit`) — values are normalized to megabytes with a ` Mb` suffix via `formatMemoryValue`. A bare numeric byte count (e.g. `"1073741824"`) becomes `"1024 Mb"`; a value already containing a unit suffix is left intact.
- GPU row (`gpuRequest`) — raw string value.

A row SHALL render only when the underlying field is present in at least one snapshot.

#### Scenario: Full resources object renders five rows in fixed order
- **GIVEN** snapshots with `resources: { requests: { cpu: "100m", memory: "256Mi", "nvidia.com/gpu": "1" }, limits: { cpu: "500m", memory: "1Gi", "nvidia.com/gpu": "1" } }`
- **WHEN** the Resources section renders
- **THEN** five rows appear in order `cpuRequest`, `memoryRequest`, `gpuRequest`, `cpuLimit`, `memoryLimit`
- **AND** no `gpuLimit` row is rendered

#### Scenario: Partial resources object hides missing rows
- **GIVEN** snapshots with `resources: { requests: { cpu: "100m" }, limits: { memory: "1Gi" } }`
- **WHEN** the Resources section renders
- **THEN** only `cpuRequest` and `memoryLimit` rows appear
- **AND** no rows for `memoryRequest`, `gpuRequest`, `cpuLimit`

#### Scenario: CPU bare-numeric value is normalized to millicores
- **GIVEN** a snapshot with `resources.requests.cpu === "0.5"`
- **WHEN** the `cpuRequest` cell renders
- **THEN** the displayed value is `"500m"`

#### Scenario: Memory byte-count value is normalized to megabytes
- **GIVEN** a snapshot with `resources.requests.memory === "1073741824"`
- **WHEN** the `memoryRequest` cell renders
- **THEN** the displayed value is `"1024 Mb"`

#### Scenario: GPU read from Kubernetes resource key
- **GIVEN** a snapshot with `resources.requests["nvidia.com/gpu"] === "1"`
- **WHEN** the `gpuRequest` cell renders
- **THEN** the displayed value is `"1"`

### Requirement: Autoscaling section applies per-snapshot row-visibility rules and formats values

The Autoscaling section SHALL emit up to five rows in this fixed order: `minReplicas`, `maxReplicas`, `scaleToZeroDelaySeconds`, `scalingStrategyType`, `scalingStrategyThreshold`. The `strategy` fields flatten into the section (not a nested subsection) under parameter names that disambiguate the source path (`scalingStrategyType` from `strategy.$type`, `scalingStrategyThreshold` from `strategy.threshold`).

Per-snapshot row visibility:
- Let `isNever = scaling.scaleToZeroDelaySeconds == null || scaling.scaleToZeroDelaySeconds === 0`.
- Let `minEqualsMax = scaling.minReplicas != null && scaling.maxReplicas != null && scaling.minReplicas === scaling.maxReplicas`.
- `minReplicas` and `maxReplicas` rows SHALL emit a value **only when** `isNever`; otherwise their value is `undefined` (and the diff engine hides rows whose values are empty on both snapshots).
- `scaleToZeroDelaySeconds` row SHALL always emit a value (defaulting to `0` if absent).
- `scalingStrategyType` and `scalingStrategyThreshold` rows SHALL emit a value **unless** (`isNever` AND `minEqualsMax`). The static-replica case (e.g., NIM Model Serving with `minReplicas === maxReplicas === 1` and no scale-to-zero) hides them because the strategy is meaningless when no autoscaling occurs.

Value formatting:
- `scaleToZeroDelaySeconds` maps numeric seconds → human label via `ContainersI18nKey.ScaleToZero*` (`0` → "Never automatically scale to zero", `300` → "After 5 minutes with no activity", `900` → "After 15 minutes with no activity", `1800` → "After 30 minutes with no activity", `3600` → "After 1 hour with no activity"). Unknown values fall through as raw.
- `scalingStrategyType` maps `active_requests` → `"Pending requests"`. Unknown values fall through as raw.
- `scalingStrategyThreshold` is the raw numeric value, unformatted.

Row label keys: `minReplicas`/`maxReplicas` use `ContainersI18nKey.MinReplicas`/`MaxReplicas`; `scaleToZeroDelaySeconds` uses `ContainersI18nKey.ScaleToZero` ("Automatic scale-to-zero"); `scalingStrategyThreshold` uses `ContainersI18nKey.Threshold` ("Pending requests to trigger autoscaling"); `scalingStrategyType` uses `EntityFieldsI18nKey.ScalingStrategyType`.

#### Scenario: Scale-to-zero enabled hides min/max
- **GIVEN** `scaling: { minReplicas: 1, maxReplicas: 5, scaleToZeroDelaySeconds: 300, strategy: { $type: "active_requests", threshold: 80 } }` on both snapshots
- **WHEN** the Autoscaling section renders
- **THEN** the rendered rows are `scaleToZeroDelaySeconds`, `scalingStrategyType`, `scalingStrategyThreshold`
- **AND** `minReplicas` and `maxReplicas` rows are hidden

#### Scenario: Never + different min/max shows all five rows
- **GIVEN** `scaling: { minReplicas: 0, maxReplicas: 5, scaleToZeroDelaySeconds: 0, strategy: { $type: "active_requests", threshold: 80 } }`
- **WHEN** the Autoscaling section renders
- **THEN** all five rows render in fixed order

#### Scenario: Never + min equals max (e.g., NIM static serving) hides strategy + threshold
- **GIVEN** `scaling: { minReplicas: 1, maxReplicas: 1, scaleToZeroDelaySeconds: 0, strategy: { $type: "active_requests", threshold: 80 } }`
- **WHEN** the Autoscaling section renders
- **THEN** the rendered rows are `minReplicas`, `maxReplicas`, `scaleToZeroDelaySeconds`
- **AND** `scalingStrategyType` and `scalingStrategyThreshold` rows are hidden

#### Scenario: scaleToZeroDelaySeconds value is formatted via ContainersI18nKey
- **GIVEN** `scaling.scaleToZeroDelaySeconds === 300`
- **WHEN** the cell renders
- **THEN** the displayed value resolves to `t(ContainersI18nKey.ScaleToZeroAfter5Minutes)` ("After 5 minutes with no activity")

#### Scenario: scalingStrategyType formatted as "Pending requests"
- **GIVEN** `scaling.strategy.$type === "active_requests"`
- **WHEN** the cell renders
- **THEN** the displayed value is `"Pending requests"`

### Requirement: Startup probe section flattens probe and formats values

The Startup probe section SHALL render rows for `probeEnabled` (sourced from `probeProperties.enabled`), `initialDelaySeconds`, `periodSeconds`, `timeoutSeconds`, `failureThreshold`, `probeType`, `probePath`, `probePort` (the last three flattened from `probeProperties.probe.{$type,path,port}`). The `probeEnabled` row name avoids collision with the existing role-limits `enabled` row label.

The Startup probe section is rendered **whenever `probeProperties` is a key on either snapshot**, even if its `enabled` flag is `false`. The `probeEnabled` row's value SHALL default to `"false"` when the source field is `undefined` so the section reliably surfaces for entities that persist `probeProperties` with only a flag.

Value formatting:
- `probeEnabled` maps `"true"` → `t(BasicI18nKey.Yes)`, `"false"` → `t(BasicI18nKey.No)`. Other values fall through as raw.
- `probeType` maps `PROBE_TYPE.TCP` (`"tcpSocket"`) → `"TCP"`, `PROBE_TYPE.HTTP_GET` (`"httpGet"`) → `"HTTP GET"`.

#### Scenario: Startup probe section flattens probe and renders all eight rows when populated
- **GIVEN** `probeProperties: { enabled: true, initialDelaySeconds: 10, periodSeconds: 5, timeoutSeconds: 1, failureThreshold: 3, probe: { $type: "httpGet", path: "/health", port: 8080 } }`
- **WHEN** the Startup probe section renders
- **THEN** rows appear for `probeEnabled`, `initialDelaySeconds`, `periodSeconds`, `timeoutSeconds`, `failureThreshold`, `probeType`, `probePath`, `probePort`
- **AND** no nested subsection header appears within the section

#### Scenario: probeEnabled value formatted as Yes/No
- **GIVEN** `probeProperties.enabled === true`
- **WHEN** the cell renders
- **THEN** the displayed value is `t(BasicI18nKey.Yes)` ("Yes")

#### Scenario: probeType maps tcpSocket/httpGet to UI labels
- **GIVEN** `probeProperties.probe.$type === "tcpSocket"`
- **WHEN** the cell renders
- **THEN** the displayed value is `"TCP"`

### Requirement: Container deployment predicate

The predicate `isContainerDeploymentResource(type)` SHALL be exported from `src/types/activity-audit.ts`, accept `string | undefined`, and return `true` only for the six container subtypes: `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`. The existing `isDeploymentManagerResource`, `isImageDefinitionResource`, and `isGlobalFirewallResource` predicates SHALL be unchanged.

#### Scenario: Predicate accepts the six container subtypes
- **WHEN** `isContainerDeploymentResource` is called with each of `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`
- **THEN** the result is `true` in every case

#### Scenario: Predicate rejects non-container deployment-manager types
- **WHEN** `isContainerDeploymentResource` is called with `McpImageDefinition`, `ImageBuildDomainWhitelist`, `Model`, or `Application`
- **THEN** the result is `false` in every case

### Requirement: Resource identifier chip navigates to the container's edit page

The "Resource identifier" chip in the `AuditView` header SHALL be clickable for container activities and SHALL navigate to the entity's edit page in the appropriate section, using the `auditResourceRoute` map. The six container subtypes route as follows:

- `McpDeployment` → `ApplicationRoute.McpContainers` (`/mcp-containers/{id}`)
- `AdapterDeployment` → `ApplicationRoute.AdapterContainers` (`/adapter-containers/{id}`)
- `ApplicationDeployment` → `ApplicationRoute.ApplicationContainers` (`/application-containers/{id}`)
- `InterceptorDeployment` → `ApplicationRoute.InterceptorContainers` (`/interceptor-containers/{id}`)
- `NimDeployment` → `ApplicationRoute.ModelServings` (`/model-servings/{id}`)
- `InferenceDeployment` → `ApplicationRoute.ModelServings` (`/model-servings/{id}`)

#### Scenario: MCP container chip navigates to McpContainers route
- **WHEN** the user clicks the Resource identifier chip on an `McpDeployment` activity
- **THEN** the browser navigates to `/{lang}/mcp-containers/{resourceId}`

#### Scenario: NIM serving chip navigates to ModelServings route
- **WHEN** the user clicks the Resource identifier chip on a `NimDeployment` activity
- **THEN** the browser navigates to `/{lang}/model-servings/{resourceId}`

#### Scenario: HF inference serving chip navigates to ModelServings route
- **WHEN** the user clicks the Resource identifier chip on an `InferenceDeployment` activity
- **THEN** the browser navigates to `/{lang}/model-servings/{resourceId}`

### Requirement: Container Properties section hides infrastructure keys and formats primitives

For container activities, the diff engine SHALL skip the following top-level keys when iterating the snapshot (they never produce diff rows): `$type`, `id`, `createdAt`, `updatedAt`, `parentDeploymentName`, `modelFormat`. The container's `$type` (e.g., `inference`) is already conveyed by the audit header chip; `modelFormat` duplicates the source `$type` for HuggingFace; identifier / timestamp fields are managed by the system and not user-visible state.

The flattened `source.$type` row in Properties SHALL be labelled with `EntityFieldsI18nKey.source` ("Source"). Its value SHALL be formatted via a container-aware source-type formatter:

- `internal_image` → `t(SourceI18nKey.InternalImage, { type: <subtype label> })` where `<subtype label>` is derived from `resourceType` (e.g., `MCP_DEPLOYMENT` → `t(EntitiesI18nKey.MCP)`, `NIM_DEPLOYMENT` / `INFERENCE_DEPLOYMENT` → `t(EntitiesI18nKey.Model)`)
- `image_reference` → `t(SourceI18nKey.DockerImageReference)`
- `ngc_registry` → `t(SourceI18nKey.NgcRegistry)`
- `huggingface` → `t(SourceI18nKey.HuggingFace)`
- `mcp-registry` (synthetic `$type` injected by `normalizeImageSource` when `externalRegistryRef` is present) → `t(SourceI18nKey.McpRegistry)`

`normalizeImageSource` SHALL additionally collapse the three internal-image source fields (`imageDefinitionId`, `imageDefinitionName`, `imageDefinitionVersion`) into a single synthetic `imageDefinition` row whose value is formatted as `"{name} ({version})"` when both are present, falling back to whichever single field is present. The `imageDefinitionId` UUID is dropped from the rendered output.

The container `status` row SHALL render through `DeploymentStatusCellRenderer`, which delegates to the shared `StatusIndicator` component (status icon + localized label resolved through `STATUS_I18N_KEYS`).

The container `transport` row SHALL map raw values to uppercase labels: `sse` → `"SSE"`, `http_streaming` → `"HTTP"`.

#### Scenario: Container hidden keys produce no rows
- **GIVEN** a snapshot with `{ $type: "mcp", id: "u-1", createdAt: 1, updatedAt: 2, parentDeploymentName: "p", modelFormat: "huggingface", displayName: "Foo" }`
- **WHEN** the diff body renders
- **THEN** no row appears for `$type`, `id`, `createdAt`, `updatedAt`, `parentDeploymentName`, or `modelFormat`
- **AND** a row appears for `displayName`

#### Scenario: Source $type rendered as "Internal MCP Image" for an internal-image MCP container
- **GIVEN** `resourceType: "McpDeployment"` and `source: { $type: "internal_image", imageDefinitionId: "u", imageDefinitionName: "foo", imageDefinitionVersion: "1.2.0" }`
- **WHEN** the Properties section renders
- **THEN** one row has parameter `$type` (labelled "Source") and value `"Internal MCP Image"`
- **AND** one row has parameter `imageDefinition` (labelled via `ImagesI18nKey.Image`) and value `"foo (1.2.0)"`
- **AND** no row appears for `imageDefinitionId`, `imageDefinitionName`, or `imageDefinitionVersion`

#### Scenario: MCP-Registry source renders single label
- **GIVEN** `source: { $type: "internal_image", externalRegistryRef: { packageName: "weather", version: "1.0.0" } }`
- **WHEN** the Properties section renders
- **THEN** the `$type` row's value is `t(SourceI18nKey.McpRegistry)` ("MCP Registry")
- **AND** a `packageName` row appears with value `"weather"` and a `serverVersion` row appears with value `"1.0.0"`

#### Scenario: status row renders status icon + label
- **GIVEN** a snapshot with `status: "running"`
- **WHEN** the status cell renders
- **THEN** the cell is rendered through `DeploymentStatusCellRenderer`, which renders a colored status icon + the localized "Running" label

#### Scenario: transport row formats to uppercase
- **GIVEN** a snapshot with `transport: "sse"`
- **WHEN** the transport cell renders
- **THEN** the displayed value is `"SSE"`
