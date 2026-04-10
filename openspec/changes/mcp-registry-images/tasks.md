## 1. Types and Constants

- [x] 1.1 Move `ExternalRegistryRef` to `types/deployments/mcp-registry.ts`, add `version?: string` field, import directly in `containers.ts` (no re-export)
- [x] 1.2 Add `externalRegistryRef?: ExternalRegistryRef` to `ImageSource` in `models/deployments/images.ts`
- [x] 1.3 Move `McpRegistryFetchFn` from `McpRegistryGrid` component to `types/deployments/mcp-registry.ts`, update all imports
- [x] 1.4 Create `constants/deployments/mcp-registry.ts` with `CONTAINER_MCP_REGISTRY_FILTER` and `IMAGE_MCP_REGISTRY_FILTER`
- [x] 1.5 Add `getImageSource(isRegistry?)` and `getImageTemplate(isRegistry?)` to `utils/deployments/images.tsx`

## 2. API Layer

- [x] 2.1 Add `getImageMcpServers()` method to `McpRegistryApi` using `IMAGE_MCP_REGISTRY_FILTER`
- [x] 2.2 Update `McpRegistryApi` to import filters from constants
- [x] 2.3 Add unit tests for `getImageMcpServers()` and existing `getContainerMcpServers()`

## 3. Server Actions

- [x] 3.1 Add `getImageMcpServers()` server action with `minResults` accumulation pattern
- [x] 3.2 Add i18n keys for image MCP registry flow (AddImage, FromMcpRegistry, AddFromMcpRegistryModalTitle)

## 4. Generalize McpServerNameField

- [x] 4.1 Refactor `McpServerNameField` props: `fetchServers`, `onServerSelect`, `serverName`, `onServerNameChange`, `isModal`, `disabled`
- [x] 4.2 Move container-specific logic (OCI package extraction, transport mapping, imageReference, RUNNING check) to `ContainerSource` callbacks
- [x] 4.3 Update `ContainerSource.tsx` to provide container-specific callbacks, store `version` in `externalRegistryRef`

## 5. Image Entry Point

- [x] 5.1 Convert Images `HeaderButtons.tsx` "Add" button to `DialButtonDropdown` (feature-flagged, no conditional items)
- [x] 5.2 Add `isRegistry` prop to `ImageAdd` modal, use `getImageTemplate(isRegistry)` for initialization

## 6. Image Source Component

- [x] 6.1 Update `ImageSource.tsx`: single return, ternary for source field, import `getImageMcpServers` directly
- [x] 6.2 Hide Branch/BaseDirectory in modal when `externalRegistryRef` exists, show in detail view

## 7. Tests

- [x] 7.1 Add unit tests for `getImageSource` and `getImageTemplate` in `utils/deployments/tests/images.spec.tsx`
- [x] 7.2 Add unit tests for `ImageSource` rendering (with mock for McpServerNameField to avoid ag-grid hang)
- [x] 7.3 Verify `ContainerSource` tests pass with no regression

## 8. Quality Checks

- [x] 8.1 Run lint and fix issues (unused imports, formatting)
- [x] 8.2 Run format and fix issues
- [x] 8.3 All tests pass
