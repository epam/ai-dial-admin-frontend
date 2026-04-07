## MODIFIED Requirements

### Requirement: Backend API Contract

**List/search servers**: `POST /api/v1/mcp-registry/servers/list`
- Request body: `McpServersRequestDto` with fields: `search` (string), `cursor` (string), `limit` (number, default 100, max 1000), `filter` (McpServerFilterDto, optional)
- `McpServerFilterDto`: `{ packageRegistryTypes?: string[], packageTransportTypes?: string[], remoteTransportTypes?: string[], repositoryExists?: boolean }`
- Response: `{ servers: ServerResponseDto[], metadata: { nextCursor?, count? } }` (unchanged)
- Each `ServerResponseDto`: `{ server: ServerDetail, _meta: Map }` (unchanged)

The system SHALL use `POST /api/v1/mcp-registry/servers/list` for all MCP registry server requests instead of `GET /api/v1/mcp-registry/servers`.

#### Scenario: Grid fetches servers via POST
- **WHEN** the MCP registry grid requests a page of servers
- **THEN** the system SHALL send a POST request to `/api/v1/mcp-registry/servers/list` with a JSON body containing `cursor`, `limit`, `search` (if filtered), and `filter` fields

#### Scenario: Autocomplete fetches servers via POST
- **WHEN** the MCP server name field triggers an autocomplete search
- **THEN** the system SHALL send a POST request to `/api/v1/mcp-registry/servers/list` with a JSON body containing `search`, `limit`, and `filter` fields

### Requirement: Server Selectability

With server-side filtering by `packageRegistryTypes` and `packageTransportTypes`, all returned servers are selectable. The client-side `isServerSelectable()` check, greyed-out row styling (`opacity: 0.5`), and `isRowSelectable` grid option SHALL be removed.

All rows in the MCP registry grid SHALL be selectable.

#### Scenario: All returned servers are selectable
- **WHEN** the MCP registry grid displays servers returned from the backend
- **THEN** all rows SHALL be selectable (no greyed-out rows)

#### Scenario: Autocomplete shows all returned servers
- **WHEN** the MCP server name autocomplete receives results from the backend
- **THEN** all results SHALL be shown as options without client-side filtering

## ADDED Requirements

### Requirement: Server-side container pre-filter

All container-related MCP registry server requests (grid pagination, autocomplete search, freeform validation) SHALL include a `filter` with `packageRegistryTypes: ["oci"]` and `packageTransportTypes: ["streamable-http", "sse"]` so that only servers with OCI packages and supported transports are returned.

#### Scenario: Grid requests include container pre-filter
- **WHEN** the MCP registry grid fetches a page of servers (with or without a search term)
- **THEN** the request body SHALL contain `filter: { packageRegistryTypes: ["oci"], packageTransportTypes: ["streamable-http", "sse"] }`

#### Scenario: Autocomplete requests include container pre-filter
- **WHEN** the MCP server name field triggers an autocomplete search
- **THEN** the request body SHALL contain `filter: { packageRegistryTypes: ["oci"], packageTransportTypes: ["streamable-http", "sse"] }`

#### Scenario: Freeform validation requests include container pre-filter
- **WHEN** the MCP server name field validates a manually typed server name
- **THEN** the request body SHALL contain `filter: { packageRegistryTypes: ["oci"], packageTransportTypes: ["streamable-http", "sse"] }`

### Requirement: Purpose-specific API method for containers

`McpRegistryApi` SHALL expose a `getContainerMcpServers()` method that accepts `search`, `cursor`, and `limit` params, constructs a `McpServersRequestDto` with `filter: { packageRegistryTypes: ["oci"], packageTransportTypes: ["streamable-http", "sse"] }` internally, and sends a POST request to `/api/v1/mcp-registry/servers/list`.

Callers SHALL NOT provide filter values — the filter is an implementation detail of the API method.

#### Scenario: API method constructs request with container filter
- **WHEN** `getContainerMcpServers({ search: "github", cursor: "abc", limit: 100 }, token)` is called
- **THEN** it SHALL POST to `/api/v1/mcp-registry/servers/list` with body `{ search: "github", cursor: "abc", limit: 100, filter: { packageRegistryTypes: ["oci"], packageTransportTypes: ["streamable-http", "sse"] } }`

#### Scenario: API method omits undefined fields
- **WHEN** `getContainerMcpServers({ limit: 5 }, token)` is called
- **THEN** the request body SHALL NOT contain `search` or `cursor` keys with empty/undefined values

### Requirement: Purpose-specific server action for containers

A `getContainerMcpServers()` server action SHALL be created that accepts `{ search?, cursor?, limit }`, authenticates, and delegates to `McpRegistryApi.getContainerMcpServers()`. This replaces the current generic `getMcpServers()` action for container use cases.

#### Scenario: Server action delegates to API method
- **WHEN** `getContainerMcpServers({ search: "test", limit: 5 })` is called
- **THEN** it SHALL authenticate and pass params to `McpRegistryApi.getContainerMcpServers()`

### Requirement: Typed request and filter DTOs

The system SHALL define TypeScript interfaces mirroring the BE contract:

- `McpServerFilterDto` with optional fields: `packageRegistryTypes` (`string[]`), `packageTransportTypes` (`string[]`), `remoteTransportTypes` (`string[]`), `repositoryExists` (`boolean`)
- `McpServersRequestDto` with optional fields: `search` (`string`), `cursor` (`string`), `limit` (`number`), `filter` (`McpServerFilterDto`)

These interfaces SHALL be located in `src/types/deployments/mcp-registry.ts`.

#### Scenario: Filter DTO accepts all BE-supported dimensions
- **WHEN** a `McpServerFilterDto` is constructed
- **THEN** it SHALL accept `packageRegistryTypes`, `packageTransportTypes`, `remoteTransportTypes`, and `repositoryExists` as optional fields

#### Scenario: Request DTO includes filter
- **WHEN** a `McpServersRequestDto` is constructed with a filter
- **THEN** it SHALL contain the `filter` field with the `McpServerFilterDto` value

### Requirement: Server action accumulates results with minResults

The `getContainerMcpServers` server action SHALL accept an optional `minResults` param. When provided, it SHALL fetch multiple BE pages until `minResults` results are accumulated or the upstream cursor is exhausted. When omitted, a single fetch SHALL be made.

The accumulation loop SHALL NOT break on empty responses — only when the cursor is exhausted.

#### Scenario: Grid uses minResults for full page
- **WHEN** `getContainerMcpServers({ limit: 100, minResults: 100 })` is called
- **THEN** the server action SHALL fetch multiple BE pages until at least 100 servers are accumulated or no more data exists

#### Scenario: Autocomplete uses single fetch without minResults
- **WHEN** `getContainerMcpServers({ search: "test", limit: 5 })` is called without `minResults`
- **THEN** the server action SHALL make a single BE request and return the result directly

#### Scenario: Accumulation continues through empty responses
- **WHEN** a BE page returns 0 servers but `nextCursor` is present
- **THEN** the server action SHALL continue fetching the next page

### Requirement: Reusable grid with fetchServers prop

`McpRegistryGrid` SHALL accept a `fetchServers: McpRegistryFetchFn` prop and use it for all data fetching. The grid SHALL NOT import any specific server action directly.

`McpRegistryModal` SHALL accept and pass through the `fetchServers` prop to `McpRegistryGrid`.

#### Scenario: Grid uses provided fetch function
- **WHEN** `McpRegistryGrid` is rendered with `fetchServers={getContainerMcpServers}`
- **THEN** all data fetching SHALL use the provided function

### Requirement: Placeholder rows do not render radio buttons

The radio button cell renderer in `McpRegistryGrid` SHALL return `null` when the row has no data, preventing empty radio buttons on ag-grid placeholder rows.

#### Scenario: Placeholder row has no radio button
- **WHEN** ag-grid renders a placeholder row (data is undefined)
- **THEN** the selection column SHALL render nothing

### Requirement: Autocomplete clears suggestions on short input

The `McpServerNameField` autocomplete SHALL clear the dropdown options when the input has 2 or fewer characters.

#### Scenario: User clears input
- **WHEN** the user deletes text so the input has 2 or fewer characters
- **THEN** the dropdown options SHALL be cleared immediately

## REMOVED Requirements

### Requirement: Client-side selectability utils
**Reason**: Server-side filtering by `packageRegistryTypes` and `packageTransportTypes` makes client-side checks redundant.
**Migration**: Remove `isServerSelectable()`, `hasOciPackage()`, `hasSupportedTransport()` from `src/utils/deployments/mcp-registry.ts` and all their usages in `McpRegistryGrid` and `McpServerNameField`. Remove corresponding tests.
