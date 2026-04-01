## Why

The Evaluation Framework backend now supports MCP (Model Context Protocol) toolset evaluation — test suites can target a DIAL toolset + tool instead of an HTTP deployment. The frontend has no awareness of this: the `TestSuite` model, create wizard, method tab, try-it-out panel, and list view all assume HTTP-only suites, making it impossible to create or manage MCP_TOOL suites from the UI.

## What Changes

- **TestSuite model extended** — add `suiteType` discriminator (`DEPLOYMENT` | `MCP_TOOL`), `mcpDeploymentRef`, `toolRef`, `argumentTemplate` fields
- **Deployment model extended** — add `ToolsetDeployment` subtype (`$type: 'dial-toolset'`) with `transport` and `allowedTools`; add `ToolDefinition` interface for tool schema listing
- **API client extended** — `getDeployments` gains optional `type`/`interface` query params; new `getDeploymentTools` method calling `GET /api/v1/deployments/{type}/{id}/tools`
- **Create wizard — Target step** — gains "Applications" | "Toolsets" tab toggle; Toolsets tab shows filtered grid + inline tool picker after selection; suite type is derived from selection (immutable after creation)
- **Create wizard — step flow** — MCP_TOOL suites skip the Methods step (tool is selected in Target); `suiteType` set during wizard, never editable after
- **Method tab** — branches on `suiteType`: DEPLOYMENT shows existing RequestTemplate + EndpointSchema (unchanged); MCP_TOOL shows new ArgumentTemplate builder + tool info header + tool output schema
- **ArgumentTemplate builder** — table view (one row per tool input schema field: argument name, type badge, Binding/Constant toggle, value editor) with JSON editor toggle switching to Monaco editor
- **Try-it-out** — branches on `suiteType` for labels and response rendering: MCP uses "Tool Arguments Preview" label and `isError` boolean for status; DEPLOYMENT unchanged
- **Test suites list** — add `suiteType` column with filter support

## Capabilities

### New Capabilities

- `mcp-target-selection`: Create-wizard target step with Applications/Toolsets tab toggle, toolset grid filtered by `type=dial-toolset`, inline tool picker after toolset selection, deriving `suiteType`/`mcpDeploymentRef`/`toolRef` from selection
- `argument-template-editor`: Table-based argument template editor driven by `toolRef.inputSchema`; per-field Binding/Constant toggle (object/array fields forced to Constant); JSON editor toggle for raw `argumentTemplate.arguments` editing; "Change Tool" modal to replace `mcpDeploymentRef`+`toolRef` on existing MCP suites
- `mcp-try-it-out`: Try-it-out panel variant for MCP_TOOL suites — same variables/send flow but MCP-specific labels ("Tool Arguments Preview", "TOOL CALL" display), `isError`-based response status badge

### Modified Capabilities

- `test-suite-list`: Add `suiteType` column with equals filter; `Application` column value getter falls back to `mcpDeploymentRef.name` for MCP suites

## Impact

### Code
- **Modified models**: `src/models/evaluation/test-suite.ts`, `src/models/evaluation/deployment.ts`
- **Modified API**: `src/server/eval/test-suites-api.ts` — new `getDeploymentTools`, updated `getDeployments` signature
- **Modified actions**: `src/app/[lang]/test-suites/actions.ts` — expose `getDeploymentTools`, optional params on `getDeployments`
- **Modified components**:
  - `TestSuites/Modals/Create/CreateTestSuite.tsx` — step flow branching
  - `TestSuites/Modals/Create/Applications.tsx` → `Target.tsx` (add Toolsets tab)
  - `TestSuites/View/MethodTabContent.tsx` — suiteType branch
  - `TestSuites/RequestTemplate/components/TryOut.tsx` — suiteType branch
  - `constants/grid-columns/grid-columns.tsx` — suiteType column
  - `constants/i18n.ts` + `locales/en.ts` — ~15 new keys
- **New components**:
  - `TestSuites/Modals/Create/Toolsets.tsx` — toolset+tool selection step content
  - `TestSuites/ArgumentTemplate/ArgumentTemplate.tsx` — table/JSON editor with toggle
  - `TestSuites/ArgumentTemplate/ArgumentField.tsx` — single row renderer
  - `TestSuites/View/McpMethodContent.tsx` — MCP method tab content

### APIs consumed (already implemented on BE)
- `GET /api/v1/deployments?type=dial-toolset` — list toolsets
- `GET /api/v1/deployments/{type}/{id}/tools` — list tools for a deployment
- `POST/PUT /api/v1/test-suites` — extended with MCP fields
- `POST /api/v1/try-it-out/test-suites/{id}` — works for both suite types

### Non-goals
- MCP-specific response column suggestions (outputSchema-derived paths) — BE sends these already; FE rendering unchanged
- Test case schema management changes — schema fields remain type-agnostic
- Metrics/Runs tab changes — no changes needed
