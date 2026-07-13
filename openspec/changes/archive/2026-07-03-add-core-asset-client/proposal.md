## Why

`migrate-publications-to-core-api` proved the FE→DIAL-Core path and cut it for publications, but deliberately deferred the riskiest piece — Core resource shape-mapping (content+metadata merge, versioned-path parsing) — to a follow-up (`migrate-publications-enrichment-to-core`), which is now blocked waiting for exactly that layer. Meanwhile every asset *view* (applications, toolsets, conversations, prompts, files) still proxies through the admin BE via the generic `assetsApi`, which the BE is retiring. Both needs point at the same missing piece: a direct-to-Core asset client with the BE's hidden per-type transformations reproduced in TypeScript. This change builds that shared foundation once, so publications enrichment and each asset-type migration can consume it instead of re-deriving it.

## What Changes

- **New Core asset client** (`src/server/core/`): generic read/write/exists operations against DIAL Core's per-type resource endpoints — content (`GET/PUT/DELETE /v1/{type}/{path}`) and metadata (`GET /v1/metadata/{type}/{path}`) — for application-resource, toolset-resource, conversation, and prompt, plus a file-specific variant (metadata-only merge, streamed content, no version suffix). Conditional headers (`If-None-Match` on read, `If-Match` on write/delete) reproduce the BE's `HeaderUtils` semantics: an empty header set when the etag is `null`/the `*` sentinel, a real header otherwise. **BREAKING (bugfix): File delete requires a real etag/`If-Match`** — the BE's `FileService.delete` silently ignores its etag parameter and never sends `If-Match`; this client does not reproduce that gap.
- **One consolidated path/version helper**, not three: the BE independently reimplements the `__`-suffix version-parsing logic in `PathUtils` (canonical, `lastIndexOf("__")`), `CoreMetadataUtils` (a thin re-wrap), and inline inside `PromptClientMapper` (a third copy). This change ports a single TypeScript version (prefix-strip, decode, `__`-split, encode, rebuild), mirroring how `src/server/publications/path.ts` consolidated the equivalent publication-side logic.
- **Content+metadata mapper base per type**: application-resource, toolset-resource, conversation, and prompt each merge a content DTO with a metadata DTO (name/folderId/updatedAt/author/url from metadata, parsed via the version helper; content fields vary per type) — reproducing what the BE's `*ClientMapper` classes do today. File differs structurally (no content DTO; metadata alone carries `contentType`/`contentLength`) and gets its own mapper.
- **Default-value injection** for conversation and prompt reads only: path defaults to `"public/"` and page-size `limit` defaults from config when the caller omits them — the BE does this in `ConversationService`/`PromptService` but not in the application-resource, toolset-resource, or file services.
- **Bugfix carried forward**: the BE's `CreateApplicationResourceDto` (create) validates `viewerUrl`/`editorUrl`/`maxInputAttachments`, but the update-path `ApplicationDto` validates none of them. This change's shared validation (consumed by the future application-resource migration) applies the same rules to both create and update, closing that asymmetry at the source instead of re-introducing it per call site.

## Capabilities

### New Capabilities
- `core-asset-client`: direct-to-DIAL-Core content/metadata read, write, and existence operations for application-resource, toolset-resource, conversation, prompt, and file resources, including the shared version-path helper and per-type content+metadata mappers, replacing the admin-BE proxy path these operations use today.

### Modified Capabilities
<!-- None at the spec level yet — this change introduces the client layer only. Nothing currently consumes it; the per-type migrations and migrate-publications-enrichment-to-core will each add their own delta specs when they switch their consumers over. -->

## Impact

- **New code:**
  - `src/server/core/asset-api.ts` (or per-type files, decided in design) — Core client for application-resource/toolset-resource/conversation/prompt content+metadata+delete
  - `src/server/core/file-core-api.ts` (extends the existing `files-core-api.ts` from Phase 1, or supersedes it — decided in design) — Core client for file metadata+content+delete
  - `src/server/assets/path.ts` (or similar) — the single consolidated version/path helper
  - `src/server/assets/mappers/` — one content+metadata mapper per type
  - `src/constants/assets-core.ts` — Core endpoint path segments per `ResourceType`, default path/limit constants
- **No modified code yet:** nothing is re-pointed at this client in this change — `assetsApi` (BE-backed) keeps serving all current views unchanged. Wiring happens per-type in the follow-up changes (`migrate-application-resources-to-core`, `migrate-toolset-resources-to-core`, `migrate-conversations-to-core`, `migrate-prompts-to-core`, `migrate-files-to-core`) and in `migrate-publications-enrichment-to-core`'s resolver re-point.
- **External dependency:** DIAL Core `/v1/{type}/{path}`, `/v1/metadata/{type}/{path}` (same endpoints the BE calls today via `ApplicationClient`/`ToolSetClient`/`ConversationClient`/`PromptClient`/`FileClient`).
- **Auth:** forwards the logged-in user's JWT, same as the existing `CoreApi` base from Phase 1 — no new credential type.

## Non-goals

- Re-pointing any existing view, server action, or route at this client — that is the explicit job of the five per-type follow-up changes plus `migrate-publications-enrichment-to-core`.
- Folders and folder rules (`FolderService`, `getRules`/`updateRules`) — a separate follow-up change, since the BE's `updatesRules`/`unpublishFolder` drive the publication create+approve flow (`PublicationService`) rather than talking to Core directly, and folder operations fan out across all five resource types.
- Revision history (`PromptService.getPromptVersions`'s folder-scan-and-filter) — belongs to `migrate-prompts-to-core`, which owns all prompt-specific behavior.
- MCP tool-call / discovered-tools transport resolution (Application falls back to its type-schema's MCP transport; ToolSet does not) — belongs to `migrate-application-resources-to-core` / `migrate-toolset-resources-to-core`, which own the asymmetry.
- Import/export, the file-import circuit breaker, and zip path-traversal defense — belongs to `migrate-files-to-core`.
- Removing `assetsApi` or any admin-BE dependency — it keeps serving every view until each per-type change lands.
