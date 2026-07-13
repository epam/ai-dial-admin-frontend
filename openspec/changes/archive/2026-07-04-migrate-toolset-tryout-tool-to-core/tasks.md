## 1. Dependency and MCP session helper

- [x] 1.1 Add `@modelcontextprotocol/sdk` to `package.json`
- [x] 1.2 `callToolViaMcp(host, token, path, callToolRequest)` implemented in `src/server/toolsets/mcp-client.ts` — builds the absolute `v1/toolset/{prefixed-path}/mcp` URL (via `normalizeUrl` + `buildToolsetMcpUrl`), opens a `StreamableHTTPClientTransport` with the bearer token in `requestInit.headers`, connects a `Client`, calls `callTool`, closes the session in a `finally`, returns `ServerActionResponse`
- [x] 1.3 Unit tests in `src/server/toolsets/tests/mcp-client.spec.ts` — mocking the SDK's `Client`/`StreamableHTTPClientTransport` constructors (as ES classes, not arrow functions, since `new` requires a real constructor): correct URL, correct auth header, success path returns `{success:true, response}`, failure path returns a recognizable error, `close()` called on both paths — 3/3 passing

## 2. Wire the action

- [x] 2.1 `tryOutAssetTool` in `src/app/[lang]/assets-toolsets/actions.ts` branches on `resourceType`: `TOOLSET` → `callToolViaMcp(process.env.DIAL_CORE_API_URL, ...)`; `APPLICATION` → unchanged `assetsApi.tryOutTool`
- [x] 2.2 Confirmed `TryOut.tsx`'s call site and request/response handling need no changes (request shape `{ toolSetPath: { path }, callToolRequest }` and response shape both preserved)
- [x] 2.3 Targeted `vitest run` for every spec file touched/added in this change — 40/40 passing (`src/server/toolsets/tests/*`, `src/app/[lang]/assets-toolsets/actions.spec.ts`)
- [x] 2.4 `openspec validate migrate-toolset-tryout-tool-to-core --strict` — passes

<!--
No browser-verification task: TryOut.tsx and its request/response contract are unchanged —
only the server-side transport for TOOLSET try-out-tool changes. Unit tests (mocking the MCP
SDK's Client/Transport) are the verification bar; a live end-to-end MCP handshake against a
real Core instance isn't reachable from this environment, consistent with this series'
established pattern for changes with no live Core instance to test against.
-->
