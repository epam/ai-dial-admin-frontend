## mcp-registry-source (delta)

Changes to the existing MCP registry container flow: version stored in ExternalRegistryRef, McpServerNameField generalization, type and constant reorganization.

## MODIFIED Requirements

### Requirement: On Server Selection (autocomplete or modal)

When a server is selected, the following fields SHALL be populated on the container:

| Source field | Value |
|---|---|
| `source.$type` | `IMAGE_REFERENCE` (unchanged) |
| `source.imageReference` | Preferred OCI package's `identifier` (e.g., `docker.io/org/image:tag`) |
| `source.externalRegistryRef.$type` | `"mcp-registry"` |
| `source.externalRegistryRef.packageName` | `server.name` |
| `source.externalRegistryRef.version` | `server.version` |
| `transport` | Mapped from preferred OCI package's `transport.type`: `streamable-http` → `HTTP`, `sse` → `SSE`. Skip if no supported transport. |

Package preference: prefer OCI package with `streamable-http` transport over `sse`.

#### Scenario: Server selection stores name and version separately
- **WHEN** user selects server `io.github.user/weather` version `2.1.0` from autocomplete or modal
- **THEN** `source.externalRegistryRef.packageName` SHALL be `io.github.user/weather`
- **AND** `source.externalRegistryRef.version` SHALL be `2.1.0`

### Requirement: MCP Server Name Field

The `McpServerNameField` SHALL be generalized to work with both containers and images. It SHALL accept callback props instead of directly importing container types and actions:

- `fetchServers: McpRegistryFetchFn` — the fetch function for autocomplete and freeform validation
- `onServerSelect: (server: McpServer) => void` — callback when a server is selected
- `serverName: string` — current server name value
- `onServerNameChange: (name: string) => void` — callback when server name text changes
- `isModal?: boolean` — layout mode
- `disabled?: boolean` — disabled state

Container-specific logic (OCI package extraction, transport mapping, imageReference population) SHALL be handled by `ContainerSource`'s callbacks. The RUNNING status disabled check SHALL be applied only to the MCP server name field in `ContainerSource`, not globally.

#### Scenario: Container parent provides container-specific callbacks
- **WHEN** `McpServerNameField` is used in a container context
- **THEN** `ContainerSource` SHALL provide `fetchServers=getContainerMcpServers` and an `onServerSelect` that extracts OCI package info and populates container source fields

#### Scenario: Image parent provides image-specific callbacks
- **WHEN** `McpServerNameField` is used in an image context
- **THEN** `ImageSource` SHALL import `getImageMcpServers` directly and provide an `onServerSelect` that populates image source URL from `server.repository.url`

## ADDED Requirements

### Requirement: ExternalRegistryRef includes version field

The `ExternalRegistryRef` interface SHALL include an optional `version?: string` field. The interface SHALL be defined in `src/types/deployments/mcp-registry.ts`. Consumers SHALL import directly from the original file — no re-exports.

#### Scenario: Version stored on server selection
- **WHEN** a server is selected from the MCP registry
- **THEN** `externalRegistryRef.version` SHALL be set to `server.version`

### Requirement: McpRegistryFetchFn type in shared types

The `McpRegistryFetchFn` type SHALL be defined in `src/types/deployments/mcp-registry.ts` instead of the `McpRegistryGrid` component, to avoid pulling ag-grid dependencies when only the type is needed.

#### Scenario: Import without ag-grid dependency
- **WHEN** a component imports `McpRegistryFetchFn`
- **THEN** it SHALL import from `@/src/types/deployments/mcp-registry`
- **AND** the import SHALL NOT trigger ag-grid module resolution

### Requirement: MCP registry filter constants

Filter objects SHALL be defined as constants in `src/constants/deployments/mcp-registry.ts`:
- `CONTAINER_MCP_REGISTRY_FILTER`: `{ packageRegistryTypes: ['oci'], packageTransportTypes: ['streamable-http', 'sse'] }`
- `IMAGE_MCP_REGISTRY_FILTER`: `{ repositoryExists: true }`

The `McpRegistryApi` SHALL import filters from constants.

#### Scenario: API uses filter constants
- **WHEN** `getContainerMcpServers` is called
- **THEN** the request body SHALL use `CONTAINER_MCP_REGISTRY_FILTER`
- **WHEN** `getImageMcpServers` is called
- **THEN** the request body SHALL use `IMAGE_MCP_REGISTRY_FILTER`
