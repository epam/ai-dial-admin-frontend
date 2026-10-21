## 1. Generalize the dual-bucket helpers (Applications-only → view-agnostic)

- [x] 1.1 In `src/utils/files/root-folder.ts`: add `DUAL_BUCKET_VIEWS` (`AssetsApplications`,
  `AssetsToolsets`); change `getRootFolders` to check membership in that array instead of
  `view === ApplicationRoute.AssetsApplications`.
- [x] 1.2 In `src/components/Assets/utils.ts`: rename `isPlatformApplicationsBucket` →
  `isPlatformDualBucketView` (moved to/re-exported from `root-folder.ts` alongside
  `isFlatPlatformView`/`isPlatformBucketPath`, checking `DUAL_BUCKET_VIEWS`), update its call sites in
  `getGridActionLabels`/`getTreeActionLabels`/`getToolbarOptionLabels`. Replace
  `getToolbarOptionLabels`'s hardcoded `FileManagerI18nKey.Application` dual-bucket entry with a
  per-view label (`FileManagerI18nKey.Toolset` for `AssetsToolsets`, `FileManagerI18nKey.Application`
  otherwise).
- [x] 1.3 In `src/components/Assets/BaseAssetList/utils.tsx`: update `getGridColumns`'s bucket check
  to use `isPlatformDualBucketView`.
- [x] 1.4 In `src/components/EntityListView/CreateEntity/CreateEntity.tsx`: rename
  `isPlatformApplicationCreate` → `isPlatformDualBucketCreate`, switching its condition from
  `route === ApplicationRoute.AssetsApplications` to `DUAL_BUCKET_VIEWS.includes(route)`.
- [x] 1.5 Update every existing test referencing the renamed symbols
  (`Assets/tests/utils.spec.ts`, `BaseAssetList/tests/utils.spec.ts`,
  `BaseAssetList/tests/platform-applications-bucket.spec.tsx`,
  `CreateEntity/tests/CreateEntity.spec.tsx`, `utils/files/tests/root-folder.spec.ts`) so existing
  Applications-bucket assertions keep passing under the new names.

## 2. Models and server actions for platform-bucket toolsets

- [x] 2.1 In `src/models/dial/resource.ts`: add `DialPlatformToolsetResource` (mirrors
  `DialPlatformApplicationResource`'s shape relative to `DialApplicationResource`: omit
  `version`/`nodeType`/`created_at`/`updated_at`/`etag` from `DialToolsetResource`, add
  `ModifiedEntity`, `author`, `status`, `validationWarnings`); add it to the `PlatformAsset` union.
- [x] 2.2 In `src/app/[lang]/assets-toolsets/actions.ts`: add `getPlatformToolset`,
  `createPlatformToolset`, `updatePlatformToolset`, `removePlatformToolset`,
  `bulkDeletePlatformToolsets`, calling `assetApi` directly with `ResourceType.TOOLSET` against a
  `platform/`-prefixed path, never setting `version` or a folder-derived path segment (mirroring
  `assets-applications/actions.ts`'s platform functions and `platform-keys/actions.ts`'s direct-Core
  pattern).
- [x] 2.3 Add `toPlatformToolsetPayload` (mirroring `toPlatformApplicationPayload`), stripping
  `status`/`validationWarnings`/`author`/`createdAt`/`updatedAt`/`reference` before
  `createPlatformToolset`/`updatePlatformToolset` write.
- [x] 2.4 Unit tests for the new server actions and the payload-stripping helper in
  `assets-toolsets/actions.spec.ts` — platform-prefixed path construction, no version/folder segment,
  field stripping, conditional etag on update/delete.

## 3. Platform bucket action-map wiring

- [x] 3.1 In `src/components/Assets/BaseAssetList/utils.tsx`: add platform-bucket entries to
  `GetAssetActionMap`/`CreateAssetActionMap`/`BulkDeleteAssetActionMap` (or the equivalent
  bucket-aware dispatch Applications' platform entries use) so `AssetsToolsets` rows resolve to
  `getPlatformToolset`/`createPlatformToolset`/`bulkDeletePlatformToolsets` while browsing the
  `platform` bucket, and to the existing public functions otherwise.
- [x] 3.2 Unit tests covering the bucket-aware dispatch for Toolsets (mirroring the equivalent
  Applications test in `platform-applications-bucket.spec.tsx`).

## 4. Platform toolset detail view

- [x] 4.1 Create `src/components/Assets/Platform/Toolsets/View.tsx`: header chrome
  (`SimpleEntityHeader`) + save/discard/remove wired to the new platform server actions, reusing
  `Assets/Toolsets/View/TabsContent` and `ResourceAuthButtons` (sign-in/out) unmodified — mirrors
  `Assets/Platform/Applications/View.tsx`'s structure.
- [x] 4.2 In `src/app/[lang]/assets-toolsets/[id]/page.tsx`: branch on `searchParams.path` presence —
  absent → build `platform/{id}`, fetch via `getPlatformToolset`, render the new platform View;
  present → existing `getToolset` flow, render the existing public `ToolsetView` unchanged.
- [x] 4.3 In `src/utils/open-in-new-tab.ts`: update `getEntityPath`'s `AssetsToolsets` case to resolve
  a platform-bucket toolset to the bare `{encodedName}` segment with no `?path=`, matching the
  Applications precedent.
- [x] 4.4 In `src/components/Assets/Toolsets/View/Properties.tsx`: guard the `FilePath` folder-move
  control with `!isPlatformBucketPath(selectedToolset.folderId)`, mirroring
  `Assets/Apps/Properties.tsx`.
- [x] 4.5 Unit tests for the new `View.tsx` (mirroring
  `Assets/Platform/Applications/tests/View.spec.tsx`) and for the updated `Properties.tsx`/
  `page.tsx`/`open-in-new-tab.ts` branches.

## 5. Final quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, and the full `npm run test` suite from
  `apps/ai-dial-admin/`; fix any failures.
