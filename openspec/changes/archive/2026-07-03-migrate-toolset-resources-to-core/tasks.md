## 0. Prerequisite

- [x] 0.1 Confirmed `add-core-asset-client` landed; reused `AssetApi`'s toolset-resource support plus the `getMergedWithEtag`/`move` extensions added while implementing conversations/prompts
- [x] 0.2 Confirmed no default path/limit injection applies to toolset-resource in `AssetApi.getMetadata`/`resolveListPath` (only conversation/prompt are in `DEFAULT_LIST_PATH_TYPES`)

## 1. Wire server actions to Core

- [x] 1.1 `getToolsets` — now calls `assetApi.list(token, ResourceType.TOOLSET, path)`
- [x] 1.2 `getToolset` — list-then-filter preserved (design D3): `assetApi.list` then `assetApi.getMergedWithEtag<DialToolsetResource>` on the resolved path
- [x] 1.3 `createToolset` — now calls `assetApi.put(...)` with no etag/override (`If-None-Match: *`); builds the versioned path via the shared `getVersionedName` helper; `getAllowTools`/`getTransport`/`displayVersion` payload shaping unchanged
- [x] 1.4 `updateToolset` — now calls `assetApi.put(token, TOOLSET, toolset.path, {...toolset, displayVersion}, { etag })`; `displayVersion` shaping unchanged
- [x] 1.5 `removeToolset` — now calls `assetApi.delete(token, TOOLSET, path, etag)`
- [x] 1.6 `bulkDeleteToolsets` — loops `assetApi.delete` per path, fail-fast, matching conversations/prompts
- [x] 1.7 `moveToolsets` — now calls `assetApi.move(...)` per path via `Promise.all`; `extractVersionByPath`/`changePath` duplicate-rename logic untouched

## 2. Tests

- [x] 2.1 `assets-toolsets/actions.spec.ts` rewritten: the seven migrated actions mock `assetApi`; `importToolsets`/`exportToolsets`/`getAssetTools`/`tryOutAssetTool`/`signInToolset`/`signOutToolset` still mock `assetsApi`, unchanged — 19/19 passing
- [x] 2.2 Added a create-conflict case: a failed `assetApi.put` surfaces as `{ success: false, errorMessage }` through `createToolset` unchanged
- [x] 2.3 Added cases for `removeToolset`/`updateToolset` with and without an etag, asserting the etag is passed through as-is (or `undefined`)
- [x] 2.4 Added a case for `moveToolsets` with `duplicateName`, asserting the destination keeps the source's version suffix

## 3. Cleanup and quality checks

- [x] 3.1 Confirmed `assetsApi` remains unchanged for application-resource and file (no accidental removal of shared logic)
- [x] 3.2 Confirmed `importToolsets`, `exportToolsets`, `getAssetTools`, `tryOutAssetTool`, `signInToolset`, `signOutToolset` are untouched (deferred, per Non-goals)
- [x] 3.3 `npm run lint` / `npm run format` — clean
- [x] 3.4 `vitest run` — `assets-toolsets/actions.spec.ts` (19/19), `src/server/core/tests/*` all green, full-repo suite green
- [x] 3.5 `openspec validate migrate-toolset-resources-to-core --strict` — passes

<!--
No browser-verification task, consistent with the prior per-type changes: unit tests mocking the Core client are sufficient; browser verification against a live Core instance is deferred in favor of speed.
-->
