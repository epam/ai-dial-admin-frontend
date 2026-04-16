## Context

MCP Registry is integrated with containers (OCI packages) and images (repository-based). This is the third integration: toolsets, using servers that have remotes (deployed web endpoints). The existing SourceField component manages toolset source types (`endpoints`, `container`). We add a third: `mcp-registry`.

BE PR #840 (`epam/ai-dial-admin-backend`) adds `ToolSetMcpRegistrySource` with flat fields `serverName` (required) and `serverVersion` (optional), discriminated by `$type: "mcp-registry"`. Endpoint and transport remain top-level on the toolset entity.

The MCP Registry API already supports `remoteTransportTypes` filter on `POST /api/v1/mcp-registry/servers/list`.

## Goals / Non-Goals

**Goals:**
- Add MCP Registry as a new toolset source type in the SourceField dropdown
- Reuse `McpServerNameField`, `McpRegistryModal`, and `McpRegistryGrid` from container/image integrations
- Auto-populate endpoint and transport from the selected server's preferred remote
- Gate behind existing `MCP_REGISTRY_ENABLED` feature flag
- Test coverage for API, actions, utils, and component rendering

**Non-Goals:**
- User-editable endpoint — endpoint is auto-populated from remote, not shown for customization
- Multiple remote selection UI — use first compatible remote, no picker
- Changes to the MCP Registry grid columns or modal layout
- Changes to container or image MCP registry flows

## Decisions

### 1. New SOURCE_TYPE enum value: `MCP_REGISTRY = 'mcp-registry'`

Add to `SOURCE_TYPE` enum in `components/SourceField/types.ts`. Matches BE's `$type: "mcp-registry"` discriminator. Add `serverName?: string` and `serverVersion?: string` to `SOURCE_FIELD` interface — follows the existing flat-bag pattern (`containerId`, `runnerName`, `adapterName`).

**Alternative**: Reuse `externalRegistryRef` pattern from containers/images. Rejected because the BE models this as a distinct source type with flat fields, not a nested ref on an existing source type.

### 2. SourceField integration as a new conditional branch

When `source.$type === MCP_REGISTRY`, render a new `McpRegistry` component (in `components/SourceField/McpRegistry/`) that wraps `McpServerNameField` with toolset-specific callbacks. This follows the exact pattern of `Containers`, `Endpoints`, `Templates`, `Adapters` — each source type has its own component.

The `McpRegistry` component:
- Imports `getToolsetMcpServers` action directly (no prop drilling)
- Provides `onServerSelect` callback: extracts preferred remote, maps transport, sets endpoint + source fields
- Provides `onServerNameChange` callback: updates `source.serverName`, clears endpoint
- Does NOT render endpoint or transport fields — they're auto-populated in background

### 3. Generalize McpServerNameField with callback props

McpServerNameField currently takes `Container` + `setContainer` and hardcodes container-specific logic (OCI package extraction, `getContainerMcpServers`). Generalize to callback-based props:

```
fetchServers: McpRegistryFetchFn
onServerSelect: (server: McpServer) => void
serverName: string
onServerNameChange: (name: string) => void
isModal?: boolean
disabled?: boolean
```

Each consumer (ContainerSource, ImageSource, McpRegistry) provides its own callbacks. The field handles autocomplete, validation, caching, and modal — agnostic to the entity type.

If the mcp-registry-images change has already generalized this, reuse as-is.

### 4. Preferred remote selection: `getPreferredRemote(server)`

New utility in `utils/deployments/mcp-registry.ts`:
- Iterates `server.remotes[]`
- Returns first remote where `type` is `'streamable-http'` or `'sse'`
- Prefers `streamable-http` over `sse` (same preference as container OCI packages)
- Returns `undefined` if no compatible remote found

Transport mapping utility `mapRemoteTransportType(type)`:
- `'streamable-http'` → `ToolsetTransport.HTTP`
- `'sse'` → `ToolsetTransport.SSE`

### 5. Feature flag gating via `mcpRegistryEnabled`

`getSourceItems(route, deploymentsEnabled, mcpRegistryEnabled)` — updated signature. When `!mcpRegistryEnabled`, the `MCP_REGISTRY` item is disabled (same pattern as `CONTAINER` + `deploymentsEnabled`). The caller in `DeploymentProperties.tsx` passes `featureFlags.mcpRegistryEnabled`.

### 6. Filter constant: `TOOLSET_MCP_REGISTRY_FILTER`

In `constants/deployments/mcp-registry.ts`:
```
{ remoteTransportTypes: ['streamable-http', 'sse'] }
```

This ensures only servers with compatible remotes are returned from the API.

### 7. Detail/edit view behavior

When viewing an existing toolset with `source.$type === 'mcp-registry'`:
- SourceField dropdown shows "MCP Registry" (readonly if entity is immutable)
- McpServerNameField renders with `source.serverName` (readonly in view mode)
- Endpoint and transport are NOT rendered by the McpRegistry component — they display elsewhere in the toolset properties (existing behavior)

## Risks / Trade-offs

**[Risk] McpServerNameField may not be generalized yet** → If the mcp-registry-images change hasn't landed, generalization is part of this work. The callback pattern is proven from exploration — minimal risk.

**[Risk] Server with no compatible remotes passes filter** → The `remoteTransportTypes` filter is server-side, so all returned servers should have at least one compatible remote. But `getPreferredRemote()` still returns `undefined` as a safety check — in that case, endpoint is not populated and validation prevents save.

**[Trade-off] Endpoint hidden from user** → User cannot override the auto-populated endpoint. This is intentional per requirements — the MCP Registry flow is a "pick a server, we handle the rest" experience. If users need custom endpoints, they use the External Endpoint source type.

**[Trade-off] SOURCE_FIELD interface grows** → Adding `serverName`/`serverVersion` to the flat interface. This is existing tech debt (all source types share one bag of optionals). Not worth refactoring now — matches existing pattern.
