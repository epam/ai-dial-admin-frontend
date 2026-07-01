## 1. Fix the Change Tool modal selection

- [x] 1.1 In `apps/ai-dial-admin/src/components/TestSuites/Modals/Create/McpTool.tsx`, rename the `initialToolName` prop to `selectedToolName` (update the `Props` interface and the `selectedId={...}` binding passed to `RadioSelectGrid`).
- [x] 1.2 In `apps/ai-dial-admin/src/components/TestSuites/Modals/ChangeMcpToolModal/ChangeMcpToolModal.tsx`, pass the live selection to the picker: `selectedToolName={pendingTool?.name ?? testSuite.toolRef?.name}` so the radio reflects the pending tool and clears the previous one on each pick.
- [x] 1.3 In `apps/ai-dial-admin/src/components/TestSuites/Modals/Create/CreateTestSuite.tsx`, update the `McpTool` call site to use the renamed `selectedToolName` prop (value stays `testSuite.toolRef?.name`); confirm no other consumers reference `initialToolName`.

## 2. Tests

- [x] 2.1 Added dedicated `apps/ai-dial-admin/src/components/TestSuites/Modals/ChangeMcpToolModal/tests/ChangeMcpToolModal.spec.tsx` (the `McpMethodContent` spec fully mocks the modal, so selection behavior can't be asserted there). Covers: saved tool checked on open; picking a different tool moves the checked radio; Save applies the picked tool; Save disabled with no selection. Follows `.claude/rules/testing.md`.

## 3. Quality checks

- [x] 3.1 Run `npm run lint`, `npm run format`, and `npm run test` from `apps/ai-dial-admin/` (or repo root per project config); resolve all failures. — Lint clean on the 3 source files; Prettier clean; full `TestSuites` suite green (458/458), incl. new `ChangeMcpToolModal` spec.
- [ ] 3.2 Run the `spec-browser-verify` skill for this change against the running local app (local stack up, auth disabled) to verify the `change-tool-modal-selection` scenarios via the spec-verification-gate sub-agent; resolve any `fail` verdicts before completion. — BLOCKED: Playwright MCP server not connected in this environment (`mcp__playwright__browser_*` tools unavailable). All 4 scenarios reported `blocked` (setup, not defect). Retest all 4 once Playwright MCP is exposed.
