## Context

DIAL Core exposes two structurally different resource route families:
- `ResourceController` (`RESOURCE`/`RESOURCE_METADATA`) — application/toolset/conversation/prompt/file. Nested folders, `name__version` versioning, sharing/publications, always sets an `ETag` on GET 200.
- `ConfigResourceController` (`CONFIG_RESOURCE`/`CONFIG_RESOURCE_METADATA`) — model/interceptor/role/key/route/schema/catalog_schema/settings. Flat (no folders, no `/` in the entity name), no versioning, fixed `platform` bucket only.

Both families' metadata endpoints (`ConfigResourceMetadataController.handle()` and `ResourceController.getMetadata()`) delegate to the same `ResourceService.getMetadata()`, producing an identical `ResourceFolderMetadata`/`ResourceItemMetadata` JSON shape. This means DIAL Core's `models/platform/` listing is wire-compatible with the admin FE's existing `CoreResourceMetadataNode`/`toResourceInfoList` machinery without modification. The one confirmed gap: `ConfigResourceController`'s per-entity `GET /v1/models/platform/{name}` 200 does not set an `ETag` response header (unlike `ResourceController`, which always does), and its response body is a bespoke `ObjectNode` (`projectItem()`) rather than the raw stored blob `ResourceController` returns.

The admin FE already migrated application/toolset/conversation/prompt/file assets off the admin-BE proxy onto a generic Core-direct client (`AssetApi`, keyed by `ResourceType`). This change extends that same machinery to a sixth resource kind, `MODEL`, which is the first `ConfigResourceController`-family type the FE integrates with.

Only `Entities > Models` (admin-BE-backed, `src/app/[lang]/models/`) exists today. This change adds a parallel `Assets > Models` (Core-direct) surface, following the same relationship `Assets > Applications` already has to `Entities > Applications`.

## Goals / Non-Goals

**Goals:**
- List, view, create, update, and delete DIAL Core model resources directly, without an admin-BE round trip.
- Reuse the generic `AssetApi`/`ResourceType`/`ASSET_MERGERS` machinery rather than a bespoke client.
- Match the Assets > Apps UI pattern (list + Properties/Features detail tabs) as closely as the flat/unversioned constraints allow.
- Preserve, on the resource side, the exact same Features-tab delta that already exists between the Models-entity and Applications-entity Features tabs (Models has a caching group Applications lacks; Applications has `consentRequired` Models lacks).

**Non-Goals:**
- No versioning, publications, or sharing for the model asset — `ConfigResourceController` has no `__version`/sharing concept.
- No nested folders or move-into-folder — the list has exactly one root, the fixed `platform` bucket.
- No bulk import/export/zip for models in this change (Apps' import/export machinery is version- and folder-aware in ways that don't map cleanly onto a flat, unversioned resource; can be revisited later if needed).
- No Roles/Interceptors/Audit/Tools/Dependencies tabs on the model asset view — only Properties + Features, matching point 6 of the original request.
- No changes to `Entities > Models` or its admin-BE-backed server actions (`src/app/[lang]/models/actions.ts`) — that path is untouched.

## Decisions

**Extend the generic `AssetApi` machinery rather than build a separate client.**
Metadata listing is already wire-compatible (same underlying `ResourceService.getMetadata()` on the Core side), so `MODEL` slots into `CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL`/`RESOURCE_TYPE_PREFIX`/`ASSET_MERGERS` the same way the four versioned types do. Alternative considered: a lightweight model-only client (like `ToolsetOpsApi`) — rejected because the metadata/list/get/put/delete shape is a strict subset of what `AssetApi` already does; a separate client would duplicate that logic for no benefit.

**Widen the unversioned exclusion (`VersionedResourceType`) to include `MODEL`, alongside `FILE`.**
`MODEL` has no `__version` suffix concept, matching `FILE`'s existing unversioned treatment. `Exclude<ResourceType, ResourceType.FILE>` becomes `Exclude<ResourceType, ResourceType.FILE | ResourceType.MODEL>`.

**Source the model resource's etag from the metadata response, not the content response.**
`AssetApi.getMergedWithEtag` currently returns `contentResult.etag` (the content GET's `ETag` header) for all types. Since `ConfigResourceController`'s per-entity GET never sets that header, `MODEL` needs a per-type override that instead uses the metadata GET's `etag` field (present in `ResourceItemMetadata` regardless of controller family). This is a pure FE-side workaround — no DIAL Core change — confirmed viable because `ConfigResourceController` PUT/DELETE fully honor `If-Match`/`If-None-Match`, so a metadata-sourced etag is still usable for conditional writes.

**Give the model asset its own dedicated Features component and constants, not a reuse of `ResourceFeatures`.**
`Assets/Resources/ResourceFeatures.tsx` + `Assets/Resources/constants.ts` (`resourceSwitchGroups`, `resourceTextFeatures`, `resourceFeatureLabelMap`, `resourceRunnerApplicationMap`) are a snake_case mirror of the **Applications**-entity feature set (`applicationSwitchGroups`), including `consent_required` and no caching group, plus app-runner-scheme-inherited-readonly logic that only makes sense for Applications (which have runner schemas). Models have no runner/schema concept — the Models-entity `TabsContent.tsx` already calls the generic `EntityFeatures` without an `appRunner` prop. So the model asset's Features tab needs its own parallel constants mirroring `modelsSwitchGroups`/`modelsTextFeatures` instead: same five shared groups (sampling/output, tools, prompt composition, attachments, feedback) plus a caching group, minus `consent_required` from session-access, and with no runner-inherited-value logic at all.

**Flat list: the list view's data source is the single `platform/` bucket; no folder-create action is wired up.**
Reuses `Assets/Apps/List` machinery for rendering/columns/actions, but omits `FilePath`/folder-move controls in `Properties.tsx` and the create-folder handler in the list toolbar, since `platform/` is Core's only bucket for this resource type and is never created, renamed, or nested.

**Strip the GET-only `status` field before PUT; do not echo the raw GET response back as the update payload.**
Confirmed against `ConfigResourceController`: `handleGet()`'s `projectItem()` returns `Model`'s own serialized fields (via the default `MAPPER`) plus an injected `name` (redundant — `Model` already carries `name` via `RoleBasedEntity`) and an injected `status` (`"valid"` or `"invalid"`), which is **not** a field on `Model`/`Deployment`/`RoleBasedEntity`. `handlePut()` deserializes the request body strictly as `Model.class` (`treeToEntity`), and none of `Model`, `Deployment`, or `RoleBasedEntity` carry `@JsonIgnoreProperties(ignoreUnknown = true)` — so Jackson's default `FAIL_ON_UNKNOWN_PROPERTIES` (unset, defaults to `true`) applies. Echoing the raw GET body back as the PUT payload would therefore fail on the unrecognized `status` field. The update action SHALL strip `status` (and `name`, to stay consistent with how the other asset types already drop identity fields via `stripAssetIdentityFields`) from the merged resource before sending PUT — the same shape of workaround already applied to the four `ResourceController`-family types.

## Risks / Trade-offs

- [Unconfirmed snake_case field names for the caching keys] ~~The Models-entity feature set has `cacheSupported`/`autoCachingSupported`, but no snake_case precedent exists yet.~~ **Resolved**: confirmed via `Features.java`'s class-level `@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)` — canonical wire field names are `cache_supported`/`auto_caching_supported` (camelCase accepted only via `@JsonAlias` for lenient deserialization). This `Features` POJO is shared verbatim between `Model` and `Application` deployments in Core, so `consent_required` is technically a valid field on a model resource's `features` object too — the admin FE's Models-entity switch groups just choose not to surface it, a UI curation choice this change preserves on the resource side as well, not a Core-side constraint.
- [Bespoke GET response shape] ~~It's unconfirmed whether the PUT request body DIAL Core expects is exactly symmetric with that GET shape.~~ **Resolved**: not symmetric — see the new Decision above. GET adds a `status` field that PUT's strict `Model.class` deserialization rejects; the FE must strip it before update.
- [Partial visibility] `ConfigResourceMetadataController` does not surface file-sourced (`aidial.config.json`) model entries — only blob-backed/API-written ones. Some models configured via static config may not appear in the new Assets > Models list. → Mitigation: document this as a known limitation; not fixable from the FE alone.
- [Shared-type blast radius] Widening `VersionedResourceType`'s exclusion touches a type consumed by all five existing asset types' shared logic. → Mitigation: this is a type-level exclusion widening only (adding a case), not a behavior change to the existing four types; verify with the existing asset test suites after the change.

## Migration Plan

Purely additive — no existing route, component, or admin-BE integration is modified. Ships unconditionally (no feature flag), matching how the four prior asset-migration changes shipped. Rollback is a plain revert (new files/menu entry only).

## Open Questions

None outstanding. Both prior open questions (caching-feature snake_case field names; GET/PUT payload symmetry) are resolved — see the Decisions and Risks sections above.
