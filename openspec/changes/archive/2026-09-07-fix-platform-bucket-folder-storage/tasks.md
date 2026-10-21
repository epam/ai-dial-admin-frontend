## 1. Fix the platform-bucket folderId read path

- [x] 1.1 In `apps/ai-dial-admin/src/server/core/asset-metadata.ts`, change `dualBucketMetadataFields`'s
      platform branch to spread `flatMetadataFields`'s result and override `folderId: 'platform/'`
      explicitly (`flatMetadataFields`'s underlying `parseEncodedFlatPath` hardcodes `folderId: ''`
      unconditionally, since flat resources have no folder concept).
- [x] 1.2 Grep every read of `.folderId` on `DialApplicationResource`/`DialToolsetResource` (both
      platform and public consumers, including `ApplicationAssetProperties`, `ToolsetAssetProperties`,
      `FoldersStorageLabel`, `updatePlatformApplication`/`updatePlatformToolset`'s `fetchFiles` calls,
      and any grid/list code reading a merged application/toolset's `folderId`) and confirm each either
      already expects `'platform/'` or is one of the three surfaces this change targets — fix or note
      any caller that assumed the old `''` value.
      Audit result: `ApplicationAssetProperties`/`ToolsetAssetProperties`/`FoldersStorageLabel` are the
      three targeted surfaces (tasks 2-3). `isPlatformBucketDelete` in `Assets/Modals/utils.tsx` was
      silently dead before this fix and now correctly activates, matching its own comment's stated
      intent — a behavior improvement, not a regression, and out of this change's scope to test.
      **Correction (post-landing):** the `platformAsset.path || platformAsset.folderId` fallback in
      `Modals.tsx`'s duplicate-modal-selection check was *not* unaffected — `path` always won the `||`
      and never carried the bucket prefix, so `isPlatformDualBucketView` came back `false` for a
      platform-bucket row and the wrong duplicate modal (versioned `DuplicateAsset`, with its
      "Duplication type" selector) rendered. This surfaced as Issue #4420 and was fixed by dropping the
      `.path` fallback now that this change makes `folderId` itself reliably `'platform/'`.
      `BaseAssetList.tsx`'s `handleDuplicate` had the identical `platformAsset.path || platformAsset.folderId`
      pattern at its own `isPlatformDualBucketView` call (deciding which duplicate *action* to run, after
      the modal closes) — same latent bug, now also fixed by dropping the `.path` fallback there too.
      The two related bucket-branch spec files' `confirm-duplicate-platform` fixtures hardcoded
      `folderId: undefined` (correct back when `folderId` was always unreliable pre-fix) and were updated
      to `folderId: 'platform/'` to match what a real post-fix platform-bucket resource now carries.
      `fetchFiles(selectedApp.folderId)` in the platform detail views now refreshes the correct root
      instead of a no-op `fetchFiles('')`. The only caller assuming the old `''` value is the existing
      unit test in `asset-metadata.spec.ts` (fixed in 1.3).
- [x] 1.3 Add/update unit tests for `dualBucketMetadataFields`/`mergeApplicationResource`/
      `mergeToolsetResource` in `asset-metadata`'s test file covering: a platform-bucket resource's
      `folderId` is `'platform/'`, and a public-bucket resource's `folderId`/`path`/`version` are
      unchanged.

## 2. Hide the Move-to control for platform-bucket entities

- [x] 2.1 Verify (with a component test, adding one if missing) that `ApplicationAssetProperties`'s
      existing `!isPublication && !isPlatformBucketPath(asset.folderId)` guard now hides the `FilePath`
      Move-to control for a platform-bucket application, given the Task 1 fix, and still shows it for a
      public-bucket application with a real `folderId`.
      Verified: `Apps/tests/Properties.spec.tsx` already had both cases (public-bucket shows, platform
      shows-hidden) — no new test needed. Both pass against the fixed read path (3/3).
- [x] 2.2 Do the same for `ToolsetAssetProperties`.
      Verified: `Toolsets/View/tests/Properties.spec.tsx` already had both cases too — no new test
      needed. Both pass (4/4).

## 3. Show the platform bucket in the header Folder Storage field

- [x] 3.1 In `apps/ai-dial-admin/src/components/Assets/Header/FolderStorage.tsx`, add an
      `isPlatformBucketPath(asset.folderId)` branch in `FoldersStorageLabel` that renders the literal
      `platform` bucket name with no `IconExternalLink` postfix button, ahead of the existing
      folder-path-and-link rendering; keep the existing `asset.folderId &&` gate for the public,
      no-folder case.
- [x] 3.2 Add/update `FoldersStorageLabel`'s component tests: a platform-bucket asset renders `platform`
      with no link button (query by role/accessible name per `.claude/rules/a11y.md` and
      `testing.md` §4); a public-bucket asset with a folder path is unaffected.
      Added `Header/tests/FolderStorage.spec.tsx` (no prior test file existed): platform-bucket renders
      `platform` with no button; public-bucket renders the path with a button; no-folderId renders
      nothing. 3/3 passing.

## 4. Filter the platform root out of the Move-to popup's destination tree

- [x] 4.1 In `apps/ai-dial-admin/src/components/Common/FilePath/utils.ts`, add a pure helper that,
      given the shared `AssetsFolderContext` `files` array and the current `view`, drops the `platform`
      root node when `view` is in `DUAL_BUCKET_VIEWS` and returns the array unchanged otherwise.
      
- [x] 4.2 In `apps/ai-dial-admin/src/components/Common/FilePath/FilePath.tsx`, apply that helper to
      `files` before computing `items={processAssetsData(...)}` and `rootItem`, so `rootItem` resolves
      to the `public` root for dual-bucket views instead of `files?.[0]`.
     
- [x] 4.3 Add/update unit tests for the new filtering helper (drops `platform` for a dual-bucket view's
      `files`, passes non-dual-bucket `files` through unchanged) and a `FilePath`/`DialDestinationFolderPopup`
      component test confirming `platform` is not offered as a Move-to destination for a public-bucket
      application/toolset.
     

## 5. Final quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, and `npm run test` (full coverage run) from the repo
      root and fix any failures.
      `npm run lint`: clean (0 errors, 113 pre-existing unrelated warnings). `npm run format`: found
      one file (`Common/FilePath/tests/utils.spec.ts`) needing reformatting, fixed via
      `prettier --write`. `npm run test` (full coverage, 957 files/10958 tests): 14 tests failed, all
      "Test timed out in 5000ms" in `Analytics/QueryBuilder/tests/QueryBuilder.spec.tsx` and
      `EntityListView/CreateEntity/tests/CreateEntity.spec.tsx` — neither file touches
      `FilePath`/`AssetsFolderContext`/`root-folder`. Re-ran `CreateEntity.spec.tsx` in isolation: 8/8
      passed in 3s, confirming full-suite resource contention flakiness, not a regression from this
      change. All 23 tests added/extended by this change pass.
