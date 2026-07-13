## 0. Prerequisite

- [x] 0.1 Confirmed `add-core-asset-client` landed; read its actual `AssetApi` exports. Found and closed a second gap (after conversations' `getMergedWithEtag`): Core's move is a **generic ops endpoint** (`POST /v1/ops/resource/move`, backend `ResourceClient.move`), not a per-type `/v1/{type}/{path}` operation — `add-core-asset-client` didn't build it. Added `AssetApi.move(token, type, sourcePath, destinationPath, overwrite)` (applies the type prefix + per-segment encoding, then calls the generic move op), tested in `src/server/core/tests/asset-api.spec.ts`
- [x] 0.2 Re-confirmed no `getPromptVersions`-equivalent caller exists in the FE — `AssetVersionControl` and `getPrompt`'s own list-then-filter still cover version grouping via the ordinary list endpoint

## 1. Wire server actions to Core

- [x] 1.1 `getPrompts` — now calls `assetApi.list(token, ResourceType.PROMPT, path)`
- [x] 1.2 `getPrompt` — list-then-filter preserved (design D2): lists via `assetApi.list`, then `assetApi.getMergedWithEtag<DialPrompt>` on the resolved path
- [x] 1.3 `createPrompt` — now calls `assetApi.put(...)` with no etag/override, producing `If-None-Match: *`; builds the versioned path via the shared `getVersionedName` helper (not a re-copied `__` literal)
- [x] 1.4 `updatePrompt` — now calls `assetApi.put(token, PROMPT, prompt.path, prompt, { etag })`
- [x] 1.5 `removePrompt` — now calls `assetApi.delete(token, PROMPT, path, etag)`
- [x] 1.6 `bulkDeletePrompts` — loops `assetApi.delete` per path, fail-fast, matching the pattern already established for conversations (Core has no per-type bulk-delete op either)
- [x] 1.7 `movePrompts` — now calls `assetApi.move(...)` per path via `Promise.all` (parallel, preserving original concurrency); `extractVersionByPath`/`changePath` duplicate-rename logic untouched

## 2. Tests

- [x] 2.1 `prompts/actions.spec.ts` rewritten to mock `assetApi` (plus `assetsApi` for the still-deferred `exportPrompts`) — 13/13 passing
- [x] 2.2 Added a create-conflict case: a failed `assetApi.put` (simulating `If-None-Match: *` rejection) surfaces as `{ success: false, errorMessage }` through `createPrompt` unchanged
- [x] 2.3 Added cases for `removePrompt` with and without an etag, and `bulkDeletePrompts` fail-fast (stops after the first failing path)
- [x] 2.4 Added a case for `movePrompts` with `duplicateName`, asserting the destination keeps the source's version suffix (and documents the pre-existing `changePath` double-slash quirk, left as-is per design D4)

## 3. Cleanup and quality checks

- [x] 3.1 Confirmed `assetsApi` remains unchanged and still used by toolset-resource, application-resource, file actions, and `exportPrompts`/`import/route.ts` for prompts
- [x] 3.2 Confirmed `src/app/api/prompts/import/route.ts` and `previewPromptZip` are untouched (deferred, per Non-goals)
- [x] 3.3 `npm run lint` / `npm run format` — clean
- [x] 3.4 `vitest run` — `prompts/actions.spec.ts` (13/13), `src/server/core/tests/asset-api.spec.ts` (12/12), full-repo suite green
- [x] 3.5 `openspec validate migrate-prompts-to-core --strict` — passes

<!--
No browser-verification task, consistent with the prior per-type changes: unit tests mocking the Core client are sufficient; browser verification against a live Core instance is deferred in favor of speed.
-->
