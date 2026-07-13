## Context

Three independent surfaces, each already fully traced against the BE:

1. **Import/export** (`ToolSetResourceController` → `ToolSetEximService`/`ZipToolSetEximService`) is structurally identical to the already-solved Prompts case: aggregate JSON document (`{ toolSets: [...] }`, matching `ToolSetsEximDto`), zip wraps that document as one `toolSets/toolSets.json` entry, `OVERRIDE`/`SKIP` conflict policy in `ToolSetEximService.createToolSetOrThrow`. The FE already has a live client-side contract for this shape — `ParsedAssets.toolSets: AssetToolset[]` (`src/models/import-asset.ts`), the same object already rewritten by `getFormDataForImport`'s toolset branch. Unlike prompts, the BE does not redact `authSettings.clientSecret`/tokens/PKCE fields on export (confirmed in `ToolSetEximDto`/`ToolSetClientMapper.toToolSetExim` — a separate, unrelated config-export path does redact, but not this one). Per user decision, this port preserves that (arguably risky) behavior rather than fixing it.
2. **Discovered-tools** (`ToolSetController.getDiscoveredTools` → Feign `ToolsClient.getTools` → Core `GET /v1/toolset/{path}/tools`) is a pure passthrough — no BE-side caching, transformation, or DB lookup beyond an existence check.
3. **Sign-in/sign-out** (`ResourceCredentialService` → Feign `ResourceCredentialClient` → Core `POST /v1/ops/toolset/signin`/`signout`) is also a pure passthrough — the BE holds no client secret and performs no token exchange; Core owns the entire OAuth flow and the `ResourceAuthSettings`/`ResourceAuthStatus` credential store, keyed by `CredentialsLevel` (`GLOBAL`/`APPLICATION`/`USER`).

Try-out-tool is excluded (Non-goals) because the BE runs an actual MCP client SDK session against Core's `/mcp` endpoint — real protocol logic, not a passthrough, and a separate risk profile the user chose to scope separately.

## Goals / Non-Goals

**Goals**
- Toolset JSON/zip export produces `{ toolSets: AssetToolset[] }`, matching the FE's existing `ParsedAssets` contract — no new wire type invented.
- Toolset JSON/zip import applies `OVERRIDE`/`SKIP` conflict resolution against Core's live state, reusing the circuit breaker and zip path-traversal guard already generalized for Files/Prompts.
- Discovered-tools and sign-in/sign-out become direct Core passthroughs with identical request/response shapes to what `assetsApi` produced.

**Non-Goals**
- Try-out-tool / MCP client work (separate change).
- Secret redaction on export (explicitly preserved as today's behavior).
- Any change to `ToolsetAuthSettings`, `ToolsetAuthCredentialLevel`, or the sign-in/sign-out UI.

## Decisions

### D1 — Toolset import/export reuses the Prompts exim pattern verbatim, swapping the field name
`buildToolsetsExport`/`importToolsetsExport`/`mergeToolsetsExports` in `src/server/toolsets/exim.ts`/`zip-exim.ts` mirror `src/server/prompts/exim.ts`/`zip-exim.ts` structurally: same circuit breaker reuse, same per-folder existing-paths cache, same `flatImport` destination-resolution logic — the only difference is operating on `ParsedAssets.toolSets` instead of `.prompts`, and `ResourceType.TOOLSET`/`RESOURCE_TYPE_PREFIX[TOOLSET]` instead of `PROMPT`. No id-regex validation is added — unlike prompts, the FE's own `isInvalidJson` never enforced one for toolsets (only checks the array is non-empty), so none is invented here either.

### D2 — Toolset-only ops get their own small Core client, not bolted onto `AssetApi`
`AssetApi` models the shared CRUD/move shape for all four versioned types. Discovered-tools/sign-in/sign-out are toolset-exclusive Core endpoints with no equivalent on the other three types, so they get a dedicated `ToolsetOpsApi extends CoreApi` (mirroring how `FilesCoreApi`/`CorePublicationsApi` hold their own type-specific operations rather than overloading the generic client) with three methods:
- `discoveredTools(token, path)`: `GET v1/toolset/${encodeCorePath(prefix+path)}/tools`
- `signIn(token, body)`: `POST v1/ops/toolset/signin`
- `signOut(token, body)`: `POST v1/ops/toolset/signout`

### D3 — Sign-in/sign-out request bodies are unchanged; only the transport target moves
`getToolsetBasicBody`/`getToolsetSignInBody` already build the exact body Core's ops endpoints expect (`url`, `credentialsLevel`, `authenticationType`, plus `code`/`redirectUri` or `apiKey`) — these utilities are reused as-is. Only `signInToolset`/`signOutToolset` in `assets-toolsets/actions.ts` change, swapping `assetsApi.signInToolset(...)` for `toolsetOpsApi.signIn(token, body)`.

## Risks / Trade-offs

- **[Risk] Export includes live OAuth secrets in plaintext**, same as today's BE behavior. Accepted per explicit user decision — not this change's problem to fix, and fixing it silently would also be a behavior change the user didn't ask for.
- **[Trade-off] No shared abstraction between `AssetApi` and `ToolsetOpsApi`** beyond `CoreApi` — acceptable since these three operations have no cross-type equivalent to generalize over (D2).

## Migration Plan

1. Implement `src/server/toolsets/exim.ts`/`zip-exim.ts` (D1), with unit tests mirroring the prompts test suite's coverage (export mapping, OVERRIDE/SKIP, circuit breaker, zip merge/collision-rejection).
2. Implement `ToolsetOpsApi` (D2) with unit tests for URL/body shape of each of the three methods.
3. Wire `importToolsets`/`exportToolsets`/`getAssetTools`/`signInToolset`/`signOutToolset` to the new implementations.
4. Targeted test pass for all new/touched modules.

## Open Questions

None outstanding — secret-redaction and try-out-tool scoping both confirmed with the user.
