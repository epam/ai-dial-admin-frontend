## 1. Types

- [x] 1.1 Add `McpServerFilterDto` and `McpServersRequestDto` interfaces to `src/types/deployments/mcp-registry.ts` — filter fields: `packageRegistryTypes`, `packageTransportTypes`, `remoteTransportTypes`, `repositoryExists` (all optional)

## 2. API Layer

- [x] 2.1 Add `getContainerMcpServers({ search?, cursor?, limit }, token)` method to `McpRegistryApi` in `src/server/deployments/mcp-registry.ts` — constructs `McpServersRequestDto` with `filter: { packageRegistryTypes: ["oci"], packageTransportTypes: ["streamable-http", "sse"] }` internally, sends POST to `/api/v1/mcp-registry/servers/list` via `postAction`
- [x] 2.2 Add `getContainerMcpServers({ search?, cursor?, limit, minResults? })` server action in `src/app/actions/deployments.ts` — when `minResults` provided, accumulates multiple BE pages until target reached or cursor exhausted; without `minResults`, single fetch
- [x] 2.3 Remove old `getMcpServers()` method from `McpRegistryApi` and old `getMcpServers()` server action
- [x] 2.4 Update API tests in `src/server/deployments/tests/mcp-registry.spec.ts` — verify `getContainerMcpServers()` sends POST with JSON body containing both OCI and transport filters, omits undefined/empty fields

## 3. Remove Client-Side Selectability

- [x] 3.1 Remove `isServerSelectable()`, `hasOciPackage()`, `hasSupportedTransport()` from `src/utils/deployments/mcp-registry.ts`
- [x] 3.2 Remove corresponding tests from `src/utils/deployments/tests/mcp-registry.spec.ts`
- [x] 3.3 Update `McpRegistryGrid` — remove `isRowSelectable`, `getRowStyle` (opacity 0.5), and `isServerSelectable` import
- [x] 3.4 Update `McpServerNameField` — remove `isServerSelectable` import and client-side filtering of autocomplete results

## 4. Grid Improvements

- [x] 4.1 Add `fetchServers: McpRegistryFetchFn` prop to `McpRegistryGrid` — grid uses provided function via `useRef` for data fetching, no direct action import
- [x] 4.2 Add `fetchServers` prop to `McpRegistryModal` — passes through to `McpRegistryGrid`
- [x] 4.3 Grid passes `minResults: 100` to `fetchServers` for full-page accumulation
- [x] 4.4 Radio button cell renderer returns `null` for placeholder rows (no data)
- [x] 4.5 Fix grid `successCallback` — always report `startRow + servers.length` as last row when no cursor, instead of special-casing empty responses with `successCallback([], 0)`
- [x] 4.6 Fix TS error — coerce `response.metadata?.nextCursor` to string, coerce filter value to string

## 5. Consumer Updates

- [x] 5.1 Update `McpServerNameField` — call `getContainerMcpServers()` for autocomplete (`limit: 5`) and freeform validation (`limit: 10`), pass `getContainerMcpServers` as `fetchServers` to `McpRegistryModal`
- [x] 5.2 Autocomplete clears dropdown options when input has <= 2 characters

## 6. Quality Checks

- [x] 6.1 Run lint, format, and full test suite — all passing
