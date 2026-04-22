## mcp-registry-source (delta)

Extends the MCP Registry UI flow with a server-details sidebar, link rendering for URL columns, and a single-server fetch endpoint. No changes to the existing selection, pagination, filtering, or entry-point flows.

## ADDED Requirements

### Requirement: Shared SidePanel chrome component

The FE SHALL expose a reusable `SidePanel` component at `src/components/Common/SidePanel/SidePanel.tsx` that provides the titled closable aside chrome. The component SHALL own only the chrome (outer container, header with label and close button, open-gating, children slot) and SHALL NOT own any data-fetching, loading, empty-state, or i18n logic.

The component SHALL accept the following props:

- `label: ReactNode` — header label text
- `isOpen: boolean` — gate controlling whether the panel is rendered
- `onClose: () => void` — invoked when the close button is clicked
- `children: ReactNode` — body content
- `className?: string` — optional override for the outer container (escape hatch for per-usage tweaks)

The outer container SHALL use the classes `flex flex-col lg:w-[420px] p-4 border border-primary rounded h-full` by default. The header row SHALL render the label as `<span className="dial-tiny-text text-secondary">` followed by a `DialCloseButton` with `size={24}`.

Both the HuggingFace `ModelDescription` and the new `McpServerDetails` SHALL compose `SidePanel`. `ModelDescription` SHALL be refactored to compose `SidePanel` without regressing its existing fetch/loader/empty behavior.

#### Scenario: Panel is hidden when closed

- **WHEN** `SidePanel` is rendered with `isOpen={false}`
- **THEN** it SHALL render nothing (return `null`)

#### Scenario: Panel renders label and children when open

- **WHEN** `SidePanel` is rendered with `isOpen={true}`, a label, and children
- **THEN** the label SHALL appear in the header row
- **AND** the children SHALL appear in the body
- **AND** a close button SHALL be present in the header

#### Scenario: Close button invokes onClose

- **WHEN** the user clicks the close button
- **THEN** `onClose` SHALL be invoked exactly once
- **AND** `SidePanel` SHALL NOT internally change its `isOpen` state (owned by the parent)

#### Scenario: ModelDescription composition

- **WHEN** the HuggingFace registry modal opens a model description
- **THEN** `ModelDescription` SHALL render a `SidePanel` with `label={t(ContainersI18nKey.ModelDetails)}`
- **AND** the existing markdown/loader/empty behavior SHALL appear inside the `SidePanel` children
- **AND** the close button in `SidePanel` SHALL call `onChangeIsDescriptionShown(false)`

### Requirement: Single-server fetch endpoint

The FE SHALL expose a `getMcpServerVersion(serverName: string, version: string)` server action backed by `McpRegistryApi.getMcpServerVersion()`, which hits `POST /api/v1/mcp-registry/servers/versions` with body `{ serverName, version }`.

The BE endpoint returns `ServerListResponseDto` with a single-item `servers` array when `version` is provided (see `McpRegistryController.postServerVersions` in `ai-dial-admin-deployment-manager-backend`). The server action SHALL unwrap `response.servers[0]` into an `McpServerResponse` shape `{ server: McpServer, _meta?: Record<string, unknown> }` before returning.

#### Scenario: Successful single-server fetch

- **WHEN** `getMcpServerVersion("ai.aliengiraffe/spotdb", "v0.1.0")` is called
- **THEN** the FE SHALL POST to `/api/v1/mcp-registry/servers/versions` with body `{ serverName: "ai.aliengiraffe/spotdb", version: "v0.1.0" }`
- **AND** the response SHALL be unwrapped to `{ success: true, response: { server, _meta } }`

#### Scenario: Upstream returns empty servers array

- **WHEN** the BE returns `{ servers: [], metadata: { count: 0 } }`
- **THEN** the server action SHALL return `{ success: true, response: null }` (no hard error — the UI treats null as "no details available")

#### Scenario: Upstream returns an error

- **WHEN** the BE call fails
- **THEN** the server action SHALL propagate the error envelope as-is (`success: false`, `errorHeader`, `errorMessage`) per the standard server-action contract

### Requirement: Server Details Sidebar

The MCP registry modal SHALL render an optional right-hand sidebar (`McpServerDetails`) that composes the shared `SidePanel` chrome. The sidebar SHALL:

- Compose `SidePanel` with `label={t(ContainersI18nKey.ServerDetails)}`, `isOpen`, and `onClose` props
- Be triggered by clicking a pinned utility column ("details icon") in `McpRegistryGrid`
- Be closable via the `SidePanel`'s close button
- Be decoupled from row selection — opening the sidebar SHALL NOT change the currently-selected server
- Share the modal's flex layout (`flex h-full bg-layer-2 py-4 px-6 gap-4`) and inherit `SidePanel`'s default `lg:w-[420px]` width at the large breakpoint

Sidebar content SHALL be composed from DIAL primitives, rendered as children of `SidePanel`:

| Slot | Content | Component |
|---|---|---|
| Chrome (outer + header + close) | Provided by parent | `SidePanel` |
| Title | `server.name` | `<h3 className="dial-h3">` |
| Description | `server.description` | `<p className="dial-small-text text-primary">` |
| Version | `server.version` | `DialLabelledText` |
| Last Update | `server.updatedAt` formatted via the same formatter as the grid column | `DialLabelledText` |
| Repository | `server.repository.url` as anchor with external-link icon | `DialLabelledText` with `children` |
| Remotes | `server.remotes[].type` as inline tag chips | Static markup or reuse of `TagsCellRenderer` |
| Full server.json | Pretty-printed `{ server, _meta }` payload | `CodeViewer` with `hideFullscreen` |
| Loading state | While the full-payload fetch is in flight for the JSON block | `DialLoader` |
| Empty state | When the fetch returns no data | `DialNoDataContent` |

#### Scenario: Opening the sidebar

- **WHEN** the user clicks the details icon in a grid row
- **THEN** the sidebar SHALL appear immediately populated with the row's instant data (name, description, version, repository, remotes)
- **AND** a fetch to `getMcpServerVersion(server.name, server.version)` SHALL be initiated
- **AND** the JSON viewer block SHALL show a loader until the fetch resolves
- **AND** the grid's radio selection SHALL NOT change

#### Scenario: Closing the sidebar

- **WHEN** the user clicks the close button in the panel header
- **THEN** the sidebar SHALL hide
- **AND** any in-flight `getMcpServerVersion` request result SHALL be discarded for UI purposes
- **AND** the radio selection SHALL remain unchanged

#### Scenario: Sidebar opens for a row with missing optional fields

- **WHEN** the clicked row has no `repository`
- **THEN** the Repository block SHALL NOT be rendered
- **WHEN** the clicked row has no `remotes`
- **THEN** the Remotes block SHALL NOT be rendered

#### Scenario: JSON payload fetch fails

- **WHEN** `getMcpServerVersion` returns an error
- **THEN** the sidebar SHALL remain open showing the instant row data
- **AND** the JSON viewer section SHALL render `DialNoDataContent` with label `NoServerDetails`

#### Scenario: Reopening the sidebar for a different server

- **WHEN** the sidebar is open for server A and the user clicks the details icon for server B
- **THEN** the sidebar content SHALL update to server B's instant data
- **AND** a new fetch SHALL be initiated for server B
- **AND** the server A fetch result, if it arrives after, SHALL NOT overwrite server B's data

### Requirement: CodeViewer supports hiding the fullscreen control

The `CodeViewer` component (`src/components/Common/CodeViewer/CodeViewer.tsx`) SHALL accept an optional `hideFullscreen?: boolean` prop (default `false`).

When `hideFullscreen` is `true`:

- The maximize icon button SHALL NOT be rendered in the header
- The `FullscreenViewer` component SHALL NOT be mounted

All existing callers that do not pass `hideFullscreen` SHALL be unaffected — the maximize button and `FullscreenViewer` remain present.

The sidebar's "View full server.json" block SHALL pass `hideFullscreen` so the fullscreen control is not available within the space-constrained registry modal.

#### Scenario: Default behavior is unchanged

- **WHEN** `CodeViewer` is rendered without `hideFullscreen`
- **THEN** the maximize button SHALL be present in the header
- **AND** clicking it SHALL open the `FullscreenViewer`

#### Scenario: hideFullscreen removes the control

- **WHEN** `CodeViewer` is rendered with `hideFullscreen={true}`
- **THEN** the maximize button SHALL NOT be present
- **AND** the `FullscreenViewer` SHALL NOT be rendered

### Requirement: External URL Cell Renderer

The FE SHALL expose a reusable AG Grid cell renderer `ExternalUrlCellRenderer` at `src/components/Grid/CellRenderers/ExternalUrlCellRenderer.tsx`.

The renderer SHALL:

- Accept the standard `ICellRendererParams`
- Use `isValidHttpUrl` from `src/utils/validation/url-error.ts` to validate `params.value`
- Render an anchor (`<a href={value} target="_blank" rel="noopener noreferrer">`) with an inline `IconExternalLink` when the value is a valid HTTP(S) URL
- Render plain text when the value is a non-URL string
- Render nothing (empty cell) when the value is falsy
- Use DIAL link color tokens (`text-accent-primary`, `hover:underline`) — no hardcoded colors

#### Scenario: Valid URL renders as a clickable link

- **WHEN** the cell value is `https://github.com/example/mcp-server`
- **THEN** the renderer SHALL output an `<a>` with `href` set to the URL, `target="_blank"`, `rel="noopener noreferrer"`
- **AND** a trailing `IconExternalLink` SHALL be visible

#### Scenario: Invalid URL renders as text

- **WHEN** the cell value is `not-a-url`
- **THEN** the renderer SHALL output the string as plain text with no anchor tag

#### Scenario: Empty cell

- **WHEN** the cell value is `undefined`, `null`, or `""`
- **THEN** the renderer SHALL render no content

### Requirement: MCP Registry Grid utility column and cell click handler

`McpRegistryGrid` SHALL compose its `columnDefs` by appending a pinned-right utility column to `MCP_REGISTRY_COLUMNS`:

- `field: 'detailsColumn'`
- `cellRenderer: () => <IconFileDescription className="text-secondary" />`
- `pinned: 'right'`, `lockPinned: true`
- Width sourced from the existing `UTILITY_COLUMN` preset

`McpRegistryGrid` SHALL accept two new optional props:

- `infoPanel?: ReactNode` — forwarded to `ListEntities` (slots to the right of the grid)
- `onShowDetails?: (server: McpServer) => void` — invoked when the user clicks the details column

The grid's `gridOptions.onCellClicked` handler SHALL:

- Call `onShowDetails(event.data)` when `event.colDef.field === 'detailsColumn'` and `event.data` is defined
- NOT call `onShowDetails` for clicks on any other column
- NOT mutate row selection as a side effect of a details-column click

#### Scenario: Clicking the details column opens the sidebar

- **WHEN** the user clicks a cell in the `detailsColumn`
- **THEN** `onShowDetails` SHALL be invoked with the row's `McpServer` data
- **AND** the radio selection SHALL remain unchanged

#### Scenario: Clicking any data column does not trigger details

- **WHEN** the user clicks a cell in the `name`, `websiteUrl`, `repository.url`, `remotes`, `packages`, `version`, or `updatedAt` column
- **THEN** `onShowDetails` SHALL NOT be invoked

## MODIFIED Requirements

### Requirement: Registry Grid

- SHALL use ag-grid with infinite scroll and cursor-based pagination
- SHALL support single-row radio selection
- All rows SHALL be selectable (server-side filtering ensures only compatible servers are returned)
- Search filter on server name column SHALL map to `search` query parameter
- `updatedAt` SHALL be flattened from `_meta["io.modelcontextprotocol.registry/official"].updatedAt` during response mapping
- SHALL accept a `fetchServers: McpRegistryFetchFn` prop and use it for all data fetching (no direct action import)
- SHALL accept an optional `infoPanel?: ReactNode` prop forwarded to `ListEntities`
- SHALL accept an optional `onShowDetails?: (server: McpServer) => void` prop wired to the utility column's cell-click handler
- `McpRegistryModal` SHALL accept and pass through the `fetchServers` prop to `McpRegistryGrid`, and owns the `infoPanel`/`onShowDetails` wiring for the server-details sidebar
- Radio button cell renderer SHALL return `null` when the row has no data (placeholder rows)

**Columns:**

| Column | Field | Sortable | Filterable | Renderer |
|---|---|---|---|---|
| MCP server name | `name` | no | yes (text → search) | text |
| Website | `websiteUrl` | no | no | `ExternalUrlCellRenderer` |
| Repository | `repository.url` | no | no | `ExternalUrlCellRenderer` (with existing `valueGetter`) |
| Remotes | `remotes[].type` | no | no | badge tags |
| Packages | `packages[].registryType` | no | no | badge tags |
| Version | `version` | no | no | text |
| Last Update | `updatedAt` (flattened) | no | no | dateTime |
| (utility) | `detailsColumn` (pinned right, composed by grid component, not in `MCP_REGISTRY_COLUMNS`) | no | no | `IconFileDescription` |

#### Scenario: Website column renders valid URL as a clickable link

- **WHEN** a row's `websiteUrl` is `https://example.com`
- **THEN** the Website cell SHALL render an anchor with `target="_blank"` and `rel="noopener noreferrer"` containing the URL text and an external-link icon

#### Scenario: Repository column renders valid URL as a clickable link

- **WHEN** a row's `repository.url` is `https://github.com/example/mcp-server`
- **THEN** the Repository cell SHALL render an anchor with `target="_blank"` and `rel="noopener noreferrer"` containing the URL text and an external-link icon

#### Scenario: Repository column with no URL renders empty

- **WHEN** a row has no `repository`
- **THEN** the Repository cell SHALL render as empty (no anchor, no text)

#### Scenario: Grid renders without sidebar when infoPanel is omitted

- **WHEN** `McpRegistryGrid` is used without `infoPanel` or `onShowDetails` props
- **THEN** the grid SHALL render normally with the pinned utility column still visible
- **AND** clicking the details column SHALL be a no-op (no error thrown)

### Requirement: Registry Browser Modal

- SHALL use `McpRegistryModal` with `DialFormPopup`, header "Select MCP server from registry"
- Confirm button SHALL be disabled when no server is selected
- SHALL contain `McpRegistryGrid`
- SHALL own the server-details sidebar state (`detailsServer`, `detailsResponse`, `isDetailsOpen`, `isDetailsLoading`) and pass `infoPanel={<McpServerDetails ... />}` into `McpRegistryGrid`
- SHALL pass `onShowDetails` into `McpRegistryGrid` that updates sidebar state and invokes `getMcpServerVersion`
- Modal SHALL remain functional when the sidebar is closed (baseline behavior, no regression)

#### Scenario: Confirm button disabled until selection

- **WHEN** the modal opens and no row is selected
- **THEN** the Confirm button SHALL be disabled

#### Scenario: Details click does not affect Confirm eligibility

- **WHEN** the user clicks the details icon on a row without clicking its radio button
- **THEN** the sidebar SHALL open
- **AND** the Confirm button SHALL remain disabled (selection unchanged)

#### Scenario: Sidebar closed by default

- **WHEN** the modal first opens
- **THEN** the sidebar SHALL NOT be visible
- **AND** the grid SHALL occupy the full modal body width
