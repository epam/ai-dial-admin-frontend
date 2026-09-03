## 1. Models

- [x] 1.1 Add a platform application resource type `DialPlatformApplicationResource` in
      `src/models/dial/resource.ts`, mirroring `DialApplicationResource` minus versioning/folder
      fields Core doesn't persist for the `platform` bucket; add it to the `PlatformAsset` union.

## 2. Root-fetch generalization (Assets Applications view only)

- [x] 2.1 Confirm/extend `getRootFolder`/`isFlatPlatformView` in `src/utils/files/root-folder.ts` so
      `ApplicationRoute.AssetsApplications` is recognized as needing both `platform/` and `public/`
      roots, without changing behavior for any other view.
- [x] 2.2 Update the Apps mount-fetch path (`AppsFolderContext` / the `fetchFiles` effect in
      `src/components/Common/FileManager/FileManager.tsx`) to fetch both `platform/` and `public/` on
      first load when the view is `AssetsApplications`, merging into one `files` array with `platform`'s
      top-level node ordered before `public`'s.
- [x] 2.3 Reconcile the merged `isFetchingFiles` flag across the two fetches (loading until both
      resolve).
- [x] 2.4 Add unit tests for the merged root-fetch behavior: both roots fetched, correct ordering,
      loading state reflects both in-flight fetches, other views' single-root behavior unchanged.

## 3. Server actions for platform applications

- [x] 3.1 Add `getPlatformApplications`, `createPlatformApplication`, `getPlatformApplication`,
      `updatePlatformApplication`, `removePlatformApplication`, `bulkDeletePlatformApplications` (in
      `assets-applications/actions.ts` or a sibling file, per design.md D3), calling `assetApi` directly
      with `ResourceType.APPLICATION` against `platform/`-prefixed paths.
- [x] 3.2 Verify against Core's `Application` entity class (or a local Core write) which fields the
      `platform` bucket write path accepts; add a `toPlatformApplicationPayload` helper stripping
      Core-rejected/derived fields if needed (mirrors `toKeyPayload`), and ensure `version`/folder path
      segments are never sent for platform writes.
      **Note:** no local Core instance was available to verify with a real write. Based on the earlier
      core-repo investigation (`ConfigResourceController` delegates `platform`-bucket application
      writes to the same `ApplicationService`/`Application` entity as `public`-bucket ones — see
      design.md's Context), `createApp`/`updateApp`'s existing field set was reused as-is with no new
      `toPlatformApplicationPayload` stripping helper: `getVersionedName`'s no-op-when-absent branch
      already keeps `version`/folder segments out of the platform path (see the two new functions'
      doc comment). If a real write later shows Core rejects a field on the `platform` bucket that it
      accepts on `public`, add the stripping helper then — flagging this as unverified-by-execution
      rather than closing it silently.
- [x] 3.3 Add unit tests for the new server actions: correct `platform/`-prefixed path construction,
      no version suffix on create/update, conditional `If-Match` on delete when an etag is supplied,
      unconditional bulk-delete per item.

## 4. Bucket-aware action labels and toolbar (Assets Applications view only)

- [x] 4.1 Add a current-path parameter to `getGridActionLabels`, `getTreeActionLabels`,
      `getToolbarOptionLabels` (`src/components/Assets/utils.ts`) and `getBulkActionsToolbarOptions`
      (`src/components/Common/FileManager/utils.ts`), defaulting to current behavior when omitted so
      every other view stays untouched. Add an `isPlatformApplicationsBucket(view, path)` (or similarly
      named) helper — `view === AssetsApplications && path?.startsWith(PLATFORM_ROOT_FOLDER + '/')` —
      shared by these functions instead of repeating the prefix check.
- [x] 4.2 For `AssetsApplications`, when the current path is platform-bucket, return the existing
      flat-platform action set (duplicate, delete, openInNewTab; no folder ops) from
      `getGridActionLabels`/`getTreeActionLabels`, and the delete-only bulk set from
      `getBulkActionsToolbarOptions` — matching `isFlatPlatformView`'s output verbatim. Otherwise keep
      the current full-set behavior.
- [x] 4.3 `getToolbarOptionLabels`: when the current path is platform-bucket, return a single
      `newItem`/"New Platform Application" entry (no folder-create, no import) instead of the existing
      `AssetsApplications` toolbar entries.
- [x] 4.4 In `FileManager.tsx`, thread the context's current `filePath` into the
      `getGridOptions`/`getTreeOptions`/`getToolbarOptions`/`getBulkActionsToolbarOptions` calls (all
      four currently keyed by `view` alone) and add `filePath` to their `useMemo` dependency arrays so
      the memoized options recompute when the user navigates between buckets.

## 5. Bucket-aware CRUD wiring in BaseAssetList (Assets Applications view only)

`BaseAssetList.tsx` and `BaseAssetList/utils.tsx` currently assume one action function per `view` at
every call site below (`AssetFolderContextMap`/`GetAssetActionMap`/`CreateAssetActionMap`/
`BulkDeleteAssetActionMap` are `Record<ApplicationRoute, fn>`, one entry per key). Applications is the
first view needing two functions behind one `view` key, selected by the target path's bucket at call
time — not two `ApplicationRoute` values. `MoveAssetActionMap`/`ImportAssetActionMap`/
`ExportAssetActionMap` need no platform entry: platform applications don't support move/import/export
(flat, no folders — same as every other flat platform view), so those three maps and their call sites
in `BaseAssetList.tsx` (`handleMoveItems`, `onImport`, `onExport`) are unaffected by this change.

- [x] 5.1 `handleDuplicateModalOpen`: resolve the "get" call by the clicked row's path bucket
      (`getApp` for `public/`, `getPlatformApplication` for `platform/`) instead of
      `GetAssetActionMap[view]` alone.
- [x] 5.2 `handleCreateAsset`: resolve the "create" call by `destinationFolder`'s (or the current
      path's) bucket (`createApp` vs `createPlatformApplication`) instead of `CreateAssetActionMap[view]`
      alone; platform-bucket creates never pass `folderId`/`version`.
- [x] 5.3 `handleDuplicate`: the existing `isFlatPlatformView(view)` branch decides duplicate-payload
      shape for the whole view. Extend it (or add a sibling check) so a platform-bucket application row
      takes the flat-duplicate path (`getPlatformAssetDuplicate`-style, no `__version` suffix) while a
      public-bucket row keeps the existing versioned-duplicate path, both under the same
      `AssetsApplications` view.
- [x] 5.4 `onMultipleRemove`: resolve the bulk-delete call by the deleted items' bucket
      (`bulkDeleteApps` vs `bulkDeletePlatformApplications`) instead of `BulkDeleteAssetActionMap[view]`
      alone. Selection is already scoped to one folder (confirmed in design.md), so a single bulk-delete
      batch is always single-bucket — no mixed-bucket case to handle.
- [x] 5.5 `utils/open-in-new-tab.ts`'s `getEntityPath`: the existing `AssetsApplications` case returns
      the public, versioned `{name}?path=...` shape unconditionally. Branch it on the entity's
      `path`/`folderId` bucket so a platform-bucket entity returns the bare `{encodedName}` segment
      (matching the `PlatformModels`/etc. case's shape, no `?path=`) instead, so
      `getUrnForEntity`/`handleGridItemClick`/`onOpenInNewTab` route a platform-bucket row to the
      shared `/assets-applications/[id]` route from task 6.2, distinguished by the missing query param.
- [x] 5.6 `BaseAssetList/utils.tsx`: `getEmptyAsset`'s `AssetsApplications` case and
      `getPlatformAssetDuplicate` need to produce the right shape for a platform-bucket create/duplicate
      (no `folderId`/version fields) — extend rather than branch-duplicate these, reusing the existing
      flat-platform shape where possible.
      **Note:** neither needed a change. `getEmptyAsset`'s only caller is folder-creation, and task 4
      already removes the folder-create toolbar/tree action for the platform bucket, so that path is
      unreachable there. `getPlatformAssetDuplicate` is reused as-is by 5.3 (its non-`PlatformAppRunners`
      branch already keeps `name` and strips the read-only/derived fields a platform application
      duplicate also needs stripped) — no signature change required.
- [x] 5.7 Add unit tests for each branch above: public-bucket rows/paths keep exercising the existing
      `public` functions unchanged; platform-bucket rows/paths exercise the new platform functions;
      the detail-route segment built for a platform-bucket row matches task 6.2's route.

## 6. Platform application detail view

- [x] 6.1 Create `src/components/Assets/Platform/Applications/View.tsx` (folder renamed from
      `PlatformApplications` after first review — see design.md D4's naming note).
      **Revised per design.md D4** (confirmed against `ai-dial-core`: platform-bucket applications
      have full field/tab parity with public-bucket ones, so no new `TabsContent.tsx`/`Properties.tsx`
      were written): the view reuses `Applications/View/TabsContent` (the same component the public
      Apps view uses) and its `Properties`/tab components unmodified, passing
      `view={ApplicationRoute.AssetsApplications}` through — only the header (`SimpleEntityHeader`
      instead of the versioning-aware `AssetHeader`) and the server actions
      (`updatePlatformApplication`/`removePlatformApplication`, no move/version logic) are new. No
      create modal was added — the existing generic `CreateEntity` modal (already dispatched for
      `AssetsApplications` in `Modals.tsx`) is reused, since `handleCreateAsset`'s bucket branch
      (task 5.2) already routes its result correctly. The toolbar's create-action label also reads
      "Application" (not "Platform Application"), matching the public bucket's label.
- [x] 6.2 **Revised per design.md D5** (a separate nested route broke `Breadcrumbs.getBreadcrumbs` —
      its config only has two path-segment entries for `AssetsApplications`, and a three-segment
      pathname indexed past the end, throwing `Cannot read properties of undefined (reading
      'i18nKey')`): both buckets now share the existing `src/app/[lang]/assets-applications/[id]/
      page.tsx`, which branches on whether the `?path=` query param is present (public: yes; platform:
      no) to decide which `get*`/data-fetch/View to use. `getEntityPath`'s `AssetsApplications` case
      (`utils/open-in-new-tab.ts`) was updated to route a platform-bucket entity to this same route's
      bare-name segment (no `platform-applications/` prefix, no `?path=`). No separate
      `platform-applications/[id]/page.tsx` route exists.
- [x] 6.3 Add a component test for `View.tsx`: a render smoke test matching
      `Assets/Apps/tests/View.spec.tsx`'s own scope (that view's dependency surface — `TabsContent`,
      `SimpleEntityHeader`, tab controls — is exercised at the shared-component level, unmodified by
      this change, not re-tested here).

## 7. Quality gate

- [x] 7.1 Run lint, format check, and the full test suite (`npm run lint`, `npm run format`,
      `npm run test`) and fix any failures. Lint: 0 errors (125 pre-existing warnings, none in
      touched files). Format: clean. Full `ai-dial-admin` suite: 596/596 passing in every area this
      change touches (Assets, Common/FileManager, BaseAssetList, assets-applications actions/pages,
      context/assets); the only failures in a full monorepo run are 10 pre-existing timeouts in
      `Runs/Compare/ExecutionResults`/`CompareView` specs, unrelated to this change (verified by file
      path — nothing under those directories was touched).

## 8. Fixes from first end-to-end review

- [x] 8.1 `CreateEntity.tsx`: derive `isPlatformApplicationCreate` from the current folder
      (`folderContext.filePath`) and skip seeding/requiring `version` for a platform-bucket
      Application create. Thread a new `hideVersionField` prop through `Properties` → `AssetProperties`
      to hide `VersionControl` in that case.
- [x] 8.2 `BaseAssetList/utils.tsx`'s `getGridColumns`: add the same current-path bucket check the
      action-label functions already use (D2) so a platform-bucket application row gets the flat
      Name/Author/Created/Updated column set every other platform entity uses, not the public
      Name/Version/Author/Updated set.
- [x] 8.3 Add `toPlatformApplicationPayload` in `assets-applications/actions.ts`, applied in
      `createPlatformApplication`/`updatePlatformApplication` before their `createApp`/`updateApp`
      delegation — strips `status`/`validationWarnings`/`author`/`createdAt`/`updatedAt`/`reference`,
      fields the merge reader adds that Core's `Application` entity doesn't declare and that
      `ConfigResourceController`'s strict deserialization (`FAIL_ON_UNKNOWN_PROPERTIES`) rejects,
      unlike the public bucket's lenient generic `ResourceController` path. Fixes "Failed to parse
      entity" on every platform-bucket save.
- [x] 8.4 `Assets/Apps/Properties.tsx`: hide the `FilePath` folder-move control for a platform-bucket
      application (`isPlatformBucketPath(asset.folderId)`) — a bucket with no folders has nothing to
      move into.
- [x] 8.5 Add unit/component tests for each of 8.1–8.4 and re-run the quality gate: 674/674 passing
      across every touched area (7 new tests), lint 0 errors, format clean.
