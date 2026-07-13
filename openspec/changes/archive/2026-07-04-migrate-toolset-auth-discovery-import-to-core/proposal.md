## Why

Toolset CRUD/list/get/delete/move were already ported to Core (`migrate-toolset-resources-to-core`), deferring import/export, discovered-tools, and sign-in/sign-out as fast-follows. Reverse-engineering the admin BE's `ToolSetResourceController`/`ToolSetEximService`/`ZipToolSetEximService`/`ToolSetService`/`ResourceCredentialService` shows:

- **Import/export** mirrors the prompts precedent exactly: a structured `{ toolSets: AssetToolset[] }` aggregate JSON document (the FE's existing `ParsedAssets.toolSets` shape), zip export wraps that same document as a single `toolSets/toolSets.json` entry, and import applies the same `OVERRIDE`/`SKIP` conflict-resolution policy. The BE does **not** redact OAuth secrets (`clientSecret`, tokens, PKCE verifiers) from the exported document at this layer — confirmed via `ToolSetEximDto`/`ToolSetClientMapper.toToolSetExim`. Per explicit decision, this port preserves that behavior rather than fixing it (unlike this migration's usual "fix known bugs" stance) — no redaction is added.
- **Discovered-tools** is a live, uncached Core call — the admin BE's `/discovered-tools` endpoint is a thin passthrough to Core's `GET /v1/toolset/{path}/tools`. No BE-side logic to replicate beyond the passthrough itself.
- **Sign-in/sign-out** already terminate at Core — the admin BE holds no OAuth client secret and does no token exchange; it forwards `code`/`apiKey`/`redirectUri` straight to Core's `POST /v1/ops/toolset/signin` / `signout`, which owns the actual OAuth exchange and the `ResourceAuthSettings`/`ResourceAuthStatus` credential store per `CredentialsLevel` (`GLOBAL`/`APPLICATION`/`USER`). This is a pure passthrough to port.

**Explicitly out of scope**: try-out-tool (`tryOutAssetTool`/`call-tool`). The BE runs a real MCP client SDK session (initialize handshake + `callTool`) against Core's `/mcp` endpoint — not a passthrough, but actual protocol logic requiring a new MCP client dependency. Confirmed with the user to split into its own follow-up change given the different risk/complexity profile.

## What Changes

- **Port `importToolsets`/`exportToolsets`** (`src/app/[lang]/assets-toolsets/actions.ts`) off `assetsApi.importAssets`/`exportAssets` onto a new `{ toolSets: AssetToolset[] }`-based Core-direct implementation, following the same pattern established by `migrate-prompts-import-export-to-core`:
  - Export: fetch merged content+metadata per selected path via `assetApi.getMerged`, set each toolset's `id` to its Core-prefixed path, return `{ toolSets: [...] }` for JSON, or wrap it as a single `toolSets/toolSets.json` zip entry for archive export.
  - Import: parse the uploaded `{ toolSets: AssetToolset[] }` document (JSON or zip-wrapped), resolve per-toolset conflicts against Core directly (no BE-side bulk validator), apply `OVERRIDE`/`SKIP`, `assetApi.put` each accepted toolset. Reuse the same consecutive-failure circuit breaker and zip path-traversal guard already generalized for Files/Prompts.
  - No secret redaction added — export continues to include `authSettings` (including `clientSecret`) exactly as the BE's export does today.
- **Port `getAssetTools`** to call Core's discovered-tools endpoint directly instead of `assetsApi.getTools`.
- **Port `signInToolset`/`signOutToolset`** to call Core's `v1/ops/toolset/signin`/`signout` directly instead of `assetsApi.signInToolset`/`signOutToolset`, preserving the existing `getToolsetBasicBody`/`getToolsetSignInBody` request-shaping utilities.
- New `src/server/core/toolset-ops-api.ts` (`ToolsetOpsApi extends CoreApi`) housing the three toolset-specific Core operations (discovered-tools, sign-in, sign-out) that don't fit the generic `AssetApi` (which only models the four versioned types' shared CRUD/move shape).

## Capabilities

### Modified Capabilities
- `toolset-resources-core-api`: adds toolset JSON/zip export, JSON/zip import, discovered-tools, and sign-in/sign-out, executed directly against DIAL Core, replacing the admin-BE proxy for these operations.

## Impact

- **Modified code:**
  - `src/app/[lang]/assets-toolsets/actions.ts` — `importToolsets`, `exportToolsets`, `getAssetTools`, `signInToolset`, `signOutToolset` re-pointed to Core-direct implementations
  - New: `src/server/toolsets/exim.ts`, `src/server/toolsets/zip-exim.ts` — mirrors `src/server/prompts/exim.ts`/`zip-exim.ts`
  - New: `src/server/core/toolset-ops-api.ts` — discovered-tools/sign-in/sign-out
  - `src/app/api/api.ts` — new `toolsetOpsApi` export
- **Unchanged:** `AuthButtons.tsx`, `Tools.tsx`, `ImportModal`/`ExportModal` UI, `getToolsetBasicBody`/`getToolsetSignInBody`, the `{ toolSets: AssetToolset[] }` wire shape, `ToolsetAuthCredentialLevel`/`ToolsetAuthStatus` enums.
- **Removed:** `assetsApi.importAssets`/`exportAssets`/`getTools`/`signInToolset`/`signOutToolset` become unreferenced for toolsets (class itself untouched — still used by applications' deferred import/export/discovered-tools/try-out and toolsets' own deferred try-out-tool).

## Non-goals

- Try-out-tool / call-tool (deferred to its own follow-up — requires an MCP client SDK, not a passthrough).
- Secret redaction on toolset export (explicitly preserved as-is per user decision, not treated as a bug to fix here).
- Application import/export/discovered-tools/try-out (separate, later fast-follow).
- Any change to the `{ toolSets: AssetToolset[] }` wire shape, `ToolsetAuthSettings` model, or the sign-in/sign-out UI flow.
