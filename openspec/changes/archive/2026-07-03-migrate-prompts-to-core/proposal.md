## Why

Prompts are the next asset type still proxied through the admin BE (`assetsApi` → `/api/v1/prompts/*`), and unlike conversations they exercise the full CRUD + move surface (create, update, versioning-by-duplication) that the other three remaining types (toolset-resource, application-resource, file) will also need. Migrating prompts next proves that harder wiring pattern — conditional create/update headers and version-aware path building — on the simplest type that has it, before tackling application-resource's extra validity-state/MCP complexity.

## What Changes

- **Cut prompt list/get/create/update/delete/move over to Core**, replacing the corresponding `assetsApi` calls in `src/app/[lang]/prompts/actions.ts` with `add-core-asset-client`'s prompt client.
- **Hard cutover, no fallback** — same framing as `migrate-conversations-to-core` and `migrate-publications-to-core-api`: no feature flag, BE-backed prompt path removed for these operations once this lands. `PromptsList`/`PromptView`/`Properties`, the `/prompts` and `/prompts/[id]` routes, the server-action signatures, and the `DialPrompt` model are unchanged.
- **List default-path/limit injection**, matching `PromptService.getMetadata`'s defaulting to `"public/"` and a configured limit when omitted (built by `add-core-asset-client`; this change wires `getPrompts` to rely on it).
- **Conditional create semantics preserved**: create sends `If-None-Match: *` (reject if something already exists at that path) unless override is requested; update requires `If-Match` with the caller's etag — both via `add-core-asset-client`'s `createHeadersForCreate`.
- **"New version" flow preserved unchanged**: the FE's existing duplicate-with-new-version logic (`addNewVersion`, `extractVersionByPath`/`changePath` in `movePrompts`) is UI/util-layer and does not change — this change only swaps what `createPrompt`/`updatePrompt`/`movePrompts` call underneath.

## Capabilities

### New Capabilities
- `prompts-core-api`: prompt list, get, create, update, delete, bulk-delete, and move executed directly against DIAL Core via `add-core-asset-client`, replacing the admin-BE proxy, while the FE-facing `DialPrompt` contract, routes, and server-action signatures stay identical.

## Impact

- **Modified code:**
  - `src/app/[lang]/prompts/actions.ts` — `createPrompt`, `updatePrompt`, `getPrompts`, `getPrompt`, `removePrompt`, `bulkDeletePrompts`, `movePrompts` call the Core prompt client instead of `assetsApi`
- **Unchanged:** `PromptsList`, `PromptView`/`Properties`/`TabsContent`, `src/models/dial/prompt.ts`, `AssetVersionControl` and the version-grouping logic in `src/components/Assets/utils.ts` (these already derive version lists client-side from a plain folder listing — see Non-goals), the `/prompts` routes.
- **Hard dependency:** `add-core-asset-client` (client, version-path helper, prompt content+metadata mapper, default-path/limit injection) must be implemented first.
- **Auth:** forwards the logged-in user's JWT via the existing Core client pipeline.

## Non-goals

- **Import/export (JSON + zip) and zip preview** (`src/app/api/prompts/import/route.ts`, `exportPrompts`, `foldersApi.previewPromptZipFiles`/`previewPromptZip` action) — these need zip streaming, multipart parsing, and reproducing the BE's `PromptEximDto` path-format validation (`prompts/public/(...)/name__version` regex), a distinct risk bucket similar to File's import circuit-breaker/path-traversal work. Deferred to a fast-follow change once this one is stable, kept on the BE-backed path until then.
- **`PromptService.getPromptVersions`** (the BE's dedicated folder-scan-and-filter versions endpoint) — confirmed **not called anywhere in the FE**. The FE already lists a prompt's version siblings via a plain folder listing (`getAssetList`) grouped client-side (`AssetVersionControl`, `versions`/`selectedVersions`/`displayVersion` fields on the asset model) — this change's Core-backed `getPrompts` continues to serve that same pattern without porting the BE's separate paginated-stream endpoint.
- Folders/rules — `migrate-folders-to-core` (separate, later change).
- Any other asset type (conversation — done; toolset-resource, application-resource, file — later changes).
- Any change to `PromptsList`/`PromptView` UI, columns, or i18n beyond what's needed to keep them working against the new data source.
