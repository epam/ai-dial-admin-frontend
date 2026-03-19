## Why

MCP containers can currently be created from internal images or Docker image references, but users must manually find and enter image URIs. The MCP Registry (https://registry.modelcontextprotocol.io) is a centralized catalog of MCP servers with metadata including OCI Docker images and transport configuration. Integrating it as a source lets users browse/search servers and create containers with the Docker image and transport auto-configured — reducing manual work and errors.

## What Changes

- **3rd option in MCP Create dropdown**: "From MCP Registry" alongside existing "From Internal MCP Image" and "From Docker Image Reference". Gated by `MCP_REGISTRY_ENABLED` env var (disabled by default).
- **New `McpServerNameField` component**: search input with debounced autocomplete + "Select from registry" button, following the `HFModelNameField` pattern. On server selection, auto-fills `source.imageReference` (from OCI package identifier), `transport` (from package transport type), and `source.externalRegistryRef`.
- **New `McpRegistryGrid` and `McpRegistryModal` components**: MCP-specific grid+modal for registry browsing with ag-grid infinite scroll, cursor pagination, and radio selection.
- **New `McpRegistryApi` server class and action**: mirrors `HuggingfaceApi` pattern, calls `GET /api/v1/mcp-registry/servers` (search, cursor pagination).
- **Extend `ContainerSource` type**: add `externalRegistryRef` field. In `ContainerSource` component, when `IMAGE_REFERENCE` + `externalRegistryRef` present, render `McpServerNameField` instead of Docker URI input.
- **New MCP grid column definitions**: server name (searchable), website, repository, remotes (badges), packages (badges), version, last update (flattened from `_meta`).
- **Server selectability**: only servers with an OCI package AND a supported transport type (`streamable-http` or `sse`) in packages are selectable. Transport is read from `packages[].transport.type`, not from `remotes[]`.
- **Freeform validation**: when user types a server name manually (not from autocomplete/modal), the field fetches the server from registry and validates it exists and is selectable before enabling Save.
- **Feature flag**: `MCP_REGISTRY_ENABLED` env var controls visibility. Documented in README and `.env.template`.

## Capabilities

### New Capabilities
- `mcp-registry-source`: Browse/search MCP Registry, select servers, and create MCP containers with auto-configured source and transport.

### Modified Capabilities
- `mcp-docker-image-source`: The `IMAGE_REFERENCE` rendering in `ContainerSource` now branches on `externalRegistryRef` to show either Docker URI input or MCP server name field.

## Impact

- **New components**: `McpRegistryGrid`, `McpRegistryModal`, `McpServerNameField`
- **New server code**: `McpRegistryApi` class, server action (`getMcpServers`)
- **New types**: MCP server/package/remote interfaces, `ExternalRegistryRef` interface, `externalRegistryRef` on `ContainerSource`
- **New utils**: OCI package/transport checks, preferred package selection, transport mapping, server name validation
- **New constants**: `MCP_REGISTRY_COLUMNS` grid column definitions
- **Modified components**: `HeaderButtons` (3rd dropdown item, feature-flagged), `ContainerSource` (externalRegistryRef branch), `ServingCreate` (templateOptions prop), `Modals` (new ModalType)
- **Modified utils**: `getContainerTemplate` (4th param for mcpRegistry option)
- **Modified config**: `.env.template`, `README.md` (new `MCP_REGISTRY_ENABLED` var), `layout.tsx` (new feature flag)
- **i18n**: New translation keys for MCP registry labels, button text, modal header, validation errors
- **Backend dependency**: PR #223 (`externalRegistryRef` field) must be merged; MCP Registry API (`feat/add-mcpregistry-support` branch) must be available

## Non-goals

- Environment variables pre-fill from server packages (future)
- Auto-fill name/description from server metadata (future)
- Version selection UI — grid shows versions but no picker
- Backend `_meta` flattening — frontend flattens `updatedAt` from nested `_meta` map
- Migrating existing HF flow to generic registry components (future)
- Edit view re-selection of MCP server on existing containers (future)
- Repository-only servers without OCI package (future)
- Endpoint path pre-fill from remotes (dropped — remotes are external hosted endpoints, not relevant for container creation)
