## ADDED Requirements

### Requirement: Sub-source components remove their validation entries on unmount

Any component nested inside `SourceField` (`apps/ai-dial-admin/src/components/SourceField/SourceField.tsx`) or inside the source-type branch of `ContainerSource` (`apps/ai-dial-admin/src/components/Deployments/Fields/ContainerSource.tsx`) that registers a field in `SaveValidationContext` via `dispatch({ type: ValidationActionType.SetField, field: <name>, ... })` SHALL also dispatch `{ type: ValidationActionType.RemoveField, field: <name> }` when the component unmounts. The cleanup SHALL be the return value of the same `useEffect` that registers the field.

The contract applies to (at minimum) `McpServerNameField` (`field: 'mcpServerName'`) and `HFModelNameField` (`field: 'modelName'`). New sub-source components added in the future SHALL follow the same lifecycle.

#### Scenario: Switching from MCP Registry to MCP Container in Create Toolset removes mcpServerName

- **WHEN** the user opens Create Toolset, selects "MCP Registry" as source type without filling the server-name field, and then switches to "MCP Container"
- **THEN** the `mcpServerName` entry is removed from `SaveValidationContext.fieldValidations`
- **AND** `isValid` is recomputed over only the remaining entries (it does not stay `false` because of a stale `mcpServerName: false`)

#### Scenario: Filling required fields after the switch enables Create

- **GIVEN** the user has switched MCP Registry → MCP Container as in the previous scenario
- **WHEN** they fill the unique `name`, `displayName`, and select a Container
- **THEN** the Create button is enabled (issue #3027)

#### Scenario: Container source-type swap clears HF and MCP validation entries

- **GIVEN** the user is editing a container with `source.$type === IMAGE_REFERENCE` and `externalRegistryRef` set, so `McpServerNameField` is rendered
- **WHEN** the user switches container source to HUGGINGFACE
- **THEN** `mcpServerName` is removed from validation state
- **AND** `modelName` is registered fresh by `HFModelNameField` and follows the same cleanup contract on the next switch

#### Scenario: Re-entering a source type after switching away

- **GIVEN** the user has selected MCP Registry, picked a server (validating `mcpServerName: true`), then switched away
- **WHEN** the user switches back to MCP Registry
- **THEN** `McpServerNameField` re-mounts and re-registers `mcpServerName` based on the current `serverName` value (not on the previous mount's last state)

### Requirement: Switching source type produces a clean source object

`SourceField.onChangeSource` (`apps/ai-dial-admin/src/components/SourceField/SourceField.tsx`) SHALL build the new `entity.source` as `{ $type: <newType> }` only. It SHALL NOT spread the previous `entity.source` into the new object. Type-specific keys (`serverName`, `serverVersion`, `containerId`, `runnerName`, `adapterName`, `applicationTypeSchemaId`, `completionEndpointPath`, `responsesEndpointPath`, `configurationEndpointPath`, `mcpEndpointPath`) SHALL NOT carry across a source-type change.

This requirement applies to all entity types served by `SourceField` (Toolsets, Models, Adapters, Interceptors, and Applications when used in the modal flow).

#### Scenario: Switch from MCP Registry to MCP Container drops serverName

- **GIVEN** `entity.source = { $type: 'mcp-registry', serverName: 'foo', serverVersion: '1.0' }`
- **WHEN** the user selects "MCP Container" in the source-type dropdown
- **THEN** `entity.source` becomes exactly `{ $type: 'container' }`
- **AND** `entity.source.serverName` and `entity.source.serverVersion` are `undefined`

#### Scenario: Switch from MCP Container to External Endpoint drops containerId

- **GIVEN** `entity.source = { $type: 'container', containerId: 'my-container' }`
- **WHEN** the user selects "External Endpoint"
- **THEN** `entity.source` becomes exactly `{ $type: 'endpoints' }`
- **AND** `entity.source.containerId` is `undefined`

#### Scenario: Submitted payload has no stale source keys

- **GIVEN** the user switched source type at least once during creation
- **WHEN** the form submits the entity to the backend (`createToolset`, `createModel`, etc.)
- **THEN** `entity.source` contains only `$type` and the keys populated by the currently mounted sub-source component

### Requirement: Submit-button enablement reflects only mounted-field validations

The Create / Save button computed from `useSaveValidationContext().isValid` SHALL reflect validation state of currently mounted form fields only. Once a sub-source component unmounts, its previous `isValid` value SHALL NOT influence the submit-enablement of the form.

This requirement is the user-visible consequence of the two requirements above; the test for issue #3027 validates it end-to-end.

#### Scenario: Issue #3027 repro

- **WHEN** the user opens "Create Toolset", selects "MCP Registry", switches to "MCP Container", picks a container, and fills `name` and `displayName` with valid unique values
- **THEN** the Create button is enabled
