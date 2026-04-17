## Why

MCP Registry image integration currently only supports servers with repositories (source code). When a server is selected, the source type is always CODE with the repository URL. However, many MCP servers have both a repository AND OCI Docker packages. Users should be able to choose which source type to use (build from source code or use pre-built Docker image). Additionally, some servers may only have OCI packages without a repository — these are currently invisible to the image flow because the filter only returns servers with `repositoryExists: true`.

## What Changes

- **Update image registry filter**: Replace single `{ repositoryExists: true }` filter with two parallel requests — one for `{ repositoryExists: true }` and one for `{ packageRegistryTypes: ["oci"] }` — merged and deduplicated by `name + version` in the server action.
- **New `ImageMcpRegistry` component**: Extracted from `ImageSource` to own all MCP registry logic — server selection, name change, view-load fetch, source prefill. Wraps `McpServerNameField` and exposes `selectedServer` to the parent via `onServerChange` callback.
- **SourceType component gains `registryServer` prop**: When provided, `SourceType` owns the source type switch logic internally — builds clean source objects (CODE with repo URL, or DOCKER with OCI identifier + transport mapping), passes through `externalRegistryRef` untouched. Derives disabled state from server capabilities via `hasRepoAndOci()`.
- **`ImageSource` simplified**: Only handles layout and shared state (`registryServer`). Registry-specific logic lives in `ImageMcpRegistry`, source type switch logic lives in `SourceType`. Non-registry flow is unchanged.
- **Version responsibility**: Only `McpServerNameField` and the modal set `externalRegistryRef.version`. Name typing clears version. Source type switch never touches name or version.
- **New `hasRepoAndOci` utility**: Combined capability check in `utils/deployments/mcp-registry.ts`, unit tested.
- **`CodeURL` and `DockerURI` gain `disabled` prop**: For disabling URL fields in registry view.
- **Grid preselection fix**: Radio button requires both name AND version match; no preselection when version is missing.

## Capabilities

### New Capabilities

_None — this change enhances existing capabilities._

### Modified Capabilities

- `mcp-registry-images`: New `ImageMcpRegistry` component; source type selection based on server capabilities; dual-filter merged request; transport type mapping for Docker source; version handling rules.
- `mcp-registry-source`: `SourceType` gains `registryServer` prop with internal prefill logic; `hasRepoAndOci` utility; grid preselection version check; `CodeURL`/`DockerURI` disabled prop.

## Impact

- **New component**: `ImageSource/ImageMcpRegistry.tsx` — MCP registry logic for images
- **Modified server action**: `getImageMcpServers` — two parallel requests, merge + dedup
- **Modified components**: `ImageSource.tsx` (simplified), `SourceType.tsx` (`registryServer` prop), `CodeURL.tsx` (`disabled` prop), `DockerURI.tsx` (`disabled` prop), `McpRegistryGrid.tsx` (preselection fix)
- **Modified constants**: `IMAGE_MCP_REGISTRY_FILTER` → `IMAGE_MCP_REGISTRY_REPO_FILTER` + `IMAGE_MCP_REGISTRY_OCI_FILTER`
- **New utils**: `hasRepoAndOci`, `mapImageTransportType` in `utils/deployments/mcp-registry.ts`
- **New tests**: `ImageMcpRegistry.spec.tsx`, `hasRepoAndOci` tests, `mapImageTransportType` tests, server action merge/dedup tests

## Non-goals

- Changing grid columns or grid behavior
- Auto-mapping `repository.subfolder` to `baseDirectory`
- Branch/SHA fields in modal (only in view)
- New feature flag (reuses `MCP_REGISTRY_ENABLED`)
- Preserving branch/sha/baseDirectory across source type switches
