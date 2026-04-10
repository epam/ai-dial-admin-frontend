## Context

MCP Registry integration exists for containers — users browse the registry, select a server with an OCI package, and create a container with the image reference auto-populated. The backend (deployment manager) already supports:
- `externalRegistryRef` on image source DTOs (`DockerImageSourceDto`, `GitDockerfileImageSourceDto`) via spec 005
- `repositoryExists` filter on `POST /api/v1/mcp-registry/servers/list` via spec 009

The frontend `McpServerNameField` component is currently tightly coupled to containers — it imports `Container` type, calls `getContainerMcpServers`, and uses container-specific `applyServer` logic (OCI package extraction, transport mapping).

## Goals / Non-Goals

**Goals:**
- Enable image creation from MCP Registry with minimal new components (reuse grid, modal, field patterns)
- Generalize `McpServerNameField` to work with both containers and images via callback props
- Store server version in `ExternalRegistryRef.version` field (BE will support this)
- Add comprehensive test coverage for MCP registry API layer, server actions, and utilities

**Non-Goals:**
- No custom grid columns for images — reuse container grid as-is
- No `repository.subfolder` → `baseDirectory` auto-mapping
- No new feature flag — reuse `MCP_REGISTRY_ENABLED`
- No BE changes required

## Decisions

### 1. Generalize McpServerNameField via callback props

**Decision**: Make `McpServerNameField` entity-agnostic by accepting callback props instead of being container-specific.

**Current**: Component imports `Container` type, calls `getContainerMcpServers` directly, and runs container-specific `applyServer` logic (OCI package extraction, transport mapping).

**New**: Component accepts:
- `fetchServers: McpRegistryFetchFn` — the fetch function (container or image variant)
- `onServerSelect: (server: McpServer) => void` — callback when server is selected
- `serverName: string` — current server name value
- `onServerNameChange: (name: string) => void` — callback for name changes
- `isModal?: boolean`, `disabled?: boolean` — unchanged

Container-specific logic (`getPreferredOciPackage`, `mapTransportType`, imageReference population) moves to `ContainerSource`. `ImageSource` imports `getImageMcpServers` directly and provides its own `onServerSelect` that populates `source.url` from `server.repository.url`.

**Why not a new component**: The autocomplete, debounce, cache, validation, modal integration, and freeform validation logic are identical between containers and images. Duplicating would be pure waste.

### 2. Reuse ImageAdd modal with isRegistry flag

**Decision**: Reuse the existing `ImageAdd` modal by adding an `isRegistry?: boolean` prop. When true, the modal initializes with the MCP registry template via `getImageTemplate(isRegistry)`. `ImageFields` renders `ImageSource`, which detects `externalRegistryRef` and shows `McpServerNameField` instead of source fields.

**Why**: Avoids a separate modal component. The existing `ImageFields` already handles version verification and all base field logic — using `ImageBase` directly caused an infinite re-render loop due to the `image` object dependency in `ImageBase`'s useEffect.

### 3. Image entry point as dropdown

**Decision**: Convert the Images page "Add" button to a `DialButtonDropdown` with two items: "Add Image" and "From MCP Registry". When feature flag is disabled, the original single button is rendered. Dropdown items are not conditionally filtered — the dropdown itself is only shown when the flag is enabled.

### 4. Version stored in ExternalRegistryRef.version field

**Decision**: Add `version?: string` to `ExternalRegistryRef` interface. Store `server.name` in `packageName` and `server.version` in `version` separately. No concatenation or parsing needed.

**Why**: The BE will add native `version` field support. Concatenating name@version in `packageName` would fail validation since `@` is not in the server name pattern.

### 5. ExternalRegistryRef in mcp-registry types

**Decision**: Move `ExternalRegistryRef` interface from `types/deployments/containers.ts` to `types/deployments/mcp-registry.ts`. Containers imports it directly from the original location — no re-export.

**Why**: Both `ContainerSource` and `ImageSource` need this type. Consumers should always import from the original file.

### 6. Image detail/edit view: conditional rendering in ImageSource

**Decision**: `ImageSource` component uses a single return with a ternary for the source field (McpServerNameField vs SourceType/CodeURL/DockerURI). Branch and BaseDirectory are hidden in modal when `externalRegistryRef` exists, shown in the detail/edit view.

### 7. Server-side filters as constants

**Decision**: MCP registry filter objects (`CONTAINER_MCP_REGISTRY_FILTER`, `IMAGE_MCP_REGISTRY_FILTER`) live in `constants/deployments/mcp-registry.ts`. API layer imports from constants.

### 8. Factory functions in utils

**Decision**: `getImageSource(isRegistry?)` and `getImageTemplate(isRegistry?)` live in `utils/deployments/images.tsx`, following the pattern of `getContainerSource`/`getContainerTemplate` in `utils/deployments/containers.ts`. `IMAGE_TEMPLATE` constant remains in `constants/deployments/images.tsx` as a pre-built default.

### 9. McpRegistryFetchFn type location

**Decision**: `McpRegistryFetchFn` type moved from `McpRegistryGrid` component to `types/deployments/mcp-registry.ts`. Avoids pulling ag-grid dependency chain when only the type is needed (caused test hangs in jsdom).

## Risks / Trade-offs

- **McpServerNameField refactor scope** → The generalization touches a component used by the existing container flow. Risk of regression. Mitigation: existing container tests + new tests for both paths.
- **Grid columns not optimized for images** → Packages/Remotes columns are less relevant for image use case. Trade-off accepted for simplicity — columns still show useful info and can be refined later.
