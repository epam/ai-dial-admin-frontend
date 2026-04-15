## mcp-registry-source

UI flow for creating MCP containers from the MCP Registry, including registry browsing, server selection, and automatic container configuration. Gated behind `MCP_REGISTRY_ENABLED` feature flag.

### Backend API Contract

**List/search servers**: `POST /api/v1/mcp-registry/servers/list`
- Request body: `McpServersRequestDto` with fields: `search` (string), `cursor` (string), `limit` (number, default 100, max 1000), `filter` (McpServerFilterDto, optional)
- `McpServerFilterDto`: `{ packageRegistryTypes?: string[], packageTransportTypes?: string[], remoteTransportTypes?: string[], repositoryExists?: boolean }`
- Response: `{ servers: ServerResponseDto[], metadata: { nextCursor?, count? } }`
- Each `ServerResponseDto`: `{ server: ServerDetail, _meta: Map }`
- `ServerDetail`: `{ name, description, title?, version, repository?, websiteUrl?, packages?, remotes?, icons? }`
- `Package`: `{ registryType: "npm"|"pypi"|"oci"|"nuget"|"mcpb", identifier, version?, transport: { type }, runtimeHint?, environmentVariables? }`
- `Remote`: `{ type: "streamable-http"|"sse", url, headers?, variables? }`

The system SHALL use `POST /api/v1/mcp-registry/servers/list` for all MCP registry server requests instead of `GET /api/v1/mcp-registry/servers`.

### Feature Flag

- Feature SHALL be gated behind `MCP_REGISTRY_ENABLED` env var (default: false)
- When disabled, the "From MCP Registry" option SHALL NOT appear in the Create dropdown
- Feature flag SHALL be passed via `featureFlags.mcpRegistryEnabled` in `AppContext`
- Env var SHALL be documented in `README.md` and `.env.template`

### Entry Point

- The MCP containers list page (`ApplicationRoute.McpContainers`) Create dropdown SHALL have a 3rd option: "From MCP Registry" (when feature flag enabled)
- Clicking it SHALL open the `ServingCreate` modal with `type=MCP`, `sourceType=IMAGE_REFERENCE`, and `templateOptions={ mcpRegistry: true }`
- Template SHALL initialize with `externalRegistryRef: { $type: 'mcp-registry', packageName: '' }` so `ContainerSource` renders `McpServerNameField`

### Server Selectability

With server-side filtering by `packageRegistryTypes` and `packageTransportTypes`, all returned servers are selectable. All rows in the MCP registry grid SHALL be selectable.

### Server-side Container Pre-filter

All container-related MCP registry server requests (grid pagination, autocomplete search, freeform validation) SHALL include a `filter` with `packageRegistryTypes: ["oci"]` and `packageTransportTypes: ["streamable-http", "sse"]` so that only servers with OCI packages and supported transports are returned.

### Toolset MCP Registry Filter Constant

`constants/deployments/mcp-registry.ts` SHALL export `TOOLSET_MCP_REGISTRY_FILTER: McpServerFilterDto` with value `{ remoteTransportTypes: ['streamable-http', 'sse'] }`, alongside the existing `CONTAINER_MCP_REGISTRY_FILTER` and `IMAGE_MCP_REGISTRY_FILTER`.

### Purpose-specific API Methods

`McpRegistryApi` SHALL expose `getContainerMcpServers()`, `getImageMcpServers()`, and `getToolsetMcpServers()` methods. Each accepts `search`, `cursor`, and `limit` params, constructs a `McpServersRequestDto` with its respective filter internally, and sends a POST request to `/api/v1/mcp-registry/servers/list`.

Callers SHALL NOT provide filter values — the filter is an implementation detail of each API method.

### Purpose-specific Server Action for Containers

A `getContainerMcpServers()` server action SHALL be created that accepts `{ search?, cursor?, limit }`, authenticates, and delegates to `McpRegistryApi.getContainerMcpServers()`. This replaces the current generic `getMcpServers()` action for container use cases.

### Server Action Accumulates Results with minResults

The `getContainerMcpServers` server action SHALL accept an optional `minResults` param. When provided, it SHALL fetch multiple BE pages until `minResults` results are accumulated or the upstream cursor is exhausted. When omitted, a single fetch SHALL be made.

The accumulation loop SHALL NOT break on empty responses — only when the cursor is exhausted.

### Typed Request and Filter DTOs

The system SHALL define TypeScript interfaces mirroring the BE contract:

- `McpServerFilterDto` with optional fields: `packageRegistryTypes` (`string[]`), `packageTransportTypes` (`string[]`), `remoteTransportTypes` (`string[]`), `repositoryExists` (`boolean`)
- `McpServersRequestDto` with optional fields: `search` (`string`), `cursor` (`string`), `limit` (`number`), `filter` (`McpServerFilterDto`)

These interfaces SHALL be located in `src/types/deployments/mcp-registry.ts`.

### Remote Utility Functions

`utils/deployments/mcp-registry.ts` SHALL export `getPreferredRemote(server: McpServer)` and `mapRemoteTransportType(type: string)` alongside existing `getPreferredOciPackage()` and `mapTransportType()`.

### MCP Server Name Field

- SHALL render a `DialSelectField` with inline search (debounced, same pattern as `HFModelNameField`)
- Autocomplete SHALL call `getContainerMcpServers({ search: value, limit: 5 })` on input (debounce ~100ms, trigger after 2+ characters)
- All autocomplete results SHALL be shown as options without client-side filtering
- SHALL maintain a server cache (`Map<string, McpServer>`) for instant pre-fill on autocomplete selection
- SHALL render a "Select from registry" button that opens the registry browser modal
- SHALL validate server name against pattern `^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$`
- SHALL register validity with `SaveValidationContext` (field: `mcpServerName`)
- SHALL be disabled when container is in edit-disabled state or running
- SHALL clear dropdown options when input has 2 or fewer characters

### Freeform Validation

When user types a server name that is not in the local cache:
1. `imageReference` SHALL be cleared immediately
2. `mcpServerName` field SHALL be marked invalid (Save blocked, no error message shown)
3. A fetch SHALL be made to `getContainerMcpServers({ search: value, limit: 10 })`
4. If exact name match found → `applyServer()` called, field becomes valid
5. If no exact match → error: "MCP server not found in registry"

### On Server Selection (autocomplete or modal)

When a server is selected, the following fields SHALL be populated on the container:

| Source field | Value |
|---|---|
| `source.$type` | `IMAGE_REFERENCE` (unchanged) |
| `source.imageReference` | Preferred OCI package's `identifier` (e.g., `docker.io/org/image:tag`) |
| `source.externalRegistryRef.$type` | `"mcp-registry"` |
| `source.externalRegistryRef.packageName` | `server.name` |
| `transport` | Mapped from preferred OCI package's `transport.type`: `streamable-http` → `HTTP`, `sse` → `SSE`. Skip if no supported transport. |

Package preference: prefer OCI package with `streamable-http` transport over `sse`.

### Registry Browser Modal

- SHALL use `McpRegistryModal` with `DialFormPopup`, header "Select MCP server from registry"
- Confirm button SHALL be disabled when no server is selected
- SHALL contain `McpRegistryGrid`

### Registry Grid

- SHALL use ag-grid with infinite scroll and cursor-based pagination
- SHALL support single-row radio selection
- All rows SHALL be selectable (server-side filtering ensures only compatible servers are returned)
- Search filter on server name column SHALL map to `search` query parameter
- `updatedAt` SHALL be flattened from `_meta["io.modelcontextprotocol.registry/official"].updatedAt` during response mapping
- SHALL accept a `fetchServers: McpRegistryFetchFn` prop and use it for all data fetching (no direct action import)
- `McpRegistryModal` SHALL accept and pass through the `fetchServers` prop to `McpRegistryGrid`
- Radio button cell renderer SHALL return `null` when the row has no data (placeholder rows)

**Columns:**

| Column | Field | Sortable | Filterable | Renderer |
|---|---|---|---|---|
| MCP server name | `name` | no | yes (text → search) | text |
| Website | `websiteUrl` | no | no | text |
| Repository | `repository.url` | no | no | text (valueGetter) |
| Remotes | `remotes[].type` | no | no | badge tags |
| Packages | `packages[].registryType` | no | no | badge tags |
| Version | `version` | no | no | text |
| Last Update | `updatedAt` (flattened) | no | no | dateTime |

### Validation

- MCP server name: required, pattern `^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$`
- Server existence: validated against registry on freeform input
- `source.imageReference`: populated automatically from OCI identifier

### Error Handling

- If MCP registry API call fails, grid SHALL show error state (ag-grid `failCallback`)
- If autocomplete search fails, no suggestions shown (silent failure, same as HF pattern)
- Toast notification on container creation failure (existing pattern via `showNotification`)

### Accessibility

- Registry grid SHALL be keyboard navigable (ag-grid default)
- Modal SHALL trap focus (handled by `DialFormPopup`)
- "Select from registry" button SHALL have descriptive label for screen readers