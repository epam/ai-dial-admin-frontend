## 1. Types and constants

- [x] 1.1 Add `MODEL` to `ResourceType` in `src/types/resource-type.ts`.
- [x] 1.2 Register `MODEL` in `CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL`/`RESOURCE_TYPE_PREFIX` in `src/constants/assets-core.ts` and `src/constants/publications-core.ts`, pointing at `models/platform`.
- [x] 1.3 Widen `VersionedResourceType` in `src/constants/assets-core.ts` to `Exclude<ResourceType, ResourceType.FILE | ResourceType.MODEL>`.
- [x] 1.4 Add `ApplicationRoute.AssetsModels = '/assets-models'` in `src/types/routes.ts`.

## 2. Domain models

- [x] 2.1 Add `DialModelResource` type in `src/models/dial/` (mirroring `DialApplicationResource`), including the read-only `status: 'valid' | 'invalid'` field from Core's GET response.
- [x] 2.2 Add `DialModelResourceFeatures` type in `src/models/dial/` mirroring `DialApplicationResourceFeatures` but with the Models-entity feature set: adds `cache_supported`/`auto_caching_supported`, omits `consent_required`.

## 3. Core-asset-client support for Model

- [x] 3.1 In `src/server/core/asset-api.ts` (or the shared merge helper), add etag-from-metadata resolution for `ResourceType.MODEL` (metadata GET's `etag` field instead of the content response's `ETag` header), since `ConfigResourceController`'s per-entity GET never sets that header.
- [x] 3.2 Confirm `AssetApi`'s content GET/PUT/DELETE path-building works for `MODEL` without applying `__version` suffix parsing (same as the existing unversioned handling for `FILE`, adapted for a resource that has a real content endpoint).
- [x] 3.3 Add `mergeModelResource` + `ASSET_MERGERS[ResourceType.MODEL]` in `src/server/core/asset-metadata.ts`, projecting Core's GET response (including the injected `status` field) into `DialModelResource`.
- [x] 3.4 Implement PUT-payload construction for Model that strips `status` (and other non-`Model` identity fields such as `path`/`folderId`) before sending create/update requests to Core, and omits any field not explicitly present in the payload so an omitted encrypted field is not overwritten (relies on Core's preserve-on-omit secret-field merge).
- [x] 3.5 Surface DIAL Core's cross-reference validation failure (HTTP 422 with `validationWarnings`) from create/update as a recognizable error distinct from a generic failure.

## 4. Server actions

- [x] 4.1 Add `src/app/[lang]/assets-models/actions.ts` with `getModels`, `createModel`, `getModel`, `updateModel`, `removeModel`, mirroring `assets-applications/actions.ts` minus move/import/export/tools/external-service concerns.
- [x] 4.2 Add `src/app/[lang]/assets-models/page.tsx` (list route) and the model detail route, following the `assets-applications` routing pattern.

## 5. Menu

- [x] 5.1 Add a `Models` entry as the first item in the Assets section of `src/components/Menu/menu-configuration.tsx`, linking to `ApplicationRoute.AssetsModels`.

## 6. Components: Assets/Models

- [x] 6.1 Add `src/components/Assets/Models/models.ts` and `constants.ts` (kept separate per file-organization conventions).
- [x] 6.2 Add `src/components/Assets/Models/List/` mirroring `Assets/Apps/List`, but rendering only the flat `platform` root with no folder-create/rename/move-into-folder controls.
- [x] 6.3 Add `src/components/Assets/Models/View/` and `Properties.tsx` mirroring `Assets/Apps/View`/`Properties.tsx`, omitting `FilePath`/folder-move controls.
- [x] 6.4 Add `src/components/Assets/Models/Features.tsx` (or `ModelResourceFeatures.tsx`) as a dedicated component with its own switch groups mirroring `modelsSwitchGroups`/`modelsTextFeatures` (caching group present, `consent_required` absent, no app-runner-scheme-inherited-readonly logic) — not a reuse of `Assets/Resources/ResourceFeatures`.
- [x] 6.5 Wire the model detail view's tabs to exactly `Properties` and `Features` (no Roles/Interceptors/Audit/Tools/Dependencies).

## 7. Tests

- [x] 7.1 Unit tests for `mergeModelResource` and the etag-from-metadata resolution in `src/server/core/asset-metadata.ts`/`asset-api.ts`.
- [x] 7.2 Unit tests for the PUT-payload stripping logic (status/identity fields removed; omitted fields not sent).
- [x] 7.3 Unit tests for `assets-models/actions.ts` covering create-conflict, update-etag, 422-validation-warning surfacing, and delete conditional semantics.
- [x] 7.4 Component tests for `Assets/Models/List` (flat rendering, no folder-create action) and `Assets/Models/Features` (caching group present, `consent_required` absent, text features match Apps).

## 8. Quality checks

- [x] 8.1 Run lint, format check, and the full test suite; fix any failures.

Note: no automated browser-verification task was added for this change — the user declined one when asked, despite several scenarios (menu order, flat list, tab set, Features groups) being browser-observable; coverage for those relies on the component tests in section 7.
