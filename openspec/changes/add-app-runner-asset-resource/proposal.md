## Why

Application Runners exist today only as an admin-BE-backed `Entity` (`Entities > Application Runners`, `/api/v1/applicationTypeSchemas*`), reaching DIAL Core indirectly: the admin BE renders each runner into Core format and publishes it inside the aggregated whole-config document, keyed by the schema's `$id`. DIAL Core also exposes runners as a first-class writable config resource (`GET/PUT/DELETE /v1/schemas/platform/{name}`, listable via `GET /v1/metadata/schemas/platform/`), which nothing in the admin FE uses. Admins therefore have no way to browse or edit Core's own runner resources the way they can for asset applications, toolsets, and — since `add-model-asset-resource` — models. This change closes that gap using the pattern already proven for those types.

## What Changes

- Add `ResourceType.APP_TYPE_SCHEMA` and wire it into the existing generic Core-asset machinery (`AssetApi`, `CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL`, `RESOURCE_TYPE_PREFIX`, `ASSET_MERGERS`) alongside application/toolset/conversation/prompt/model.
- Add an `Assets > App Runners` menu item directly after `Models` in the Assets section, pointing at a new `/assets-app-runners` route.
- Add `src/components/Assets/AppRunners/*` on top of `BaseAssetList`, mirroring `Assets/Models/*`: a flat (non-foldered) list over Core's fixed `platform` bucket, and a detail view with `Properties`, `Features`, `Parameters`, `AppRoutes`, and `Interceptors` tabs.
- **Resource name is the runner's `$id`**, carried through one extra percent-encoding layer so it survives Core's `ENTITY_NAME_PATTERN` (`^[A-Za-z0-9._%:-]+$`, applied to the URL-decoded segment, which a raw `$id` URI fails on `/`). The FE-facing identity, `[id]` route, and `IdControl isUrlId` behaviour stay as they are today.
- **New route payload converters**: Core represents `dial:applicationTypeRoutes` as an object keyed by route name with `dial:`-prefixed fields, while the FE model is a `DialAppRoute[]` array. Two pure functions own the conversion in both directions, reproducing what the admin BE's `ApplicationTypeSchemaRouteCoreMapper` does today.
- **Parameters resolve through DIAL Core, not the admin BE**: `GET /v1/application_type_schemas/schema?id=schemas/platform/{name}` already downloads and merges the external schema referenced by `dial:applicationTypeSchemaEndpoint`, replacing the admin BE's `resolvedSchema` call for this resource kind.
- **Client-side validation is required**: Core's write path for this resource kind performs no validation whatsoever (`case PROJECT_KEY, APP_TYPE_SCHEMA, CATALOG_SCHEMA -> { /* no post-processing */ }`) and stores the request body verbatim, so meta-schema conformance rules must be enforced in the FE before the write.
- No versioning, publications, sharing, move, or import/export — `ConfigResourceController` has no version or sharing concept and the resource lives in a single flat bucket.
- No `Applications` or `Audit` tab, and no Core-sync banner: the reverse application association is an admin-BE database concept, and DIAL Core has no audit, revision, or snapshot surface for config resources.

## Capabilities

### New Capabilities

- `assets-app-runners`: The `Assets > App Runners` menu item, flat list with create/delete/bulk-delete, and detail view (Properties, Features, Parameters, AppRoutes, Interceptors tabs), including the `$id`-as-resource-name identity and the client-side meta-schema validation rules that replace the admin BE's server-side checks.
- `app-runner-resources-core-api`: App-runner-resource list/get/create/update/delete/bulk-delete against DIAL Core's `ConfigResourceController`-backed `schemas/platform` routes — flat, unversioned, etag sourced from metadata, request body stored verbatim — plus the route array/object conversion and the Core-resolved parameters read.

### Modified Capabilities

- `core-asset-client`: Add support for a resource kind whose content body is stored **verbatim** by Core (`WriteSpec.entityClass == null`) rather than round-tripped through a typed entity, and whose Core resource name carries an extra percent-encoding layer. Both properties are new relative to the five existing kinds.

## Impact

- `src/types/resource-type.ts`: add `APP_TYPE_SCHEMA` to `ResourceType`.
- `src/constants/publications-core.ts`: add `SCHEMAS_PREFIX = 'schemas/platform/'` and the `RESOURCE_TYPE_PREFIX` entry.
- `src/constants/assets-core.ts`: register the type in `CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL`; widen the `VersionedResourceType` exclusion to include it.
- `src/server/core/asset-metadata.ts`: add `mergeAppRunnerResource` + `ASSET_MERGERS` entry; add `createdAt` to `CoreResourceMetadataNode` and `flatMetadataFields` (Core's `ResourceItemMetadata` carries it; the FE does not read it yet).
- `src/utils/files/root-folder.ts`: map the new view to the `platform` root.
- `src/types/routes.ts`: new `ApplicationRoute.AssetsAppRunners = '/assets-app-runners'`.
- `src/components/Menu/menu-configuration.tsx`: new `App Runners` entry after `Models` in the Assets group.
- `src/components/Assets/BaseAssetList/`: register the new view in `CreateAssetActionMap` and the `CreateAssetRoute`/`CrudAssetRoute` unions so the list toolbar's create action works.
- `src/app/[lang]/assets-app-runners/`: new list and detail routes plus `actions.ts`.
- `src/components/Assets/AppRunners/`: new `List`, `View`, `TabsContent`, `Properties`, `Features`, `constants.ts`, `models.ts`.
- New pure converters for the Core route object/array mapping and the `$id`/resource-name encoding.
- `src/models/dial/resource.ts`: new `DialAppRunnerResource` type.
- **Unchanged**: `Entities > Application Runners` (`src/app/[lang]/application-runners/`, `src/components/ApplicationRunners/`, `ApplicationRunnersApi`) and every existing consumer of `getApplicationSchemesList`.
- **Auth**: reads *and* writes on Core's `platform` bucket require the caller's JWT to carry Core's admin role (`AdminRoleAuthorizationService`), the same requirement `Assets > Models` already relies on.
- **Depends on**: the flat/unversioned machinery merged with `add-model-asset-resource` (`isVersioned`, `parseEncodedFlatPath`, `flatMetadataFields`, etag-from-metadata, `getRootFolder`).

## Non-goals

- **No changes to `Entities > Application Runners`** — that entity path, its admin-BE server actions, its Audit tab, its revision/rollback wiring, and its Core-sync banner are untouched.
- **No extension of the application source-field runner picker** (`SourceField/Application/AppRunners.tsx`) — asset applications *can* reference an asset runner by setting `application_type_schema_id` to the canonical `schemas/platform/{name}`, but wiring that into the picker is deferred to a follow-up. Until then asset runners are viewable and editable but not selectable from an application.
- **No outbound "Create Application"/"Create Asset Application" buttons** on the runner detail view. The entity variant is impossible (`ApplicationEntity.applicationTypeSchema` is a foreign key into the admin BE's own runner table), and the asset variant would create an application referencing a runner the picker cannot yet render.
- **No `Applications` tab** — the reverse association is an admin-BE database concept with no Core counterpart.
- **No Audit tab, revision links, rollback, or Core-sync banner** — DIAL Core exposes no audit, revision, history, or snapshot surface for config resources, and no existing Core-direct asset surface has them.
- **No import/export, publications, sharing, versioning, or move.**
- **No backfill of existing runners into Core blob storage.** Existing runners reach Core through the admin BE's aggregated whole-config push keyed by `$id`; blob-written runners are keyed by canonical ID. The two populations coexist in Core's single `applicationTypeSchemas` map, exactly as `Assets > Models` coexists with `Entities > Models`. The new list shows only runners created through this surface.
