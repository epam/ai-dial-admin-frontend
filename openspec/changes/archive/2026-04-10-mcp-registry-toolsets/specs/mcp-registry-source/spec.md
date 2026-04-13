## mcp-registry-source

Delta spec for extending the existing MCP Registry source capability with toolset-specific filtering and generalized utility functions.

## ADDED Requirements

### Requirement: Toolset MCP Registry filter constant

`constants/deployments/mcp-registry.ts` SHALL export `TOOLSET_MCP_REGISTRY_FILTER: McpServerFilterDto` with value `{ remoteTransportTypes: ['streamable-http', 'sse'] }`, alongside the existing `CONTAINER_MCP_REGISTRY_FILTER` and `IMAGE_MCP_REGISTRY_FILTER`.

#### Scenario: All three filter constants coexist
- **WHEN** importing from `constants/deployments/mcp-registry.ts`
- **THEN** `CONTAINER_MCP_REGISTRY_FILTER`, `IMAGE_MCP_REGISTRY_FILTER`, and `TOOLSET_MCP_REGISTRY_FILTER` are all available

### Requirement: Remote utility functions in mcp-registry utils

`utils/deployments/mcp-registry.ts` SHALL export `getPreferredRemote(server: McpServer)` and `mapRemoteTransportType(type: string)` alongside existing `getPreferredOciPackage()` and `mapTransportType()`.

#### Scenario: Utils module exports both OCI and remote utilities
- **WHEN** importing from `utils/deployments/mcp-registry.ts`
- **THEN** both `getPreferredOciPackage`/`mapTransportType` (for containers) and `getPreferredRemote`/`mapRemoteTransportType` (for toolsets) are available

## MODIFIED Requirements

### Requirement: Purpose-specific API Method for Containers

`McpRegistryApi` SHALL expose a `getContainerMcpServers()` method that accepts `search`, `cursor`, and `limit` params, constructs a `McpServersRequestDto` with `filter: { packageRegistryTypes: ["oci"], packageTransportTypes: ["streamable-http", "sse"] }` internally, and sends a POST request to `/api/v1/mcp-registry/servers/list`.

`McpRegistryApi` SHALL also expose `getImageMcpServers()` and `getToolsetMcpServers()` methods following the same pattern with their respective filters.

Callers SHALL NOT provide filter values — the filter is an implementation detail of each API method.

#### Scenario: Three purpose-specific API methods exist
- **WHEN** accessing `McpRegistryApi` instance
- **THEN** `getContainerMcpServers()`, `getImageMcpServers()`, and `getToolsetMcpServers()` are all available
- **THEN** each sends the appropriate filter for its entity type
