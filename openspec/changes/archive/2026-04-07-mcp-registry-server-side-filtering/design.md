## Context

The MCP Registry integration (see `openspec/specs/mcp-registry-source/spec.md`) currently uses `GET /api/v1/mcp-registry/servers` with query params (`search`, `cursor`, `limit`). All servers are returned regardless of package type or transport, and the FE applies `isServerSelectable()` client-side to grey out non-selectable servers.

BE PRs [#232](https://github.com/epam/ai-dial-admin-deployment-manager-backend/pull/232) and [#268](https://github.com/epam/ai-dial-admin-deployment-manager-backend/pull/268) add a `POST /api/v1/mcp-registry/servers/list` endpoint with a `filter` object supporting: `packageRegistryTypes`, `packageTransportTypes` (new in #268), `remoteTransportTypes` (renamed from `remoteTypes` in #268), and `repositoryExists`.

Current call sites:
- `McpRegistryGrid` — fetches pages for the registry browser modal
- `McpServerNameField` — autocomplete search (limit 5) and freeform validation (limit 10)
- Both go through server action `getMcpServers()` → `McpRegistryApi.getMcpServers()`

## Goals / Non-Goals

**Goals:**
- Switch API layer from GET to POST with structured request DTO
- Pre-filter container requests with `packageRegistryTypes: ["oci"]` + `packageTransportTypes: ["streamable-http", "sse"]`
- Create purpose-specific API method and server action for containers
- Remove client-side selectability logic (`isServerSelectable`, greyed-out rows)
- Type the request/filter DTOs to mirror BE contract

**Non-Goals:**
- User-facing filter UI
- Using `remoteTransportTypes` or `repositoryExists` filters
- Changing pagination behavior or ag-grid configuration

## Decisions

### 1. POST with structured body over GET with query params

**Choice**: Use `POST /api/v1/mcp-registry/servers/list` with JSON body.

**Why**: The filter is a nested object with multiple dimensions. POST maps naturally to the BE `ServersRequestDto` and makes the FE types mirror the API contract directly. Also cleaner than CSV query params as dimensions grow.

**Alternative considered**: Stay with GET. Simpler for one param but awkward with multiple filter arrays.

### 2. Purpose-specific API methods and server actions

**Choice**: Create `getContainerMcpServers()` in both `McpRegistryApi` and the server action layer. The API method constructs the full `McpServersRequestDto` internally — accepting only `search`, `cursor`, `limit` from callers — and bakes in the container filter.

```
// McpRegistryApi
getContainerMcpServers({ search?, cursor?, limit }, token)
  → POST /api/v1/mcp-registry/servers/list
    body: { search, cursor, limit, filter: {
      packageRegistryTypes: ["oci"],
      packageTransportTypes: ["streamable-http", "sse"]
    }}

// Server action
getContainerMcpServers({ search?, cursor?, limit })
  → authenticates, delegates to McpRegistryApi.getContainerMcpServers()
```

**Why**: Filters are an API-layer concern, not a component concern. Components just call the action that matches their use case. Future consumers add their own API method + action with different filters.

**Alternative considered**: Utility builder function. Adds an unnecessary abstraction layer when the logic can live directly in the API method.

### 3. Filter types mirroring BE contract (PR #268)

**Choice**: Define `McpServerFilterDto` and `McpServersRequestDto` in `src/types/deployments/mcp-registry.ts`.

```
McpServerFilterDto {
  packageRegistryTypes?: string[];
  packageTransportTypes?: string[];      // new in BE #268
  remoteTransportTypes?: string[];       // renamed from remoteTypes in BE #268
  repositoryExists?: boolean;
}

McpServersRequestDto {
  search?: string;
  cursor?: string;
  limit?: number;
  filter?: McpServerFilterDto;
}
```

**Why**: Mirrors the BE contract exactly. Including all fields means future features just pass values without type changes.

### 4. Remove isServerSelectable and greyed-out rows

**Choice**: Remove `isServerSelectable()`, `hasOciPackage()`, `hasSupportedTransport()` from utils. Remove `isRowSelectable` and `getRowStyle` (opacity 0.5) from `McpRegistryGrid`. Remove client-side `isServerSelectable` filtering from `McpServerNameField` autocomplete.

**Why**: With BE filtering by both `packageRegistryTypes: ["oci"]` and `packageTransportTypes: ["streamable-http", "sse"]`, every returned server has at least one OCI package and at least one package with a supported transport. Client-side checks are redundant.

**Note**: BE evaluates filter dimensions independently across all packages (not per-package). A server with Package A (OCI, stdio) + Package B (npm, streamable-http) matches both filters even though no single package satisfies both. This is an edge case we accept — can re-implement client-side checks if it becomes a real problem.

**Alternative considered**: Keep as safety net. Rejected — adds complexity for a theoretical edge case. Simpler to re-add if needed.

### 5. Server-side result accumulation with `minResults`

**Choice**: The `getContainerMcpServers` server action accepts an optional `minResults` param. When provided, it fetches multiple BE pages in a loop until `minResults` results are accumulated or the upstream cursor is exhausted. When omitted, a single fetch is made.

```
// Grid: accumulate until 100 results
getContainerMcpServers({ search, cursor, limit: 100, minResults: 100 })

// Autocomplete: single fast fetch
getContainerMcpServers({ search, limit: 5 })
```

**Why**: With server-side filtering, matching servers are sparse (~106 out of 15K in the upstream registry). A single BE request with `maxPagesToScan: 25` might return only 4 results. The grid needs ~100 rows to fill the view. Accumulation in the server action (not the grid) keeps the grid simple and avoids ag-grid lifecycle issues that occurred when looping in the component.

**Key detail**: The loop breaks only when `!cursor` (upstream exhausted), NOT on empty responses — the BE can return 0 matches from a scan batch but still have more upstream pages.

**Alternative considered**: Accumulation loop in the grid component. Caused ag-grid infinite row model issues — the datasource was being recreated, wiping previous results on scroll.

### 6. Reusable grid with `fetchServers` prop

**Choice**: `McpRegistryGrid` accepts a `fetchServers: McpRegistryFetchFn` prop. The grid is agnostic to which action fetches data. Uses `useRef` for the function to avoid datasource recreation.

**Why**: The grid will be reused for different consumers (containers, future image browsing) with different server actions and filter presets.

### 7. Placeholder row fix

**Choice**: The radio button `cellRenderer` in `McpRegistryGrid` returns `null` when `data` is undefined.

**Why**: Ag-grid's infinite scroll pre-creates placeholder rows when more data might exist (`nextCursor` present). Without the guard, empty radio buttons render for these placeholders.

### 8. Autocomplete clears on short input

**Choice**: The debounced `onServerNameType` clears `serverOptions` when input length is <= 2 characters.

**Why**: Previously, stale suggestions remained visible when the input was cleared or shortened. Now the dropdown closes immediately.

## Risks / Trade-offs

**[Risk] BE endpoints not yet deployed** → PRs #232 and #268 must be merged and deployed.
→ Mitigation: Feature is behind `mcpRegistryEnabled` flag (disabled by default). No impact until both BE and FE are deployed and flag is enabled.

**[Risk] Cross-package filter matching edge case** → BE evaluates `packageRegistryTypes` and `packageTransportTypes` independently. A server could match both filters without having a single OCI package with supported transport.
→ Mitigation: Accepted as unlikely in practice. If it surfaces, re-implement `isServerSelectable()`.

**[Risk] Response may exceed `limit`** → BE returns up to one extra upstream page when filtering.
→ Mitigation: Ag-grid infinite row model handles variable page sizes naturally via cursor-based pagination. No code changes needed.

**[Trade-off] Unused filter fields in types** → `remoteTransportTypes` and `repositoryExists` aren't used yet. Intentional — prepares for future features.
