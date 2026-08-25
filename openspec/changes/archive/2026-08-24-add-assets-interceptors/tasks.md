## 1. Core resource wiring

- [x] 1.1 Add `DialInterceptorResource` to `src/models/dial/resource.ts`, following
      `DialModelResource`'s flat shape (name/path/folderId/author/status + the Core-writable
      `Interceptor`/`Deployment` fields: displayName, description, iconUrl, endpoint, interfaces,
      overrideName, forwardAuthToken, descriptionKeywords, features, defaults, createdAt/updatedAt).
- [x] 1.2 Add `mergeInterceptorResource` to `src/server/core/asset-metadata.ts`, mirroring
      `mergeModelResource`'s use of `flatMetadataFields`, and register it in `ASSET_MERGERS` under
      `ResourceType.INTERCEPTOR`.
- [x] 1.3 Unit test `mergeInterceptorResource` alongside the existing `asset-metadata.spec.ts` cases.

## 2. Server actions

- [x] 2.1 Create `src/app/[lang]/assets-interceptors/actions.ts` with `getInterceptors`,
      `createInterceptor`, `getInterceptor`, `updateInterceptor`, `removeInterceptor`,
      `bulkDeleteInterceptors`, following `assets-models/actions.ts`'s shape (flat, plain name, no
      `$id`/URI encoding).
- [x] 2.2 Reuse the shared create form (`EntityProperties`/`IdControl`) rather than a bespoke id
      control — do not add `AssetsInterceptors` to `isSimpleEntity`'s false-list, matching
      `AssetsModels`'s precedent. No bespoke name-pattern validation: Core's own server-side
      rejection (D2) covers it.
- [x] 2.3 Unit test the actions (success, Core rejection surfaced verbatim), following
      `assets-app-runners/actions.spec.ts`.

## 3. Routes and pages

- [x] 3.1 Added `ApplicationRoute.AssetsInterceptors` to `src/types/routes.ts`.
- [x] 3.2 A dedicated `MenuI18nKey.AssetsInterceptors` key is used for the Assets-section item
      (matching the `AssetsModels`/`AppRunners` precedent of a separate key per section, rather than
      the Toolsets/Applications precedent of reusing one key — the initially reused
      `MenuI18nKey.Interceptors` was replaced with this dedicated key).
- [x] 3.3 Added the `Interceptors` item to the Assets section of `MENU_CONFIGURATION` in
      `src/components/Menu/menu-configuration.tsx`, directly after `AppRunners`.
- [x] 3.4 Created `src/app/[lang]/assets-interceptors/page.tsx` (list) and
      `src/app/[lang]/assets-interceptors/[id]/page.tsx` (detail), following the `assets-models` page
      shape (`force-dynamic`, etag threading, `notFound()` on missing resource — simpler than
      `assets-app-runners`'s, since there's no `$id`/roles/interceptors/globalInterceptors reads
      needed for a one-tab Properties-only view).

## 4. List component

- [x] 4.1 Created `src/components/Assets/Interceptors/List.tsx` built on the shared asset list
      (`BaseAssetList`), following `Assets/Models/List.tsx`. Registered the new
      `ApplicationRoute.AssetsInterceptors` across every `BaseAssetList`/`Assets/utils.ts`/
      `Common/FileManager/utils.ts`/`Delete`/`Modals`/`duplicate-entity`/`update-entity`/
      `create-entity` map this view needs to plug into (create/delete/bulk-delete/duplicate enabled,
      no folder controls, matching the `AssetsModels`/`AssetsAppRunners` precedent — including
      duplicate, which the code already offers both siblings despite the original spec text).
      `models.ts`/`constants.ts` were not needed — the generic maps in `BaseAssetList/utils.tsx` were
      sufficient, no view-specific column/feature config was required.
- [x] 4.2 Metadata-only columns (name, author, created-at, updated-at) come for free from
      `isFlatPlatformView` + `getGridColumns`'s existing flat-platform branch, now that
      `AssetsInterceptors` is registered there.
- [x] 4.3 The interceptor create modal is the shared `CreateEntity`/`EntityProperties`/`IdControl`
      flow (task 2.2) — no bespoke modal needed.
- [x] 4.4 Unit tested the list (`tests/List.spec.tsx`) and the menu/tab-registration points
      (`Menu/tests/menu-configuration.spec.ts`, `utils/tabs/tests/utils.spec.ts`,
      `utils/files/tests/root-folder.spec.ts`).

## 5. Detail view

- [x] 5.1 Created `src/components/Assets/Interceptors/View.tsx` and `TabsContent.tsx` with exactly one
      tab (`Properties`) — no Configuration/Parameters tab (see design D3: the entity-side
      `ParameterSchema` fetch is admin-BE-coupled, not Core-direct, and a replacement is out of scope
      for this change), no Audit tab, no Core-sync banner, no reverse-index tabs. Followed
      `Assets/Models/View.tsx`'s save/discard/JSON-editor shape.
- [x] 5.2 Created `src/components/Assets/Interceptors/Properties.tsx`. Composed from the same
      individual `BaseControls`/`EntityMainProperties` pieces `Assets/Models/Properties.tsx` uses
      (`DisplayNameControl`, `DescriptionControl`, `IconControl`, `EndpointControl`,
      `InterfacesField`, `OverrideNameControl`, `TopicsControl`, `ForwardAuthTokenField`) rather than
      the monolithic entity-side `InterceptorProperties` wrapper, which always renders a
      container/deployment `SourceField` that has no meaning for a Core-only resource.
- [x] 5.3 Unit tested the view, tabs, and Properties tab (`tests/View.spec.tsx`,
      `tests/TabsContent.spec.tsx`, `tests/Properties.spec.tsx`).

## 6. Attach-picker widening

- [x] 6.1 Added `AssetInterceptorOrigin` (`Entity | Asset`) to
      `src/components/EntityView/Interceptors/models.ts` (co-located with the one component that
      consumes it, rather than the App-Runner-specific `SourceField/Application/models.ts`).
- [x] 6.2 Added `mergeInterceptorOrigins` to `src/components/EntityView/Interceptors/utils.ts`,
      tagging admin-BE rows `Entity` and `Assets > Interceptors` rows `Asset`.
- [x] 6.3 **Corrected approach**: rather than editing four separate pages, the merge fetch
      (`getInterceptors('')`, degrading to the admin-BE-only list on failure) was added inside
      `EntityInterceptors` itself, gated by an explicit `NEEDS_ASSET_MERGE_VIEWS` allow-list
      (`Applications`, `Models`, `ApplicationRunners`, `AssetsModels`) — see design D4. No page files
      needed changes. The entity `Interceptors` view's own reverse-index tabs were dropped from scope
      (design D4 correction): they show which entities already reference one resolved admin-BE
      interceptor, not an attach picker, so no origin widening applies.
- [x] 6.4 Added `withAssetSourceColumn`/`hasAssetInterceptorOrigin` to
      `src/components/EntityView/Interceptors/utils.ts` and wired them into
      `getInterceptorsColumnDefs` and the add-interceptor modal's columns, alongside (not replacing)
      the existing `ConfigEntityOrigin`-driven `withSourceColumn`, unchanged on `Assets > App Runners`.
- [x] 6.5 `onOpen` in `Interceptors.tsx` now routes an `AssetInterceptorOrigin.Asset` row to
      `ApplicationRoute.AssetsInterceptors`, leaving `Entity`-origin rows' existing
      `ApplicationRoute.Interceptors` target unchanged.
- [x] 6.6 Unit tested the merge/column helpers (`EntityView/Interceptors/tests/utils.spec.ts`) and
      confirmed the existing `Interceptors.spec.tsx`/`global-interceptors.spec.tsx` suites, plus the
      full suites for `Applications/View`, `Models/View`, `ApplicationRunners/View`, and
      `Assets/Models`, still pass unchanged.

## 7. Quality checks

- [x] 7.1 Ran the full test suite (`npx vitest run` from `apps/ai-dial-admin`): 839 files, 9358 tests
      passed, 0 failed. Ran `npm run lint`: 0 errors, 134 pre-existing warnings, none in files this
      change touches.

## 8. Follow-up additions: Features/Configuration tabs, Models page fix

- [x] 8.1 Checked ai-dial-core for which `features` an interceptor actually honors before building a
      Features tab: none of the switches/endpoints are read by
      `BaseInterceptorController`/`ChatCompletionInterceptorController`/`ResponsesInterceptorController`
      (only `overrideName` is), so no Features tab was added — see design D6.
- [x] 8.2 Added `src/server/core/deployment-configuration-api.ts` (`DeploymentConfigurationApi`),
      hitting Core's generic `GET v1/deployments/{name}/configuration` (resolves an interceptor by
      plain name via `Config.selectDeployment`), registered as `deploymentConfigurationApi` in
      `src/app/api/api.ts`.
- [x] 8.3 Added `getInterceptorConfigurationSchema` to `assets-interceptors/actions.ts`, and made the
      shared `ParameterSchema` component (`Interceptors/View/ParameterSchema/ParameterSchema.tsx`)
      accept an injectable `getSchema` prop (defaulting to the existing admin-BE lookup, so the entity
      surface is unchanged) rather than duplicating the component.
- [x] 8.4 Added `src/components/Assets/Interceptors/ParameterSchema.tsx`, wiring the shared component
      to the Core-direct fetch, and wired the `Configuration` tab into `TabsContent.tsx` and
      `getTabsForAsset` — see design D3/D7.
- [x] 8.5 Fixed `Assets > Models`' Interceptors tab to read Core's Api/ConfigFile-merged population
      directly (`readConfigEntities`/`readGlobalInterceptors`, extracted from
      `assets-app-runners/[id]/page.tsx` into `src/server/config-entities/read-page-options.ts` and
      shared by both pages) instead of `interceptorsApi.getInterceptorsList` — see design D8. Threaded
      `globalInterceptors`/`optionWarnings` through `Assets/Models/View.tsx` and `TabsContent.tsx`,
      matching `Assets/AppRunners/View.tsx`'s shape.
- [x] 8.6 Removed `AssetsModels` from `EntityInterceptors`'s `NEEDS_ASSET_MERGE_VIEWS`, since it now
      reads the same Core-merged population `Assets > App Runners` does — merging in the
      `Assets > Interceptors` CRUD population on top would double-count the same resources.
- [x] 8.7 Unit tested the new API/action (`deployment-configuration-api.spec.ts`, extended
      `actions.spec.ts`) and the widened tab set (extended `TabsContent.spec.tsx`); ran the full
      suite again (839 files / 9367 passed after fixing one test asserting the pre-existing
      `MenuI18nKey.Interceptors` reuse, which turned out to have been replaced on disk with a
      dedicated `MenuI18nKey.AssetsInterceptors` key — see task 3.2) and `npm run lint`/`tsc --noEmit`
      scoped to touched files, both clean.
