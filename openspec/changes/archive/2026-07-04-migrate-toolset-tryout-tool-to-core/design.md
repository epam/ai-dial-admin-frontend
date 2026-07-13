## Context

`ToolSetResourceController.callTool` (`POST /api/v1/toolset-resources/call-tool`) → `ToolSetResourceService.callTool` → `ToolCallService.callTool` uses `McpClientFactory` to build a real MCP Java SDK client pointed at `{coreClientUrl}/v1/toolset/{url}/mcp`, performs `initialize()`, then `callTool()`, per request — no persistent session, no BE-side credential injection (Core applies the toolset's stored auth server-side; the BE only forwards the admin bearer token). Request DTO: `CallToolResourceRequestDto{ toolSetPath: { path }, callToolRequest: McpSchema.CallToolRequest }`; response: raw `McpSchema.CallToolResult`.

The FE's `TryOut.tsx` already builds exactly this request shape (`{ toolSetPath: { path: toolSetName }, callToolRequest: { name, arguments } }`) and treats the response as opaque JSON (`res.success ? res.response : { error: res.errorMessage }`) — no FE-side parsing of the MCP result shape exists to preserve or break, which keeps this port's wire-contract obligation to "same shape in, same shape out," not "same shape internally."

Verified against the installed `@modelcontextprotocol/sdk@1.29.0` type definitions (not assumed from memory):
- `Client` (from `@modelcontextprotocol/sdk/client`): `new Client(clientInfo, options?)`, `connect(transport)` — performs the initialize handshake automatically — `callTool(params, resultSchema?, options?)`, `close()` (inherited from `Protocol`).
- `StreamableHTTPClientTransport` (from `@modelcontextprotocol/sdk/client/streamableHttp`): `new StreamableHTTPClientTransport(url: URL, { requestInit?: RequestInit })` — `requestInit.headers` is exactly where the bearer token goes; no `authProvider` needed since Core handles the toolset's own credentials, this transport only needs to authenticate as the admin.

## Goals / Non-Goals

**Goals**
- `tryOutAssetTool` for `ResourceType.TOOLSET` opens a short-lived MCP session against Core, issues one `callTool`, and returns the raw result — matching the admin BE's request/response contract exactly.
- No change to `TryOut.tsx` or any other try-out variant.

**Non-Goals**
- Application try-out-tool (deferred).
- Session reuse across calls (BE doesn't do this either — Non-goals in proposal).
- Any MCP capability beyond `callTool` (no resource listing, no prompts, no sampling) — this port only needs to reproduce what the BE's `ToolCallService` actually calls.

## Decisions

### D1 — A dedicated MCP session helper, not a `ToolsetOpsApi` method
`ToolsetOpsApi` (from `migrate-toolset-auth-discovery-import-to-core`) models plain Core REST passthroughs — one `fetch` in, one response out. An MCP session is a stateful client/transport lifecycle (construct transport → construct client → connect → call → close), a different shape of "operation" entirely. `callToolViaMcp(token, path, callToolRequest)` lives in its own module, `src/server/toolsets/mcp-client.ts`, built with plain `Client`/`StreamableHTTPClientTransport` rather than bolted onto the REST-shaped `CoreApi` hierarchy.

### D2 — URL and auth built the same way as every other toolset Core call
`v1/toolset/${encodeCorePath(RESOURCE_TYPE_PREFIX[TOOLSET] + path)}/mcp`, resolved against `DIAL_CORE_API_URL` into an absolute `URL` (required by `StreamableHTTPClientTransport`'s constructor, unlike the relative paths `BaseApi`'s `fetch`-based methods use internally). The bearer token is attached via `requestInit.headers`, reusing the existing `getAuthorizationHeader(token)` helper — the same one `BaseApi` itself uses, so auth stays consistent with every other Core call in this codebase.

### D3 — Every session is opened and closed within a single request; errors always close the client
```
const transport = new StreamableHTTPClientTransport(url, { requestInit: { headers } });
const client = new Client({ name: 'ai-dial-admin', version: '1' });
try {
  await client.connect(transport);
  return { success: true, response: await client.callTool(callToolRequest) };
} catch (error) {
  return { success: false, errorHeader: ..., errorMessage: ... };
} finally {
  await client.close();
}
```
This mirrors the BE's own per-request lifecycle (Context) — no pooling, no reuse, matching the admin tool's realistic call volume (a human clicking "Try out" in the UI, not a hot path).

## Risks / Trade-offs

- **[Risk] Per-request MCP handshake overhead** (new TCP/HTTP round-trip + initialize exchange for every single tool call) — accepted, since the BE did exactly the same thing and this is a low-volume, human-triggered UI action, not a hot path.
- **[Trade-off] New runtime dependency** (`@modelcontextprotocol/sdk`) — accepted per user decision, same category of trade-off as `jszip` earlier in this migration series.

## Migration Plan

1. Add `@modelcontextprotocol/sdk` to `package.json`.
2. Implement `callToolViaMcp` in `src/server/toolsets/mcp-client.ts` (D1–D3), with unit tests mocking the SDK's `Client`/`StreamableHTTPClientTransport` (verifying URL construction, header attachment, and that `close()` is called on both the success and error paths).
3. Branch `tryOutAssetTool` in `assets-toolsets/actions.ts` by `resourceType`.
4. Targeted test pass.

## Open Questions

None outstanding — dependency choice and scope (toolset-only) both confirmed with the user.
