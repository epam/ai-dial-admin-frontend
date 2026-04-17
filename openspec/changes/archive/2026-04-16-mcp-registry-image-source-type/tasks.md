## 1. Filter Constants and API

- [x] 1.1 Replace `IMAGE_MCP_REGISTRY_FILTER` with `IMAGE_MCP_REGISTRY_REPO_FILTER` and `IMAGE_MCP_REGISTRY_OCI_FILTER` in `src/constants/deployments/mcp-registry.ts`
- [x] 1.2 Add `getImageMcpServersByRepo()` and `getImageMcpServersByOci()` methods to `McpRegistryApi`
- [x] 1.3 Update `getImageMcpServers` server action — two parallel requests, merge + dedup by name+version, `minResults` support
- [x] 1.4 Update API tests — verify both API methods use correct filters
- [x] 1.5 Add server action tests — merge, dedup, error propagation, first occurrence kept

## 2. Utilities

- [x] 2.1 Add `mapImageTransportType()` to `src/utils/deployments/mcp-registry.ts` — `stdio` → LOCAL, others → REMOTE
- [x] 2.2 Add `hasRepoAndOci()` to `src/utils/deployments/mcp-registry.ts` — combined capability check
- [x] 2.3 Add unit tests for both utilities

## 3. SourceType Component

- [x] 3.1 Replace `onSourceTypeChange`/`sourceTypeDisabled` callback props with `registryServer?: McpServer` prop
- [x] 3.2 When `registryServer` provided: own prefill logic internally, build clean source objects, pass through `externalRegistryRef` untouched, derive disabled from `hasRepoAndOci`
- [x] 3.3 Verify non-registry callers unchanged

## 4. ImageMcpRegistry Component

- [x] 4.1 Create `ImageSource/ImageMcpRegistry.tsx` — wraps `McpServerNameField`, owns server select/name change/view-load fetch
- [x] 4.2 On server select: detect capabilities, default source type, prefill source fields, call `onServerChange(server)`
- [x] 4.3 On name typing: call `onServerChange(undefined)`, clear version from `externalRegistryRef`
- [x] 4.4 On view load: fetch server by name when `!isModal && serverName && !selectedServer`, call `onServerChange`
- [x] 4.5 Add base tests for `ImageMcpRegistry`

## 5. ImageSource Simplified

- [x] 5.1 Remove registry logic from `ImageSource` — no server selection, no prefill, no fetch
- [x] 5.2 Hold `registryServer` state, pass to `ImageMcpRegistry` and `SourceType`
- [x] 5.3 Show SourceType: non-registry always; modal only if both capabilities; view always after fetch
- [x] 5.4 CodeURL/DockerURI disabled in registry view
- [x] 5.5 Update ImageSource tests

## 6. CodeURL / DockerURI

- [x] 6.1 Add `disabled?: boolean` prop to `CodeURL` and `DockerURI` components

## 7. Grid Preselection

- [x] 7.1 Require both name AND version match for radio button preselection; no preselection when version missing

## 8. Version Display Fix

- [x] 8.1 Remove `(version)` display from `McpServerNameField` `customSelectedValue`

## 9. Quality Checks

- [x] 9.1 Run lint, format, and full test suite — all passing
