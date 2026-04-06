## 1. Models and API layer

- [x] 1.1 Extend `src/models/evaluation/deployment.ts`: add `ToolsetDeployment extends Deployment` interface (`transport?: string`, `allowedTools?: string[]`) and `ToolDefinition` interface (`name`, `description?`, `inputSchema`, `outputSchema?`)
- [x] 1.2 Extend `src/models/evaluation/test-suite.ts`: add `suiteType?: 'DEPLOYMENT' | 'MCP_TOOL'` to `TestSuite`; add interfaces `McpDeploymentRef`, `ToolRef`, `ArgumentTemplate`
- [x] 1.3 Extend `src/server/eval/test-suites-api.ts`: add optional `type` and `interfaceFilter` params to `getDeployments`; add `getDeploymentTools(deploymentType, deploymentId, token)` method calling `GET /api/v1/deployments/{type}/{id}/tools → ToolDefinition[]`; add `DEPLOYMENT_TOOLS_URL` constant
- [x] 1.4 Extend `src/app/[lang]/test-suites/actions.ts`: update `getDeployments` signature to accept optional filter params; add `getDeploymentTools(deploymentType, deploymentId)` server action

## 2. i18n keys

- [x] 2.1 Add new keys to `src/constants/i18n.ts` `TestSuitesI18nKey`: `Mcp`, `Tool`, `SuiteType`, `SelectTool`, `ToolArguments`, `ToolArgumentsPreview`, `ToolCallPreview`, `ChangeTool`, `ChangeToolset`, `NoToolsAvailable`, `NoArgumentsDefined`, `ToolCallSucceeded`, `ToolCallFailed`, `ToolOutputSchema`
- [x] 2.2 Add corresponding English values to `src/locales/en.ts`

## 3. Test suites list column

- [x] 3.1 Add `suiteType` column to `TEST_SUITES_COLUMN` in `src/constants/grid-columns/grid-columns.tsx` with `evalStringFilter` and `hide: false`
- [x] 3.2 Update `Application` column `valueGetter` in `TEST_SUITES_COLUMN` to fall back to `params.data?.mcpDeploymentRef?.name` when `deploymentRef?.name` is absent

## 4. Create wizard — symmetric 3-step structure

- [x] 4.1 Create `src/components/TestSuites/Modals/Create/McpTargets.tsx`: MCP deployment grid only (no tool picker); calls `getDeployments({ interfaceFilter: 'mcp' })`; grid columns: Display Name, ID, Type (`$type`), Transport, Created At; single-row-selection; fires `onSelect(deployment)` on row click; accepts `initialDeploymentId` for pre-selection; context-unaware (no modal/wizard coupling)
- [x] 4.2 Rename `Applications.tsx` → `Target.tsx`: add `DialTabs` with "Applications" | "MCP" tabs; Applications tab renders existing grid (unchanged); MCP tab renders `McpTargets`; on Applications selection sets `suiteType: 'DEPLOYMENT'` + `deploymentRef`, clears MCP fields; on MCP selection sets `suiteType: 'MCP_TOOL'` + `mcpDeploymentRef` (from `deployment.$type`/`deploymentId`/`displayName`), clears HTTP fields + `toolRef`
- [x] 4.3 Create `src/components/TestSuites/Modals/Create/McpTool.tsx`: tool picker for a given MCP deployment; calls `getDeploymentTools(deployment.type, deployment.id)` on mount; displays tool grid with columns: Tool Name, Description, Input Schema field count; single-row-selection; fires `onSelect(tool)` on row click; accepts `initialToolName` for pre-selection; shows loading/empty/error states; context-unaware
- [x] 4.4 Update `src/components/TestSuites/Modals/Create/constants.ts`: `TEST_SUIT_STEPS` always produces 3 steps; step 3 label is `"Method"` when `suiteType === 'DEPLOYMENT'`, `"Tool"` when `suiteType === 'MCP_TOOL'`; step 3 validity: endpoint selected for DEPLOYMENT, toolRef set for MCP_TOOL
- [x] 4.5 Update `src/components/TestSuites/Modals/Create/CreateTestSuite.tsx`: step 3 renders `Methods.tsx` for DEPLOYMENT (existing), `McpTool.tsx` for MCP_TOOL (new); `McpTool` `onSelect` sets `testSuite.toolRef`; pass `suiteType`-aware step list from updated `constants.ts`

## 5. ArgumentTemplate editor

- [x] 5.1 Create `src/components/TestSuites/ArgumentTemplate/utils.ts`: `inferFieldMode(value): 'binding' | 'constant'` (checks `${{...}}` pattern); `buildArgumentsFromTable(rows): Record<string, unknown>`; `buildInitialArguments(inputSchema): Record<string, unknown>` (all fields default to Binding with empty placeholder); `extractBindingColumn(value: string): string` (parses `${{colName}}` → `colName`)
- [x] 5.2 Create `src/components/TestSuites/ArgumentTemplate/ArgumentTemplate.tsx`: renders header with `DialSwitch` JSON toggle; in table mode renders AG Grid table via `getArgumentColumns`; in JSON mode renders `EntityJsonEditor` on `argumentTemplate.arguments`; sync between modes per design D3; calls `onChange` on every edit
- [x] 5.3 Add `src/components/TestSuites/ArgumentTemplate/columns.tsx` (or `utils/columns.ts`): `getArgumentColumns(toolRef, testCaseSchema, onChange)` — AG Grid ColDef array with Argument (read-only, required fields show `*`), Type badge renderer, Mode toggle (EditableCellRenderer pattern with `editable: false` + `valueGetter`), Value editor (type-aware EditableCellRenderer: text input for string, number for integer/number, DialSwitch for boolean, truncated-JSON-preview + edit-icon for object/array — clicking edit icon opens `DialPopup` Monaco editor with Apply/Cancel)
- [x] 5.4 Create `src/components/TestSuites/View/McpMethodContent.tsx`: tool call header (deployment name + tool name badges), "Change Toolset / Tool" button, `ArgumentTemplate` component, Tool Output Schema section (read-only Monaco when `toolRef.outputSchema` present), `TryOutButton`
- [x] 5.5 Update `src/components/TestSuites/View/MethodTabContent.tsx`: add `isMcp` branch — render `McpMethodContent` when `testSuite.suiteType === 'MCP_TOOL'`, existing content otherwise

## 6. Change Tool modal

- [x] 6.1 Create `src/components/TestSuites/Modals/ChangeMcpToolModal/ChangeMcpToolModal.tsx`: `DialPopup` composing `McpTargets` (deployment grid, `initialDeploymentId={mcpDeploymentRef.id}`) and `McpTool` (tool picker, shown once a deployment is selected, `initialToolName` set only when pending deployment matches current `mcpDeploymentRef.id`); modal holds `pendingDeployment` + `pendingTool` in local state via `onSelect` callbacks; "Save" disabled until `pendingTool` set; Save commits `mcpDeploymentRef` from pending deployment, `toolRef` from pending tool, `argumentTemplate` reset via `buildInitialArguments(pendingTool.inputSchema)`; Cancel discards local state; neither `McpTargets` nor `McpTool` requires an `isModal` prop

## 7. Try-it-out MCP branch

- [x] 7.1 Update `src/components/TestSuites/RequestTemplate/components/TryOut.tsx`: derive `isMcp = testSuite.suiteType === 'MCP_TOOL'`; replace "Request Body Preview" label with "Tool Arguments Preview" when `isMcp`; replace `endpointRef.method/relativeUrlPattern` line with `TOOL CALL deployment:tool` when `isMcp`; replace `DialAlert` status logic: use `response.isError` boolean for MCP, `response.statusCode` for DEPLOYMENT

## 8. Tests

- [x] 8.1 Unit tests for `src/components/TestSuites/ArgumentTemplate/utils.ts`: `inferFieldMode`, `buildArgumentsFromTable`, `buildInitialArguments`, `extractBindingColumn`
- [x] 8.2 Component tests for `ArgumentTemplate.tsx`: table renders from inputSchema; JSON toggle switches mode; Binding mode writes `${{col}}` placeholder; Constant mode writes literal; object type forced to Constant
- [x] 8.3 Component tests for `McpMethodContent.tsx`: renders tool call header; renders ArgumentTemplate; hides output schema when absent; shows output schema when present
- [x] 8.4 Component tests for `TryOut.tsx` MCP branch: correct labels shown for MCP suite; `isError: true` renders error badge; `isError: false` renders success badge; DEPLOYMENT suite unchanged

## 9. Quality

- [x] 9.1 Run `npm run lint` and fix any issues
- [x] 9.2 Run `npm run format:write` and commit formatting changes
- [x] 9.3 Run `npm run test` from `apps/ai-dial-admin/` and confirm all tests pass
