## mcp-registry-images

UI flow for creating image definitions from the MCP Registry, including registry browsing, server selection, and automatic image source configuration. Gated behind `MCP_REGISTRY_ENABLED` feature flag.

## ADDED Requirements

### Requirement: Feature flag gates image MCP Registry flow

The entire image MCP Registry flow SHALL be gated behind the existing `MCP_REGISTRY_ENABLED` feature flag. When disabled, the Images page SHALL show only the existing "Add" button (no dropdown).

#### Scenario: Feature flag enabled
- **WHEN** `MCP_REGISTRY_ENABLED` is `true`
- **THEN** the Images page SHALL show a dropdown with "Add Image" and "From MCP Registry" options

#### Scenario: Feature flag disabled
- **WHEN** `MCP_REGISTRY_ENABLED` is `false`
- **THEN** the Images page SHALL show only the existing single "Add" button

### Requirement: Images page entry point as dropdown

The Images page "Add" button SHALL become a `DialButtonDropdown` when the feature flag is enabled. Dropdown items are always both present — the dropdown itself is conditionally rendered based on the flag.

#### Scenario: Add Image option
- **WHEN** user clicks "Add Image" from the dropdown
- **THEN** the existing `ImageAdd` modal SHALL open with the standard image creation flow

#### Scenario: From MCP Registry option
- **WHEN** user clicks "From MCP Registry" from the dropdown
- **THEN** the `ImageAdd` modal SHALL open with `isRegistry=true`

### Requirement: Reuse ImageAdd modal with isRegistry flag

The existing `ImageAdd` modal SHALL accept an `isRegistry?: boolean` prop. When true, it SHALL initialize with `getImageTemplate(true)` which sets `source.$type=CODE` with `externalRegistryRef`. The modal uses `ImageFields` which renders `ImageSource` — detecting `externalRegistryRef` and showing `McpServerNameField` instead of source fields.

Branch, SHA, and BaseDirectory fields SHALL NOT be shown in the modal when `externalRegistryRef` exists.

#### Scenario: Registry modal fields
- **WHEN** the `ImageAdd` modal opens with `isRegistry=true`
- **THEN** the modal SHALL display name, version, description, and McpServerNameField
- **AND** SHALL NOT display source type, CodeURL, DockerURI, Branch, SHA, or BaseDirectory

#### Scenario: Standard modal unchanged
- **WHEN** the `ImageAdd` modal opens without `isRegistry`
- **THEN** the modal SHALL display the standard image creation fields

### Requirement: ImageSource renders McpServerNameField when externalRegistryRef exists

The `ImageSource` component SHALL check for `source.externalRegistryRef`. When present, it SHALL render `McpServerNameField` (importing `getImageMcpServers` directly) instead of SourceType/CodeURL/DockerURI. Branch and BaseDirectory SHALL be shown only when `!isModal`.

#### Scenario: Image with externalRegistryRef in detail view
- **WHEN** an image has `source.externalRegistryRef` set and is not in modal
- **THEN** `ImageSource` SHALL render McpServerNameField, Branch, and BaseDirectory

#### Scenario: Image with externalRegistryRef in modal
- **WHEN** an image has `source.externalRegistryRef` set and is in modal
- **THEN** `ImageSource` SHALL render only McpServerNameField

#### Scenario: Image without externalRegistryRef
- **WHEN** an image does NOT have `source.externalRegistryRef`
- **THEN** `ImageSource` SHALL render existing fields unchanged

### Requirement: Purpose-specific API method for images

`McpRegistryApi` SHALL expose a `getImageMcpServers()` method that uses `IMAGE_MCP_REGISTRY_FILTER` from constants and sends a POST request to `/api/v1/mcp-registry/servers/list`.

#### Scenario: API method applies repository filter
- **WHEN** `getImageMcpServers({ search: 'github' })` is called
- **THEN** a POST request SHALL be sent with `filter: { repositoryExists: true }`

### Requirement: Purpose-specific server action for images

A `getImageMcpServers()` server action SHALL support `minResults` accumulation identical to `getContainerMcpServers()`.

#### Scenario: Single fetch without minResults
- **WHEN** `getImageMcpServers({ limit: 100 })` is called without `minResults`
- **THEN** a single fetch SHALL be made

#### Scenario: Accumulation with minResults
- **WHEN** `getImageMcpServers({ limit: 100, minResults: 50 })` is called
- **THEN** the action SHALL fetch pages until at least 50 results or cursor exhausted

### Requirement: Image on-server-selection populates source fields

When an MCP server is selected for an image, the following fields SHALL be populated:

| Image source field | Value |
|---|---|
| `source.$type` | `CODE` (git) |
| `source.url` | `server.repository.url` |
| `source.externalRegistryRef.$type` | `"mcp-registry"` |
| `source.externalRegistryRef.packageName` | `server.name` |
| `source.externalRegistryRef.version` | `server.version` |

No other source fields SHALL be auto-populated.

#### Scenario: Server with repository selected
- **WHEN** user selects server `io.github.user/my-server` version `1.0.0` with repository `https://github.com/user/my-server`
- **THEN** image source SHALL be set with `url: 'https://github.com/user/my-server'`, `packageName: 'io.github.user/my-server'`, `version: '1.0.0'`

### Requirement: ImageSource type includes externalRegistryRef

The `ImageSource` interface SHALL include an optional `externalRegistryRef?: ExternalRegistryRef` field, imported from `types/deployments/mcp-registry`.

#### Scenario: Existing images without externalRegistryRef
- **WHEN** an existing image has no `externalRegistryRef`
- **THEN** the field SHALL be `undefined` and no behavior SHALL change

### Requirement: Image template factory functions

`getImageSource(isRegistry?)` and `getImageTemplate(isRegistry?)` SHALL be defined in `utils/deployments/images.tsx`. When `isRegistry` is true, the source SHALL be `{ $type: CODE, url: '', externalRegistryRef: { $type: 'mcp-registry', packageName: '' } }`.

#### Scenario: Default template
- **WHEN** `getImageTemplate()` is called
- **THEN** source SHALL be `{ $type: DOCKER, imageUri: '' }`

#### Scenario: Registry template
- **WHEN** `getImageTemplate(true)` is called
- **THEN** source SHALL include `externalRegistryRef`
