## Why

In the **Change Tool** modal (Evaluation → Test suite → MCP suite → Method tab → "Change tool"), clicking a tool does not visually fill its radio button, so users get no confirmation of what they selected before saving (issue #3752). The selection is functionally captured (Save enables and works), but the missing visual feedback is confusing.

## What Changes

- The Change Tool modal will visually mark the currently-selected tool's radio button as checked, updating immediately when the user picks a different tool.
- Fix is scoped to `ChangeMcpToolModal`: the tool picker's `selectedId` will be driven by the pending selection (falling back to the test suite's saved tool) instead of being frozen at the saved tool name.
- No behavior change for the Create Test Suite flow, `Target`, or other `RadioSelectGrid` consumers, which already round-trip `selectedId` correctly.

## Capabilities

### New Capabilities
- `change-tool-modal-selection`: Visual selection state of the tool picker within the Change Tool modal for MCP test suites.

### Modified Capabilities
<!-- None: no existing consolidated spec covers this behavior. -->

## Impact

- Code: `apps/ai-dial-admin/src/components/TestSuites/Modals/ChangeMcpToolModal/ChangeMcpToolModal.tsx` (single-file fix). Optional clarity rename of the `initialToolName` prop on `TestSuites/Modals/Create/McpTool.tsx` to `selectedToolName` (also used by `CreateTestSuite.tsx`).
- Tests: `ChangeMcpToolModal` / `McpMethodContent` component tests.
- No API, dependency, or shared-grid (`RadioSelectGrid`) changes. Cosmetic, no functional/data impact.
