## Context

The EF backend fully implements MCP toolset evaluation (suite types `DEPLOYMENT` and `MCP_TOOL`, toolset listing, tool discovery via `GET /deployments/{type}/{id}/tools`, MCP-extended try-it-out). The FE TestSuite entity was built around HTTP-only assumptions: `TestSuite` model lacks MCP fields, `getDeployments` fetches all deployments without type filtering, the create wizard always ends at a Methods step, and `MethodTabContent` always renders `RequestTemplate` + `EndpointSchema`.

`suiteType` is immutable after creation on the backend — this drives the FE architecture. Once set, the suite's entire UX shape is fixed: method tab, try-it-out, input bindings all differ by type.

## Goals / Non-Goals

**Goals:**
- Allow creating MCP_TOOL test suites via the create wizard
- View and edit `argumentTemplate` (Binding/Constant per tool input field + JSON editor escape hatch) for existing MCP suites
- Try-it-out working for MCP suites
- `suiteType` column and filter in the test suites list
- All existing DEPLOYMENT suite flows unchanged

**Non-Goals:**
- Changing `suiteType` on an existing suite (immutable by design)
- MCP-specific response column suggestion UI (BE handles outputSchema-derived paths; FE renders them through existing response columns editor)
- TestCaseSchema changes (schema fields are type-agnostic)
- Metrics/Runs tab changes

## Decisions

### D1: suiteType as the single discriminator throughout FE

All conditional rendering keys off `testSuite.suiteType === 'MCP_TOOL'`. No parallel flags, no derived state. Components that don't care about suite type (TestCases, Metrics, Runs) receive no changes.

`suiteType` defaults to `'DEPLOYMENT'` for existing suites where the field is absent (backwards compatibility with pre-migration data returned by the API).

### D2: Create wizard — symmetric 3-step structure for both suite types

Both paths use the same 3-step shape:

```
DEPLOYMENT:  Properties → Target (pick application)      → Method (pick HTTP endpoint)
MCP_TOOL:    Properties → Target (pick MCP deployment)   → Tool   (pick tool)
```

The Target step gains "Applications" | "MCP" tabs. Selecting from the MCP tab sets `suiteType: 'MCP_TOOL'` and `mcpDeploymentRef` — no tool picker inline. Tool selection happens exclusively in step 3.

Step 3 is always present. Its label adapts ("Method" for DEPLOYMENT, "Tool" for MCP_TOOL). Its content branches on `suiteType`: existing `Methods.tsx` for DEPLOYMENT, new `McpTool.tsx` for MCP_TOOL.

`suiteType` is derived from the tab active when a deployment is selected — never an explicit user-facing input. Target step validity = any deployment selected. Tool/Method step validity = tool or endpoint selected.

Benefits over inline picker: Target step stays focused (one grid, one selection); step validation is consistent across both types; `McpTool.tsx` and `Methods.tsx` are natural parallels; `ChangeMcpToolModal` composition is clean (see D4).

### D3: ArgumentTemplate builder — table + JSON toggle

The `ArgumentTemplate` component renders a table driven by `toolRef.inputSchema.properties`. Each row:
- **Argument** — field name from schema (read-only)
- **Type** — type badge from `inputSchema.properties[name].type`
- **Mode** — Binding/Constant toggle; `object` and `array` types forced to Constant (no toggle rendered, static "Constant" label)
- **Value** — Binding mode: column selector (picks from `testSuite.testCaseSchema` field names); Constant mode: text input for `string`, number input for `integer`/`number`, checkbox/switch for `boolean`, truncated JSON preview + edit icon for `object`/`array` (click opens `DialPopup` Monaco with Apply/Cancel)

JSON toggle (DialSwitch) in the component header switches to a full Monaco `EntityJsonEditor` editing `argumentTemplate.arguments` directly. State flows: table writes → produce `argumentTemplate`; JSON editor writes → produce `argumentTemplate`; both update via the same `onChange` callback.

**Binding mode output**: when a field is in Binding mode with column `colName`, the corresponding `argumentTemplate.arguments[field]` value becomes `${{colName}}`. When a default value is present in `toolRef.inputSchema`, it becomes `${{colName:defaultValue}}`.

### D4: "Change Tool" — modal composes McpTargets + McpTool together

`McpMethodContent` shows a "Change Toolset / Tool" button that opens `ChangeMcpToolModal`. The modal allows changing both the deployment and the tool in one screen (no step navigation inside the modal). It composes two context-unaware components:

```
ChangeMcpToolModal
  ├── McpTargets  (deployment grid, pre-selects current mcpDeploymentRef)
  └── McpTool     (appears after deployment selected, pre-selects current tool
                   only when deployment matches current mcpDeploymentRef.id)
  └── footer: Save (disabled until tool selected) / Cancel
```

Both `McpTargets` and `McpTool` are context-unaware — they receive `initialDeploymentId`/`initialToolName` and fire `onSelect` callbacks. The modal holds `pendingDeployment` + `pendingTool` in local state. Save commits both to the suite; Cancel discards.

This is the direct parallel of `ChangeMethodModal` (which wraps `Methods.tsx`). The same `McpTargets.tsx` and `McpTool.tsx` used in the wizard steps are reused here without modification.

### D5: TryOut MCP branch — minimal divergence

`TryOut.tsx` adds a `isMcp` derived boolean (`testSuite.suiteType === 'MCP_TOOL'`). The actual server action call (`tryOutTestSuite`) is unchanged — the BE routes by suite type internally. Only labels and response status rendering differ:

| | DEPLOYMENT | MCP_TOOL |
|---|---|---|
| Preview label | "Request Body Preview" | "Tool Arguments Preview" |
| Method line | `method relativeUrl` | `TOOL CALL deployment:tool` |
| Status badge | `response.statusCode` | `response.isError ? Error : Success` |

The `Variables` table, send/restart buttons, Request/Response collapsibles all remain identical.

### D6: Deployment model — tagged union, not single interface

`Deployment` stays as the base interface. `ToolsetDeployment extends Deployment` adds `transport?: string` and `allowedTools?: string[]`. Components receiving `Deployment[]` still work via the base type; toolset-specific fields are accessed via `(d as ToolsetDeployment)` narrowing where needed in toolset-specific components.

### D7: getDeployments filtering — client-side optional params

`getDeployments(type?, interfaceFilter?)` passes query params to the API only when provided. The existing call sites (MethodTabContent, CreateTestSuite) pass no params → unchanged behavior. The new MCP tab passes `interface=mcp` to get all MCP-capable deployments (toolsets + applications with MCP interface) in a single call.

## Risks / Trade-offs

**[Risk] argumentTemplate diverges from toolRef.inputSchema on tool change** → `ChangeMcpToolModal` on confirm resets `argumentTemplate` to a fresh template derived from the new tool's `inputSchema` (all fields default to Binding mode with empty binding). The user must reconfigure bindings after changing the tool.

**[Risk] JSON editor and table editor state sync** → switching modes rewrites `argumentTemplate.arguments` entirely from table state (to JSON) or from parsed JSON (to table). If the JSON is invalid at switch time, table mode is blocked (shows parse error, keeps JSON mode). Same pattern as `BodyTab` in RequestTemplate.

**[Risk] toolRef.inputSchema missing or empty** → ArgumentTemplate table renders empty with a "No arguments defined" empty state. JSON editor still works. No crash.

**[Risk] Existing suites without suiteType field** → normalized to `'DEPLOYMENT'` at read time, either in the model transformation layer or via `?? 'DEPLOYMENT'` at every read site. Prefer a single normalization point in `getTestSuite` response mapping.

## Resolved Questions

- **OQ1 (resolved)**: The MCP tab SHALL include both toolsets (`$type: 'dial-toolset'`) and MCP-capable applications (`$type: 'dial-application'`), fetched via `?interface=mcp`. The tab is labeled "MCP" (not "Toolsets"). A "Type" column in the grid distinguishes them. `mcpDeploymentRef.type` is set from the deployment's `$type` field. The tool picker and invocation path are identical for both types (same MCP proxy endpoint on the backend).
- **OQ2 (resolved)**: After "Change Tool", `argumentTemplate` is always reset to a fresh template derived from the new tool's `inputSchema` (all fields in Binding mode, empty binding). The user must reconfigure bindings. Preserving overlapping fields is deferred to a future iteration.
