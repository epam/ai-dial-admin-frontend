## Why

MCP Registry integration currently supports containers (OCI packages) and images (repository-based). Toolsets are the third and final entity type that can benefit from MCP Registry — servers with remotes (deployed endpoints) can be used as toolset sources. BE PR #840 (`epam/ai-dial-admin-backend`) already adds `mcp-registry` as a new toolset source type with `serverName`, `serverVersion`, and endpoint validation. This completes the MCP Registry integration across all deployment entity types.

## What Changes

- Add `MCP_REGISTRY` as a new `SOURCE_TYPE` for toolsets in the SourceField dropdown (gated behind `MCP_REGISTRY_ENABLED` feature flag via `mcpRegistryEnabled`)
- Add `getToolsetMcpServers()` API method with filter `{ remoteTransportTypes: ['streamable-http', 'sse'] }` — returns only servers with compatible remotes
- Add `getToolsetMcpServers()` server action with `minResults` accumulation pattern
- When MCP Registry source is selected, render `McpServerNameField` (generalized with callback props) — autocomplete + browse via reused `McpRegistryModal`/`McpRegistryGrid`
- On server selection: find first remote with supported transport type → auto-populate `toolset.endpoint` from `remote.url`, `toolset.transport` mapped from `remote.type`, `source.serverName` and `source.serverVersion` from the server
- Endpoint is NOT shown for user customization — only the server selector is visible
- Add `serverName` and `serverVersion` fields to `SOURCE_FIELD` interface to match BE DTO
- Generalize `McpServerNameField` from container-specific to callback-based (if not already done by mcp-registry-images change)
- Add utility `getPreferredRemote(server)` — selects first remote with transport type in `['streamable-http', 'sse']`
- Test coverage for API method, server action, utils, and component rendering

## Capabilities

### New Capabilities
- `mcp-registry-toolsets`: MCP Registry as a toolset source type — server selection, remote-to-endpoint mapping, SourceField integration, and server-side filtering for remotes

### Modified Capabilities
- `mcp-registry-source`: Extend with toolset-specific filtering requirements (`remoteTransportTypes`) and generalized McpServerNameField callback pattern

## Impact

- **SourceField system**: New `SOURCE_TYPE.MCP_REGISTRY` enum value, new branch in `SourceField.tsx` rendering, new entry in `TOOLSET_SOURCE_ITEMS`, updated `getSourceItems()` signature to accept `mcpRegistryEnabled`
- **SOURCE_FIELD interface**: New optional fields `serverName`, `serverVersion` — affects `components/SourceField/types.ts`
- **Toolset model**: No changes — `endpoint` and `transport` already exist on `Toolset`, `source` is `SOURCE_FIELD`
- **McpServerNameField**: Generalized to accept callbacks instead of container-specific props (shared across containers, images, toolsets)
- **McpRegistryApi**: New `getToolsetMcpServers()` method alongside existing container/image methods
- **Server actions**: New `getToolsetMcpServers()` in deployments actions
- **Validation**: New `MCP_REGISTRY` case in `isValidSourceField()` — requires `serverName`
- **Feature flag**: Reuses existing `MCP_REGISTRY_ENABLED` / `featureFlags.mcpRegistryEnabled`
