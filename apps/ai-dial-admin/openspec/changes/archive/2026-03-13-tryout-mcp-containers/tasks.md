## 1. API Layer

- [x] 1.1 Add `CONTAINER_CALL_TOOL_URL` and `callContainerTool(containerId, body, token)` method to `src/server/deployments/containers.ts`
- [x] 1.2 Add `tryOutContainerTool(containerId, body)` server action to `src/app/actions/deployments.ts`

## 2. Component Wiring

- [x] 2.1 Add `containerId` prop to `TryOut` component (`src/components/Tools/Tool/TryOut.tsx`) and branch `sendRequest` to call `tryOutContainerTool` when `isMcpToolset` is true
- [x] 2.2 Remove `!isMcpToolset` guard in `ToolHeader` (`src/components/Tools/Tool/ToolHeader.tsx:63`) and pass `containerId` to `TryOut`
- [x] 2.3 Thread `containerId` prop through `Tool` component (`src/components/Tools/Tool/Tool.tsx`) to `ToolHeader`
- [x] 2.4 Pass `containerId` from `Tools` (`src/components/Tools/Tools.tsx`) into each `ToolComponent`

## 3. Testing & Quality

- [x] 3.1 Add unit tests for `callContainerTool` in `ContainersApi`
- [x] 3.2 Add unit tests for `TryOut` component covering the MCP container code path
- [x] 3.3 Run lint, format, and full test suite to verify no regressions
