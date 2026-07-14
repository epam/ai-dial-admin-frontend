## Context

`src/app/[lang]/prompts/actions.ts` exposes seven server actions: `createPrompt`, `updatePrompt`, `getPrompts` (list), `getPrompt` (single, resolved by folderId+name+version via a list-then-filter), `removePrompt` (conditional single delete), `bulkDeletePrompts` (unconditional bulk delete), `movePrompts` (move, including a duplicate-with-renamed-version flow via `extractVersionByPath`/`changePath`). Import/export (JSON + zip) live in a separate route (`src/app/api/prompts/import/route.ts`) and a folders-storage action (`previewPromptZip`) — deferred per the proposal's Non-goals.

The BE's `PromptService` mirrors this shape: `createPrompt`/`putPrompt` (create rejects with `EntityAlreadyExistsException` on conflict — an `OptimisticLockConflictException` remap the BE does when `If-None-Match: *` fails), `getMetadata` (defaults path to `"public/"`, limit from config), `fetchApplicationResource` (poorly named internally — actually the prompt content+metadata merge), `deletePrompts`/`delete` (conditional via `If-Match`). `add-core-asset-client` already builds the generic version of all of this; this change wires prompts to it.

One BE feature is confirmed **not used by the FE**: `PromptService.getPromptVersions`, a dedicated endpoint that streams a folder's metadata and filters client-side (BE-side) by exact name match to build a version list. The FE's `AssetVersionControl` component (and `getPrompt`'s own list-then-filter) already achieve the same result using the ordinary list endpoint — there is no separate "versions" UI action to port.

## Goals / Non-Goals

**Goals**
- `createPrompt`, `updatePrompt`, `getPrompts`, `getPrompt`, `removePrompt`, `bulkDeletePrompts`, `movePrompts` call the Core prompt client instead of `assetsApi`.
- Preserve conditional-header semantics exactly: create → `If-None-Match: *` unless override; update/delete → `If-Match` with the real etag.
- Zero change to `PromptsList`/`PromptView`, `DialPrompt`, version-grouping UI, or routes.
- Hard cutover: no flag, no BE fallback for these seven operations.

**Non-Goals**
- Import/export/zip-preview (separate fast-follow, per proposal).
- Porting `getPromptVersions`/`PromptMetadataIterator` — unused by the FE, not built.
- Building any client/mapper logic — owned by `add-core-asset-client`.
- Folders/rules.

## Decisions

### D1 — Hard cutover, mirroring prior changes' D1/D2
No feature flag. The seven prompt actions call the Core client unconditionally once this lands. `assetsApi`'s generic methods stay alive (still used by toolset-resource, application-resource, file) — only the prompt call sites move.

### D2 — `getPrompt`'s list-then-filter path resolution is preserved, not replaced by direct path building
`getPrompt(folderId, name, version, etag)` today lists the folder and finds the matching item's `path` field rather than constructing the path directly from `folderId`/`name`/`version`. Even though `add-core-asset-client`'s version helper (`buildEncodedPath`) could construct that path deterministically, this change keeps the existing list-then-filter approach: the returned `path` field is guaranteed to match what Core actually stored (including any BE/Core-side encoding nuance), whereas hand-building it risks a subtle encoding mismatch this change has no fixture to catch. Revisit as an optimization only with a dedicated fidelity check, not as part of this cutover.

### D3 — Create/update conditional headers ported verbatim from `add-core-asset-client`
`createPrompt` → `createHeadersForCreate(allowOverride=false, etag=null)` → `If-None-Match: *`. `updatePrompt` → `If-Match: <etag>`. No new behavior; this change only confirms the prompt actions pass the right etag/override values into the already-built helper.

### D4 — Move/duplicate-rename logic is untouched
`movePrompts`' duplicate-with-new-version-suffix behavior (`extractVersionByPath` + `changePath` building a `name__version` destination) lives in `src/utils/files/path.ts` and stays as-is; only the underlying move call (`assetsApi.moveAssets` → Core client's move/put) changes.

## Risks / Trade-offs

- **[Risk] Create-conflict semantics drift**: the BE remaps a failed `If-None-Match: *` into `EntityAlreadyExistsException` with a specific message; the Core client must surface an equivalent, recognizable error so `createPrompt`'s caller (the "create new version" flow in `PromptView`) still shows the right conflict message. → **Mitigation**: verify against `add-core-asset-client`'s error-normalization (its `CoreApi` error wrapping, ported from publications' D9) before wiring; add a unit test for the conflict path specifically.
- **[Trade-off] Import/export deferred**: prompts keep a partial BE dependency (import/export routes) until the fast-follow lands. Accepted — bundling zip/multipart logic into this change would roughly double its scope for a feature this change doesn't need to touch to prove the CRUD+move pattern.

## Migration Plan

1. Confirm `add-core-asset-client` has landed; read its prompt-client, mapper, and error-normalization exports.
2. Swap the seven `assetsApi` calls in `prompts/actions.ts`.
3. Verify the create-conflict and update-precondition-failure paths produce the same user-facing error messages as before.
4. Update `prompts/actions.spec.ts` to mock the Core client.

## Open Questions

None outstanding.
