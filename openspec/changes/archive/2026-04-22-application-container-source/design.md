## Context

Applications currently support two source types: ENDPOINTS (direct URLs) and SCHEMA (app runner). `Containers.tsx` already handles the CONTAINER branch for Models, Adapters, and Interceptors via `SourceField.tsx`. `ApplicationEndpoint.tsx` already handles the dual chat+MCP UI for the ENDPOINTS branch. The BE `ApplicationContainerSourceDto` carries four fields: `containerId`, `containerName`, `completionEndpointPath`, `mcpEndpointPath` — the last field is missing from the FE's `SOURCE_FIELD` struct. `getApplicationContainers()` action exists and is callable but not yet wired into the Applications source UI.

## Goals / Non-Goals

**Goals:**
- Add CONTAINER as a third source option for Applications
- Reuse `Containers.tsx` (widened generic) and `ApplicationEndpoint.tsx` (extended with `prefix` prop) — no new component files
- Chat endpoint locked on (disabled checkbox) in CONTAINER mode; MCP endpoint optional (interactive checkbox)
- Container URL displayed as a read-only prefix alongside path inputs
- "Create Application" shortcut from the Application Containers list

**Non-Goals:**
- No changes to ENDPOINTS or SCHEMA branches
- No AssetApp changes
- No validation changes (`!!source.containerId` already covers CONTAINER)
- No BE changes

## Decisions

### D1 — Reuse `ApplicationEndpoint.tsx` via `prefix` prop rather than a new component

**Decision**: Add `prefix?: string` to `ApplicationEndpoint.tsx`. When present, the component renders in CONTAINER mode: chat checkbox disabled (locked on), MCP checkbox interactive, inputs are path fields, writes go to `source.completionEndpointPath`/`source.mcpEndpointPath`.

**Alternatives considered**:
- New `ApplicationContainerEndpoints.tsx` — rejected: duplicates ~80% of ApplicationEndpoint logic (MCP config section, checkbox toggle, transport select). Single component with a mode flag is less code and easier to test.
- Conditional rendering in `Containers.tsx` itself — rejected: mixes endpoint-editing concerns into the container-selector component.

**Rationale**: One component, one place to maintain the chat+MCP editing logic. The `prefix` prop is a natural signal: "you have a base URL, show paths instead of full URLs".

### D2 — Chat checkbox locked on; MCP checkbox interactive

**Decision**: In CONTAINER mode, chat checkbox is `checked={true}` + `disabled={true}`. MCP checkbox is interactive (user can check/uncheck). When MCP is unchecked: `source.mcpEndpointPath = null`, `entity.mcp = undefined`.

**Rationale**: The BE `ContainerEndpointResolver` always resolves `application.endpoint` from the container URL (blank `completionEndpointPath` maps to container URL directly) — there is no way to suppress the chat endpoint. MCP, however, can be omitted: sending `mcp: null` results in a bare MCP endpoint with no transport config, which is semantically equivalent to "no user-configured MCP". This aligns with how the ENDPOINTS branch treats an unchecked MCP.

### D3 — Widen `Containers.tsx` generic rather than fork

**Decision**: Change `<T extends DialInterceptor | DialModel>` to `<T extends DialInterceptor | DialModel | DialApplication>`. Add an Application-specific branch in `onSelect` (skip auto-path logic) and in the sub-component render (render `ApplicationEndpoint` with `prefix` instead of `Endpoints`).

**Rationale**: All container selection mechanics (modal, display name fetch, "open in new tab", running-status filter) are identical across entity types. Forking would duplicate ~120 lines for no benefit.

### D4 — `selectedContainer.url` as the prefix value

**Decision**: The `Container` model already has `url?: string` populated by the deployments API. After `onSelect` resolves the chosen container, `selectedContainer.url` is passed as `prefix` to `ApplicationEndpoint`. No extra fetch needed.

**Rationale**: The container list is already fetched at mount. The URL is part of the same payload.

### D5 — "Create Application" in ApplicationContainers HeaderButtons uses `initialValues`

**Decision**: Add a "Create Application" action to `HeaderButtons.tsx` for the ApplicationContainers list that navigates to the Application create route with `initialValues = { source: { $type: CONTAINER, containerId, containerName } }`. The existing `!initialValues` guard in `DeploymentProperties.tsx` already hides the SourceField picker on the create form when `initialValues` is present.

**Rationale**: No new UI pattern — `initialValues` pre-fill is already used by other entities (e.g., creating a Model from a container). The create form shows only name/description fields; the source is pre-set and locked.

## Risks / Trade-offs

- **BE always sets `mcp.endpoint` even when `mcpEndpointPath` is null** → The resolver maps blank paths to the container URL, so a "disabled MCP" will still have `mcp.endpoint = containerUrl` on the BE side. This is a BE behaviour the FE cannot suppress. Risk is low — the transport config fields are null, and the container URL endpoint is benign for a minimal MCP object. Mitigation: document in the spec scenarios.

- **`container.url` may be undefined** → The `url` field on `Container` is optional. If the selected container has no URL (edge case for non-running containers), the prefix would be an empty string or undefined. Mitigation: `Containers.tsx` already filters to `status === 'running'`; running containers always have a resolved URL.

- **`Containers.tsx` generic widening may expose type errors** → Adding `DialApplication` to the generic constraint may surface TypeScript errors in existing code paths that assume the entity only has Model/Interceptor fields. Mitigation: the Application-specific branch is guarded by an `isDialApplication` type guard, keeping the existing paths unchanged.
