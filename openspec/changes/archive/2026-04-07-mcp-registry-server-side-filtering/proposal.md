## Why

The MCP Registry grid and autocomplete currently fetch all servers and apply client-side filtering (`isServerSelectable`) to grey out non-OCI servers or those without supported transports. This wastes bandwidth, pagination slots, and degrades UX — users scroll through rows they can never select. Backend PRs [#232](https://github.com/epam/ai-dial-admin-deployment-manager-backend/pull/232) and [#268](https://github.com/epam/ai-dial-admin-deployment-manager-backend/pull/268) introduce server-side filtering (by package registry type, package transport type, remote transport type, and repository existence), enabling the FE to request only relevant servers and remove client-side selectability logic entirely.

## What Changes

- **Switch MCP Registry API from GET to POST**: Replace `GET /api/v1/mcp-registry/servers` with `POST /api/v1/mcp-registry/servers/list` using structured request body with nested `filter` object.
- **Purpose-specific API methods and server actions**: Create `getContainerMcpServers()` in `McpRegistryApi` and as a server action, with container-specific filters baked in: `packageRegistryTypes: ["oci"]` and `packageTransportTypes: ["streamable-http", "sse"]`. Components just call the action with search/pagination params. Future consumers get their own API method + action with their own filter presets.
- **Remove client-side selectability logic**: Since BE now filters by both package registry type and package transport type, `isServerSelectable()`, `hasOciPackage()`, `hasSupportedTransport()` are no longer needed. Remove them along with grid `isRowSelectable`, `getRowStyle` (opacity 0.5), and autocomplete client-side filtering.
- **Update filter types to match BE contract**: `remoteTypes` renamed to `remoteTransportTypes`, new `packageTransportTypes` field added.
- **Server-side result accumulation**: The server action supports a `minResults` param. When provided, it fetches multiple BE pages until the target count is reached or data is exhausted. The grid uses `minResults: 100` to fill initial view; autocomplete omits it for fast single-fetch responses.
- **Reusable grid with `fetchServers` prop**: `McpRegistryGrid` accepts a `fetchServers` function prop instead of importing a specific action. This allows future consumers (e.g., image browsing) to pass their own data-fetching action.
- **Grid placeholder row fix**: Radio button cell renderer returns `null` for rows without data, preventing empty radio buttons on ag-grid placeholder rows.
- **Autocomplete clears suggestions on short input**: When input has 2 or fewer characters, dropdown options are cleared immediately.

## Capabilities

### New Capabilities

_None — this change enhances an existing capability._

### Modified Capabilities

- `mcp-registry-source`: API contract changes from GET to POST with structured filter body; new purpose-specific API method and server action for containers with OCI + transport pre-filter; removal of client-side selectability checks and greyed-out row styling; updated filter DTO types.

## Impact

- **Modified server code**: `McpRegistryApi` — new `getContainerMcpServers()` POST method, removal of old `getMcpServers()` GET method
- **Modified server action**: New `getContainerMcpServers()` replacing `getMcpServers()`
- **New types**: `McpServersRequestDto`, `McpServerFilterDto` interfaces mirroring BE contract
- **Removed utils**: `isServerSelectable()`, `hasOciPackage()`, `hasSupportedTransport()` from `src/utils/deployments/mcp-registry.ts`
- **Modified components**: `McpRegistryGrid` — accepts `fetchServers` prop, accumulation via `minResults`, placeholder row fix; `McpServerNameField` — call new action, remove client-side filtering, clear suggestions on short input; `McpRegistryModal` — passes `fetchServers` through
- **No UI changes**: No new controls; greyed-out rows simply disappear (all returned rows are selectable)
- **No feature flag changes**: Stays behind existing `mcpRegistryEnabled` flag
- **Backend dependency**: BE PRs [#232](https://github.com/epam/ai-dial-admin-deployment-manager-backend/pull/232) and [#268](https://github.com/epam/ai-dial-admin-deployment-manager-backend/pull/268) must be deployed

## Non-goals

- User-facing filter UI (dropdowns/checkboxes for filter dimensions)
- Using `remoteTransportTypes` or `repositoryExists` filters (for future features)
- Switching other entity APIs to POST (scoped to MCP registry only)
