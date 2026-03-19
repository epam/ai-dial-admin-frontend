## V1 — Implemented

### 1. Types and Models

- [x] 1.1 Create MCP server types in `src/types/deployments/mcp-registry.ts`: `McpServer`, `McpPackage`, `McpRemote`, `McpRepository`, `McpServerResponse`, `McpServersResponse`
- [x] 1.2 Add `ExternalRegistryRef` interface and `externalRegistryRef?` to `ContainerSource` type in `src/types/deployments/containers.ts`
- [x] 1.3 Add `createMcpRegistry` to `ModalType` enum in `src/components/EntityListView/Components/Modals.tsx`
- [x] 1.4 Add i18n keys in `src/locales/en.ts` and `src/constants/i18n.ts`: MCP server name label/placeholder, "Select from registry" button, modal header, dropdown label, validation errors (invalid name, not found, not supported)

### 2. API Layer

- [x] 2.1 Create `McpRegistryApi` class in `src/server/deployments/mcp-registry.ts` extending `BaseApi` with `getMcpServers(params, token)` → `GET /api/v1/mcp-registry/servers`
- [x] 2.2 Add `mcpRegistryApi` instance in `src/app/api/api.ts`
- [x] 2.3 Add server action `getMcpServers(params)` in `src/app/actions/deployments.ts`

### 3. Utils

- [x] 3.1 Create `src/utils/deployments/mcp-registry.ts` with:
  - `hasOciPackage(server)` — checks `packages[].registryType === "oci"`
  - `hasSupportedTransport(server)` — checks OCI packages have `transport.type` of `streamable-http` or `sse`
  - `isServerSelectable(server)` — requires both OCI package and supported transport
  - `getPreferredOciPackage(server)` — finds OCI package preferring `streamable-http` over `sse`
  - `mapTransportType(transportType)` — `"streamable-http"` → `CONTAINER_TRANSPORT.HTTP`, `"sse"` → `CONTAINER_TRANSPORT.SSE`
- [x] 3.2 Add `getErrorForMcpServerName(value, t)` to `src/utils/deployments/validation.ts` — pattern: `^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$`

### 4. Grid Column Definitions

- [x] 4.1 Add `MCP_REGISTRY_COLUMNS` to `src/constants/grid-columns/grid-columns.tsx` with columns: MCP server name (searchable filter), Website, Repository (valueGetter), Remotes (badge tags), Packages (badge tags), Version, Last Update (dateTime, flattened from `_meta`)

### 5. MCP Registry Grid and Modal

- [x] 5.1 Create `McpRegistryGrid` in `src/components/Deployments/McpRegistryGrid/McpRegistryGrid.tsx` — ag-grid with infinite scroll, cursor-based pagination, radio single-select, `ListEntities` wrapper, `MCP_REGISTRY_COLUMNS`. Rows not passing `isServerSelectable` disabled (opacity 0.5). Search filter maps to `search` param. Flattens `updatedAt` from `_meta` during response mapping.
- [x] 5.2 Create `McpRegistryModal` in `src/components/Deployments/Modals/McpRegistryModal/McpRegistryModal.tsx` — `DialFormPopup` with header, Cancel/Confirm. Returns selected `McpServer` object on confirm.

### 6. McpServerNameField Component

- [x] 6.1 Create `McpServerNameField` in `src/components/Deployments/Fields/ContainerSource/McpServerNameField.tsx`:
  - `DialSelectField` with debounced autocomplete calling `getMcpServers({ search, limit: 5 })`, filtered by `isServerSelectable`
  - Maintains `McpServer` cache for instant pre-fill on autocomplete selection
  - "Select from registry" button opening `McpRegistryModal`
  - On server selection: set `source.imageReference` from preferred OCI package identifier, `source.externalRegistryRef.packageName` from server name, `transport` from package transport type
  - Freeform validation: clears `imageReference`, blocks Save during fetch, shows "not found" or "not supported" errors
  - Pattern validation using `getErrorForMcpServerName`
  - Registers field validity with `SaveValidationContext`

### 7. Integrate into Existing Components

- [x] 7.1 Update `ContainerSource` (`src/components/Deployments/Fields/ContainerSource.tsx`): in `IMAGE_REFERENCE` case, check `externalRegistryRef` → render `McpServerNameField`; skip `imageReference` validation when `externalRegistryRef` present
- [x] 7.2 Update `HeaderButtons` (`src/components/Containers/List/HeaderButtons.tsx`): add 3rd item to `mcpDropdownItems` ("From MCP Registry"), conditionally included based on `featureFlags.mcpRegistryEnabled`
- [x] 7.3 Update `getContainerTemplate` in `src/utils/deployments/containers.ts`: add 4th param `options?: ContainerTemplateOptions`. When `options.mcpRegistry`, include `externalRegistryRef` in source
- [x] 7.4 Update `ServingCreate` (`src/components/Deployments/Modals/ServingCreate.tsx`): add `templateOptions` prop, pass through to `getContainerTemplate`

### 8. Feature Flag

- [x] 8.1 Add `mcpRegistryEnabled: isValueTruthy(process.env.MCP_REGISTRY_ENABLED)` to `featureFlags` in `src/app/[lang]/layout.tsx`
- [x] 8.2 Gate MCP registry dropdown item behind `featureFlags.mcpRegistryEnabled` in `HeaderButtons`
- [x] 8.3 Add `MCP_REGISTRY_ENABLED` to `.env.template`
- [x] 8.4 Add `MCP_REGISTRY_ENABLED` to environment variables table in `README.md`

### 9. Tests

- [x] 9.1 Unit tests for `src/utils/deployments/mcp-registry.ts`: `hasOciPackage`, `hasSupportedTransport`, `isServerSelectable`, `getPreferredOciPackage`, `mapTransportType`
- [x] 9.2 Unit tests for `getErrorForMcpServerName` in `src/utils/deployments/tests/validation.spec.ts`
- [x] 9.3 Unit tests for `McpRegistryApi` in `src/server/deployments/tests/mcp-registry.spec.ts`
- [x] 9.4 Component test for `ContainerSource` — verify `externalRegistryRef` branch renders `McpServerNameField`
- [x] 9.5 Update `HeaderButtons` tests — verify 3rd dropdown item for MCP route

### 10. Quality Checks

- [x] 10.1 Run lint, format, and all tests (`nx lint ai-dial-admin`, `nx test ai-dial-admin`) to verify no regressions

---

## Future Improvements

### Generic Registry Abstraction
- Extract reusable `RegistryGrid` and `RegistryModal` generic components from `McpRegistryGrid`/`McpRegistryModal`
- Migrate HF flow (`HFRegistryGrid`, `HFRegistryModal`) to use generic components

### Edit View
- On container detail view, when `externalRegistryRef` present, render `McpServerNameField` instead of Docker URI input
- Allow re-selection of MCP server, updating `imageReference` and `transport`

### Environment Variables Pre-fill
- On server selection, populate `metadata.envs[]` from `packages[].environmentVariables`
- Map `isSecret` → `MOUNT_TYPE.SECURE_CONTENT`, `isRequired` → validation

### Auto-fill Name/Description
- Pre-fill `displayName` from `server.title` and `description` from `server.description` on selection

### Version Selection
- Add version picker after server selection (fetch `GET /{ns}/{name}/versions`)
- Allow user to choose specific version vs latest

### Repository Support
- Support servers with git repository but no OCI package
- Map repository URL to `git` source type for image building

### Non-Selectable Row UX
- Add tooltip on disabled rows explaining why they can't be selected
- Consider filtering vs disabling

### Backend `_meta` Flattening
- Request BE to expose `updatedAt` as a top-level field on the response DTO
- Remove frontend flattening logic once BE provides it
