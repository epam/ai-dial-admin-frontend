## Context

MCP Registry image integration (`mcp-registry-images` spec) currently uses `IMAGE_MCP_REGISTRY_FILTER: { repositoryExists: true }`, returning only servers with repositories. On server select, it always sets `source.$type = CODE` with `source.url = repository.url`. There's no way to use a server's OCI Docker package as an image source.

Servers in the MCP registry can have:
- Repository only (code source)
- OCI packages only (docker source)
- Both repository AND OCI packages (user should choose)

## Goals / Non-Goals

**Goals:**
- Return servers with either repository or OCI packages from the registry
- Let users choose source type when a server has both capabilities
- Prefill source fields based on the selected source type
- Fetch server on view load to determine capabilities for the dropdown
- Keep URL / Docker URI fields disabled in view (auto-filled from registry)
- Clear separation of concerns between components

**Non-Goals:**
- Changing grid columns
- Branch/SHA fields in modal
- Auto-mapping subfolder to baseDirectory
- New feature flag
- Preserving branch/sha/baseDirectory across source type switches

## Decisions

### 1. Two parallel requests merged in server action

**Choice**: `getImageMcpServers` makes two parallel POST requests — `{ repositoryExists: true }` and `{ packageRegistryTypes: ["oci"] }` — then merges and deduplicates by `name + version`.

**Why**: The BE filter uses AND across dimensions, so a single request can't express "has repository OR has OCI package". Two parallel requests are the simplest way to get the union.

### 2. New `ImageMcpRegistry` component

**Choice**: Extract MCP registry logic from `ImageSource` into `ImageMcpRegistry` (`ImageSource/ImageMcpRegistry.tsx`). It owns:
- `McpServerNameField` rendering
- Server selection → prefills source based on capabilities
- Name typing → clears version, resets server
- View-load fetch → resolves server for capability detection

It exposes `selectedServer` to the parent via `onServerChange(server | undefined)`.

**Why**: `ImageSource` was doing too much — handling both non-registry and registry flows. Similar to how Toolsets has `SourceField/McpRegistry/McpRegistry.tsx` wrapping `McpServerNameField`. The parent just holds state and renders shared components.

### 3. SourceType gains `registryServer` prop (not callbacks)

**Choice**: `SourceType` accepts `registryServer?: McpServer`. When provided:
- It owns the source type switch logic internally (builds clean CODE/DOCKER source, maps transport)
- Passes through `image.source.externalRegistryRef` untouched — never sets name or version
- Derives disabled state from `hasRepoAndOci(registryServer)`

**Why**: The prefill logic belongs in the component that handles the dropdown change. No callback props needed — `SourceType` has `image`, `setImage`, and the server. Previous approach with `onSourceTypeChange` + `sourceTypeDisabled` callbacks leaked logic into the parent.

### 4. Version responsibility

**Choice**: Only two places set `externalRegistryRef.version`:
- `ImageMcpRegistry.onServerSelect` — sets `version: server.version` on server selection
- `McpServerNameField` freeform validation → calls `onServerSelect` with matched server

Name typing clears version (stale version from old server is wrong). Source type switch never touches name or version — just passes through existing `externalRegistryRef`.

**Why**: Clear ownership prevents stale/wrong versions. Version is always set from the actual resolved server object.

### 5. `hasRepoAndOci` combined utility

**Choice**: Single function `hasRepoAndOci(server): boolean` in `utils/deployments/mcp-registry.ts` combining `!!server.repository?.url && !!server.packages?.some(p => p.registryType === 'oci')`. Used by `ImageSource` (show/hide dropdown), `SourceType` (disabled state), and `ImageMcpRegistry` (server select → set `serverHasBoth` state).

**Why**: Avoids duplicating the check. Unit tested.

### 6. Clean source objects on type switch

**Choice**: `SourceType` builds clean source objects without spreading `...image.source`. CODE source includes only `$type`, `url`, `branchName`, `sha`, `baseDirectory`, `externalRegistryRef`. DOCKER source includes only `$type`, `imageUri`, `externalRegistryRef`.

**Why**: Spreading leaked fields across source types (e.g., `imageUri` remaining after switching from Docker back to Code), causing false dirty state.

### 7. Grid preselection requires version

**Choice**: The grid radio button checks `!!selectedServer?.version && name matches && version matches`. No preselection when version is missing.

**Why**: Multiple versions of the same server exist in the grid. Without version, multiple rows would be preselected. Old images without stored version simply don't preselect — acceptable tradeoff.

### 8. Modal vs View behavior

| Aspect | Modal | View |
|---|---|---|
| SourceType dropdown | Shown only if both options | Always shown (after server fetch) |
| SourceType enabled | Always (when shown) | Enabled if both, disabled if one |
| URL / Docker URI | Not shown | Shown, disabled |
| Branch / SHA | Not shown | Shown, editable |
| Server fetch | Not needed (user selects) | Fetch on mount by `ImageMcpRegistry` |

## Risks / Trade-offs

**[Risk] Two parallel requests doubles API load** → Each grid page / autocomplete call makes 2 POST requests.
→ Mitigation: Parallel requests, not sequential. BE's `maxPagesToScan` limits upstream load.

**[Risk] Server fetch on view load adds latency** → SourceType dropdown starts disabled until fetch completes.
→ Mitigation: Rest of view renders immediately. If fetch fails, dropdown stays disabled.

**[Risk] Dedup by name+version may miss edge cases** → Server metadata could differ across the two filter requests.
→ Mitigation: Both requests hit the same upstream. First occurrence is kept.

**[Trade-off] Branch/sha/baseDirectory lost on type switch** → Switching CODE → DOCKER → CODE loses these fields. Accepted — user can re-enter.
