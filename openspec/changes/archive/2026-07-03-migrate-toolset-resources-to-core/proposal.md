## Why

Toolset-resources are the next asset type on the admin BE (`assetsApi` → `/api/v1/toolset-resources/*`), and their CRUD+move shape is structurally identical to prompts (same content+metadata merge, same conditional create/update, same list-then-filter single-get, same duplicate-with-version-rename move) — just without a version-parity validation bug to fix. Migrating this CRUD slice next keeps the per-type changes consistent in size and lets `migrate-toolset-resources-to-core` and the upcoming `migrate-application-resources-to-core` share the same reviewed pattern before that change takes on its extra validity-state/MCP-fallback complexity.

## What Changes

- **Cut toolset-resource list/get/create/update/delete/move over to Core**, replacing the corresponding `assetsApi` calls in `src/app/[lang]/assets-toolsets/actions.ts` with `add-core-asset-client`'s toolset-resource client.
- **Hard cutover, no fallback** — same framing as `migrate-conversations-to-core` and `migrate-prompts-to-core`: no feature flag, BE-backed path removed for these operations once this lands. `ToolsetsList`/`ToolsetView`/`Properties`, the `/assets-toolsets` and `/assets-toolsets/[id]` routes, the server-action signatures, and the `Toolset`/`AssetToolset` models are unchanged.
- **List default-path/limit**: unlike conversation/prompt, the BE's `ToolSetResourceService` does **not** default path/limit — this change preserves that (no defaulting added).
- **Conditional create/update semantics preserved**: create → `If-None-Match: *` unless override; update → `If-Match` with the caller's etag, via `add-core-asset-client`'s `createHeadersForCreate`.
- **Move/duplicate-rename flow preserved unchanged** — same `extractVersionByPath`/`changePath` utility as prompts, untouched by this change.

## Capabilities

### New Capabilities
- `toolset-resources-core-api`: toolset-resource list, get, create, update, delete, bulk-delete, and move executed directly against DIAL Core via `add-core-asset-client`, replacing the admin-BE proxy, while the FE-facing `Toolset`/`AssetToolset` contract, routes, and server-action signatures stay identical.

## Impact

- **Modified code:**
  - `src/app/[lang]/assets-toolsets/actions.ts` — `getToolsets`, `createToolset`, `getToolset`, `updateToolset`, `removeToolset`, `bulkDeleteToolsets`, `moveToolsets` call the Core toolset-resource client instead of `assetsApi`
- **Unchanged:** `Toolsets/List.tsx`, `Toolsets/View/*`, `src/models/dial/toolset.ts`, `src/models/dial/deployment-asset.ts` (`AssetToolset`), the `/assets-toolsets` routes, `getAllowTools`/`getTransport` (`src/utils/toolset/toolset-transport.ts`, unchanged — these shape the create/update payload's `allowedTools`/`transport` fields before they reach the client, not the client itself).
- **Explicitly not touched by this change** (stays on `assetsApi`/admin BE): `importToolsets`, `exportToolsets`, `getAssetTools` (discovered-tools), `tryOutAssetTool` (call-tool), `signInToolset`, `signOutToolset` — see Non-goals.
- **Hard dependency:** `add-core-asset-client` (client, version-path helper, toolset-resource content+metadata mapper) must be implemented first.
- **Auth:** forwards the logged-in user's JWT via the existing Core client pipeline.

## Non-goals

- **Import/export/zip-preview** — same reasoning as `migrate-prompts-to-core`'s deferral: zip/multipart handling is a distinct risk bucket, deferred to a fast-follow.
- **Discovered-tools and call-tool** (`getAssetTools`, `tryOutAssetTool`) — the BE resolves these via `toolsClient.getTools`/`toolCallService.callTool` against a Core MCP endpoint (`{coreClientUrl}/v1/toolset/{url}/mcp`), a separate live-proxy concern from CRUD. Deferred to a fast-follow change alongside sign-in/out (below), since both are toolset-auth/discovery concerns that share context.
- **Sign-in/sign-out** (`signInToolset`, `signOutToolset`) — the BE routes these through a dedicated `ResourceCredentialService`/`ResourceCredentialClient` (per-auth-type validation: OAuth requires a code, API-key requires a key, None requires neither) that is structurally unrelated to the content/metadata CRUD this change covers. Deferred to the same fast-follow as discovered-tools/call-tool.
- Folders/rules — `migrate-folders-to-core` (separate, later change).
- Any other asset type (conversation, prompt — done; application-resource, file — later changes).
- Any change to `Toolsets/List`/`Toolsets/View` UI, columns, or i18n beyond what's needed to keep them working against the new data source.
