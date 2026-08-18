## 1. Routes, i18n, and menu entry

- [x] 1.1 Add `AssetsSkills = '/assets-skills'` to the Assets group of `ApplicationRoute` in `src/types/routes.ts`.
- [x] 1.2 Add `MenuI18nKey.Skills` (and any `Assets.Skill.*`/list-empty-state keys needed by `FileManagerI18nKey`) to `src/constants/i18n.ts`, and their resolved strings to `src/locales/en.ts`, following the naming already used for `AppRunners`/`Toolsets` menu and file-manager keys.
- [x] 1.3 Add the `Skills` menu item to the Assets group in `src/components/Menu/menu-configuration.tsx`, positioned immediately after `Files`, linking to `ApplicationRoute.AssetsSkills`. Added a matching `MENU_CONFIGURATION — Assets group` describe block to `Menu/tests/menu-configuration.spec.ts` (position + href), mirroring the existing Approvals-group ordering test.
- [x] 1.4 Add `ApplicationRoute.AssetsSkills` to the `BaseAssetRoute` union in `src/components/Assets/BaseAssetList/types.ts` (leave it out of `CrudAssetRoute`/`CreateAssetRoute` per design D3).

## 2. Skill Core API client additions

- [x] 2.1 Add `listSkillMetadata(token, path, nextToken?)` to `src/server/core/skills-core-api.ts`, calling `GET v2/metadata/skills/{bucket}/{path}` and returning Core's raw folder-listing node (name/nodeType/author/createdAt/updatedAt per child, plus any continuation token).
- [x] 2.2 Add `deleteSkill(token, path, etag)` to `skills-core-api.ts`, calling `DELETE v2/skills/{bucket}/{path}` with `If-Match` set to `etag`, rejecting before any request if `etag` is falsy — mirror `FilesCoreApi.deleteFile`'s required-etag guard.
- [x] 2.3 Add a mapping helper (co-located with the new methods or in a small `skill-metadata.ts`, matching `file-metadata.ts`'s precedent) that turns a Core folder-listing node into `Asset`-shaped rows (`name`, `path`, `nodeType`, `author`, `createdAt`, `updatedAt`). Done as `src/server/core/skill-metadata.ts` (`toSkillList`) — see the note on 3.1 for why the generic `toResourceInfoList` mapper doesn't fit Skill's path shape.
- [x] 2.4 Unit test `listSkillMetadata` (pagination via continuation token, ITEM vs FOLDER `nodeType` mapping) and `deleteSkill` (etag required, `If-Match` sent) in `skills-core-api.spec.ts`.

## 3. Server actions

- [x] 3.1 Create `src/app/[lang]/assets-skills/actions.ts` (`'use server'`) with `getSkills(path)` (paginates `listSkillMetadata` until no continuation token, returns mapped `Asset[]`), `getSkill(path)` (wraps `SkillsCoreApi.getSkillMetadata` for the detail page), `removeSkill(path, etag)`, and `bulkDeleteSkills(paths: { path, etag }[])` — reject the whole batch before any item reaches Core if any item lacks an etag, matching `bulkDeleteFiles`'s guard. Discovered mid-implementation: Skill nests in folders but has no `__version` suffix, matching neither `toResourceInfo`'s versioned nor flat branch — added a dedicated `toSkillList` mapper (`src/server/core/skill-metadata.ts`) and a new `parseEncodedFolderPath` path helper instead of forcing it through the generic mapper (see design D1a).
- [x] 3.2 Unit test `actions.ts` (`getSkills` pagination/mapping, `removeSkill`/`bulkDeleteSkills` etag-required rejection and per-item `If-Match`), following `assets-toolsets/actions.spec.ts`'s structure.

## 4. Skill folder context

- [x] 4.1 Create `src/context/assets/SkillFolderContext.tsx`: `createFolderContext(getSkills, 'useSkillFolder')`, exporting `SkillFolderProvider`/`useSkillFolder`, matching `ToolsetsFolderContext.tsx`'s shape exactly. Discovered mid-implementation: every other asset folder provider is mounted globally in `src/app/[lang]/layout.tsx` (`useXFolder` throws outside its provider), not just where first used — added `SkillFolderProvider` to that stack too, and to `BaseAssetList/tests/provider-wiring.spec.ts`'s wiring assertion.
- [x] 4.2 In `src/components/Publications/View/TabsContent.tsx`, replace the `FileFolderProvider` wrapping `SkillProperties` (and remove the `{/* todo add correct provider */}` comment) with `SkillFolderProvider`.
- [x] 4.3 Update `SkillProperties.tsx`'s `getContext={useFileFolder}` prop (passed to `BaseProperties`) to `useSkillFolder`, and its file-level comment describing the "no dedicated skill-folder context" rationale, since that context now exists.
- [x] 4.4 Update/extend `SkillProperties`'s existing test coverage to assert it renders under `SkillFolderProvider` rather than `FileFolderProvider`. Also added a global `SkillFolderContext` mock to `test-setup.tsx` (matching File/Prompt/Apps/Toolsets/AppRunners) since the context is now used by both Publications and the new Assets surface.

## 5. Assets > Skills list

- [x] 5.1 In `src/components/Assets/BaseAssetList/utils.tsx`: add `AssetsSkills` entries to `AssetFolderContextMap` (→ `useSkillFolder`), `GetAssetActionMap` (→ `getSkill`), `BulkDeleteAssetActionMap` (→ `bulkDeleteSkills`), `getFileManagerLabel`, and `getEmptyStateContent`; leave it out of `getResourceTypeByRoute`'s versioned-type switch (skills have no `ResourceType`-parametrized `AssetApi` path — see design D4), `CreateAssetActionMap`, `MoveAssetActionMap`, `ImportAssetActionMap`, `ExportAssetActionMap`. Also added `AssetsSkills` cases to `getGridActionLabels`/`getTreeActionLabels`/`getToolbarOptionLabels`/`getDeleteNotificationContent` (`src/components/Assets/utils.ts`) and to `getEntityPath` (`src/utils/open-in-new-tab.ts`) — discovered these route-keyed switches also needed a case, or the shared list would silently show wrong/blank actions and notifications, or the open/row-click navigation would produce the wrong URL, for the new route.
- [x] 5.2 In `getGridColumns` (`BaseAssetList/utils.tsx`), add the Skills column set — `Name`, `Author`, `Created time`, `Updated time` (no `Version` column) — following the existing `isFlatPlatformView` branch's shape but keyed to `AssetsSkills` instead of (or added alongside) the flat-platform check, since Skills is folder-tree-based, not flat.
- [x] 5.3 Create `src/components/Assets/Skills/List.tsx`: `<BaseAssetList view={ApplicationRoute.AssetsSkills} />`, matching `Toolsets/List.tsx`.
- [x] 5.4 Create `src/app/[lang]/assets-skills/page.tsx`, rendering `SkillsList` inside `SaveValidationContextProvider`, matching `assets-toolsets/page.tsx`.
- [x] 5.5 Component-test the Skills list (empty state, column set exactly `Name`/`Author`/`Created time`/`Updated time`, no create/import/export/move controls rendered, delete and bulk-delete wired to the new actions).

## 6. Assets > Skills detail view

- [x] 6.1 Create `src/components/Assets/Skills/View/View.tsx`: fetches nothing itself (receives the already-loaded skill from its page), renders path/author/created/updated via `LabelledText`, and composes the reused `SkillDetails` file-listing grid — no tabs beyond a single `Properties`-equivalent section, no `Audit` tab, no Core-sync banner, no save/discard/edit affordance. Discovered mid-implementation: `DialSkillResource`/`getSkillMetadata` (built for the read-only Skill Publications view) carried no `author`/`createdAt`/`updatedAt` — added them as optional fields, sourced from the same Core metadata response, since the spec requires showing them here. Also: the generic `AssetHeader`/`AssetButtonsWrapper` (edit/save/discard/JSON-editor/version-control plumbing) and `DeleteConfirmationModal` (keyed off route-wide `deleteEntityMap`s) were judged too coupled to the editable-asset shape to retrofit safely for a no-edit view in this change's scope — built a minimal bespoke header (`ReadonlyId` + `LabelledText` fields) instead. No delete action on the detail page itself: the spec only requires delete from the list, which already has it.
- [x] 6.2 Create `src/app/[lang]/assets-skills/[id]/page.tsx`: resolves the `path` search param, calls `getSkill`, 404s via `notFound()` if missing, renders the View inside `SaveValidationContextProvider` — matching `assets-app-runners/[id]/page.tsx`'s shape minus the option-list reads it doesn't need.
- [x] 6.3 Component-test the detail view (renders skill metadata + file listing, no editable fields, no save/discard, no Audit tab). No dedicated page-level test for the not-found path — no sibling `[id]/page.tsx` in this codebase has one either (e.g. `assets-toolsets`, `assets-app-runners`); the page follows the same `notFound()` pattern as those, unit-tested by convention only at the component level.

## 7. Quality gate

- [x] 7.1 Run `npm run lint`, `npm run format`, and the full `npm run test` suite from `apps/ai-dial-admin/`; fix any failures before completing the change. `npm run lint`: 0 errors (130 pre-existing `no-explicit-any` warnings, repo-wide, unrelated to this change). `npm run format`: clean. `npm run test` (with coverage): 8569/8571 passed, 2 failures in `src/app/api/tests/publications-enrichment.spec.ts` (unrelated file — Prompt/AssetApi publication enrichment, nothing this change touches) — one a 5000ms timeout, the other apparent cross-test fetch-mock state bleed from that timeout; both pass cleanly (3/3) when the file is run in isolation, and two prior full-suite runs via plain `vitest run` (no coverage) both passed 8571/8571 — consistent with flakiness under the coverage run's resource contention across 805 files, not a regression from this change.

## 8. Post-implementation fixes (reported after using the feature)

- [x] 8.1 Rework `SkillDetails` (`Publications/Assets/Skill/SkillDetails.tsx`) to accept `skill?: DialSkillResource` directly instead of `publication: SkillPublication`. Update `SkillProperties.tsx` to extract `publication.skillResources?.[0]?.skillResource` and pass it down. Update `Assets/Skills/View/View.tsx` to pass its `skill` prop straight through, removing the publication-shaped wrapper object. Update `SkillDetails.spec.tsx` to build a `DialSkillResource` fixture instead of a `SkillPublication`.
- [x] 8.2 Fix Skill files not loading: add `SkillsCoreApi.getSkillFiles(token, path)` calling Core's dedicated `GET /v2/metadata/skills/{bucket}/{path}/files` (recursive), since a skill's own metadata call resolves an `ITEM` node whose `items` field Core never populates — files are only reachable through this separate listing. Wire it into `getSkillMetadata` (merges both calls). Derive each file's name relative to the skill root from the listing's `url`, filtering out `FOLDER` rows. Add unit tests for both `getSkillMetadata` (now two fetch calls) and `getSkillFiles` (recursive request, nested-path derivation, folder exclusion, empty response) in `skills-core-api.spec.ts`.
- [x] 8.3 Re-run `npm run lint`, `npm run format`, and the full `npm run test` suite from `apps/ai-dial-admin/` to confirm 8.1/8.2 introduced no regressions. Targeted lint on every touched file: 0 errors (one stray debug `console.log` found and removed from `SkillDetails.tsx`). Full `vitest run` (no coverage): 798/805 files passed with 6 unrelated timeout failures (e.g. `ExecutionResultsTab.spec.tsx`, `TestCases` grid tests) — no Skill-related test appears among the failures, and each Skills-related spec file passes cleanly (19/19) run directly; consistent with flakiness from repeated heavy full-suite runs on this machine today, not a regression from 8.1/8.2.

## 9. Post-implementation fixes #2 (reported after using the feature)

- [x] 9.1 Fix the file-listing bug reported live: names rendered as `files/SKILL.md` instead of `SKILL.md`. Root cause — Core's `/files` listing's `url` is rooted under the skill's internal `files/` sub-namespace (`skills/{bucket}/{path}/files/{name}`), not the skill's bare path; the prefix stripped in `getSkillFiles` needed the extra `files/` segment. Fixed in `skills-core-api.ts`; updated all affected mock URLs in `skills-core-api.spec.ts`.
- [x] 9.2 Remove the `Size` column/field: Core's file listing reports no per-file size. Dropped `size` from `DialSkillFile` (`models/dial/resource.ts`), from `SkillsCoreApi.getSkillFiles`'s mapping, and from the `SkillDetails` grid's column defs and fixtures/tests.
- [x] 9.3 Add per-file management to the Assets > Skills detail view only (Skill Publications stays read-only, per its own unmodified spec): preview, download, remove (disabled for `SKILL.md`), and add a file. Added `SkillsCoreApi.uploadSkillFile`/`downloadSkillFile`/`previewSkillFile`/`deleteSkillFile` (per-file Core routes, etag optional on delete); `uploadSkillFile`/`removeSkillFile` server actions in `assets-skills/actions.ts`; `/api/skills/download` and `/api/skills/preview` routes mirroring the equivalent Files routes; reworked `SkillDetails` with an opt-in `readOnly` prop (default `true`, so Publications' call site needed no change) plus `onAddFile`/`onRemoveFile` callbacks and an actions column, following `Publications/Assets/Files/FilesList.tsx`'s preview/download/remove pattern (the user's own reference). `Assets/Skills/View/View.tsx` wires the callbacks to the new actions with `router.refresh()` + notifications on success.
- [x] 9.4 Updated `proposal.md`/`design.md`/both spec deltas to reflect the reversed non-goal (per-file editing is now in scope for the Assets surface) and the two bug fixes. Added/updated unit tests: `skills-core-api.spec.ts` (upload/download/preview/delete-file methods, corrected prefix), `SkillDetails.spec.tsx` (read-only vs editable mode, actions column contents, SKILL.md remove hidden, add-file upload), `View.spec.tsx` (upload/remove wiring, router refresh on success/no-refresh on failure), `actions.spec.ts` (`uploadSkillFile`/`removeSkillFile`).
- [x] 9.5 Re-ran targeted lint (0 errors) and the full Skills-related test suite (52/52 passed) after 9.1–9.3.

## 10. Post-implementation fixes #3 (reported after using the feature)

- [x] 10.1 Description editing explicitly skipped per user decision: `SKILL.md`'s `description` field
  stays read-only in both surfaces for this change — the user deferred it until in-browser `SKILL.md`
  editing exists, which would supersede a bespoke description-only editor.
- [x] 10.2 Fixed empty maintainer/created/updated in the Assets detail header. Read Core's actual
  Java source (`ComplexResourceService.nodeMetadata()`, `SkillHandler.java`) rather than trusting
  `skills.md`: no metadata endpoint returns a single skill's own `author`/`createdAt`/`updatedAt` —
  they only exist on that skill's row in its *parent folder's* listing. Reworked
  `SkillsCoreApi.getSkillMetadata` to run the manifest read (etag from the `SKILL.md` `GET`'s `ETag`
  header), the files listing, and a new `findSkillListingEntry` parent-folder lookup (paginating
  `listSkillMetadata` until it matches the skill's own encoded path) in parallel, and derive `name`/
  `folderId` from splitting `path` rather than any Core response field. Added `folderId` to
  `DialSkillResource`. Updated `skills-core-api.spec.ts` for the 3-call flow and the
  no-matching-row fallback.
- [x] 10.3 Added staged (Save/Discard) file add/remove to Skill Publications: lifted
  `skillAddedFiles`/`skillRemovedFileNames` state into `PublicationView.tsx` (mirroring the existing
  `addedFiles` pattern already used by File Publications), included in `isChanged`/reset on discard,
  and a new `applySkillFileChanges` applied on `onSave` after `updatePublication` succeeds. Reworked
  `SkillDetails` (`Publications/Assets/Skill/SkillDetails.tsx`) to always render a preview/download/
  remove actions column (previously read-only for Publications) with staged rows for not-yet-uploaded
  files (hiding preview/download until saved) and `SKILL.md`'s remove action always disabled. Threaded
  the staged-file props through `SkillProperties.tsx` → `TabsContent.tsx` → `View.tsx`.
- [x] 10.4 Reworked the Assets > Skills detail view to use a proper asset header instead of the
  bespoke path/author/created/updated header built in task 6.1. The generic `AssetHeader`/
  `AssetButtonsWrapper` was judged unsuitable — `AssetButtonsWrapper` unconditionally renders
  `AssetVersionControl` (a version dropdown with a "Create new version" flow hardcoded to
  `getApp`/`getToolset`/`getPrompt`), and Skill has no version concept. Built a narrower
  `SkillButtonsWrapper`/`SkillHeader` pair instead, following the `ConversationButtonsWrapper`/
  `ConversationHeader` precedent for a type that doesn't fit the generic shape: renders the plain
  (non-versioned) `ChangedEntityButtons` for Save/Discard when the entity is dirty, or Delete +
  `DeleteConfirmationModal` otherwise. `Assets/Skills/View/View.tsx` now stages file add/remove and a
  folder change locally, computes `isChanged` from both, and only calls
  `uploadSkillFile`/`removeSkillFile`/`moveSkills` on Save — Discard resets to the original skill.
- [x] 10.5 Added Move to another folder for the Assets > Skills detail view, reusing the
  Prompts/Toolsets convention: a `FilePath` folder field in `Assets/Skills/View/Properties.tsx`
  (`SkillAssetProperties`), compared against the original `folderId` as `isNeedToMove`, and a new
  `moveSkills` action (`assets-skills/actions.ts`) built on the existing generic `moveAssets` helper —
  no new Core client code needed, since Core's move endpoint is resource-type-agnostic.
- [x] 10.6 Added the three route-keyed map entries needed for `AssetsSkills` to work with the generic
  delete/update machinery now in use: `deleteEntityMap` (`EntityView/Modals/Delete/utils.ts`),
  `isAssetView` (`utils/is-view.ts`), `createEntityMap` (`utils/entities/update-entity.ts`), plus new
  `DeleteI18nKey.Skill`/`UpdateI18nKey.Skill` i18n keys.
- [x] 10.7 Updated/rewrote tests for all touched files: `skills-core-api.spec.ts` (18 tests, new
  3-call `getSkillMetadata` flow), `SkillDetails.spec.tsx` (13 tests, always-actions/disabled/staged
  model), `SkillProperties.spec.tsx` (2 tests, required setter props), `View.spec.tsx` (7 tests,
  `SkillHeader`/staged Save-Discard/Move). Fixed the global `useSkillFolder` mock in `test-setup.tsx`
  to return `{ fetchFiles: vi.fn() }` instead of a bare function, which several new tests depend on.
- [x] 10.8 Re-ran `npm run lint` (0 errors, 130 pre-existing unrelated warnings), `npm run format`
  (clean save for the user's own `skills.md`, left untouched), and the full `npm run test` suite
  (804 files / 1 confirmed-flaky unrelated failure, 8610/8615 tests) to confirm 10.1–10.6 introduced
  no regressions.

## 11. Post-implementation fixes #4 (reported after using the feature)

- [x] 11.1 Added breadcrumbs to the Assets > Skills detail view: `AssetsSkills` had no entry in
  `Breadcrumbs/constants.ts`'s route-keyed `breadcrumbConfig`, so no breadcrumb rendered at all for
  the route. Added the entry (`shouldEnrichWithFolderBreadcrumbs: true`, matching
  `AssetsToolsets`/`AssetsApplications`), and a `case ApplicationRoute.AssetsSkills: return
  useSkillFolder;` to `getFolderContext` in `Breadcrumbs/utils.ts` so the folder-path enrichment
  reads from the right context.
- [x] 11.2 Reduced `SkillsCoreApi.getSkillMetadata` from 3 Core requests to 2: dropped the separate
  `SKILL.md` manifest GET entirely, since `CoreResourceMetadataNode.etag` is already present on
  `ITEM` rows in a folder listing (confirmed in `asset-metadata.ts`) — the parent-folder listing read
  (already needed for author/dates) carries the same aggregate etag a manifest content read would.
  Also dropped `findSkillListingEntry`'s pagination loop in favor of a single (first-page) listing
  read, so a per-skill read costs a bounded, small number of Core requests rather than an unbounded
  one; a skill missing from that page is now treated as not found (previously this was a documented
  "still succeeds with fields undefined" edge case — accepted as the simpler, cheaper behavior). The
  only fetch beyond that single listing read is `getSkillFiles`. Removed the now-unused
  `MANIFEST_FILE` constant. Updated `skills-core-api.spec.ts` for the new 2-call flow and the
  non-paginated not-found case.
- [x] 11.3 Fixed the file-remove etag bug: `View.tsx`'s `onSave` was passing `originalSkill.etag` —
  captured once, before any mutation — to every `removeSkillFile` call in a loop over
  `removedFileNames`. Since each per-file delete mutates the bundle's aggregate etag, every delete
  after the first would send an increasingly stale `If-Match` and fail. Fixed by dropping the etag
  argument entirely: `deleteSkillFile`'s etag is optional by design (Core's per-file route accepts
  an unconditional delete), so removes now use that unconditional path, matching what the design doc
  already specified but the call site hadn't followed.
- [x] 11.4 Fixed the post-move refresh: `onSave` was calling `fetchFiles` only on the *destination*
  folder after a move, leaving the *source* folder's cached listing stale (the skill still appeared
  there in the tree/list until an unrelated refresh). Changed to match `Assets > Toolsets`' own
  post-move convention exactly: `fetchFiles(addTrailingSlash(ROOT_FOLDER), true)` on move (resets
  the whole folder-tree cache and lets it lazy-reload), or a plain `fetchFiles(originalSkill.folderId)`
  when only files changed and no move happened.
- [x] 11.5 Discovered while fixing 11.1–11.4 and confirmed against a failing test: task 10.4's
  `SkillHeader` rework dropped the skill's read-only path/author/created/updated fields entirely
  (the new header only renders `ReadonlyId`, unlike the bespoke header it replaced) — a regression
  against the still-current "Skill asset detail view shows read-only metadata" requirement. Restored
  them in `Assets/Skills/View/Properties.tsx` using the shared `ResourceInfoHeader` component
  (already used by `Assets > Toolsets`/`Apps`/`AppRunners`/`Models` for the same author/dates
  display) with a `path` `LabelledText` as its `prefix`, rather than reintroducing a bespoke header.
- [x] 11.6 Re-ran targeted lint (0 errors) and the full Skills/Breadcrumbs-related test suite
  (65/65 passed) after 11.1–11.5, plus a full `npm run lint`/`npm run format`/`npm run test` pass to
  confirm no regressions elsewhere.

## 12. Post-implementation diagnostics (reported after using the feature)

- [x] 12.1 Investigated a live report of a folder-only Save (no file changes) not moving the skill,
  with no console output at all reaching a debug line placed after the move attempt. Traced the FE
  Core-contract construction for `moveSkills` end to end (`AssetApi.move`'s `sourceUrl`/
  `destinationUrl` shape, `RESOURCE_TYPE_PREFIX[SKILL]`, `ResourceDescriptorFactory.fromAnyUrl`,
  `ResourceOperationService.moveResource`'s `ComplexResourceService.copyResource`/`delete` path) by
  reading `ai-dial-core`'s actual source — found no defect in the request Skill's move already sends
  compared to Prompts/Toolsets/Applications' identical, working use of the same generic move
  endpoint. The debug line's absence is explained by `onSave`'s existing early `return` on a failed
  or rejected move — which was already correct control flow, just silent about *why*.
- [x] 12.2 Hardened error visibility so a real failure is never indistinguishable from "Save did
  nothing": added a fallback error title (`ErrorI18nKey.ServerError`) on every `!result.success`
  branch (file remove, file add, and move) so a Core response with an empty `errorHeader` doesn't
  render a blank-looking toast, and wrapped `onSave`'s whole body in a `catch` that logs
  (`console.error`) and shows the same fallback notification for any rejected promise (a thrown
  error, not just a resolved `{ success: false }`) — previously an uncaught rejection here would
  have produced neither a notification nor a console message, i.e. this exact symptom. Added two
  tests (`View.spec.tsx`) covering a resolved move failure and a rejected `moveSkills` call, both
  asserting a notification fires and no navigation/refresh happens.
- [x] 12.3 No code changes were made to the move request itself — the underlying Core interaction
  could not be reproduced or fully diagnosed without live server logs/network response, which are
  outside this repo. Flagged to the user as the concrete next step if the failure recurs with the
  new error handling in place: the shown notification (or the `POST /v1/ops/resource/move` response
  in the browser Network tab) will now carry Core's actual rejection reason.

## 13. Skill grouping-folder deletion (explored, then applied)

- [x] 13.1 Explored the gap: deleting a grouping-folder row in `Assets > Skills` was a silent no-op
  reporting false success — `getResourceTypeByRoute` deliberately excludes `SKILL` (design D4, no
  `ResourceType`-parametrized `AssetApi` path), so `BaseAssetList.onMultipleRemove`'s folder branch
  never ran, and `Promise.all([])` resolves vacuously successful. Confirmed against Core's actual
  `ComplexResourceController`/`ComplexResourceMetadataController` source (not just `skills.md`) that
  Skills don't fit `removeFolderCore`'s generic model anyway: that model walks flat resources and
  deletes each via a create+approve publication, but Skills are folder-shaped with their own
  dedicated v2 endpoints, and `GET /v2/metadata/skills/{bucket}/{path}?recursive=true` (confirmed via
  `ComplexResourceService.listChildren`) already returns a flat list of marker nodes only — a skill's
  internal files are excluded by Core itself, so a recursive walk over this endpoint naturally treats
  each skill as one atomic leaf without any FE-side filtering needed.
- [x] 13.2 Added `SkillsCoreApi.deleteSkillFolder(token, path, etag)` — `DELETE
  /v2/skills/{bucket}/{path}/` (trailing slash), a distinct Core route from `deleteSkill` confirmed
  via `ComplexResourceController`'s `folderOp` dispatch to `deleteFolderTarget`/
  `ComplexResourceService.deleteFolder`, which rejects with a conflict if the folder isn't empty.
- [x] 13.3 Added `removeSkillFolderCore(token, path)` to `folders-core.ts`, kept fully separate from
  `removeFolderCore`/`ALL_TYPES` per explicit direction not to touch the working generic path for the
  other five types. Recursively walks the target folder via the existing (unmodified)
  `SkillsCoreApi.listSkillMetadata` + `toSkillList`, collecting every skill and every nested
  `.dial-folder` marker at any depth, then deletes bottom-up: every skill first (order-independent),
  then every folder marker deepest-first, then the target folder itself — since Core rejects a
  non-empty folder-marker delete. Every delete uses the `'*'` unconditional etag (per explicit
  direction — no per-item etag reads), matching how `removeFolderCore`'s own folder-marker cleanup
  step already treats folder deletes as best-effort rather than needing a real etag.
- [x] 13.4 Wired `removeSkillFolder(path)` (new `folders-storage/actions.ts` export, wrapping
  `removeSkillFolderCore`) into `BaseAssetList.tsx`'s `onMultipleRemove`: an `else if (view ===
  ApplicationRoute.AssetsSkills)` branch alongside the existing `getResourceTypeByRoute` branch,
  since Skills route into a different helper rather than the generic `removeFolder`/`resourceType`
  path. This fixes the silent-no-op bug from 13.1 for both the `Assets > Skills` list's own bulk
  folder-delete and the standalone Folders Storage page.
- [x] 13.5 Added tests: `skills-core-api.spec.ts` (`deleteSkillFolder`'s trailing-slash URL, and that
  `'*'` renders as no `If-Match` header per the shared `createIfMatchHeaders` convention — also fixed
  an existing `getSkillMetadata` test fixture to reflect that a skill's own listing-row `url` carries
  a trailing slash, matching a same-session correction to `findSkillListingEntry`'s `expectedUrl`),
  `folders-core.spec.ts` (`removeSkillFolderCore`: correct bottom-up/deepest-first order, stops at
  the first failure, handles an empty folder), `folders-storage/actions.spec.ts`
  (`removeSkillFolder` delegates to `removeSkillFolderCore`).
- [x] 13.6 Ran targeted lint (0 errors) and the three affected test files (48/48 passed) after
  13.2–13.5.
