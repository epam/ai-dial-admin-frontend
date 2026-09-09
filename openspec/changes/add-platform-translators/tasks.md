## 1. Core wiring: enum, route, model

- [x] 1.1 Add `ResourceType.TRANSLATOR = 'TRANSLATOR'` to `types/resource-type.ts`.
- [x] 1.2 Add `ApplicationRoute.PlatformTranslators = '/platform-translators'` to `types/routes.ts`,
  grouped with the other `// Platform entities` members.
- [x] 1.3 Add `ApplicationRoute.PlatformTranslators` to `FLAT_PLATFORM_VIEWS`
  (`utils/files/root-folder.ts`), directly after `ApplicationRoute.PlatformInterceptors`.
- [x] 1.4 Add `DialTranslatorResource` to `models/dial/resource.ts` (`ModifiedEntity`, `name`, `path`,
  `folderId`, `author?`, `status?`, `validationWarnings?`, `in?: DeploymentInterfaceType`,
  `out?: DeploymentInterfaceType`, `baseUrl?: string`), and add it to the `PlatformAsset` union.
- [x] 1.5 Add `TRANSLATOR` cases to `BaseAssetRoute`/`CreateAssetRoute` (`components/Assets/BaseAssetList/types.ts`)
  and any other `ApplicationRoute` union type the six existing flat-platform entities are already listed in.
- [x] 1.6 (Found during implementation, not itemized above — required for the total `Record<ResourceType, …>`
  maps to compile.) Register `ResourceType.TRANSLATOR` end-to-end in `constants/publications-core.ts`
  (`TRANSLATORS_PREFIX`, `RESOURCE_TYPE_PREFIX`), `constants/assets-core.ts` (`VersionedResourceType`
  exclusion, `CORE_RESOURCE_URL`, `CORE_RESOURCE_METADATA_URL`, `PLATFORM_BUCKET_RESOURCE_TYPES`), and
  `server/core/asset-metadata.ts` (`mergeTranslatorResource` + `ASSET_MERGERS` entry, following
  `mergeInterceptorResource`'s `flatMetadataFields` shape).

## 2. Server actions

- [x] 2.1 Create `app/[lang]/platform-translators/actions.ts` with `toTranslatorPayload` (stripping
  `status`, `validationWarnings`, `path`, `folderId`) and `getTranslators`/`createTranslator`/
  `getTranslator`/`updateTranslator`/`removeTranslator`/`bulkDeleteTranslators`, following
  `platform-interceptors/actions.ts`'s shape (`assetApi.put`/`.delete`/`.list`/`.getMergedWithEtag`
  against `ResourceType.TRANSLATOR`).
- [x] 2.2 Unit tests in `platform-translators/actions.spec.ts` covering `toTranslatorPayload`'s
  field-stripping and each action's call shape (path construction, conditional etag on
  update/delete), following `platform-interceptors/actions.spec.ts`.

## 3. Menu, i18n, breadcrumbs, folder context

- [x] 3.1 Add `MenuI18nKey.PlatformTranslators` to `constants/i18n.ts` and its label in `locales/en.ts`.
- [x] 3.2 Add the `Translators` menu item to the Catalog group in `components/Menu/menu-configuration.tsx`,
  directly after `PlatformInterceptors` (before `PlatformRoutes`).
- [x] 3.3 Add a `PlatformTranslators` breadcrumb entry to `components/Breadcrumbs/constants.ts`,
  following the `PlatformInterceptors`/`PlatformRoutes` shape (`{ name: 'PlatformTranslators',
  i18nKey: MenuI18nKey.PlatformTranslators }` + an `Id` segment).
- [x] 3.4 Create `context/assets/TranslatorsFolderContext.tsx`, following
  `InterceptorsFolderContext.tsx`, and mount `TranslatorsFolderProvider` in `app/[lang]/layout.tsx`
  alongside the other asset folder providers.
- [x] 3.5 Add a `TranslatorsFolderContext` mock to `test-setup.tsx`, following the existing per-entity
  folder-context mocks.

## 4. List view

- [x] 4.1 Create `components/Assets/Platform/Translators/List.tsx` — a thin `BaseAssetList` wrapper for
  `ApplicationRoute.PlatformTranslators`, following `Assets/Platform/Interceptors/List.tsx`.
- [x] 4.2 Create `app/[lang]/platform-translators/page.tsx` (list page), following
  `app/[lang]/platform-interceptors/page.tsx`.
- [x] 4.3 Wire `ApplicationRoute.PlatformTranslators` into the shared asset-list infrastructure:
  `AssetFolderContextMap`/`GetAssetActionMap`/`CreateAssetActionMap`/`BulkDeleteAssetActionMap`
  (`components/Assets/BaseAssetList/utils.tsx`), the toolbar/empty-state/action-label switches in
  `components/Assets/utils.ts`, `components/Common/FileManager/utils.ts`, and
  `components/Assets/Modals/utils.tsx` (create-modal field set: name only, no display name), and
  `components/EntityView/Modals/Delete/utils.ts` (delete-modal copy) — matching the entries each of
  those already carries for `PlatformInterceptors`/`PlatformRoutes`. Deliberately no entry in any
  duplicate-action map (see design D6).
- [x] 4.4 Component tests for `List.tsx`, following `Assets/Platform/Interceptors/tests/List.spec.tsx`,
  plus coverage in `Assets/tests/utils.spec.ts`/`BaseAssetList/tests/utils.spec.ts` for the new map
  entries (including the no-duplicate carve-out).

## 5. Detail view

- [x] 5.1 Create `components/Assets/Platform/Translators/CreateProperties.tsx` — shared `IdControl`
  only, no display-name or description control — following
  `Assets/Platform/Routes/CreateProperties.tsx`, and wire it into
  `components/EntityMainProperties/Properties/Properties.tsx` ahead of `isSimpleEntity` for
  `ApplicationRoute.PlatformTranslators`.
- [x] 5.2 Confirm `constants/deployment-interfaces.ts`'s existing `MODEL_INTERFACE_TYPES` (all four
  `DeploymentInterfaceType` values) is reused directly as the option source for both the `in` and
  `out` selects — no new interface-type constant needed.
- [x] 5.3 Create `components/Assets/Platform/Translators/Properties.tsx`: `ResourceInfoHeader`, two
  enum selects for `in`/`out` (options from `MODEL_INTERFACE_TYPES`), and a `baseUrl` URL text field —
  no display name, description, icon, endpoint list, features, or topics control.
- [x] 5.4 Create `components/Assets/Platform/Translators/TabsContent.tsx` rendering exactly the
  `Properties` tab, following `Assets/Platform/Routes/TabsContent.tsx`.
- [x] 5.5 Create `components/Assets/Platform/Translators/View.tsx` (etag/discard/save/JSON-editor
  wiring, no Roles/Configuration/Features tab), following `Assets/Platform/Interceptors/View.tsx`.
- [x] 5.6 Confirm `getTabsForAsset`'s default branch (`utils/tabs/utils.ts`) already returns exactly
  `[propertiesTab(t)]` for `ApplicationRoute.PlatformTranslators` with no new branch needed — same
  confirmation `add-assets-roles` task 4.5 made — or add one if the default doesn't already fit.
- [x] 5.7 Create `app/[lang]/platform-translators/[id]/page.tsx` (detail page), following
  `app/[lang]/platform-interceptors/[id]/page.tsx` — reads identity from `params.id` directly, no
  `?path=` query param (per the current, already-landed URL shape for flat platform entities).
- [x] 5.8 Component tests for `CreateProperties.tsx`, `Properties.tsx`, `TabsContent.tsx`, and
  `View.tsx`, following the `Assets/Platform/Routes/tests/` equivalents.

## 6. Quality gate

- [ ] 6.1 Run `npm run lint`, `npm run format`, and the full `npm run test` suite from
  `apps/ai-dial-admin/`; fix any failures introduced by this change.

Note: this change has browser-observable scenarios (menu order, tab set, create-modal fields), but a
dedicated `spec-browser-verify` task was declined by the user for this change — coverage relies on the
unit/component tests in groups 2, 4, and 5 instead.

