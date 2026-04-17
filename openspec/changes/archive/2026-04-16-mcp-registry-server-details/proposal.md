## Why

The MCP Registry grid (`McpRegistryModal` → `McpRegistryGrid`) is the entry point users take to browse and pick an MCP server when creating a container, image, or toolset. Today it mirrors the HuggingFace registry grid in overall shape but is missing two affordances that HF already has:

1. **No server-details preview sidebar.** Users have to select a server and proceed just to see what they're picking. The HF grid already solves this with a side panel triggered by a pinned icon column — the MCP grid should follow the same pattern with MCP-specific content (title, description, version, last update, repository link, remotes chips, full `server.json`).
2. **Website and Repository URLs are rendered as plain text.** The registry records include `websiteUrl` and `repository.url` fields that are real URLs, but the grid shows them as text. Users cannot open them in a new tab directly from the grid — they have to copy-paste.

The BE already exposes everything we need: `POST /api/v1/mcp-registry/servers/versions` in `McpRegistryController` returns the full server.json for a single `{ serverName, version }` pair. No BE work is needed.

## What Changes

- **Shared `SidePanel` chrome** — new `src/components/Common/SidePanel/SidePanel.tsx` encapsulates the titled closable aside pattern (outer container, header with label + close button, open-gating, children slot). Extracted from the existing HuggingFace `ModelDescription`, consumed by both HF's refactored `ModelDescription` and the new `McpServerDetails`. Stays content-agnostic — no fetch/loading/empty concerns.
- **Server-details sidebar** — new `McpServerDetails` component composing `SidePanel`, rendered to the right of the MCP grid (same layout slot as `ModelDescription` for HF). Sidebar shows server name, description, version, last update, repository link, remotes chips, and an expandable `server.json` viewer. Triggered by clicking a pinned utility column with `IconFileDescription`, identical to the HF pattern. Selection and preview are decoupled — clicking the details icon does not change the radio selection.
- **`CodeViewer` gains `hideFullscreen?: boolean`** — optional prop (default `false` preserves existing behavior for all other callers). When true, the maximize icon and `FullscreenViewer` are not rendered. `McpServerDetails` passes `hideFullscreen` so the sidebar JSON block stays contained within the panel.
- **Fetch full server.json** — new `getMcpServerVersion({ serverName, version })` server action + `McpRegistryApi.getMcpServerVersion()` method hitting `POST /api/v1/mcp-registry/servers/versions`. Unwraps `ServerListResponseDto.servers[0]` (BE returns a single-item list when `version` is provided).
- **External URL cell renderer** — new `ExternalUrlCellRenderer` (`src/components/Grid/CellRenderers/`) that renders a cell value as an anchor tag with `IconExternalLink` when `isValidHttpUrl(value)` is true, falling back to plain text otherwise. Applied to the `websiteUrl` and `repository.url` columns in `MCP_REGISTRY_COLUMNS`.
- **MCP grid wiring** — `McpRegistryGrid` gains `infoPanel?: ReactNode` prop forwarded to `ListEntities`, a pinned right-hand utility column with `IconFileDescription`, and an `onCellClicked` handler that calls a new `onShowDetails(server: McpServer)` callback when the details column is clicked. Column click does not toggle selection.
- **Modal wiring** — `McpRegistryModal` owns the sidebar state (`detailsServer`, `isDetailsOpen`), constructs the `infoPanel` via `McpServerDetails`, and passes both `infoPanel` and `onShowDetails` into the grid.
- **Preserve the original response shape** — `McpRegistryGrid` currently flattens `McpServerResponse` into `McpServer` and discards the `_meta` envelope (`apps/ai-dial-admin/src/components/Deployments/McpRegistryGrid/McpRegistryGrid.tsx:76-79`). The flattened row still powers the grid; the details fetch re-requests the full `{ server, _meta }` so the JSON viewer shows the authentic registry payload.
- **i18n keys** — new `ContainersI18nKey` entries for sidebar labels (`ServerDetails`, `LastUpdate`, `Repository`, `Remotes`, `ViewFullServerJson`, `NoServerDetails`). Single registry namespace — no variants for container vs image vs toolset.
- **Test coverage** — unit tests for `ExternalUrlCellRenderer`, server-action wrapper, and `McpServerDetails` rendering (with mocks from `test-setup.tsx`).

## Non-goals

- No BE changes — the per-server endpoint already exists at `POST /api/v1/mcp-registry/servers/versions`
- No changes to grid selection model, pagination, or filtering
- No `icons` field support in sidebar (`ServerDetail` has it on BE, FE `McpServer` type does not — out of scope)
- No per-flow (container/image/toolset) sidebar variants — content is identical regardless of entry point
- No copy buttons in the sidebar — values are already openable via links
- No "Copy `server.json`" button — the Monaco viewer in `CodeViewer` already has one
- No follow-up version-switcher inside the sidebar (BE supports `/versions` list, but out of scope for this change)

## Capabilities

### Modified Capabilities

- `mcp-registry-source`: Adds server-details sidebar to the registry modal, renders Website and Repository columns as links, adds single-server fetch endpoint, adds utility column and click handler to grid.

## Impact

- **Components (new)**: `components/Common/SidePanel/SidePanel.tsx`, `components/Grid/CellRenderers/ExternalUrlCellRenderer.tsx`, `components/Deployments/Modals/McpRegistryModal/McpServerDetails.tsx`
- **Components (modified)**: `components/Deployments/Modals/HFRegistryModal/ModelDescription.tsx` (refactor to compose `SidePanel`), `components/Deployments/Modals/McpRegistryModal/McpRegistryModal.tsx` (sidebar state, `infoPanel`), `components/Deployments/McpRegistryGrid/McpRegistryGrid.tsx` (utility column, `onCellClicked`, `infoPanel` prop), `components/Common/CodeViewer/CodeViewer.tsx` (optional `hideFullscreen` prop)
- **Constants (modified)**: `constants/grid-columns/grid-columns.tsx` (websiteUrl and repository.url columns use `ExternalUrlCellRenderer`)
- **API layer (new method)**: `server/deployments/mcp-registry.ts` gains `getMcpServerVersion(serverName, version, token)` hitting `POST /api/v1/mcp-registry/servers/versions`
- **Server actions (new)**: `app/actions/deployments.ts` gains `getMcpServerVersion(serverName, version)`
- **Types (unchanged)**: Reuse existing `McpServer`, `McpServerResponse`, `McpServersResponse` — BE `ServerResponseDto` maps 1:1 to `McpServerResponse`
- **i18n**: New `ContainersI18nKey` entries and corresponding `en.ts` strings
