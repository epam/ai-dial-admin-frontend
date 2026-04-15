## 1. Types and Constants

- [x] 1.1 Add `MCP_REGISTRY = 'mcp-registry'` to `SOURCE_TYPE` enum in `src/components/SourceField/types.ts` and add `serverName?: string`, `serverVersion?: string` to `SOURCE_FIELD` interface
- [x] 1.2 Add `TOOLSET_MCP_REGISTRY_FILTER` constant to `src/constants/deployments/mcp-registry.ts` with `{ remoteTransportTypes: ['streamable-http', 'sse'] }`
- [x] 1.3 Add "MCP Registry" option to `TOOLSET_SOURCE_ITEMS` in `src/components/SourceField/constants.ts`
- [x] 1.4 Update `getSourceItems()` to accept `mcpRegistryEnabled` parameter and disable `MCP_REGISTRY` when false

## 2. API and Server Action

- [x] 2.1 Add `getToolsetMcpServers()` method to `McpRegistryApi` in `src/server/deployments/mcp-registry.ts` using `TOOLSET_MCP_REGISTRY_FILTER`
- [x] 2.2 Add `getToolsetMcpServers()` server action in `src/app/actions/deployments.ts` with `minResults` accumulation pattern
- [x] 2.3 Add tests for `getToolsetMcpServers()` API method in `src/server/deployments/tests/mcp-registry.spec.ts`

## 3. Utils

- [x] 3.1 Add `getPreferredRemote(server)` utility in `src/utils/deployments/mcp-registry.ts` — returns first remote with type in `['streamable-http', 'sse']`
- [x] 3.2 Add `mapRemoteTransportType(type)` utility in `src/utils/deployments/mcp-registry.ts` — maps to `ToolsetTransport`
- [x] 3.3 Add tests for `getPreferredRemote` and `mapRemoteTransportType` in `src/utils/deployments/tests/mcp-registry.spec.ts`

## 4. SourceField Integration

- [x] 4.1 Create `McpRegistry` component in `src/components/SourceField/McpRegistry/McpRegistry.tsx` — wraps `McpServerNameField` with toolset-specific callbacks (`onServerSelect` extracts preferred remote, maps transport, sets endpoint + source fields; `onServerNameChange` updates serverName and clears endpoint; stores `serverVersion` on select)
- [x] 4.2 Add `SOURCE_TYPE.MCP_REGISTRY` conditional branch in `SourceField.tsx` to render `McpRegistry` component
- [x] 4.3 Update `isValidSourceField()` in `src/components/SourceField/utils.ts` with `MCP_REGISTRY` case — valid when `serverName` is non-empty
- [x] 4.4 Update `DeploymentProperties.tsx` to pass `mcpRegistryEnabled` from `featureFlags` to `getSourceItems()`

## 5. Tests and Validation

- [x] 5.1 Add tests for `isValidSourceField` with `MCP_REGISTRY` source type in `src/components/SourceField/tests/`
- [x] 5.2 Run lint, format, and all tests to verify no regressions
