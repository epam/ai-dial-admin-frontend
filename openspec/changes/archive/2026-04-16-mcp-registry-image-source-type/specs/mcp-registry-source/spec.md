## MODIFIED Requirements

### Requirement: MCP registry filter constants

Filter objects SHALL be defined as constants in `src/constants/deployments/mcp-registry.ts`:
- `CONTAINER_MCP_REGISTRY_FILTER`: `{ packageRegistryTypes: ['oci'], packageTransportTypes: ['streamable-http', 'sse'] }`
- `IMAGE_MCP_REGISTRY_REPO_FILTER`: `{ repositoryExists: true }`
- `IMAGE_MCP_REGISTRY_OCI_FILTER`: `{ packageRegistryTypes: ['oci'] }`
- `TOOLSET_MCP_REGISTRY_FILTER`: `{ remoteTransportTypes: ['streamable-http', 'sse'] }`

The previous `IMAGE_MCP_REGISTRY_FILTER` constant SHALL be replaced by two separate constants for the dual-request pattern.

#### Scenario: Image API uses both filter constants
- **WHEN** `getImageMcpServers` is called
- **THEN** two parallel requests SHALL be made — one with `IMAGE_MCP_REGISTRY_REPO_FILTER` and one with `IMAGE_MCP_REGISTRY_OCI_FILTER`

## ADDED Requirements

### Requirement: SourceType accepts registryServer prop

The `SourceType` component SHALL accept an optional `registryServer?: McpServer` prop. When provided:
- `SourceType` SHALL own the source type switch logic internally — building clean source objects with prefilled data from the server
- The source type dropdown SHALL be disabled when `!hasRepoAndOci(registryServer)` (server has only one capability)
- `externalRegistryRef` SHALL be passed through from `image.source` untouched — `SourceType` SHALL NOT modify name or version

When `registryServer` is not provided, existing behavior SHALL be unchanged (default handler wipes and replaces source).

#### Scenario: Registry server with both capabilities — dropdown enabled
- **WHEN** `SourceType` receives `registryServer` with both repository and OCI packages
- **THEN** the source type dropdown SHALL be enabled

#### Scenario: Registry server with single capability — dropdown disabled
- **WHEN** `SourceType` receives `registryServer` with only repository or only OCI
- **THEN** the source type dropdown SHALL be disabled

#### Scenario: No registryServer — default behavior
- **WHEN** `SourceType` does NOT receive `registryServer`
- **THEN** the default handler SHALL wipe and replace the source (existing behavior unchanged)
