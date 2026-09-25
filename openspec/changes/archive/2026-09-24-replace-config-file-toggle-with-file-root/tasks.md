## 1. Source-root model and Core reads

- [x] 1.1 Add the explicit file-source/root descriptor and supported route-to-`ConfigFileEntityType` registry in `apps/ai-dial-admin/src/utils/files/root-folder.ts` (or its focused model/constant companions), preserving `BucketType` for physical Core resource buckets only.
- [x] 1.2 Extend `ConfigFileEntityType` and `READABLE_CONFIG_FILE_TYPES` with `translators`, and add focused config-file API/client tests for the accepted type while preserving the Key exclusion.
- [x] 1.3 Update `apps/ai-dial-admin/src/context/assets/AssetsFolderContext.tsx` and its source-specific helpers to create `file` nodes and load name-only file rows through `configFileApi.listNames` with the initial root batch, surfacing failed reads through established notification handling without N+1 body reads.
- [x] 1.4 Update root ordering and Catalog-disabled root selection so supported views put `file` first; platform-only views use `file` then `platform`, and Applications/Toolsets use `file`, `platform`, then `public` (or `file`, then `public` when Catalog is disabled).

## 2. FileManager source behavior

- [x] 2.1 Update `apps/ai-dial-admin/src/components/Assets/BaseAssetList/BaseAssetList.tsx`, `apps/ai-dial-admin/src/components/Common/FileManager/FileManager.tsx`, and source-aware FileManager utilities so `file` rows are flat, name-only, and never enter physical-bucket fetch or mutation paths.
- [x] 2.2 Gate toolbar, row, bulk-selection, folder, drag/drop, duplicate, import/export, move, rename, and delete affordances for the file source; retain row open and open-in-new-tab only.
- [x] 2.3 Update `apps/ai-dial-admin/src/components/EntityListView/EntityListView.tsx`, click handling, and `apps/ai-dial-admin/src/utils/open-in-new-tab.ts` so non-Catalog file rows append `configFile=true`, Applications/Toolsets have no public `path` parameter, and Catalog Schema file rows preserve their encoded `$id` fallback route.

## 3. Detail coverage and cleanup

- [x] 3.1 Add the `configFile=true` read and read-only detail branch for `apps/ai-dial-admin/src/app/[lang]/platform-translators/[id]/page.tsx` and its Translator view, including hidden ADMIN|CORE format selection.
- [x] 3.2 Wire Catalog Schema file-root discovery to the existing API-first/file-fallback detail resolver without changing the fallback route or mutation behavior.
- [x] 3.3 Remove `showConfigFiles` state and persistence from `AppContext`, `ConfigFilesToggle`, `ConfigFileListSwap`, `useConfigFileEntityList`, `ConfigFileEntityList`, swap-only page wrappers, `CONFIG_FILE_ENTITY_VIEWS`, toggle-only header/list props, and the unused `showOnlyConfigFiles` picker-read branch.
- [x] 3.4 Update affected OpenSpec source specs and inline comments/terminology so App Runners' `schemas` file mapping is identified as application-type schemas and the retired toggle behavior is no longer documented.

## 4. Tests and quality gates

- [x] 4.1 Add or update focused unit and component tests for source descriptors, initial file-name loading and error handling, root ordering under both Catalog states, name-only file columns, mutation suppression, navigation URLs, Translator read-only details, and Catalog Schema fallback navigation.
- [x] 4.2 Run focused Vitest files from `apps/ai-dial-admin`, then `npm run typecheck` and `npm run typecheck:specs` with zero errors.
- [x] 4.3 Run final `npm run lint`, `npm run format`, and `npm run test`; investigate any failures before completing the change.
