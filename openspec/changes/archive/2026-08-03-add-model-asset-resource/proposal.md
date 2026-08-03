## Why

Applications, toolsets, conversations, prompts, and files have already been migrated from the admin-BE proxy to talking directly to DIAL Core as "asset" resources. Models are the next entity type that exists both as an admin-BE-backed "Entity" (`Entities > Models`) and, in DIAL Core, as a `ConfigResource` (`GET/PUT/DELETE /v1/models/platform/{name}`, listable via `GET /v1/metadata/models/platform/`). Admins currently have no way to browse or edit Core's raw model-resource JSON the way they can for asset applications/toolsets — adding an `Assets > Models` resource closes that gap using the same pattern already proven for applications.

## What Changes

- Add `ResourceType.MODEL` and wire it into the existing generic Core-asset machinery (`AssetApi`, `CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL`, `RESOURCE_TYPE_PREFIX`, `ASSET_MERGERS`) alongside application/toolset/conversation/prompt.
- Add a new `Assets > Models` menu item, first entry in the Assets section, pointing at a new `/assets-models` route.
- Add `src/components/Assets/Models/*`, mirroring `Assets/Apps/*`: a flat (non-foldered) list view and ~~a detail view with `Properties` and `Features` tabs only (no Roles/Interceptors/Audit/Tools/Dependencies tabs, matching what `Entities > Models` supports today)~~ — **superseded by the follow-up below.** The two-tab set rested on a false premise: `Entities > Models` has five tabs (Properties, Features, Roles, Interceptors, Audit), not two.
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

## Follow-up: parity with `Entities > Models`, and the flat-view defects

Shipping the surface above left it under-built in a way the original proposal did not intend. Two independent problems, closed together here because both are finalization work on the same unarchived change.

### The tab set and Properties tab were scoped from a wrong premise

The two-tab decision was justified as "matching what `Entities > Models` supports today". That is not what the entity view supports — it renders Properties, Features, **Roles**, **Interceptors**, and Audit. Separately, `Assets/Models/Properties.tsx` renders none of the routing-critical fields that `DialModelResource` already declares and DIAL Core's `Deployment`/`Model` already accept. The practical consequence: a model created through this surface has **no endpoint and no upstreams**, so it is registered but unroutable, and the only repair path is the raw JSON toggle.

- **Properties gains the unexposed Core-supported fields**: `endpoint`, `upstreams`, `type`, `tokenizerModel`, `overrideName`, `forwardAuthToken`, `embeddingDimensions` (shown for `EMBEDDING` only), `displayVersion`, and `responsesDefaults`. Existing controls are reused or extracted for shared use rather than duplicated; only the display-name/version pair genuinely needs extracting out of `DeploymentProperties`, and `descriptionKeywords` turns out to be rendered already via the topics control.
- **`endpoint` is a plain field, not a source field.** Core's `Deployment` has no `source` concept — container/adapter sources are admin-BE constructs. `endpoint` is presented as the legacy fallback to the `interfaces` map already rendered, matching Core's `resolveEndpoint()` precedence.
- **`responsesDefaults` is rendered whenever the model can serve the Responses API**, computed as Core does in `supportsInterface(OPENAI_RESPONSES)` — `interfaces['openaiResponses'].base_url` or `responsesEndpoint` present. The entity view's `source.$type`-derived condition has no Core counterpart and is not ported.
- **Roles and Interceptors tabs are added**, bringing the asset view to four tabs (Properties, Features, Roles, Interceptors). Adding Interceptors also makes an already-specified requirement reachable: Core's write-time 422 validates exactly one thing on a model — that every `interceptors[i]` resolves in the merged config — so until now no form input could trigger it.
- **Upstream secrets are omit-preserved, never blanked.** `Upstream.key` and `Upstream.secretExtraData` are `@EncryptedField` + `WRITE_ONLY` in Core, so they never come back on GET and every loaded upstream renders them empty. Core preserves an omitted or null secret but re-encrypts a literal `""` as a real value, destroying the stored credential. The write path must drop empty secrets rather than send them.
- **No Audit tab.** DIAL Core exposes no audit, revision, or snapshot surface for config resources, matching every other Core-direct asset surface.

### Flat-view defects fixed for App Runners but not for Models

`add-app-runner-asset-resource` found a family of wiring defects by using its view, and two of its fixes were scoped to that view alone even though `Assets > Models` is the sibling flat resource kind with the identical constraint:

- The folder tree still offers add-sibling/add-child/rename for Models. Those route into the shared create-folder handler, which submits `getEmptyAsset` — a `TEMP_FOLDER` placeholder with no valid model — into a bucket that has no folder concept, so the action can only fail.
- The model detail route decodes the `path` query parameter a second time after Next has already decoded it once.
- The list omits the localized created-at column App Runners gained.

### Admin-backend independence

The original proposal described this surface as Core-direct without qualifying it. Auditing every server call it makes found five admin-backend reads — none touching the model resource, all populating pickers, four of them introduced by this follow-up. Two are removed here and three are deferred:

- **Removed**: the tokenizer catalogue (its picker was selection-only, so the field was uneditable without the admin backend — replaced with free text, since Core treats the value as an opaque string it neither validates nor enumerates) and the topic catalogue (already had a free-text path, so it was enrichment; dropped for this view only).
- **Deferred to its own change**: the role list, interceptor list and global interceptors. All three are Core-owned and readable from two Core endpoints — `/v1/metadata/{type}/platform/` for API-written entries plus `/v1/admin/config/file/{type}` for config-file entries — which together are exactly the set Core's own validator accepts. Deferred because it adds a client for a second Core route family, needs dedup and reference-form rules for names in both populations, and applies equally to `Assets > App Runners`.

So after this change **no admin-backend call is required to configure a model**; three optional picker reads remain, and the surface degrades to typed entry rather than breaking. `Assets > App Runners` still carries the interceptor and topic dependencies it shipped with.

### Capability impact

- `assets-models` (modified): four tabs rather than two; Properties covers the Core-supported deployment fields; the folder tree offers no folder actions; the list carries a created-at column.
- `model-resources-core-api` (modified): the upstream secret omit-preservation contract on write; `status` corrected to reflect Core's two distinct projections and its admin-only `validationWarnings` channel; the canonical deployment identity a written model takes in the merged config.

### Additional impact

- `src/components/Assets/utils.ts`: `getTreeActionLabels` returns no actions for `AssetsModels`.
- `src/app/[lang]/assets-models/[id]/page.tsx`: drop the second decode; fetch the role list for the new Roles tab.
- `src/components/Assets/BaseAssetList/utils.tsx`: created-at column for `AssetsModels`.
- `src/components/Assets/Models/Properties.tsx`: the new field set.
- `src/components/EntityView/Interceptors/Interceptors.tsx` and `src/components/EntityView/Roles/`: recognise `AssetsModels`.
- `src/utils/tabs/utils.ts`: four tabs for `AssetsModels`.
- `src/app/[lang]/assets-models/actions.ts`: empty-secret stripping in the write payload helper.
- New pure helper for the Responses-API support check, and one for upstream secret stripping.

### Non-goals for this follow-up

- **No `dependencies` editor.** It needs a picker spanning both the entity and asset model populations; that is its own change.
- **No `reference` editor.** Core's `Deployment.reference` is editable on no admin surface today, so exposing it here would be inventing a control rather than reusing one, with no established validation or semantics to copy.
- **No `catalogSchemaId`/`catalogProperties` editor.** `catalogProperties` is validated against a registered catalog schema, and no admin surface for catalog schemas exists yet.
- **No Audit tab, revision links, or rollback** — no Core surface exists for them.
- **No import/export, publications, sharing, versioning, or move** — unchanged from the original scope.
- **No changes to `Entities > Models`** — unchanged from the original scope.
