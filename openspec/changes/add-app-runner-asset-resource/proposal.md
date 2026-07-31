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
- ~~**No extension of the application source-field runner picker**~~ — **superseded by the follow-up below (Issue #4078)**, which wires asset runners into the picker on `Assets > Applications`.
- **No extension of the runner picker outside `Assets > Applications`.** `Entities > Applications` keeps its entity-only picker: its reference is `source.applicationTypeSchemaId`, a foreign key into the admin BE's own runner table, so an asset runner has no row to point at and a merged option there would be selectable but fail on save. The other five `getApplicationSchemesList` consumers (`interceptors/[id]`, `application-publications/[id]`, `applications`, `application-runners`, `export-config`) are likewise untouched.
- **No outbound "Create Application"/"Create Asset Application" buttons** on the runner detail view. The entity variant is impossible (`ApplicationEntity.applicationTypeSchema` is a foreign key into the admin BE's own runner table). The asset variant is now technically possible once the picker renders asset runners, but remains out of scope here.
- **No `Applications` tab** — the reverse association is an admin-BE database concept with no Core counterpart.
- **No Audit tab, revision links, rollback, or Core-sync banner** — DIAL Core exposes no audit, revision, history, or snapshot surface for config resources, and no existing Core-direct asset surface has them.
- **No import/export, publications, sharing, versioning, or move.**
- **No backfill of existing runners into Core blob storage.** Existing runners reach Core through the admin BE's aggregated whole-config push keyed by `$id`; blob-written runners are keyed by canonical ID. The two populations coexist in Core's single `applicationTypeSchemas` map, exactly as `Assets > Models` coexists with `Entities > Models`. The new list shows only runners created through this surface.

## Follow-up: asset runners selectable from asset applications (Issue #4078)

Shipping the surface above left it unreachable: an admin can create an app runner under `Assets > App Runners`, but no application can point at it, because the runner picker on `Assets > Applications` is fed solely by the admin BE's `getApplicationSchemesList`. The only workaround is hand-editing the application's JSON. This follow-up closes that, and is the deferral the original non-goal named.

### What changes

- **Both populations in one picker.** `SelectAppRunnersModal` renders a single flat grid combining the admin-BE runner list with the Core asset-runner list, plus a new `Source` column reading `Entity` or `Asset`. The asset half is fetched through the existing Core asset path (`getRunners` → `assetApi.list`), not through the admin BE.
- **The reference value is population-dependent.** An entity runner is still referenced by its `$id`. An asset runner is referenced by its Core resource name, `schemas/platform/{encodeURIComponent($id)}` — e.g. `schemas/platform/http%3A%2F%2Fasdqwe`. `AppRunners.tsx` currently writes `r.$id` for every option, which is wrong for the asset half.
- **The reverse lookup must accept both forms.** `Assets/Apps/Properties.tsx` resolves the selected runner with `scheme.$id === schemaSourceId`, which can never match a canonical resource name — so a correctly-saved asset runner reopens as a blank field and silently disables the Responses defaults section. The `valueTitle` lookup in `AppRunners.tsx` has the same defect.
- **Each option carries its origin,** because two further behaviours branch on it: the resolved-schema read on select (admin BE `getResolvedApplicationScheme` vs Core `getResolvedRunnerSchema`), and the "Open" button target (`/application-runners/{$id}` vs `/assets-app-runners/{path}`).
- **One list read, no recursion.** This resource kind is flat — `PLATFORM_BUCKET_RESOURCE_TYPES` is documented as such and `parseEncodedFlatPath` returns `folderId: ''` unconditionally — so the bucket root already holds every runner and `assetApi.list` covers the picker in a single (paginated) call. A `getAllRunners` action wraps it for callers that have no folder to scope to.
- **Asset rows are labelled by `$id`.** Their list rows are metadata-only (`ResourceInfo`), so no display name, description, or topics exist without a content read per runner. `$id` matches what the shipped `Assets > App Runners` list already shows under a column headed `ID`. Because `Display Name` is the grid's sort key, the merged grid needs a sort fallback so asset rows do not clump at one end.

### Capability impact

- `assets-app-runners` (modified): asset runners become selectable from `Assets > Applications`; the existing "Entities > Application Runners is unaffected" requirement is narrowed, since asset applications now read both lists rather than the admin-BE list alone.
- `app-runner-resources-core-api` (modified): adds a recursive, folder-flattening list read over `schemas/platform/`.

### Additional impact

- `src/components/SourceField/Application/AppRunners.tsx`: origin-aware option values, resolve dispatch, `valueTitle` lookup, and Open target.
- `src/components/SourceField/Application/SelectAppRunnersModal.tsx` and `src/constants/grid-columns/grid-columns.tsx`: merged row model, `Source` column, sort fallback.
- `src/components/Assets/Apps/Properties.tsx`: reverse lookup accepting both reference forms.
- `src/app/[lang]/assets-applications/page.tsx` and `[id]/page.tsx`: second fetch for the asset runner list, isolated so a Core failure degrades to the entity-only list rather than failing the page.
- `src/app/[lang]/assets-app-runners/actions.ts`: a `getAllRunners` action over the existing flat list read. `src/server/core/asset-api.ts` is unchanged.
- New pure helper composing `SCHEMAS_PREFIX` + `toCoreRunnerName` into the canonical reference value, and its inverse for the reverse lookup.
