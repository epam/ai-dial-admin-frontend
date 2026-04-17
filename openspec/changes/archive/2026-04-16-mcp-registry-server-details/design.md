## Context

`McpRegistryModal` and `McpRegistryGrid` were introduced by the `mcp-registry-integration` change and generalized by the `mcp-registry-images` and `mcp-registry-toolsets` changes. The grid now serves three entry points (containers, images, toolsets) with BE-side filtering via `fetchServers: McpRegistryFetchFn`. All three share the same columns, layout, and selection behavior.

The HuggingFace registry modal (`HuggingfaceRegistry.tsx:1-68`, `HFRegistryGrid.tsx:1-150`) already implements a detail-preview sidebar pattern: the grid exposes a pinned icon column, `onCellClicked` handler opens a right-hand side panel (`ModelDescription.tsx:35-57`), and the panel occupies `lg:w-[420px]` inside the modal's flex row. Selection (radio) and preview (sidebar) are decoupled — clicking the details icon does not change the selected row.

The BE (`McpRegistryController` in `ai-dial-admin-deployment-manager-backend`) exposes five endpoints under `/api/v1/mcp-registry/servers`:

- `GET /` — list with query params
- `POST /list` — list with body (FE uses this for paginated grid)
- `GET /{namespace}/{name}/versions` — all versions of a server
- `GET /{namespace}/{name}/versions/{version}` — one specific version
- `POST /versions` — with `{ serverName, version }`; when `version` is set, returns `ServerListResponseDto` wrapping a single-item array

`ServerResponseDto` is a 1:1 structural match for the FE `McpServerResponse` type: `{ server: ServerDetail, _meta: Map<String, Object> }`.

## Goals / Non-Goals

**Goals:**
- Reach feature parity with the HF registry grid's sidebar pattern for MCP
- Make `websiteUrl` and `repository.url` clickable from the grid without copy-paste
- Reuse existing UI primitives (`DialLabelledText`, `CodeViewer`, `DialCloseButton`, `DialButton`, DIAL typography) — no new UI primitives
- Zero BE work — consume existing endpoints

**Non-Goals:**
- No new feature flag — the sidebar is a UX refinement of an existing flagged feature
- No selection-vs-preview coupling changes — keep HF's decoupled model
- No refactor of the grid's datasource or pagination
- No multi-version UI inside the sidebar (would need `/versions` list endpoint; out of scope)

## Decisions

### 1. Sidebar triggered by pinned utility column (HF parity)

**Decision**: Add a pinned-right utility column with `IconFileDescription` to `MCP_REGISTRY_COLUMNS` via `McpRegistryGrid` (not the constants file), matching `HFRegistryGrid.tsx:122-132`. `gridOptions.onCellClicked` checks `event.colDef.field === 'detailsColumn'` and calls `onShowDetails(event.data)`.

**Why**: The HF pattern is already battle-tested and familiar to users. Row-click would collide with radio selection semantics. A dedicated icon keeps the grammar of "radio = select, icon = preview" explicit.

**Why not add to `MCP_REGISTRY_COLUMNS`**: The utility column depends on the click handler passed in by the grid component, so it must be composed at the grid level — not in a static constants file. HF does this the same way.

### 2. Decoupled selection and preview

**Decision**: Clicking the details icon does NOT mutate the selected row. The sidebar receives the clicked row's `McpServer` independently. Radio selection continues to drive `selectedServer` for the modal's Confirm flow.

**Why**: Matches HF behavior (`HFRegistryGrid.tsx:49-58` — selection and details are independent callbacks). Users can preview candidate servers without committing selection.

### 3. ExternalUrlCellRenderer as a new reusable renderer

**Decision**: Add `src/components/Grid/CellRenderers/ExternalUrlCellRenderer.tsx` accepting `ICellRendererParams`. When `isValidHttpUrl(params.value)` is true, render an anchor (`target="_blank"`, `rel="noopener noreferrer"`) with an `IconExternalLink` and DIAL link styling. Otherwise render plain text. Apply to `websiteUrl` and `repository.url` columns in `MCP_REGISTRY_COLUMNS`.

**Why a renderer and not inline JSX in the column def**: AG Grid cell renderers must be stable React components — inline function components cause remount on every render. A named renderer is cleaner and unit-testable. Placing it in `Grid/CellRenderers/` matches the 18 existing peers (`BooleanButtonCellRenderer`, `TagsCellRenderer`, etc.).

**Why not extend an existing renderer**: No existing renderer handles URLs — verified by inspection of `src/components/Grid/CellRenderers/`. `isValidHttpUrl` already exists in `utils/validation/url-error.ts:9`, reused here.

**Placement of the external link icon**: Inline, trailing the URL text, `size={14}`. Matches `Adapters.tsx:150` pattern.

### 4. Single-server fetch via `POST /api/v1/mcp-registry/servers/versions`

**Decision**: Add `McpRegistryApi.getMcpServerVersion(serverName, version, token)` using `postAction` (same pattern as existing methods). Request body: `{ serverName, version }`. Response: `ServerListResponseDto` → FE unwraps `response.servers[0]` to get `{ server, _meta }`.

**Why POST `/versions` over GET `/{namespace}/{name}/versions/{version}`**:
- Pattern parity: all existing FE MCP calls use `postAction` through `BaseApi`
- No URL-encoding of server names (dots, slashes) — body is JSON
- Matches the existing validated-DTO style the BE uses for `postListServers`

**Why not reuse the flat row data from the grid**: The grid flattens `McpServerResponse` into `McpServer` and hoists `_meta[REGISTRY_META_KEY].updatedAt` onto the row (`McpRegistryGrid.tsx:76-79`). The `_meta` envelope is discarded. The sidebar's "View full server.json" section is meant to show the authentic registry payload, including `_meta`. Fetching fresh guarantees fidelity.

**Trade-off**: Extra round-trip per sidebar open. Acceptable — users open details infrequently, and the payload is small. If this ever becomes hot, we can cache by `name@version` in the modal.

### 5. Preserve the original `McpServerResponse` on grid rows

Not applicable with Decision 4 — we re-fetch on open, so the grid's current flattening is fine.

### 6. Extract a shared `SidePanel` chrome component

**Decision**: Extract the panel chrome (outer container, titled header row, close button, open-gating) from the existing HuggingFace `ModelDescription` into a new shared component `src/components/Common/SidePanel/SidePanel.tsx`. Both `ModelDescription` and the new `McpServerDetails` compose it by passing `label`, `isOpen`, `onClose`, and `children`. The extracted chrome SHALL NOT own any data-fetching, loading, or empty-state logic — those remain in each concrete panel so the abstraction stays content-agnostic.

**Why extract now, with two callers**:
- The chrome is byte-identical between HF and MCP: same `lg:w-[420px]`, same border/padding/radius, same `dial-tiny-text` header label, same `DialCloseButton` size=24, same open-gating shape.
- The roadmap in the deployment-manager-backend README lists NIM (in-flight) and KServe (planned) — both are registry-shaped features that will likely need identical sidebar chrome. Extracting now, with two concrete shapes to validate the abstraction, is cheaper than re-extracting later.
- The extraction is intentionally shallow: four props and ~15 lines of JSX. Easy to reverse if it ever gets in the way.

**Why `SidePanel` and not `RegistryDetailsPanel` / `InfoPanel` / `Drawer`**:
- "Registry" would leak the current use case into what should be a generic chrome component. A future analytics details inspector or entity properties aside should be able to reuse it without a rename.
- `InfoPanel` overlaps semantically with the existing `MetricInfoPanel`, `RunMetricDetailPanel`, and `RunResultDetailPanel` — all content components that would not become subtypes.
- `Drawer` typically implies slide-in/out animation from offscreen — this chrome is statically inset beside the grid.
- `SidePanel` describes what the component is (a side-placed panel), matches industry convention, and has no existing collision in the repo (verified via grep).

**Why not use `CollapsibleSidebar` from `@epam/ai-dial-ui-kit`**: `CollapsibleSidebar` is for expanding/collapsing in place (e.g., a nav rail). The registry sidebar is open or closed — not collapsed to a narrow rail — and is rendered inside a modal flex row. Different semantics.

**Placement in `components/Common/`** per the `config.yaml` design rule that reusable patterns live there alongside `CopyButton`, `LabelledText`, `CodeViewer`, etc.

**HF regression exposure**: Refactoring `ModelDescription` to compose `SidePanel` touches 5 lines of chrome. Existing HF tests give a safety net; any surviving tests that query the header label or close behavior must continue to pass after the refactor.

### 7. Sidebar composition — reuse DIAL primitives end-to-end

**Decision**: `McpServerDetails` is composed from existing primitives:

| Element | Primitive |
|---|---|
| Panel chrome (outer + header + close) | `SidePanel` (from Decision 6) |
| Server name | `<h3 className="dial-h3">` |
| Description | `<p className="dial-small-text text-primary">` |
| Version, Last Update | `DialLabelledText` (imported from `@epam/ai-dial-ui-kit`) — text prop |
| Repository | `DialLabelledText` with `children` slot wrapping the `<a>` (pattern from `TabsContent.tsx:45-47`) |
| View in API | `<a>` wrapping `websiteUrl` with `IconExternalLink`, styled as a link |
| Remotes | Inline tag chips rendered via the same `TagsCellRenderer` style already used in the Remotes column — or static markup with DIAL tag tokens |
| Full server.json toggle | `CodeViewer` (`src/components/Common/CodeViewer/CodeViewer.tsx`) — already read-only, already expandable, already has copy + fullscreen |
| Loading | `DialLoader` (mirror of `ModelDescription.tsx:45`) |
| Empty | `DialNoDataContent` (mirror of `ModelDescription.tsx:51`) |

**Why reuse `CodeViewer` for the JSON block**: The component is already read-only by default (`CodeViewer.tsx:80`), supports JSON pretty-printing, includes copy button, fullscreen viewer, and size indicator. The design shows a collapsible JSON block — `CodeViewer` is that block. The minor visual deviation (chevron-left vs. chevron-right in design) is acceptable and avoids duplicating ~30 lines of Monaco setup.

**Why local `LabelledText` wrapper is NOT used**: Its only addition over `DialLabelledText` is `copyable` support. The design has no copy affordance in the sidebar (URLs are openable; JSON already has copy via `CodeViewer`). Using `DialLabelledText` directly keeps the component dependency-minimal and matches `TabsContent.tsx` usage in the Image view header.

### 8. Sidebar layout mirrors HF (via `SidePanel`)

**Decision**: `SidePanel` owns the outer layout: `flex flex-col lg:w-[420px] p-4 border border-primary rounded h-full` — identical to `ModelDescription.tsx:39`. Inside `McpServerDetails`, the children body uses `flex flex-col gap-4` with scroll-y overflow for long descriptions. Version + Last Update sit in a `flex flex-row gap-6` row to mirror the design.

**Why**: The modal (`PopupSize.Lg`, 800px height) is width-constrained. The HF precedent (`lg:w-[420px]`) proves this fits alongside a 6-column grid without horizontal scroll. Deviating would require separate design review.

### 9. i18n — single registry namespace

**Decision**: Add keys under the existing `ContainersI18nKey` enum (where `McpServers`, `SelectModelFromRegistry`, etc. already live). New keys:

- `ServerDetails` — panel label
- `LastUpdate` — "Last Update"
- `Repository` — "Repository"
- `ViewInApi` — "View in API"
- `Remotes` — "Remotes" (may already exist; check before adding)
- `ViewFullServerJson` — "View full server.json"
- `NoServerDetails` — "No server details available"

Reuse existing keys where already defined: `Version`, possibly `Remotes`, `Description`.

**Why `ContainersI18nKey` and not a new namespace**: Registry is currently a single conceptual feature regardless of which entity (container/image/toolset) triggered it. The existing keys for the registry modal already live in `ContainersI18nKey`. Splitting now would create churn for zero benefit. Can be extracted to a dedicated `McpRegistryI18nKey` later if the registry grows into its own domain.

### 10. No copy buttons in sidebar

**Decision**: Values in the sidebar are either links (openable), tag labels (not meaningful to copy), or the full JSON (already copyable via `CodeViewer`). Skip all `CopyButton` usage.

### 11. Loading and error states

**Decision**:
- While `getMcpServerVersion` is in flight, show `DialLoader` (same as HF).
- On fetch error, show `DialNoDataContent` with `NoServerDetails` label (no retry affordance for now — user can close and re-open).
- Sidebar opens immediately with the row data we already have (so the user sees name/description/version instantly), and the JSON viewer block shows the loader until the full fetch resolves. If the fetch succeeds, replace the in-memory row with the authoritative response.

**Why show instant row data**: The grid already has enough to render the header (name, description, version, repository, websiteUrl) — the only block waiting on the fetch is the full `server.json`. Instant render avoids a perceived loading spike on every icon click.

## Risks / Trade-offs

- **Modal width pressure**. Six data columns + radio + utility column + 420px sidebar inside an 800-wide popup. HF already runs in this budget without horizontal scroll, but the HF grid has five data columns vs MCP's six. Mitigation: validate visually; if tight, consider hiding less-critical columns while the sidebar is open (e.g. via `gridApi.setColumnsVisible`) — deferred unless it becomes a problem.
- **Extra round-trip per open**. The sidebar re-fetches the full server on every open. Acceptable per Decision 4; if flagged as slow, add an in-modal cache `Map<string, McpServerResponse>` keyed by `${name}@${version}`.
- **`CodeViewer` chrome mismatch with design**. Design shows chevron on the right; `CodeViewer` puts the chevron on the left. Trade-off accepted — reuse beats pixel parity.
- **Icons field on BE not modeled in FE**. `ServerDetail` has `icons?: List<Icon>` — the FE `McpServer` type omits it. Out of scope for this change but noted as known drift.
- **URL-as-link styling drift**. The `ExternalUrlCellRenderer` styles links using DIAL accent tokens. If the grid is ever embedded on a surface with different link styling, the renderer's visual weight may feel off. Mitigation: use existing text-accent-primary token, same as other link instances.
