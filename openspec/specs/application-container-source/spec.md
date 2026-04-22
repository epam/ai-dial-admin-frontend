### Requirement: SOURCE_FIELD carries mcpEndpointPath

The `SOURCE_FIELD` interface in `components/SourceField/types.ts` SHALL include an optional `mcpEndpointPath?: string` field so that the BE `ApplicationContainerSourceDto.mcpEndpointPath` can be round-tripped without data loss.

#### Scenario: mcpEndpointPath survives serialization

- **WHEN** the FE sends a DialApplication with `source.$type === 'container'` and `source.mcpEndpointPath === '/mcp/'`
- **THEN** the JSON payload SHALL contain `{ "$type": "container", "containerId": "...", "mcpEndpointPath": "/mcp/" }`
- **AND** no other SOURCE_FIELD fields are affected

### Requirement: Applications source dropdown offers CONTAINER option

`APPLICATION_SOURCE_ITEMS` SHALL include `SOURCE_TYPE.CONTAINER` with label `"Application Container"` as a third option alongside ENDPOINTS and SCHEMA. The option SHALL be disabled when `featureFlags.deploymentsEnabled` is false, consistent with how CONTAINER is gated for other entity types.

#### Scenario: Dropdown with deployments enabled

- **WHEN** a user opens a DialApplication with `deploymentsEnabled: true`
- **THEN** the source dropdown SHALL show three options: "Endpoints", "App Runner", "Application Container"

#### Scenario: Dropdown with deployments disabled

- **WHEN** a user opens a DialApplication with `deploymentsEnabled: false`
- **THEN** the "Application Container" option SHALL be present but disabled

### Requirement: Containers component supports DialApplication

`Containers.tsx` SHALL accept `DialApplication` as a valid entity type alongside `DialInterceptor` and `DialModel`. When the entity is a `DialApplication`:

1. `onSelect` SHALL write only `source.containerId` and `source.containerName` — no automatic `completionEndpointPath` derivation (unlike Models).
2. After container selection, the sub-component rendered below the selector SHALL be `ApplicationEndpoint` with `prefix={selectedContainer.url}`.
3. The "open in new tab" link SHALL navigate to `ApplicationRoute.ApplicationContainers`.

#### Scenario: Container selected for Application

- **WHEN** a user selects a container while editing a DialApplication with source CONTAINER
- **THEN** `entity.source.containerId` SHALL be set to the selected container's name
- **AND** `entity.source.containerName` SHALL be set to the selected container's display name
- **AND** `entity.source.completionEndpointPath` SHALL NOT be auto-populated
- **AND** `ApplicationEndpoint` SHALL render below the selector with `prefix` set to the container's URL

#### Scenario: Open container link

- **WHEN** the user clicks the "open in new tab" icon next to the container selector for an Application
- **THEN** the browser SHALL navigate to the Application Container detail page

### Requirement: ApplicationEndpoint dual-mode rendering via prefix prop

`ApplicationEndpoint.tsx` SHALL accept an optional `prefix?: string` prop. The presence of `prefix` activates CONTAINER mode; its absence preserves the existing ENDPOINTS mode.

**CONTAINER mode** (prefix present):
- The chat endpoint checkbox SHALL be rendered as `checked={true}` and `disabled={true}` — it is permanently locked on.
- The MCP endpoint checkbox SHALL be rendered as interactive (user can check/uncheck).
- Chat input SHALL accept a path string (e.g. `/v1/chat/completions`); the `prefix` value SHALL be displayed as a read-only label alongside the input.
- MCP path input SHALL accept a path string; the `prefix` value SHALL be displayed as a read-only label alongside the input (visible only when MCP is checked).
- On chat path change: `onChange` SHALL write the value to `entity.source.completionEndpointPath`.
- On MCP path change: `onChange` SHALL write the value to `entity.source.mcpEndpointPath`.
- MCP transport, `forwardPerRequestKey`, and `configDelivery` fields SHALL remain editable and write to `entity.mcp.*` as in ENDPOINTS mode.

**ENDPOINTS mode** (prefix absent): all existing behaviour unchanged.

#### Scenario: Chat path input in CONTAINER mode

- **WHEN** `prefix` is present and the user types `/v1/chat/completions` in the chat path field
- **THEN** `entity.source.completionEndpointPath` SHALL be set to `/v1/chat/completions`
- **AND** `entity.endpoint` SHALL NOT be modified

#### Scenario: Chat checkbox locked in CONTAINER mode

- **WHEN** `prefix` is present
- **THEN** the chat checkbox SHALL be rendered with `checked={true}` and `disabled={true}`
- **AND** clicking it SHALL have no effect

#### Scenario: MCP toggled on in CONTAINER mode

- **WHEN** `prefix` is present and the user checks the MCP checkbox
- **THEN** the MCP path input and MCP config section SHALL become visible
- **AND** `entity.mcp` SHALL be initialised with default transport values

#### Scenario: MCP toggled off in CONTAINER mode

- **WHEN** `prefix` is present and the user unchecks the MCP checkbox
- **THEN** `entity.source.mcpEndpointPath` SHALL be set to `null`
- **AND** `entity.mcp` SHALL be set to `undefined`

#### Scenario: ENDPOINTS mode unaffected

- **WHEN** `prefix` is absent
- **THEN** the component SHALL behave identically to its pre-change implementation
- **AND** chat and MCP checkboxes SHALL both be interactive

### Requirement: Source-type change to CONTAINER clears Application fields

When the source `$type` changes to or from `CONTAINER` in the Applications view, `SourceField.onChangeSource` SHALL clear the same Application-specific fields it clears for ENDPOINTS↔SCHEMA switches: `endpoint`, `mcp`, `viewerUrl`, `editorUrl`, `applicationTypeSchemaId`, `applicationProperties`.

#### Scenario: Switching ENDPOINTS → CONTAINER

- **WHEN** the user switches the source dropdown from ENDPOINTS to CONTAINER
- **THEN** `entity.endpoint`, `entity.mcp`, `entity.viewerUrl`, `entity.editorUrl`, `entity.applicationTypeSchemaId`, and `entity.applicationProperties` SHALL be cleared
- **AND** `entity.source.$type` SHALL be updated to `CONTAINER`

#### Scenario: Switching CONTAINER → SCHEMA

- **WHEN** the user switches the source dropdown from CONTAINER to SCHEMA
- **THEN** the same Application-specific fields SHALL be cleared
- **AND** `entity.source.$type` SHALL be updated to `SCHEMA`

### Requirement: Create Application shortcut from Application Containers list

The Application Containers list header SHALL expose a "Create Application" action that navigates to the Application create form with `source.$type === CONTAINER` and `containerId` pre-filled. The SourceField picker SHALL be hidden on the create form (existing `!initialValues` guard), so the user only fills in name and other fields.

#### Scenario: Navigate from container list to create application

- **WHEN** the user clicks "Create Application" on a container in the Application Containers list
- **THEN** the browser SHALL navigate to the Application create form
- **AND** the form SHALL have `source = { $type: 'container', containerId: <selected>, containerName: <selected> }` pre-filled
- **AND** the SourceField selector SHALL NOT be visible on the create form

#### Scenario: getContainerRoute for Applications

- **WHEN** `getContainerRoute(ApplicationRoute.Applications)` is called
- **THEN** it SHALL return `ApplicationRoute.ApplicationContainers`
