## MODIFIED Requirements

### Requirement: Purpose-specific server action for images

The `getImageMcpServers()` server action SHALL make two parallel POST requests — one with `{ repositoryExists: true }` and one with `{ packageRegistryTypes: ["oci"] }` — and merge and deduplicate results by `name + version`. The action SHALL support `minResults` accumulation.

#### Scenario: Merged results from two filters
- **WHEN** `getImageMcpServers({ limit: 100, minResults: 100 })` is called
- **THEN** the action SHALL make two parallel requests with different filters
- **AND** merge results, deduplicating servers that appear in both by `name + version`

#### Scenario: Server with both repo and OCI appears once
- **WHEN** a server has both a repository and an OCI package
- **THEN** it SHALL appear once in the merged results with its full data (both repository and packages)

### Requirement: Image on-server-selection populates source fields

When an MCP server is selected for an image (via `ImageMcpRegistry`), the source fields SHALL be populated based on the server's capabilities:

- If server has repository: default to "Source code", prefill `source.url` from `repository.url`
- If server has only OCI packages: default to "Docker image", prefill `source.imageUri` from first OCI package's `identifier`, map transport type

**Transport mapping**: `stdio` → `IMAGE_TRANSPORT_TYPE.LOCAL`, `streamable-http` / `sse` → `IMAGE_TRANSPORT_TYPE.REMOTE`

#### Scenario: Server with repository selected
- **WHEN** user selects a server that has a repository
- **THEN** source SHALL default to CODE with `source.url` from `repository.url`

#### Scenario: Server with only OCI selected
- **WHEN** user selects a server that has only OCI packages (no repository)
- **THEN** source SHALL default to DOCKER with `source.imageUri` from first OCI package's `identifier`
- **AND** `transportType` SHALL be mapped from the package transport type

### Requirement: ImageMcpRegistry component

A new `ImageMcpRegistry` component (`ImageSource/ImageMcpRegistry.tsx`) SHALL wrap `McpServerNameField` and own all MCP registry logic for images:
- Server selection → calls `onServerChange(server)` and prefills image source
- Name typing → calls `onServerChange(undefined)` and clears version from `externalRegistryRef`
- View-load fetch → fetches server by name when `!isModal && serverName && !selectedServer`

The parent (`ImageSource`) SHALL hold `registryServer` state and pass it to both `ImageMcpRegistry` and `SourceType`.

#### Scenario: Server selected via modal or autocomplete
- **WHEN** a server is selected
- **THEN** `ImageMcpRegistry` SHALL call `onServerChange(server)` with the full `McpServer` object
- **AND** prefill source fields based on server capabilities

#### Scenario: User types server name
- **WHEN** user types in the server name field
- **THEN** `ImageMcpRegistry` SHALL call `onServerChange(undefined)` to clear the server
- **AND** `externalRegistryRef` SHALL have version cleared (only packageName updated)

#### Scenario: View loads with existing server name
- **WHEN** image view loads with `externalRegistryRef.packageName` set
- **THEN** `ImageMcpRegistry` SHALL fetch the server from the registry
- **AND** call `onServerChange(server)` to populate capabilities

### Requirement: Version ownership

Only `McpServerNameField` (via `ImageMcpRegistry.onServerSelect`) and the modal SHALL set `externalRegistryRef.version`. Source type switch SHALL never modify name or version — it SHALL pass through the existing `externalRegistryRef` untouched.

#### Scenario: Version set on server select
- **WHEN** a server is selected (autocomplete, modal, or freeform validation)
- **THEN** `externalRegistryRef.version` SHALL be set to `server.version`

#### Scenario: Version cleared on typing
- **WHEN** user types a new server name
- **THEN** `externalRegistryRef.version` SHALL be cleared

#### Scenario: Source type switch preserves version
- **WHEN** user switches source type in the dropdown
- **THEN** `externalRegistryRef.name` and `externalRegistryRef.version` SHALL NOT change

### Requirement: ImageSource simplified layout

`ImageSource` SHALL only handle layout and shared state. When `externalRegistryRef` exists:
- Render `ImageMcpRegistry` (MCP server field)
- Render `SourceType` with `registryServer` prop (shared between registry and non-registry)
- Render `CodeURL`/`DockerURI` with `disabled` prop in view
- Render Branch/BaseDirectory (shared)

#### Scenario: Registry flow in modal
- **WHEN** image has `externalRegistryRef` in modal
- **THEN** render `ImageMcpRegistry` + `SourceType` (only if both capabilities)
- **AND** URL, Docker URI, Branch, SHA SHALL NOT be shown

#### Scenario: Registry flow in view
- **WHEN** image has `externalRegistryRef` in view
- **THEN** render `ImageMcpRegistry` + `SourceType` (always, disabled if single capability)
- **AND** URL/Docker URI shown disabled, Branch/SHA shown editable

### Requirement: SourceType source type switch with registryServer

When `SourceType` receives `registryServer` prop and user switches source type:

**"Source code" selected:**
- `source.$type = CODE`, `url = server.repository.url`, `externalRegistryRef` passed through
- `branchName`, `sha`, `baseDirectory` from current source preserved

**"Docker image" selected:**
- `source.$type = DOCKER`, `imageUri = firstOciPackage.identifier`, `externalRegistryRef` passed through
- `transportType` mapped: `stdio` → LOCAL, others → REMOTE

Source objects SHALL be built clean (no `...image.source` spread) to prevent field leaks.

#### Scenario: Switch to Docker — clean source
- **WHEN** user switches to "Docker image"
- **THEN** source SHALL contain only `$type`, `imageUri`, `externalRegistryRef`
- **AND** SHALL NOT contain stale `url` or `branchName` fields

#### Scenario: Switch to Code — clean source
- **WHEN** user switches to "Source code"
- **THEN** source SHALL contain only `$type`, `url`, `branchName`, `sha`, `baseDirectory`, `externalRegistryRef`
- **AND** SHALL NOT contain stale `imageUri` field

## ADDED Requirements

### Requirement: Image transport type mapping utility

`utils/deployments/mcp-registry.ts` SHALL export `mapImageTransportType(transportType: string): IMAGE_TRANSPORT_TYPE` that maps:
- `stdio` → `IMAGE_TRANSPORT_TYPE.LOCAL`
- `streamable-http` → `IMAGE_TRANSPORT_TYPE.REMOTE`
- `sse` → `IMAGE_TRANSPORT_TYPE.REMOTE`

#### Scenario: stdio maps to local
- **WHEN** `mapImageTransportType('stdio')` is called
- **THEN** it SHALL return `IMAGE_TRANSPORT_TYPE.LOCAL`

#### Scenario: streamable-http maps to remote
- **WHEN** `mapImageTransportType('streamable-http')` is called
- **THEN** it SHALL return `IMAGE_TRANSPORT_TYPE.REMOTE`

### Requirement: hasRepoAndOci utility

`utils/deployments/mcp-registry.ts` SHALL export `hasRepoAndOci(server: McpServer): boolean` that returns true when server has both `repository.url` and at least one package with `registryType === 'oci'`.

#### Scenario: Server with both
- **WHEN** server has repository and OCI package
- **THEN** `hasRepoAndOci` SHALL return `true`

#### Scenario: Server with only repo
- **WHEN** server has repository but no OCI packages
- **THEN** `hasRepoAndOci` SHALL return `false`

### Requirement: Grid preselection requires version

The grid radio button SHALL require both `name` AND `version` match for preselection. When `selectedServer.version` is empty/missing, no row SHALL be preselected.

#### Scenario: Version matches — preselected
- **WHEN** `selectedServer` has `name: 'org/server'` and `version: '1.0.0'`
- **THEN** the grid row with matching name and version SHALL be preselected

#### Scenario: Version missing — no preselection
- **WHEN** `selectedServer` has `name: 'org/server'` and `version: ''`
- **THEN** no grid rows SHALL be preselected

### Requirement: CodeURL and DockerURI accept disabled prop

`CodeURL` and `DockerURI` components SHALL accept an optional `disabled?: boolean` prop. When true, the input field SHALL be disabled (in addition to the existing `isReadOnlyAdmin` check).

#### Scenario: Disabled in registry view
- **WHEN** `disabled={true}` is passed
- **THEN** the input SHALL be disabled regardless of admin role
