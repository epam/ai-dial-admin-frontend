## Context

The admin BE proxies five resource types through per-type Core clients + mappers: `ApplicationClient`/`ApplicationClientMapper`, `ToolSetClient`/`ToolSetClientMapper`, `ConversationClient`/`ConversationClientMapper`, `PromptClient`/`PromptClientMapper`, `FileClient`/`FileClientMapper`. Four of the five share an identical shape: a content DTO (`GET /v1/{type}/{path}`) merged with a metadata DTO (`GET /v1/metadata/{type}/{path}`) into the domain model, with the versioned name (`name__version`) parsed out of the metadata URL. File is the outlier: no content DTO (bytes are streamed separately), no version suffix, and the metadata DTO itself carries `contentType`/`contentLength`.

The FE already has this same *shape* of client for publications (`src/server/core/core-api.ts`, `bucket-api.ts`, `files-core-api.ts`), built in `migrate-publications-to-core-api`. That change also created `src/server/publications/path.ts` to consolidate the BE's publication-URL path logic into one helper instead of porting the BE's several near-duplicates verbatim. This change applies the same instinct to the asset domain: the BE has the `__`-suffix version parser implemented three times (`PathUtils.extractNameAndVersion` — canonical, `lastIndexOf("__")`; `CoreMetadataUtils.parseEncodedVersionedPath` — a thin wrapper around the same; and an inline copy inside `PromptClientMapper` that doesn't call either). We port one.

Nothing consumes this client yet — `assetsApi` (BE-backed) keeps serving every current view. This change is pure plumbing, exercised only by its own unit tests, until the per-type follow-ups switch their consumers over.

## Goals / Non-Goals

**Goals**
- One `CoreApi`-based client (or small family of clients) covering content GET, metadata GET, PUT, and DELETE for application-resource, toolset-resource, conversation, and prompt, plus a file-specific client (metadata GET, streamed content GET, PUT, DELETE) — reproducing exactly what the BE's five `*Client` classes do, no more.
- Exactly one implementation of the version-path helper, consumed by every mapper that needs it.
- Content+metadata mapper per type, reproducing the BE's per-type field split (which fields come from content vs. metadata).
- Conditional-header semantics (`If-None-Match` on read, `If-Match` on write/delete) matching the BE's `HeaderUtils`: no header sent when the etag is `null` or the `*` sentinel, a real header otherwise — except File delete, which is bugfixed (see Decisions, D5).
- Default path (`"public/"`) and default `limit` injection for conversation and prompt reads, matching `ConversationService`/`PromptService`.

**Non-Goals**
- Wiring any view, server action, or route to this client (per-type follow-ups).
- Folders/rules, revision history, MCP transport resolution, import/export — each called out in the proposal as belonging to a specific follow-up change.
- Validating the *content* of each type's fields beyond what's needed to merge content+metadata (e.g., full form-validation parity for application-resource fields is the application-resource migration's job; this change only guarantees the client doesn't silently drop the etag it needs to enforce that validation's precondition).

## Decisions

### D1 — Client shape: one generic client + one file-specific client, not five per-type classes
The four versioned types differ only in: URL path segment (`applications/`, `toolsets/`, `conversations/`, `prompts/`), and which fields live in content vs. metadata. Model this as a config-driven registry — one `AssetTypeConfig` per `ResourceType` (path segment, content-field mapper, whether default path/limit injection applies) — the same pattern `migrate-publications-to-core-api`'s D3 used for its five publication resolvers. A single `CoreAssetApi` class takes a `ResourceType` argument and looks up the config; `CoreFileApi` stays separate since its request/response shape (streamed content, no version) doesn't fit the same interface.

**Alternative considered**: five separate per-type API classes, mirroring the BE's five `*Client` classes 1:1. Rejected for the same reason publications rejected five resolver classes — ~90% duplicate code, harder to keep in sync when a cross-cutting fix (like the header-semantics bugfix) needs to land once.

### D2 — One version-path helper, ported from `PathUtils` (not `CoreMetadataUtils` or the `PromptClientMapper` inline copy)
`PathUtils.extractNameAndVersion` is the canonical implementation (`lastIndexOf("__")`, last occurrence). Port: `extractNameAndVersion(rawName)`, `buildVersionedName(name, version)`, `buildPath(folderId, name, version)`, `buildEncodedPath(...)` (per-segment URL-encode), `parseVersionedPath(path, prefix)` → `{ path, folderId, name, version }`. The BE has a minor divergence between `VersionedPathParts.getVersionedName()` (checks `== null`) and the static `PathUtils.getVersionedName()` (checks `isBlank()`) for the blank-version case — this port picks one behavior (treat blank-or-null version as "no version", matching the more defensive `isBlank()` check) rather than reproducing the inconsistency.

### D3 — Content+metadata merge is a mapper concern, not a client concern
The client returns the raw content DTO and raw metadata DTO separately (two calls); a `mergeAssetContentAndMetadata(type, content, metadata)` function per type does the merge, matching how the BE's `*ClientMapper` classes are separate from the `*Client` classes. This keeps the client itself dumb and the field-mapping logic (which is what will actually need field-by-field verification against the BE, similar to publications' D3 "fidelity is the acceptance bar") isolated and independently testable.

### D4 — Conditional headers match `HeaderUtils`, generalized
Port `createHeadersForCreate(allowOverride, etag)`, `createIfMatchHeaders(etag)`, `createIfNonMatchHeaders(etag)`: return an empty header object when `etag` is `null` or equals the sentinel `"*"`; otherwise return `{ 'If-Match': etag }` / `{ 'If-None-Match': etag }`. These reuse the existing `IF_MATCH`/`IF_NONE_MATCH`/`DEFAULT_ETAG` constants already defined in `src/constants/api-headers.ts` for the BE-backed `AssetsApi`.

### D5 — Bugfix: File delete requires a real etag (BREAKING vs. today's silent gap)
The BE's `FileService.delete(path, etag)` accepts an etag parameter and never uses it — `fileClient.deleteFile(path)` sends no conditional header at all, unlike every other type's delete. Per the agreed decision to fix known bugs during this port rather than preserve them, `CoreFileApi.delete` makes `etag` a required parameter and always sends `If-Match`. This is a deliberate behavior change for File delete once `migrate-files-to-core` wires it up; flagged here because the client's type signature is what prevents call sites from reintroducing the silent-drop.

### D6 — Bugfix: update-path validation parity for application-resource fields
The BE validates `viewerUrl`/`editorUrl`/`maxInputAttachments` on `CreateApplicationResourceDto` (create) via `@Endpoint`/`@Positive`/`@Max`, but the update-path `ApplicationDto` carries the same fields with no annotations — a live asymmetry (confirmed against current BE HEAD, introduced when bugfix `2b2facc6` patched only the create DTO). This change's shared validation module (to be consumed by `migrate-application-resources-to-core`) defines the rule once and applies it to both create and update payloads, so the future per-type change can't reintroduce the gap by validating only one path.

### D7 — Default injection stays per-type, not global
Only `ConversationService` and `PromptService` default `path` to `"public/"` and `limit` from config when omitted; `ApplicationResourceService`/`ToolSetResourceService`/`FileService` do not. The `AssetTypeConfig` registry (D1) carries an optional `defaultListPath`/`defaultListLimit` per type rather than applying it universally, to avoid silently changing application-resource/toolset-resource/file list behavior.

## Risks / Trade-offs

- **[Risk] Field-mapping drift** — the content/metadata field split for application-resource, toolset-resource, conversation, and prompt must exactly match what the BE's `*ClientMapper` classes produce, or the future per-type migrations inherit silent data loss. → **Mitigation**: same acceptance bar as `migrate-publications-enrichment-to-core`'s D3 — field-by-field diff against BE-path fixtures per type, done as this change's own unit tests, not deferred to the consumers.
- **[Risk] File delete behavior change (D5) surprises a caller** → **Mitigation**: no caller exists yet (this change wires nothing up); `migrate-files-to-core` is the only consumer and takes on the etag requirement knowingly, per the already-agreed decision to fix rather than preserve this bug.
- **[Trade-off] Building four-of-five clients before any consumer exists** means this change ships no visible behavior change and can't be end-to-end verified against a real view yet — only unit-tested against fixtures/mocks. Accepted because `migrate-publications-enrichment-to-core` is already blocked waiting for exactly this, so shipping it standalone unblocks that change immediately rather than bundling it into the first per-type migration.

## Migration Plan

No runtime migration — this change adds new, unwired modules only. Land it, then:
1. `migrate-publications-enrichment-to-core` re-points its resolver registry at this client (unblocks a change already in the backlog).
2. The five per-type changes (`migrate-application-resources-to-core`, `migrate-toolset-resources-to-core`, `migrate-conversations-to-core`, `migrate-prompts-to-core`, `migrate-files-to-core`) each wire their views/actions to this client and retire their slice of `assetsApi`.
3. `migrate-folders-to-core` lands last, once all five types and `CorePublicationsApi` are in place.

## Open Questions

- Exact file/module layout (one `asset-api.ts` with a `ResourceType` switch vs. one file per type) — left to implementation; D1 only commits to "not five duplicate classes," not the file boundary.
- Whether `src/server/core/files-core-api.ts` (already built for publications' file-staging use case) should be extended in place for the file-asset use case (metadata+content+delete) or superseded by a new `CoreFileApi` — resolve during implementation by reading that file first.
