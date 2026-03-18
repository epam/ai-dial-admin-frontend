## mcp-registry-source

UI flow for creating MCP containers from the MCP Registry, including registry browsing, server selection, and automatic container configuration. Gated behind `MCP_REGISTRY_ENABLED` feature flag.

### Backend API Contract

**List/search servers**: `GET /api/v1/mcp-registry/servers`
- Query params: `search` (string), `cursor` (string), `limit` (number, default 100, max 1000), `updatedSince` (RFC3339), `version` (string)
- Response: `{ servers: ServerResponseDto[], metadata: { nextCursor?, count? } }`
- Each `ServerResponseDto`: `{ server: ServerDetail, _meta: Map }`
- `ServerDetail`: `{ name, description, title?, version, repository?, websiteUrl?, packages?, remotes?, icons? }`
- `Package`: `{ registryType: "npm"|"pypi"|"oci"|"nuget"|"mcpb", identifier, version?, transport: { type }, runtimeHint?, environmentVariables? }`
- `Remote`: `{ type: "streamable-http"|"sse", url, headers?, variables? }`

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

A server is selectable (in both grid and autocomplete) when it has **both**:
1. At least one package with `registryType === "oci"`
2. At least one OCI package with `transport.type === "streamable-http"` or `transport.type === "sse"`

Transport is read from `packages[].transport.type` (NOT from `remotes[]`).

A server is blocked when:
- No packages at all
- No OCI package
- OCI packages only have unsupported transport (e.g., `stdio`)

### MCP Server Name Field

- SHALL render a `DialSelectField` with inline search (debounced, same pattern as `HFModelNameField`)
- Autocomplete SHALL call `getMcpServers({ search: value, limit: "5" })` on input (debounce ~100ms, trigger after 2+ characters)
- Autocomplete results SHALL be filtered to only selectable servers (`isServerSelectable`)
- SHALL maintain a server cache (`Map<string, McpServer>`) for instant pre-fill on autocomplete selection
- SHALL render a "Select from registry" button that opens the registry browser modal
- SHALL validate server name against pattern `^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$`
- SHALL register validity with `SaveValidationContext` (field: `mcpServerName`)
- SHALL be disabled when container is in edit-disabled state or running

### Freeform Validation

When user types a server name that is not in the local cache:
1. `imageReference` SHALL be cleared immediately
2. `mcpServerName` field SHALL be marked invalid (Save blocked, no error message shown)
3. A fetch SHALL be made to `getMcpServers({ search: value, limit: "10" })`
4. If exact name match found and selectable → `applyServer()` called, field becomes valid
5. If exact match found but not selectable → error: "MCP server does not have a supported OCI package and transport"
6. If no exact match → error: "MCP server not found in registry"

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
- Rows not passing `isServerSelectable` SHALL be disabled (not selectable, visually greyed with opacity 0.5)
- Search filter on server name column SHALL map to `search` query parameter
- `updatedAt` SHALL be flattened from `_meta["io.modelcontextprotocol.registry/official"].updatedAt` during response mapping

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
- Server selectability: must have OCI + supported transport
- `source.imageReference`: populated automatically from OCI identifier

### Error Handling

- If MCP registry API call fails, grid SHALL show error state (ag-grid `failCallback`)
- If autocomplete search fails, no suggestions shown (silent failure, same as HF pattern)
- Toast notification on container creation failure (existing pattern via `showNotification`)

### Accessibility

- Registry grid SHALL be keyboard navigable (ag-grid default)
- Disabled rows SHALL have reduced opacity (0.5) visual indicator
- Modal SHALL trap focus (handled by `DialFormPopup`)
- "Select from registry" button SHALL have descriptive label for screen readers
