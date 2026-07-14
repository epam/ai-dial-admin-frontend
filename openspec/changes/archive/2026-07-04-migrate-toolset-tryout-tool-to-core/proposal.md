## Why

Try-out-tool (`tryOutAssetTool` for `ResourceType.TOOLSET`) is the last toolset operation still proxied through the admin BE — split out from `migrate-toolset-auth-discovery-import-to-core` because, unlike every other toolset operation, it isn't a passthrough. Reverse-engineering `ToolSetResourceController.callTool` → `ToolCallService.callTool` shows the admin BE runs a real MCP client SDK session against Core's `/mcp` endpoint: it opens a transport, performs the MCP `initialize` handshake, issues a single `callTool` request, and tears the session down — all per request, with no persistent session held. Only the admin bearer token is attached; Core itself applies the toolset's stored credentials server-side, so there's no secret-holding on the BE's part to replicate — but there **is** real protocol logic (the MCP handshake) that has no Core REST equivalent to call directly.

Porting this requires an MCP client implementation. Per user decision, this change adds `@modelcontextprotocol/sdk` (the official TypeScript MCP SDK) as a new dependency, used server-side in a Next.js server action — the same short-lived per-request pattern the BE itself uses (`Client` + `StreamableHTTPClientTransport`, confirmed against the installed package's type definitions: `Client.connect(transport)` performs the initialize handshake automatically, `Client.callTool(params)` issues the tool call, `Client.close()` tears the session down).

## What Changes

- **Port `tryOutAssetTool`** (`src/app/[lang]/assets-toolsets/actions.ts`'s call site — the shared function also serves `ResourceType.APPLICATION`) to branch by resource type:
  - `ResourceType.TOOLSET`: open a short-lived MCP client session against Core's `v1/toolset/{prefixed-path}/mcp` endpoint (bearer-token-authenticated, no other headers) via `@modelcontextprotocol/sdk`'s `Client`/`StreamableHTTPClientTransport`, issue the single `callTool` request, close the session, and return the raw `CallToolResult` as the response — matching the admin BE's existing wire shape.
  - `ResourceType.APPLICATION`: **unchanged** — continues to call `assetsApi.tryOutTool`, since applications' full migration (import/export/discovered-tools/try-out) is still a separate deferred fast-follow (confirmed with the user).
- New `src/server/toolsets/mcp-client.ts` housing the MCP session helper (`callToolViaMcp(token, path, callToolRequest)`), kept separate from `ToolsetOpsApi` since it isn't a plain Core REST call — it manages an SDK client/transport lifecycle, not a single `fetch`.

## Capabilities

### Modified Capabilities
- `toolset-resources-core-api`: adds try-out-tool for toolsets, executed as a direct MCP client session against DIAL Core, replacing the admin-BE proxy. Toolsets have zero remaining admin-BE dependency after this change.

## Impact

- **Modified code:**
  - `src/app/[lang]/assets-toolsets/actions.ts` — `tryOutAssetTool` branches: `TOOLSET` → new MCP client path; `APPLICATION` → unchanged `assetsApi.tryOutTool`
  - New: `src/server/toolsets/mcp-client.ts` — MCP session helper
  - `package.json` — new dependency `@modelcontextprotocol/sdk`
- **Unchanged:** `TryOut.tsx`'s call site and request/response shapes (`{ toolSetPath: { path }, callToolRequest: { name, arguments } }` in, raw `CallToolResult`-shaped response out), `tryOutTool`/`tryOutContainerTool`/`tryOutToolsetTool` (the other three try-out variants, all out of scope).
- **Removed:** `assetsApi.tryOutTool` becomes unreferenced for `ResourceType.TOOLSET` specifically (class itself untouched — still used for `ResourceType.APPLICATION` here, and by every other still-BE-backed application operation).

## Non-goals

- Application try-out-tool (explicitly deferred, confirmed with the user — separate fast-follow alongside the rest of the applications migration).
- Any change to the MCP wire protocol itself, the `Tool`/`CallToolResult` shapes, or the `TryOut.tsx` UI.
- Session reuse/pooling across multiple tool calls — each try-out request opens and closes its own short-lived session, matching the admin BE's own per-request pattern exactly.
