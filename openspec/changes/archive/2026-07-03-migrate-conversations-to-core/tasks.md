## 0. Prerequisite

- [x] 0.1 Confirmed `add-core-asset-client` landed (archived 2026-07-03); read its actual `AssetApi`/`FilesCoreApi` exports. Found and closed one gap: `AssetApi.getMerged` didn't surface the content resource's etag, but `getConversation` needs to thread it back to the caller for a later conditional write — added `AssetApi.getMergedWithEtag<T>()` (returns `ServerActionResponse<T>` with `etag`, matching the `*ActionWithEtag` contract `getConversation` already exposed) as a scoped extension, tested in `src/server/core/tests/asset-api.spec.ts`
- [x] 0.2 Re-confirmed: no create/update/move/import/export action exists for conversations in `src/components/Assets/Conversations/` or `src/app/[lang]/conversations/actions.ts` — scope stands as list/get/delete/bulk-delete only

## 1. Wire server actions to Core

- [x] 1.1 `getConversations` — now calls `assetApi.list(token, ResourceType.CONVERSATION, path)` instead of `assetsApi.getAssetList`
- [x] 1.2 `getConversation` — now calls `assetApi.getMergedWithEtag<DialConversation>(token, ResourceType.CONVERSATION, path, etag)` instead of `assetsApi.getAssetWithEtag`
- [x] 1.3 `deleteConversation` — now calls `assetApi.delete(token, ResourceType.CONVERSATION, path, etag)` instead of `assetsApi.removeAssetWithEtag`; optional-etag behavior preserved (etag passed through as-is, `undefined` when omitted)
- [x] 1.4 `deleteConversations` — now loops over `assetApi.delete(token, ResourceType.CONVERSATION, path)` per path, fail-fast (stops and returns the first failure), matching the BE's sequential fail-fast bulk-delete behavior; returns `{ success: true }` once all paths succeed

## 2. Tests

- [x] 2.1 `conversations/actions.spec.ts` rewritten to mock `assetApi` instead of `assetsApi`; all four actions covered — 8/8 passing
- [x] 2.2 Added a case: `getConversations('')` still calls through with the empty path (defaulting is `assetApi.list`'s own responsibility, verified in `add-core-asset-client`'s own tests)
- [x] 2.3 Added cases: `deleteConversation` with and without an etag (etag passed through / `undefined`); `deleteConversations` fail-fast (stops after the first failing path and returns that failure, doesn't attempt remaining paths)

## 3. Cleanup and quality checks

- [x] 3.1 Confirmed `assetsApi` is untouched — still exported and used by prompts/toolsets/application-resources/files actions; only the conversations call sites moved
- [x] 3.2 `npm run lint` / `npm run format` — no new violations (one pre-existing unrelated file was auto-formatted by a prior change)
- [x] 3.3 `vitest run` — `src/app/[lang]/conversations/actions.spec.ts` (8/8) and `src/server/core/tests/*` (11/11 in `asset-api.spec.ts`, all others still green) all passing
- [x] 3.4 `openspec validate migrate-conversations-to-core --strict` — passes

<!--
No browser-verification task, per explicit user decision: unit tests (mocking the Core client) are sufficient for this change; browser verification against a live Core instance was declined in favor of speed.
-->
