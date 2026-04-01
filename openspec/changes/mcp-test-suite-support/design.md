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

### D2: Create wizard — tab toggle inside Target step (Option B)

The Target step gains "Applications" | "Toolsets" tabs rather than adding a new step. Selecting from the Toolsets tab:
1. Sets `suiteType: 'MCP_TOOL'` on the in-progress suite state
2. Shows an inline tool picker below the toolsets grid (fetches `getDeploymentTools` on selection)
3. Sets `mcpDeploymentRef` + `toolRef` on the suite state

`suiteType` is derived from the tab active at time of selection — it is never an explicit user-facing input.

For step navigation: after Target selection, a toolset selection skips to finish (no Methods step); an application selection proceeds to Methods as today. The stepper implements this by checking `testSuite.suiteType` in `TEST_SUIT_STEPS`.

### D3: ArgumentTemplate builder — table + JSON toggle

The `ArgumentTemplate` component renders a table driven by `toolRef.inputSchema.properties`. Each row:
- **Argument** — field name from schema (read-only)
- **Type** — type badge from `inputSchema.properties[name].type`
- **Mode** — Binding/Constant toggle; `object` and `array` types forced to Constant (no toggle rendered, static "Constant" label)
- **Value** — Binding mode: column selector (picks from `testSuite.testCaseSchema` field names); Constant mode: text input for `string`, number input for `integer`/`number`, checkbox/switch for `boolean`, inline Monaco for `object`/`array`

JSON toggle (DialSwitch) in the component header switches to a full Monaco `EntityJsonEditor` editing `argumentTemplate.arguments` directly. State flows: table writes → produce `argumentTemplate`; JSON editor writes → produce `argumentTemplate`; both update via the same `onChange` callback.

**Binding mode output**: when a field is in Binding mode with column `colName`, the corresponding `argumentTemplate.arguments[field]` value becomes `${{colName}}`. When a default value is present in `toolRef.inputSchema`, it becomes `${{colName:defaultValue}}`.

### D4: "Change Tool" — reuse Target step content in a modal

`McpMethodContent` shows a "Change Toolset / Tool" button that opens a `ChangeMcpToolModal`. The modal renders the same `Toolsets.tsx` content (tabs: Applications grayed out or hidden, only Toolsets tab active). On confirm, `mcpDeploymentRef`, `toolRef`, and `argumentTemplate` are all replaced. This is analogous to `ChangeMethodModal` for HTTP suites.

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

`getDeployments(type?, interfaceFilter?)` passes query params to the API only when provided. The existing call sites (MethodTabContent, CreateTestSuite) pass no params → unchanged behavior. The new Toolsets tab passes `type=dial-toolset`.

## Risks / Trade-offs

**[Risk] argumentTemplate diverges from toolRef.inputSchema on tool change** → `ChangeMcpToolModal` on confirm resets `argumentTemplate` to a fresh template derived from the new tool's `inputSchema` (all fields default to Binding mode with empty binding). The user must reconfigure bindings after changing the tool.

**[Risk] JSON editor and table editor state sync** → switching modes rewrites `argumentTemplate.arguments` entirely from table state (to JSON) or from parsed JSON (to table). If the JSON is invalid at switch time, table mode is blocked (shows parse error, keeps JSON mode). Same pattern as `BodyTab` in RequestTemplate.

**[Risk] toolRef.inputSchema missing or empty** → ArgumentTemplate table renders empty with a "No arguments defined" empty state. JSON editor still works. No crash.

**[Risk] Existing suites without suiteType field** → normalized to `'DEPLOYMENT'` at read time, either in the model transformation layer or via `?? 'DEPLOYMENT'` at every read site. Prefer a single normalization point in `getTestSuite` response mapping.

## Open Questions

- **OQ1**: Should the Toolsets tab in the create wizard also show MCP-capable applications (`$type: 'dial-application'` with MCP interface)? The BE supports this via `?interface=mcp`. Out of scope for v1 per proposal, but the `Target.tsx` tab structure should accommodate it without rework.
- **OQ2**: After "Change Tool", should the old `argumentTemplate` be preserved if the new tool has overlapping field names? Decision deferred — v1 resets to fresh template on tool change (simpler, safe).
