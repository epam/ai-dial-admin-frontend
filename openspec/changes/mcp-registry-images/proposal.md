## Why

MCP Registry integration currently only supports containers — users can browse the registry and create containers from servers that have OCI packages. However, many MCP servers also have source repositories (GitHub) that can be used to build image definitions. There is no way to create images from MCP Registry today, forcing users to manually copy repository URLs. The BE already supports `externalRegistryRef` on image source DTOs (spec 005) and `repositoryExists` filtering (spec 009), so the frontend is the only missing piece.

Additionally, the current `ExternalRegistryRef` lacks a `version` field, making it impossible to identify which exact server version was selected.

## What Changes

- **Image creation from MCP Registry**: Images page "Add" button becomes a dropdown with "Add Image" (existing) and "From MCP Registry" (feature-flagged behind `MCP_REGISTRY_ENABLED`). Reuses `ImageAdd` modal with `isRegistry` flag — `ImageFields` renders `McpServerNameField` when `externalRegistryRef` is detected. Source fields hidden in modal, Branch/BaseDirectory shown in detail view only.
- **Image detail/edit view**: When `source.externalRegistryRef` exists, `ImageSource` renders `McpServerNameField` (imports `getImageMcpServers` directly) instead of CodeURL/DockerURI/SourceType. Branch and BaseDirectory visible in detail view, hidden in modal.
- **Image-specific API method and server action**: New `getImageMcpServers()` with `IMAGE_MCP_REGISTRY_FILTER` constant and `minResults` accumulation.
- **Reuse MCP Registry grid**: `McpRegistryModal` and `McpRegistryGrid` reused as-is. Grid columns unchanged.
- **Version in ExternalRegistryRef**: Add `version?: string` field to `ExternalRegistryRef`. Store `server.name` in `packageName` and `server.version` in `version` separately. Applies to both container and image flows.
- **Type and constant reorganization**: `ExternalRegistryRef` moved to `types/deployments/mcp-registry.ts`. `McpRegistryFetchFn` moved from grid component to types. Filter constants in `constants/deployments/mcp-registry.ts`. Factory functions `getImageSource`/`getImageTemplate` in `utils/deployments/images.tsx`.
- **Test coverage**: Cover MCP registry API methods, server actions, utils, and component rendering.

## Non-goals

- No changes to grid columns or grid behavior — reuse as-is from container flow
- No mapping of `repository.subfolder` to `baseDirectory` — user fills manually if needed
- No new feature flag — reuses existing `MCP_REGISTRY_ENABLED`
- No BE changes — leverages existing `externalRegistryRef` support on image DTOs and `repositoryExists` filter

## Capabilities

### New Capabilities
- `mcp-registry-images`: MCP Registry integration for image definitions — entry point, modal flow, server selection, source prefill, detail/edit view rendering, image-specific API method and server action

### Modified Capabilities
- `mcp-registry-source`: Version field on ExternalRegistryRef, McpServerNameField generalization, type/constant reorganization

## Impact

- **Components**: `Images/List/HeaderButtons.tsx` (dropdown), `ImageAdd.tsx` (isRegistry prop), `ImageSource.tsx` (externalRegistryRef branch), `McpServerNameField.tsx` (generalized), `ContainerSource.tsx` (container callbacks)
- **Types**: `ExternalRegistryRef` with `version` in `types/deployments/mcp-registry.ts`, `ImageSource` in `models/deployments/images.ts`, `McpRegistryFetchFn` in types
- **Constants**: `CONTAINER_MCP_REGISTRY_FILTER`, `IMAGE_MCP_REGISTRY_FILTER` in `constants/deployments/mcp-registry.ts`
- **Utils**: `getImageSource(isRegistry?)`, `getImageTemplate(isRegistry?)` in `utils/deployments/images.tsx`
- **API layer**: New `getImageMcpServers()` in `server/deployments/mcp-registry.ts`
- **Server actions**: New `getImageMcpServers()` action in `app/actions/deployments.ts`
