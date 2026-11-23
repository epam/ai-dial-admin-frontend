## Why

The Tools tab can show no tools for a runner-backed application until the user changes the “Use all available tools” switch. That switch can also write an application-level `mcp` object, which Core rejects for schema-based applications: their MCP configuration belongs to the runner schema.

## What Changes

- For runner-backed applications, present the Tools tab as a read-only list of all currently usable tools, respecting the runner's effective allowlist. An empty allowlist means no Core name filtering.
- Keep search and the existing Try Out experience for usable discovered tools, subject to existing permissions and availability. Hide the use-all switch, tool management, and tool-type filters; browsing and searching must not modify the application.
- Apply this behavior to runner-backed applications across the relevant application views, even when runner details are still loading or cannot be matched immediately. Reuse the existing shared Tools and MCP container presentation patterns.
- Preserve existing Tools tab behavior for direct-MCP applications and all toolsets.

## Capabilities

### New Capabilities

- `runner-application-tools`: Read-only discovery, search, and Try Out for usable tools on runner-backed applications.

### Modified Capabilities

None.

## Non-goals

- Changing application create, update, import, or export payloads to omit `mcp`, `endpoint`, `function`, or other fields. Consequently, this change does not guarantee that an existing schema-based application carrying a forbidden top-level field can be saved.
- Adding per-application tool selection, changing runner allowlists, or changing Core's MCP enforcement.
- Changing toolset or non-runner application management, or broadening Try Out permissions.

## Impact

- The shared `components/Tools/Tools.tsx` and its tool-list helpers, application tab wiring, and their tests are affected. Runner identification must not depend solely on successfully matching a loaded runner; direct-MCP applications and toolsets share this component and need regression coverage.
- Tool discovery may need to use or adapt Core's filtered, paginated tools contract so the displayed list reflects the effective runner allowlist rather than only the first unfiltered upstream page. Existing notification and access behavior must remain appropriate to the chosen contract.
- No Core or application-save API contract change is proposed.
