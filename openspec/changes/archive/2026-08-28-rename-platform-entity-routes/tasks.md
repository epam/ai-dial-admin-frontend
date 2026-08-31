## 1. Rename app route directories

- [x] 1.1 Rename `src/app/[lang]/assets-models/` → `platform-models/` (including the `[id]/` sub-directory)
- [x] 1.2 Rename `src/app/[lang]/assets-app-runners/` → `platform-app-runners/` (including `[id]/`)
- [x] 1.3 Rename `src/app/[lang]/assets-interceptors/` → `platform-interceptors/` (including `[id]/`)
- [x] 1.4 Rename `src/app/[lang]/assets-routes/` → `platform-routes/` (including `[id]/`)
- [x] 1.5 Rename `src/app/[lang]/assets-roles/` → `platform-roles/` (including `[id]/`)
- [x] 1.6 Rename `src/app/[lang]/assets-keys/` → `platform-keys/` (including `[id]/`)

## 2. Update ApplicationRoute enum (load-bearing step)

- [x] 2.1 In `src/types/routes.ts`, rename the six enum members and their string values:
  `AssetsModels → PlatformModels ('/platform-models')`,
  `AssetsAppRunners → PlatformAppRunners ('/platform-app-runners')`,
  `AssetsInterceptors → PlatformInterceptors ('/platform-interceptors')`,
  `AssetsRoutes → PlatformRoutes ('/platform-routes')`,
  `AssetsRoles → PlatformRoles ('/platform-roles')`,
  `AssetsKeys → PlatformKeys ('/platform-keys')`

## 3. Fix TypeScript compilation errors (compiler-driven pass)

- [x] 3.1 Update `src/utils/files/root-folder.ts`: rename all six `Assets*` entries in `FLAT_PLATFORM_VIEWS` to `Platform*`
- [x] 3.2 Update `src/utils/is-view.ts`: rename `Assets*` entries in `isAssetView` set and `VIEWS_WITHOUT_TOPIC_CATALOGUE` array
- [x] 3.3 Update `src/components/Breadcrumbs/constants.ts`: rename the six `[ApplicationRoute.Assets*]` keys to `[ApplicationRoute.Platform*]`
- [x] 3.4 Update `src/components/Menu/menu-configuration.tsx`: rename `Assets*` references in the sidebar Assets section entries
- [x] 3.5 Update `src/components/Assets/BaseAssetList/types.ts`: rename `Assets*` in `BaseAssetRoute` and `CreateAssetRoute` union types
- [x] 3.6 Update `src/components/Assets/BaseAssetList/utils.tsx`: rename all `Assets*` keys in the four action maps (`AssetFolderContextMap`, `GetAssetActionMap`, `CreateAssetActionMap`, `BulkDeleteAssetActionMap`) and update the six `@/src/app/[lang]/assets-*/actions` import paths to `platform-*`
- [x] 3.7 Update the six context files in `src/context/assets/` (`ModelsFolderContext.tsx`, `AppRunnersFolderContext.tsx`, `InterceptorsFolderContext.tsx`, `RoutesFolderContext.tsx`, `RolesFolderContext.tsx`, `KeysFolderContext.tsx`): update `@/src/app/[lang]/assets-*/actions` import paths to `platform-*`
- [x] 3.8 Update `src/components/Assets/utils.ts`: rename `Assets*` case arms in `getTreeActionLabels`, `getToolbarOptionLabels`, `getDeleteNotificationContent`, and `getFileManagerLabel`
- [x] 3.9 Update `src/components/Assets/Modals/utils.tsx`: rename `Assets*` case arms in `getDeleteModalTitle` and `getDeleteModalDescription`
- [x] 3.10 Update `src/components/ListView/constants.ts`: rename `Assets*` entries in `listViewTitleMap`; add the missing `PlatformKeys` entry
- [x] 3.11 Update `src/utils/entities/create-entity.ts`, `update-entity.ts`, `duplicate-entity.ts`: rename `Assets*` map entries to `Platform*`
- [x] 3.12 Update `src/components/EntityView/Modals/Delete/utils.ts`: rename `Assets*` entries in `deleteEntityMap` and `bulkDeleteEntityMap`
- [x] 3.13 Update `src/components/Common/FileManager/utils.ts`: rename `Assets*` entries in `getFileManagerLabel`, `getBulkActionsToolbarOptions`, and the `AssetsAppRunners` special-case in `getItemNameValidationPattern`
- [x] 3.14 Update `src/utils/open-in-new-tab.ts`: rename the six `Assets*` case arms
- [x] 3.15 Update `src/utils/tabs/utils.ts`: rename `Assets*` guards in `getTabsForAsset`
- [x] 3.16 Update `src/components/EntityHeaderControls/JsonToggle/JsonToggleWithFormats.tsx`: rename `Assets*` entries in the array
- [x] 3.17 Update `src/components/EntityMainProperties/Properties/Properties.tsx` and `ForwardAuthToken/utils.ts`: rename `Assets*` checks
- [x] 3.18 Update `src/components/EntityView/Roles/utils.ts`, `Interceptors/Interceptors.tsx`, `src/components/BaseControls/Topics.tsx`, `src/components/UpstreamEndpoints/Endpoint/Endpoint.tsx`: rename `Assets*` comparisons
- [x] 3.19 Update `src/components/SourceField/Application/AppRunners.tsx` and `src/app/[lang]/assets-applications/` pages: update the `@/src/app/[lang]/assets-app-runners/actions` import path to `platform-app-runners`

## 4. Update i18n keys and translation strings

- [x] 4.1 In `src/constants/i18n.ts` (`MenuI18nKey`): rename `AssetsModels → PlatformModels`, `AssetsInterceptors → PlatformInterceptors`, `AssetsRoutes → PlatformRoutes`, `AssetsRoles → PlatformRoles`, `AssetsKeys → PlatformKeys`; add `PlatformAppRunners = 'Menu.PlatformAppRunners'` (replacing the anomalous reuse of `AppRunners`)
- [x] 4.2 In `src/locales/en.ts`: rename the five `Menu.Assets*` translation keys to `Menu.Platform*`; add `PlatformAppRunners: 'App Runners'`; update the sidebar nav entry for app runners to reference `MenuI18nKey.PlatformAppRunners`

## 5. Update tests

- [x] 5.1 Update `src/components/Menu/tests/menu-configuration.spec.ts`: replace all `Assets*` route references and ordering assertions
- [x] 5.2 Update `src/utils/files/tests/root-folder.spec.ts`: replace `Assets*` set membership assertions
- [x] 5.3 Update `src/utils/tests/is-view.spec.ts`: replace `Assets*` view predicate assertions
- [x] 5.4 Update `src/components/Breadcrumbs/tests/utils.spec.ts`: replace `assets-models` path strings
- [x] 5.5 Update `src/utils/tests/open-in-new-tab.spec.ts`: replace `AssetsModels`, `AssetsRoutes` test cases
- [x] 5.6 Update `src/utils/tabs/tests/utils.spec.ts`: replace `Assets*` view tab assertions
- [x] 5.7 Update per-entity component test files under `src/components/Assets/*/tests/` that hardcode route enum values or URL strings

## 6. Rename OpenSpec spec directories

- [x] 6.1 Rename `openspec/specs/assets-models/` → `openspec/specs/platform-models/`
- [x] 6.2 Rename `openspec/specs/assets-app-runners/` → `openspec/specs/platform-app-runners/`
- [x] 6.3 Rename `openspec/specs/assets-interceptors/` → `openspec/specs/platform-interceptors/`
- [x] 6.4 Rename `openspec/specs/assets-routes/` → `openspec/specs/platform-routes/`
- [x] 6.5 Rename `openspec/specs/assets-roles/` → `openspec/specs/platform-roles/`
- [x] 6.6 Rename `openspec/specs/assets-keys/` → `openspec/specs/platform-keys/`

## 7. Quality checks

- [x] 7.1 Run `npm run lint` from the repo root and resolve any issues
- [x] 7.2 Run `npx vitest run` from `apps/ai-dial-admin/` and resolve any failures

## 8. Move platform component directories into Assets/Platform/

- [x] 8.1 Move `src/components/Assets/Models/` → `src/components/Assets/Platform/Models/`
- [x] 8.2 Move `src/components/Assets/AppRunners/` → `src/components/Assets/Platform/AppRunners/`
- [x] 8.3 Move `src/components/Assets/Interceptors/` → `src/components/Assets/Platform/Interceptors/`
- [x] 8.4 Move `src/components/Assets/Routes/` → `src/components/Assets/Platform/Routes/`
- [x] 8.5 Move `src/components/Assets/Roles/` → `src/components/Assets/Platform/Roles/`
- [x] 8.6 Move `src/components/Assets/Keys/` → `src/components/Assets/Platform/Keys/`
- [x] 8.7 Move `src/components/Assets/use-asset-runner-details.ts` → `src/components/Assets/Platform/use-asset-runner-details.ts`

## 9. Update import paths that reference the moved directories

- [x] 9.1 Update the 12 `src/app/[lang]/platform-*/page.tsx` and `[id]/page.tsx` files: `Assets/X` → `Assets/Platform/X`
- [x] 9.2 Update `src/components/Assets/BaseAssetList/Modals.tsx`: `Assets/Keys/CreateKeyModal` → `Assets/Platform/Keys/CreateKeyModal`
- [x] 9.3 Update `src/components/EntityMainProperties/Properties/Properties.tsx`: three `Assets/X/CreateProperties` imports → `Assets/Platform/X/CreateProperties`
- [x] 9.4 Update the cross-platform internal import: `src/components/Assets/Platform/Routes/Properties.tsx` imports `Assets/Models/UpstreamSecretWarning` → `Assets/Platform/Models/UpstreamSecretWarning`
- [x] 9.5 Update the three callers of `use-asset-runner-details`: `Resources/ResourceFeatures.tsx`, `EntityView/AppRoute/ApplicationAppRoutes.tsx`, `EntityView/Interceptors/Interceptors.tsx`

## 10. Quality checks (post-move)

- [x] 10.1 Run `npx vitest run` from `apps/ai-dial-admin/` and resolve any failures
