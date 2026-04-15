## mcp-registry-toolsets

MCP Registry as a toolset source type — server selection, remote-to-endpoint mapping, SourceField integration, and server-side filtering for servers with compatible remotes.

### Requirement: MCP Registry source type in SourceField

The system SHALL add `SOURCE_TYPE.MCP_REGISTRY = 'mcp-registry'` to the `SOURCE_TYPE` enum. The `SOURCE_FIELD` interface SHALL include optional fields `serverName?: string` and `serverVersion?: string`.

`TOOLSET_SOURCE_ITEMS` SHALL include an "MCP Registry" option with value `SOURCE_TYPE.MCP_REGISTRY`. The option SHALL be disabled when `mcpRegistryEnabled` is false.

`getSourceItems()` SHALL accept a `mcpRegistryEnabled` parameter alongside the existing `deploymentsEnabled`. When `!mcpRegistryEnabled`, the `MCP_REGISTRY` item SHALL be disabled.

#### Scenario: MCP Registry option visible when feature flag enabled
- **WHEN** `mcpRegistryEnabled` is true and `deploymentsEnabled` is true
- **THEN** the SourceField dropdown for toolsets shows three options: "External Endpoint", "MCP Container", "MCP Registry"

#### Scenario: MCP Registry option disabled when feature flag disabled
- **WHEN** `mcpRegistryEnabled` is false
- **THEN** the "MCP Registry" option is present but disabled in the dropdown

### Requirement: MCP Registry source component in SourceField

When `source.$type === SOURCE_TYPE.MCP_REGISTRY`, SourceField SHALL render a `McpRegistry` component (located in `components/SourceField/McpRegistry/`).

The `McpRegistry` component SHALL render `McpServerNameField` with toolset-specific callbacks. It SHALL NOT render endpoint or transport fields — those are auto-populated in background.

#### Scenario: Selecting MCP Registry source type
- **WHEN** user selects "MCP Registry" from the SourceField dropdown
- **THEN** the UI renders `McpServerNameField` with autocomplete and browse button
- **THEN** endpoint and transport fields are NOT displayed within the MCP Registry section

#### Scenario: Viewing existing toolset with MCP Registry source
- **WHEN** a toolset has `source.$type === 'mcp-registry'` with `serverName` populated
- **THEN** SourceField renders `McpServerNameField` showing the server name (readonly in view mode)

### Requirement: Server-side filtering for toolset MCP servers

A `TOOLSET_MCP_REGISTRY_FILTER` constant SHALL be defined in `constants/deployments/mcp-registry.ts` with value `{ remoteTransportTypes: ['streamable-http', 'sse'] }`.

#### Scenario: Filter constant structure
- **WHEN** `TOOLSET_MCP_REGISTRY_FILTER` is used in API requests
- **THEN** only servers with remotes of type `streamable-http` or `sse` are returned

### Requirement: Purpose-specific API method for toolset MCP servers

`McpRegistryApi` SHALL expose a `getToolsetMcpServers()` method that accepts `{ search?, cursor?, limit? }` params, constructs a `McpServersRequestDto` with `filter: TOOLSET_MCP_REGISTRY_FILTER`, and sends a POST to `/api/v1/mcp-registry/servers/list`.

Callers SHALL NOT provide filter values — the filter is an implementation detail of the API method.

#### Scenario: API method sends correct filter
- **WHEN** `getToolsetMcpServers({ limit: 100 })` is called
- **THEN** a POST request is sent with body `{ limit: 100, filter: { remoteTransportTypes: ['streamable-http', 'sse'] } }`

#### Scenario: API method includes search and cursor
- **WHEN** `getToolsetMcpServers({ search: 'test', cursor: 'abc', limit: 5 })` is called
- **THEN** the POST body includes `search`, `cursor`, `limit`, and `filter`

### Requirement: Purpose-specific server action for toolset MCP servers

A `getToolsetMcpServers()` server action SHALL be created that accepts `{ search?, cursor?, limit?, minResults? }`, authenticates via `getUserToken()`, and delegates to `McpRegistryApi.getToolsetMcpServers()`.

When `minResults` is provided, the action SHALL fetch multiple BE pages until `minResults` results are accumulated or the cursor is exhausted. The accumulation loop SHALL NOT break on empty responses — only when the cursor is exhausted.

#### Scenario: Single fetch without minResults
- **WHEN** `getToolsetMcpServers({ search: 'test', limit: 10 })` is called
- **THEN** a single API call is made and the result returned directly

#### Scenario: Accumulated fetch with minResults
- **WHEN** `getToolsetMcpServers({ limit: 10, minResults: 20 })` is called and first page returns 10 results with a cursor
- **THEN** a second fetch is made with the cursor until 20+ results are accumulated or cursor exhausted

### Requirement: Preferred remote selection

A `getPreferredRemote(server: McpServer)` utility SHALL be defined in `utils/deployments/mcp-registry.ts`. It SHALL return the first remote from `server.remotes` where `remote.type` is `'streamable-http'` or `'sse'`, preferring `streamable-http` over `sse`. It SHALL return `undefined` if no compatible remote exists.

A `mapRemoteTransportType(type: string)` utility SHALL map remote transport types to `ToolsetTransport`:
- `'streamable-http'` → `ToolsetTransport.HTTP`
- `'sse'` → `ToolsetTransport.SSE`

#### Scenario: Server with streamable-http remote
- **WHEN** a server has `remotes: [{ type: 'streamable-http', url: 'https://a.com' }, { type: 'sse', url: 'https://b.com' }]`
- **THEN** `getPreferredRemote()` returns the `streamable-http` remote

#### Scenario: Server with only sse remote
- **WHEN** a server has `remotes: [{ type: 'sse', url: 'https://b.com' }]`
- **THEN** `getPreferredRemote()` returns the `sse` remote

#### Scenario: Server with unsupported first remote
- **WHEN** a server has `remotes: [{ type: 'websocket', url: '...' }, { type: 'streamable-http', url: 'https://a.com' }]`
- **THEN** `getPreferredRemote()` returns the `streamable-http` remote (skips unsupported)

#### Scenario: Server with no compatible remotes
- **WHEN** a server has `remotes: [{ type: 'websocket', url: '...' }]`
- **THEN** `getPreferredRemote()` returns `undefined`

### Requirement: On server selection populate toolset fields

When a server is selected (via autocomplete or modal), the `McpRegistry` component SHALL:

| Field | Value |
|---|---|
| `source.$type` | `SOURCE_TYPE.MCP_REGISTRY` |
| `source.serverName` | `server.name` |
| `source.serverVersion` | `server.version` |
| `endpoint` | `preferredRemote.url` (from `getPreferredRemote(server)`) |
| `transport` | Mapped from `preferredRemote.type` via `mapRemoteTransportType()` |

If `getPreferredRemote()` returns `undefined`, endpoint and transport SHALL NOT be updated.

#### Scenario: Server with compatible remote selected
- **WHEN** user selects server with `name: 'io.github.user/weather'`, `version: '1.0.0'`, `remotes: [{ type: 'streamable-http', url: 'https://weather.example.com/mcp' }]`
- **THEN** toolset is updated with `source.serverName = 'io.github.user/weather'`, `source.serverVersion = '1.0.0'`, `endpoint = 'https://weather.example.com/mcp'`, `transport = HTTP`

#### Scenario: Server name changed via typing
- **WHEN** user types a new server name in McpServerNameField
- **THEN** `source.serverName` is updated and `endpoint` is cleared until server is resolved

### Requirement: Validation for MCP Registry source

`isValidSourceField()` SHALL handle `SOURCE_TYPE.MCP_REGISTRY`: the source is valid when `source.serverName` is non-empty.

MCP server name format validation (pattern `^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$`) and registry existence check are handled by McpServerNameField internally via `SaveValidationContext`.

#### Scenario: Valid MCP Registry source
- **WHEN** toolset has `source.$type = 'mcp-registry'` and `source.serverName = 'io.github.user/weather'`
- **THEN** `isValidSourceField()` returns true

#### Scenario: Invalid MCP Registry source with empty serverName
- **WHEN** toolset has `source.$type = 'mcp-registry'` and `source.serverName = ''`
- **THEN** `isValidSourceField()` returns false

### Requirement: McpRegistryModal reuse for toolset browsing

The `McpRegistry` component SHALL open `McpRegistryModal` (via `McpServerNameField` browse button) passing `getToolsetMcpServers` as the `fetchServers` prop. The modal and grid are reused as-is from the container/image integrations.

#### Scenario: Browse button opens registry modal
- **WHEN** user clicks the browse button in McpServerNameField within MCP Registry source
- **THEN** `McpRegistryModal` opens with `McpRegistryGrid` showing servers filtered by `remoteTransportTypes`
- **THEN** user can select a server and confirm to populate toolset fields
