## 0. Prerequisite

- [x] 0.1 Confirmed `add-core-asset-client` landed; reused `AssetApi`'s application-resource support plus the `getMergedWithEtag`/`move` extensions and `validateApplicationResourceFields` (D6) built while implementing the prior three per-type changes
- [x] 0.2 Confirmed no `tryOutAssetTool`/call-tool action exists for application-resources in `assets-applications/actions.ts`

## 1. Wire server actions to Core

- [x] 1.1 `getApps` — now calls `assetApi.list(token, ResourceType.APPLICATION, path)`
- [x] 1.2 `getApp` — list-then-filter preserved (design D3): `assetApi.list` then `assetApi.getMergedWithEtag<AssetApp>`; validityState merged in (design D1, see section 2) only when the merge succeeded
- [x] 1.3 `createApp` — now calls `assetApi.put(...)` with no etag/override (`If-None-Match: *`); D4 validation runs first and short-circuits before any Core call on failure; builds the versioned path via `getVersionedName`; `applicationProperties`/`displayVersion` shaping unchanged
- [x] 1.4 `updateApp` — now calls `assetApi.put(token, APPLICATION, app.path, {...}, { etag })`; D4 validation runs first; `applicationProperties`/`defaults`/`responsesDefaults`/`displayVersion` shaping unchanged
- [x] 1.5 `removeApp` — now calls `assetApi.delete(token, APPLICATION, path, etag)`
- [x] 1.6 `bulkDeleteApps` — loops `assetApi.delete` per path, fail-fast, matching conversations/prompts/toolsets
- [x] 1.7 `moveApps` — now calls `assetApi.move(...)` per path via `Promise.all`; duplicate-rename logic untouched

## 2. Validity-state Phase 1 seam (design D1)

- [x] 2.1 Implemented `withValidityState(token, app)`: calls `assetsApi.getAsset(token, app.path, ResourceType.APPLICATION)` (the plain, non-conditional BE read — not `getAssetWithEtag`, which would have sent an incorrect `If-None-Match` precondition for a side-channel read) and extracts only `validityState`
- [x] 2.2 Merged into `getApp`'s single-resource result only — **not** into `getApps`' list rows. Deviation from the design doc's literal wording ("and each item returned by getApps"), justified by evidence: grepped the entire FE for `validityState` usage and confirmed `VALIDITY_STATUS_COLUMN` is wired only into the **deployment-config** Applications grid (`/applications`) and the Keys grid — never into `Assets/Apps` (`/assets-applications`) list or detail view. Merging it into every list row would mean one extra BE call per row on every list load for a field nothing renders; merging it into the single `getApp` result costs one extra call per detail-page load and preserves the full contract if a future UI change starts reading it there.
- [x] 2.3 Unit tests: `validityState` present and correct when the BE returns one; defaults to `{ valid: true, message: '' }` when the BE has none; the BE call is skipped entirely when the Core merge itself already failed

## 3. Tests

- [x] 3.1 `assets-applications/actions.spec.ts` rewritten: the seven migrated actions plus the validity-state seam mock `assetApi`/`assetsApi.getAsset`; `importApps`/`exportApps`/`getAssetTools` still mock `assetsApi`, unchanged — 18/18 passing
- [x] 3.2 Added a create-conflict case: a failed `assetApi.put` surfaces as `{ success: false, errorMessage }` through `createApp` unchanged
- [x] 3.3 Added cases for `removeApp` with and without an etag
- [x] 3.4 Added cases for D4's shared validation rejecting an invalid `viewerUrl` on create and an out-of-range `maxInputAttachments` on update — both short-circuit before `assetApi.put` is called
- [x] 3.5 Added a case for `moveApps` with `duplicateName`, asserting the destination keeps the source's version suffix

## 4. Cleanup and quality checks

- [x] 4.1 Confirmed `assetsApi` remains unchanged for file (no accidental removal of shared logic); it is also the (intentional, Phase 1) dependency for `withValidityState`
- [x] 4.2 Confirmed `importApps`, `exportApps`, `getAssetTools` are untouched (deferred, per Non-goals)
- [x] 4.3 Tracked follow-up: port `ApplicationResourceValidityStateOnGetResolver` (DB-backed `ApplicationTypeSchema` lookup + Core-library JSON-schema validation) in a Phase 2 change once a TS JSON-schema validator is chosen (see design's Open Questions) — this removes `withValidityState` and its BE dependency entirely
- [x] 4.4 `npm run lint` / `npm run format` — clean
- [x] 4.5 `vitest run` — `assets-applications/actions.spec.ts` (18/18), `src/server/core/tests/*` all green, full-repo suite green
- [x] 4.6 `openspec validate migrate-application-resources-to-core --strict` — passes

<!--
No browser-verification task, consistent with the prior per-type changes: unit tests mocking the Core client and the scoped BE validity-state call are sufficient; browser verification against a live Core instance is deferred in favor of speed.
-->
