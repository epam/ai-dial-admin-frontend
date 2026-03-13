## Context

The TryOut feature allows users to invoke a tool directly from the admin UI and see the response. It currently works for core toolsets (`ToolsetsApi` on `DIAL_ADMIN_API_URL`) and asset toolsets (`AssetsApi` on `DIAL_ADMIN_API_URL`). MCP container deployments display the same Tools tab via the shared `Tools` component, but the TryOut button is hidden behind a `!isMcpToolset` guard in `ToolHeader.tsx`.

The deployments backend (`DIAL_DEPLOYMENTS_API_URL`) already exposes `POST /api/v1/deployments/mcp/{deploymentId}/call-tool` with the same `{ name, arguments }` request/response shape used by the toolset call-tool endpoint.

## Goals / Non-Goals

**Goals:**
- Enable the TryOut button for MCP container tools
- Reuse the existing `TryOut` sidebar component with minimal changes
- Route MCP container tool calls through `ContainersApi` → deployments backend

**Non-Goals:**
- Changing the TryOut UI/UX
- Adding reactive container status monitoring (tab-level disable is sufficient)
- Supporting TryOut for non-MCP container types (NIM, INTERCEPTOR, ADAPTER)

## Decisions

### 1. Add a new code path in TryOut rather than abstracting a shared action

**Decision:** Add `containerId` and `isMcpToolset` props to `TryOut.tsx` and branch the `sendRequest` callback.

**Rationale:** The three existing paths (core toolset, asset toolset, MCP container) each call a different server action with slightly different parameters. A shared abstraction would add indirection without reducing complexity. A simple conditional branch matches the existing pattern (`isAssetToolset ? ... : ...`).

### 2. Add `callContainerTool` to `ContainersApi` (not `ToolsetsApi`)

**Decision:** The new API method lives in `ContainersApi` since the endpoint is on `DIAL_DEPLOYMENTS_API_URL`, not `DIAL_ADMIN_API_URL`.

**Rationale:** `ContainersApi` already owns all `/deployments/mcp/{id}/*` calls (tools, resources, prompts). Adding `call-tool` there follows the existing pattern.

### 3. Thread `containerId` through component props

**Decision:** Pass `containerId` from `Tools` → `ToolComponent` → `ToolHeader` → `TryOut`.

**Rationale:** `Tools.tsx` already receives `containerId` as a prop (used for fetching tools). The prop just needs to be forwarded down to the leaf components. No new context or state management needed.

## Risks / Trade-offs

- **[Container stops while user is on Tools tab]** → The backend validates RUNNING status and returns an error. `TryOut.tsx` already renders errors as `{ error: res.errorMessage }`. Acceptable UX for first iteration.
- **[Request body shape divergence]** → If the deployments backend `CallToolRequest` diverges from the toolset `call-tool` body in the future, the shared `TryOut` component would need further branching. Low risk since both follow the MCP spec `{ name, arguments }`.
