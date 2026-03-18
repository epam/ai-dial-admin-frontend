## Context

MCP containers support two creation flows: from internal images (two-step `ContainerCreate` modal) and from Docker image references (`ServingCreate` modal with `IMAGE_REFERENCE` source). The HuggingFace registry integration provides a reference pattern: `HuggingfaceApi` for API calls, `HFModelNameField` for search+autocomplete, `HFRegistryModal`/`HFRegistryGrid` for browsing.

The backend deployment manager has a new MCP Registry API (`GET /api/v1/mcp-registry/servers`) on the `feat/add-mcpregistry-support` branch, and PR #223 adds an optional `externalRegistryRef` field to `image_reference` sources for provenance tracking.

Key existing components:
- `HeaderButtons` — renders Create dropdown for MCP with two items
- `ServingCreate` — single-step form modal, accepts `type` and `sourceType` props
- `ContainerSource` — switches on `source.$type` to render source-specific fields
- `HFModelNameField` — search input + autocomplete + "HF Registry" button + modal portal
- `HFRegistryGrid` — ag-grid with infinite scroll, radio select, `ListEntities` wrapper
- `HFRegistryModal` — `DialFormPopup` wrapping grid + optional info panel

## Goals / Non-Goals

**Goals:**
- Add "From MCP Registry" as 3rd option in MCP Create dropdown, gated by `MCP_REGISTRY_ENABLED` feature flag
- Build MCP-specific `McpRegistryGrid` and `McpRegistryModal` components
- Build `McpServerNameField` with autocomplete and registry browser modal
- Auto-fill transport and image reference on server selection
- Store provenance via `externalRegistryRef` on the source
- Disable servers without OCI package + supported transport in the registry grid
- Validate freeform server names against registry before allowing creation

**Non-Goals:**
- No environment variables pre-fill (future)
- No auto-fill of name/description from server metadata
- No version selection UI
- No generic registry abstraction / HF migration (future)
- No edit view re-selection (future)
- No endpoint path pre-fill (remotes are external hosted endpoints)
- No backend changes — frontend consumes existing/upcoming BE APIs

## Decisions

### 1. MCP-specific grid and modal (not generic)

**Decision**: Create `McpRegistryGrid` and `McpRegistryModal` as MCP-specific components. Generic abstraction deferred to future.

**Rationale**: Building the abstraction with only one consumer risks premature generalization. The HF and MCP patterns share infrastructure (`ListEntities`, `DialFormPopup`, `RadioButtonRenderer`) but differ in datasource, columns, row behavior, and selection output. MCP-specific components are simpler and can be refactored into generics when HF migration happens.

### 2. No new `CONTAINER_SOURCE_TYPE` — use `externalRegistryRef` to branch UI

**Decision**: MCP Registry containers use the existing `IMAGE_REFERENCE` source type. The presence of `externalRegistryRef` on the source determines which UI to render in `ContainerSource`.

**Rationale**: The backend already supports `image_reference` sources with an optional `externalRegistryRef` (PR #223). Adding a frontend-only source type would require mapping it back to `image_reference` on every API call. Checking `externalRegistryRef` is simpler and aligns with the backend model.

**In `ContainerSource`**:
```
case IMAGE_REFERENCE:
  if (container.source.externalRegistryRef) → McpServerNameField
  else → Docker image reference input (existing)
```

### 3. Template initialization with `externalRegistryRef`

**Decision**: Add a 4th optional parameter `options?: { mcpRegistry?: boolean }` to `getContainerTemplate`. When `mcpRegistry` is true, the MCP + IMAGE_REFERENCE source includes an empty `externalRegistryRef: { $type: 'mcp-registry', packageName: '' }`. Pass via `templateOptions` prop on `ServingCreate`.

**Rationale**: The `externalRegistryRef` must be present from template initialization so `ContainerSource` knows to render `McpServerNameField` instead of Docker URI input. Without it, the IMAGE_REFERENCE case falls through to the Docker input.

### 4. Transport from packages, not remotes

**Decision**: Read transport type from `packages[].transport.type`, not from `remotes[].type`. The `remotes` field is not used.

**Rationale**: `remotes` describes external hosted endpoints (someone else's deployment). `packages[].transport` describes how the OCI image should be run — this is what's relevant for our container. Real-world MCP servers (e.g., `io.github.oleksii-donets/simple_mcp`) have transport on packages but no remotes.

### 5. Server selectability: OCI + supported transport

**Decision**: A server is selectable only when it has both:
1. At least one package with `registryType === "oci"`
2. At least one OCI package with `transport.type === "streamable-http"` or `"sse"`

Prefer `streamable-http` over `sse` when selecting the package.

**Rationale**: OCI is required for the Docker image reference. Transport is required because we only support HTTP and SSE container transports. Servers with only `stdio` transport cannot be deployed as containers. The same filter applies to both the grid (disabled rows) and autocomplete results.

### 6. Freeform validation against registry

**Decision**: When user types a server name (not from autocomplete/modal), fetch from registry and validate:
- Server exists → exact name match in search results
- Server is selectable → passes `isServerSelectable` check
- During fetch: `imageReference` cleared, Save button blocked (no error shown)
- On failure: show "Server not found" or "Server not supported" error

**Rationale**: Unlike HF where `modelName` is the only field needed (backend resolves it), MCP requires the full server object (OCI identifier, transport) to populate container fields. Freeform typing without validation would create containers with empty `imageReference`.

### 7. Feature flag

**Decision**: Gate the "From MCP Registry" dropdown item behind `MCP_REGISTRY_ENABLED` env var via `featureFlags.mcpRegistryEnabled` in `AppContext`. Disabled by default.

**Rationale**: Backend MCP Registry API is on a feature branch. Feature should not be visible in production until backend is ready and validated.

### 8. Last Update column — flattened from `_meta`

**Decision**: Flatten `updatedAt` from `_meta["io.modelcontextprotocol.registry/official"].updatedAt` in the grid datasource mapping. Display using existing `dateTimeColumn` config.

**Rationale**: Backend passes through raw `_meta` from MCP registry without transformation. Frontend flattens during response mapping in `McpRegistryGrid`.

## Data Flow

```
MCP Registry API                           Container Creation
GET /api/v1/mcp-registry/servers
        │
        ▼
  ServerResponseDto
  ├─ server.name ─────────────────────▶ externalRegistryRef.packageName
  ├─ server.packages[oci].identifier ─▶ source.imageReference
  ├─ server.packages[oci].transport ──▶ transport (HTTP or SSE)
  ├─ server.websiteUrl ───────────────▶ grid display only
  ├─ server.repository.url ───────────▶ grid display only
  ├─ server.version ──────────────────▶ grid display only
  └─ _meta[registry-key].updatedAt ──▶ grid display only (flattened)
```

## Risks / Trade-offs

- **[Risk] `_meta` key path may change** → Mitigation: flattened in one place in `McpRegistryGrid` datasource mapping. Easy to update.
- **[Risk] BE feature branches not merged** → Mitigation: feature gated behind `MCP_REGISTRY_ENABLED` env var. Not visible until enabled.
- **[Trade-off] Non-selectable rows shown but disabled** → Could confuse users seeing greyed-out rows. But hiding them entirely loses registry visibility. Tooltip on disabled rows can be added later.
- **[Trade-off] Freeform fetch adds latency** → When user types a full name and leaves the field, there's a brief gap where Save is disabled while the registry is queried. Acceptable UX for data integrity.
