## Why

The TryOut feature lets users test tool execution directly from the admin UI. It already works for core and asset toolsets, but is explicitly disabled for MCP container deployments (`isMcpToolset` guard), even though the same Tools tab component is shared. The deployments backend already exposes `POST /api/v1/deployments/mcp/{deploymentId}/call-tool` with the same `{ name, arguments }` request shape — the frontend just isn't wired up to use it.

## What Changes

- Wire the existing `TryOut` sidebar component to support MCP container deployments
- Add a `callContainerTool` method to `ContainersApi` hitting the deployments backend endpoint
- Add a `tryOutContainerTool` server action for the new API call
- Remove the `!isMcpToolset` guard that hides the TryOut button in `ToolHeader`
- Thread `containerId` through `Tools → Tool → ToolHeader → TryOut` so the TryOut component knows which container to call

## Non-goals

- No reactive container status checks (the Tools tab is already disabled when the container isn't RUNNING; backend also validates RUNNING status)
- No changes to the TryOut UI layout or UX (reuse as-is)
- No backend changes (endpoint already exists)

## Capabilities

### New Capabilities
- `tryout-mcp-tool`: Enable TryOut (call-tool) functionality for tools discovered on MCP container deployments

### Modified Capabilities

## Impact

- **Components**: `TryOut.tsx`, `ToolHeader.tsx`, `Tool.tsx`, `Tools.tsx` — prop additions and conditional logic
- **API layer**: `ContainersApi` (new method), `app/actions/deployments.ts` (new server action)
- **No breaking changes**: Toolset TryOut behavior is unchanged; this only adds a new code path for MCP containers
