## Why

Applications, toolsets, conversations, prompts, and files have already been migrated from the admin-BE proxy to talking directly to DIAL Core as "asset" resources. Models are the next entity type that exists both as an admin-BE-backed "Entity" (`Entities > Models`) and, in DIAL Core, as a `ConfigResource` (`GET/PUT/DELETE /v1/models/platform/{name}`, listable via `GET /v1/metadata/models/platform/`). Admins currently have no way to browse or edit Core's raw model-resource JSON the way they can for asset applications/toolsets — adding an `Assets > Models` resource closes that gap using the same pattern already proven for applications.

## What Changes

- Add `ResourceType.MODEL` and wire it into the existing generic Core-asset machinery (`AssetApi`, `CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL`, `RESOURCE_TYPE_PREFIX`, `ASSET_MERGERS`) alongside application/toolset/conversation/prompt.
- Add a new `Assets > Models` menu item, first entry in the Assets section, pointing at a new `/assets-models` route.
- Add `src/components/Assets/Models/*`, mirroring `Assets/Apps/*`: a flat (non-foldered) list view and a detail view with `Properties` and `Features` tabs only (no Roles/Interceptors/Audit/Tools/Dependencies tabs, matching what `Entities > Models` supports today).
- List is flat: the only root folder is Core's fixed `platform` bucket; no create-folder / move-into-folder affordance is exposed (unlike Apps, which supports arbitrary nested folders).
- No versioning: DIAL Core's `ConfigResourceController` (models/interceptors/roles/keys/routes/schemas) has no `__version` concept, so create/update/get/delete work against a bare `platform/{name}` path — no version selector, no publications.
- New model-resource `Features` tab is a dedicated component (parallel to `ResourceFeatures`, not a reuse of it) whose switch groups mirror the **Models-entity** feature set (`modelsSwitchGroups`/`modelsTextFeatures`), not the Applications-entity set that `ResourceFeatures` mirrors — see the `assets-models` capability below for the exact field list.
- **BREAKING (workaround, no API change)**: DIAL Core's per-entity `GET /v1/models/platform/{name}` does not set an `ETag` response header (confirmed against `ConfigResourceController`), unlike the `ResourceController`-backed types. The FE SHALL source the model resource's etag from the metadata response instead of the content response for this resource type only.

## Capabilities

### New Capabilities
- `model-resources-core-api`: Model-resource list/get/create/update/delete against DIAL Core's `ConfigResourceController`, flat/`platform`-only, unversioned, with etag sourced from metadata instead of content.
- `assets-models`: The `Assets > Models` menu item, flat list view, and detail view (Properties + Features tabs only), including the dedicated Features component whose switch groups mirror the Models-entity feature set rather than the Applications-entity set.

### Modified Capabilities
- `core-asset-client`: Add support for a resource kind that is (a) unversioned like `FILE` but (b) content-addressed like the four existing versioned types (has a content GET/PUT/DELETE, not just metadata+blob), and (c) needs its etag sourced from the metadata response rather than the content response's `ETag` header.

## Impact

- `src/types/resource-type.ts`: add `MODEL` to `ResourceType`.
- `src/constants/assets-core.ts`: register MODEL in `CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL`; widen `VersionedResourceType` exclusion to `Exclude<ResourceType, ResourceType.FILE | ResourceType.MODEL>`.
- `src/constants/publications-core.ts`: add `RESOURCE_TYPE_PREFIX[ResourceType.MODEL]` (not consumed by publications yet, but kept consistent with the other four entries for future-proofing — model resources are not publishable in this change).
- `src/server/core/asset-metadata.ts`: add `mergeModelResource` + `ASSET_MERGERS[ResourceType.MODEL]`, sourcing etag from metadata.
- `src/server/core/asset-api.ts` (or the shared merge helper): etag-from-metadata fallback for MODEL.
- `src/components/Menu/menu-configuration.tsx`: new `Assets > Models` entry, first in the Assets group.
- `src/types/routes.ts`: new `ApplicationRoute.AssetsModels = '/assets-models'`.
- `src/app/[lang]/assets-models/`: new route + `actions.ts` (list/get/create/update/delete), mirroring `assets-applications/actions.ts` minus move/import/export/tools/external-service concerns.
- `src/components/Assets/Models/`: new `List/`, `View/`, `Properties.tsx`, `Features.tsx` (or `ModelResourceFeatures.tsx`), `constants.ts`, `models.ts`.
- `src/models/dial/`: new `DialModelResource`/`AssetModel`-equivalent model + `DialModelResourceFeatures` type (snake_case, mirroring `DialApplicationResourceFeatures` but with the Models-entity feature set).
- No changes to `Entities > Models` (`src/app/[lang]/models/`, `src/components/Models/`) — that entity path is untouched by this change.
