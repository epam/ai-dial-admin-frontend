One PR, ordered so each group builds and typechecks on its own (design D9). Paths are under
`apps/ai-dial-admin/src/` unless noted. Delete dead code only in group 9, so groups 1–8 stay additive and reviewable.

## 1. Source model and pure rules

- [x] 1.1 Add `AssetSource` enum (`Public`, `Platform`, `ConfigFile`) in `models/dial/asset-source.ts` and `getAvailableSources(view, isUnitMode)` + `getDefaultSource(view)` in `utils/files/asset-sources.ts` (table in design D1; Keys → Platform only; unit mode → Public only for Applications/Toolsets).
- [x] 1.2 Add `getHeaderCount(sources, counts)` in `utils/files/asset-sources.ts` (undefined when the view has a Public source, otherwise platform + configFile; platform only when no config.json source).
- [x] 1.3 Add `parseSourceParam(view, raw, sources)` (unknown/unavailable → default) in the same util file.
- [x] 1.4 Add i18n keys (tab labels Public / Platform / config.json, `Folder` column header, Destination control labels) to `locales/en.ts` and the matching i18n enum in `constants/i18n.ts`, reusing `BasicI18nKey`/`EntitiesI18nKey` where a label already exists.

## 2. Flat data hook and grid

- [x] 2.1 Add `hooks/use-flat-assets.ts`: `useFlatAssets(view, source)` returns `{ rows, isLoading, hasError, refetch }`, calling the existing server actions (`getModels`, `getConfigFileModels`, … per view; map in `components/Assets/BaseAssetList/utils.tsx`), shows the established error notification on failure and never reports a failed read as an empty list.
- [x] 2.2 Policies and Policy Assignments: make the hook list the root and each cost-object folder and flatten, setting `folderId` on every row (`utils/policies/path.ts`); keep the per-folder fan-out inside the hook.
- [x] 2.3 Add `components/Assets/FlatAssetGrid/FlatAssetGrid.tsx` on `GridView` with column defs from `columns.tsx`, plus a Cost object column for the two policy views; Platform mode wires row actions (duplicate, delete, open in new tab) to `PlatformBulkDeleteAssetActionMap` / `PlatformGetAssetActionMap`, `DuplicatePlatformAsset` / `DuplicatePlatformKeyModal` and the platform delete confirm (2.6), refetching after a mutation. No folder context, no selection column and no bulk toolbar (selection exists only in the picker's select mode).
- [x] 2.4 `FlatAssetGrid` config.json mode: name column and open-in-new-tab only, no selection, rows link through the existing `configFile=true` hrefs (`BaseAssetList/asset-item-url.ts`).
- [x] 2.5 `FlatAssetGrid` select mode (name column, multi-select checkboxes, reports selected names) for the picker.
- [x] 2.6 Add `components/Assets/Platform/CreatePlatformEntity.tsx` (design D5a): per-view switch to `CreateKeyModal`, `CreatePolicyModal`, `CreateApplication`, `CreateEntity`, taking `names`, `runners`/`translators`, `onCreated`, with no `getContext`. Give `CreateEntity`, `CreatePolicyModal` and `CreateApplication` an explicit platform mode (no folder, no version, no `folderId`; policies and assignments take Cost object as an editable field) and make `DeleteAssetsModal` usable without a context for the platform case (or add a small platform delete confirm).

## 3. Tabbed shell

- [x] 3.1 No `ListEntities` change: the shell renders its own header (same layout classes) because the Public tab has no `ListEntities` grid to host one.
- [x] 3.2 Add `components/Assets/TabbedAssetList/TabbedAssetList.tsx` (+ `models.ts`, `constants.ts`): header (title, `listLabelAddon` count in `dial-small-text text-secondary`, Create on the Platform tab and on single-source listings, hidden for read-only admins), ui-kit tabs with count badges (check `searchEntity`/`getEntityDetails` on the `ai-dial-ui-kit` MCP for a badge prop, otherwise render the count inside the label), `tab` query parameter sync, no tab row for a single source, tab bar a11y per `.claude/rules/a11y.md` (`aria-selected`, counts announced in the accessible name).
- [x] 3.3 Load Platform and config.json counts on mount through `useFlatAssets`, share the loaded rows with the tab bodies, and show no badge for a failed read.

## 4. Platform entities

- [x] 4.1 Switch `components/Assets/Platform/Models/List.tsx` to `TabbedAssetList` as the pilot and confirm create, duplicate, delete and open-in-new-tab through the grid.
- [x] 4.2 Switch App Runners, Catalog Schemas, Interceptors, Translators, Routers, Routes, Roles and Keys lists (`components/Assets/Platform/*/List.tsx`); Keys passes a single source so it renders no tab row.
- [x] 4.3 Switch Policies and Policy Assignments lists; create modals take Cost object as an empty, editable field (`Policies/CreateProperties.tsx`, `PolicyAssignments`), remove cost-object folder delete (`RemoveCostObjectFolderActionMap`, `isNestedPlatformView` paths).

## 5. Applications and Toolsets

- [x] 5.1 Make `components/Assets/Entities/Apps/List.tsx` and `Toolsets/List.tsx` render `TabbedAssetList` with Public, Platform and config.json; unit-mode users get Public only with no tab row.
- [x] 5.2 Public tab: `FileManager` through `BaseAssetList` on the single `public/` root, no header Create button, no tree title (stop passing `label` to `getTreeOptions`).
- [x] 5.3 Platform tab for Applications/Toolsets: flat grid with Name/Author/Created/Updated columns, header Create opens `CreatePlatformEntity` (no version field), and the post-create redirect opens the platform detail route.
- [x] 5.4 Update `app/[lang]/assets-applications/page.tsx` and `assets-toolsets/page.tsx` data wiring only where the shell needs it (runners/translators props stay).

## 6. Create destination and path pickers

- [x] 6.1 `components/Assets/Modals/CreateAsset.tsx`: remove all platform support (root list, `shouldOpenOnPlatform` jump, `isPlatformDualBucketCreate`, `PlatformCreateAssetActionMap` branch). Add a `CreateSeededAsset` wrapper (design D10) with the Public/Platform **Destination** control for the runner- and container-seeded entry points, rendering `CreateAsset` or `CreatePlatformEntity`.
- [x] 6.2 `components/Common/FolderList/FolderList.tsx` and `components/Common/FilePath/FilePath.tsx`: single root, drop the `file/` filter and multi-root auto-fetch.

## 7. Entity picker and role limits

- [x] 7.1 Rewrite `components/Common/EntitySelectInput/EntitySelectManager.tsx` as a tabbed picker (Public tree + `FlatAssetGrid` select mode) reporting `PickedEntity[]` (`{ source, path?, name }`) from `EntitySelectInput/models.ts`; drop `rootFolders`/`rootLabelI18nKey` from `ENTITY_SELECT_CONFIGS` (`constants.ts`) and keep Skill/File on a single Public tree.
- [x] 7.2 `components/Assets/Platform/Roles/AddApplicationsPopup.tsx`: pass the three sources, keep the isolated `AppsFolderProvider`, reset selection on cancel, keep Apply disabled when empty; same name selected on Platform and config.json counts once.
- [x] 7.3 `components/Assets/Platform/Roles/utils.ts`: replace `isPublicPath` sniffing with source-aware keys (`Public` → `${APPLICATIONS_PREFIX}${path}`, others → `name`); update `Entities.tsx` `onAddApplications` to the new payload and keep skipping keys already in `limits`.

## 8. Single-root file manager and folder context

- [x] 8.1 `components/Common/FileManager/FileManager.tsx`: always one root (`rootItem` is `files[0]`), remove `isMultiRootView`, `isFileRootActive`, `isMoveSupported` and `isCreateFolderSupported` branches and their prop gating; `utils.ts` drops platform-view action sets.
- [x] 8.2 `context/assets/AssetsFolderContext.tsx` and `folder-reducer.ts`: single-root load, drop `string[]` roots, `buildRootNodes`, `getConfigFileNames` and `file/` branches in `fetchByPath`/`fetchRoots`; keep `getFolderRows` for Public.
- [x] 8.3 `components/Assets/BaseAssetList/BaseAssetList.tsx` and `Modals.tsx`: remove bucket branching (`isPlatformDualBucketView`, platform create/duplicate/delete/move paths, `isNestedPlatformView`, the platform cases of `renderCreateModal`/`renderDuplicateModal`) and the platform branches in `CreateEntity`, `CreateApplication` and `CreatePolicyModal`'s Public usage, so they serve Public (and Skills/Projects/Prompts/Files/Conversations) only.

## 9. Remove dead code

- [x] 9.1 Deleted `getRootDescriptors`, `getRootFolders`, `RootDescriptor`, `FILE_ROOT_FOLDER`, `isFileRootPath`, `isFileSource`, `isPlatformDualBucketView`, `buildRootNodes`, the `RootsLoaded` reducer action and the cost-object folder delete (`removePolicyFolder`, `removePolicyAssignmentFolder`, `server/assets/delete-cost-object-folder.ts`, `excludeRecordsInFolders`, `getCostObjectFolderPath`). Kept `isPlatformBucketPath`, `DUAL_BUCKET_VIEWS`, `isNestedPlatformView`, `isFlatPlatformView`, `getConfigFileEntityType` and `PLATFORM_ROOT_FOLDER`: detail pages, server code and the Platform grid still read them.
- [x] 9.2 Kept the per-entity folder providers in `context/assets/AssetFolderProviders.tsx`: the platform detail views and a few modals still read them. Only the multi-root and config-file parts of `createFolderContext` and the per-view contexts were removed.
- [x] 9.3 Checked the i18n enums for members only the removed code used: none (the one unused key, `BasicI18nKey.ShowConfigFiles`, predates this change).
- [x] 9.4 Run `grep` for `platform/`, `'file/'`, `getRootFolders` and `rootLabelI18nKey` under `src/` and resolve every remaining production hit.

## 10. Tests

- [x] 10.1 Utils: `getAvailableSources`, `getDefaultSource`, `getHeaderCount`, `parseTabParam`, the source-aware role-limit key mapping (pin `applications/{path}` and bare-name outputs) in `utils/tests/` and `Roles/tests/`.
- [x] 10.2 `useFlatAssets`: success, failed read (no empty list, notification), policy fan-out flattening with `folderId`.
- [x] 10.3 `TabbedAssetList`: tab visibility per view and unit mode, defaults, `tab` query sync and fallback, badges and their failed-read absence, header count rule, Create button per tab and read-only admin.
- [x] 10.4 `FlatAssetGrid`: Platform row actions, config.json read-only actions and hrefs, select mode; Cost object column on policy views.
- [x] 10.5 Picker and `AddApplicationsPopup`: three tabs, entity-only selection, cross-tab selection, same-name dedupe, cancel reset, Apply disabled when empty.
- [x] 10.6 Update existing specs that assert the old behaviour (`FileManager`, `BaseAssetList`, `CreateAsset`, `AssetsFolderContext`, `FolderList`, `FilePath`, policy lists) per `.claude/rules/testing.md`; keep `npm run typecheck:specs` at zero.

## 11. Specs and docs

- [x] 11.1 Update the Purpose paragraph of `openspec/specs/config-file-entity-views/spec.md` (it still describes a synthetic `file` source) and the Purpose of `platform-applications`/`platform-toolsets` at archive/sync time.
- [x] 11.2 Update any page under `docs/` that describes the three-root file manager or the `file`/`platform` folders.

## 12. Final quality checks

- [x] 12.1 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run typecheck:specs` from the repo root, fixing every error.
- [x] 12.2 Run the full suite with `npm run test` (re-run any failing file in isolation first, per the flaky-suite note) and confirm it passes.
