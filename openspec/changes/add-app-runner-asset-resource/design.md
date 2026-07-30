## Context

DIAL Core exposes two structurally different resource route families:

- `ResourceController` (`RESOURCE`/`RESOURCE_METADATA`) — application/toolset/conversation/prompt/file. Nested folders, `name__version` versioning, sharing and publications, always sets an `ETag` on GET 200.
- `ConfigResourceController` (`CONFIG_RESOURCE`/`CONFIG_RESOURCE_METADATA`) — model/interceptor/role/key/route/schema/catalog_schema/settings. Flat, no versioning, fixed `platform` bucket, no `ETag` on per-entity GET.

`add-model-asset-resource` integrated the first `ConfigResourceController` type (`MODEL`) and left behind generic seams: `isVersioned()`, `parseEncodedFlatPath`, `flatMetadataFields`, flat `parsePathFields`, etag-from-metadata in `getMergedWithEtag`, `resolveListPath`'s root-prefix strip, and `getRootFolder`. This change adds the second such type, `APP_TYPE_SCHEMA` — application runners — reusing those seams.

Within `ConfigResourceController`, however, `APP_TYPE_SCHEMA` is not the same shape as `MODEL`. `prepareWrite()` returns `new WriteSpec(descriptor, Model.class, true, false)` for models but `new WriteSpec(descriptor, null, false, false)` for schemas, and `handlePut()` branches on that: a null entity class means `blobBody = requestNode.toString()` — the request body is stored verbatim, with no deserialization, no secret-field handling, and no cross-reference validation. `applyEntityWriteLocked` confirms the absence of post-processing (`case PROJECT_KEY, APP_TYPE_SCHEMA, CATALOG_SCHEMA -> { /* no post-processing */ }`). So models get Core's 422 `validationWarnings` on a bad cross-reference; runners get a 200 on anything that parses as JSON.

Today application runners exist only as an admin-BE `Entity`. The admin BE is their system of record: `ApplicationTypeSchemaEntity` rows in its own database, rendered into Core format by `ApplicationTypeSchemaCoreMapper` and published inside the aggregated whole-config document by `CoreConfigAggregatorService`:

```java
private LinkedHashMap<String, String> getApplicationTypeSchemas() {
    return applicationTypeSchemaService.getAllOrderedByDisplayNameAscIdAsc().stream()
            .collect(toLinkedHashMap(ApplicationTypeSchema::getSchemaId,   // key = $id
                                     schemaMapper::mapToCoreString));
}
```

Blob-written entries land in that same `Config.applicationTypeSchemas` map but keyed by canonical ID (`schemas/platform/{name}`), via `MergedConfigStore`. The two populations therefore coexist under different keys and never collide — which is exactly the relationship `Assets > Models` already has to `Entities > Models`, and the reason this change can be additive and FE-only.

## Goals / Non-Goals

**Goals:**

- List, view, create, update, and delete DIAL Core app-runner resources directly, without an admin-BE round trip.
- Reuse the generic `AssetApi`/`ResourceType`/`ASSET_MERGERS` machinery rather than a bespoke client.
- Keep `$id` as the user-facing identity so routes, `IdControl isUrlId`, and open-in-new-tab behave as they do on the entity side.
- Own, in the FE, the payload transformations the admin BE performs today for the fields this surface exposes — principally the route array/object conversion.
- Replace the admin BE's `resolvedSchema` read with Core's equivalent rather than reimplementing external-schema fetching.

**Non-Goals:**

- No changes to `Entities > Application Runners` or any existing consumer of `getApplicationSchemesList`.
- No versioning, publications, sharing, move, or import/export.
- No `Applications` tab, `Audit` tab, revision links, rollback, or Core-sync banner.
- No extension of the application source-field runner picker, and no outbound create-application actions.
- No backfill of existing admin-BE runners into Core blob storage.

## Decisions

**Extend the generic `AssetApi` machinery rather than build a separate client.**
Metadata listing is wire-compatible — `ConfigResourceMetadataController` and `ResourceController.getMetadata()` both delegate to `ResourceService.getMetadata()` — so `APP_TYPE_SCHEMA` slots into `CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL`/`RESOURCE_TYPE_PREFIX`/`ASSET_MERGERS` the way `MODEL` did. `EntityBucketBinding` already allows `schemas` → `platform`.

**Keep `$id` as the Core resource name, via one extra encoding layer.**
`ENTITY_NAME_PATTERN` (`^[A-Za-z0-9._%:-]+$`) is applied to the segment *after* `UrlUtil.decodePath`, so a raw `$id` URI fails on `/`. Encoding the `$id` once before handing it to `encodeCorePath` — which itself applies `encodeURIComponent` per segment — puts the doubly-encoded form on the wire; Core strips one layer and stores `https%3A%2F%2F…`, which satisfies the pattern. Reads reverse both layers.

Alternative considered: a slug resource name with `$id` retained only as a body field. Rejected because it changes the FE identity (route param, `IdControl`, `getEntityPath`) and shifts the reference convention for no gain on this surface, where nothing yet references the runner.

Consequence accepted: the canonical ID an application would use to reference an asset runner is `schemas/platform/https%3A%2F%2F…`, not the bare `$id`. Since the picker extension is out of scope, nothing depends on this yet.

Constraint accepted: `encodeURIComponent` leaves `!`, `~`, `*`, `'`, `(`, `)` unescaped and none are in `ENTITY_NAME_PATTERN`, so a `$id` containing them cannot be stored. Validated locally before the request rather than surfaced as a Core 400.

**Strip `name` and `status` on every write, not just `path`/`folderId`.**
`projectSchemaItem()` injects `name` — set to the full canonical ID, not a bare name — and `status`. Because the body is stored verbatim, echoing a GET response back would graft `"name": "schemas/platform/…"` permanently into the stored schema and then trip `@ConformToMetaSchema` on the next full config rebuild, surfacing as `status: "invalid"` rather than as a write error. The models change's `toModelPayload` idiom extends by one field.

**Persist `topics` in the resource body; drop `applications`.**
The app-runner meta-schema declares no root-level `additionalProperties: false` (only nested ones, on routes, upstreams, response, and attachmentPaths), so extra root fields validate and — given verbatim storage — round-trip. `topics` is kept because the Properties tab edits it and the list has a column for it. `applications` is dropped because its tab is out of scope and Core models the association in the reverse direction only, via `applicationTypeSchemaId` on the application.

**Own the route array/object conversion as two pure functions.**
Core's `dial:applicationTypeRoutes` is an object keyed by route name with `dial:`-prefixed fields; the FE model is `DialAppRoute[]`. The mapping mirrors `ApplicationTypeSchemaRouteCoreMapper`'s two `map()` overloads: key from `displayName || name`, `paths` as regex source strings, `permissions` uppercased to `READ`/`WRITE`, `extraData` serialized to a string, and `secretExtraData`/`id`/`responsesEndpoint` dropped from upstreams (the meta-schema's upstream is `additionalProperties: false` and declares only `dial:endpoint`, `dial:key`, `dial:extraData`, `dial:weight`, `dial:tier`).

Placing the converters at the server-action boundary keeps `EntityView/AppRoute` and `EntityView/Interceptors` usable unchanged, and keeps the conversion unit-testable with no mocks.

Route roles map onto `dial:userRoles`. The editor stores a route's selected roles as the **keys** of `route.roleLimits` (`RouteRoles.tsx` reads `Object.keys(route.roleLimits || {})` as the route's user roles), so the conversion is keys-to-list on write and list-to-empty-limits-map on read — the same relationship the admin BE's mapper expresses via `deployment`. The per-role limit *values* have no Core representation and are not carried; route-level `additionalProperties: false` blocks stashing them in the body.

`isPublic` is not carried either. It is a UI mode meaning "inherit the parent's roles", and selecting it clears `roleLimits`, so an `isPublic` route writes no `dial:userRoles`. On read a route with no roles is therefore indistinguishable from a public one and renders as non-public with an empty role list. Accepted: this surface has no parent deployment to inherit from, which is what `isPublic` exists to express.

**Read resolved parameters from Core, accepting a documented merge-semantics drift.**
`ApplicationSchemaService.getSchema(schemaId, forceReload)` downloads `dial:applicationTypeSchemaEndpoint` (5s timeout, proxy-aware, cached per schema id) and merges; `GET /v1/application_type_schemas/schema?id=` calls it with `forceReload = true`, then strips the endpoint fields from the response to avoid disclosure. The route is not admin-gated.

The merge differs from the admin BE's. The BE fills only `required`, `$defs`, and `properties`, and only when the local value is absent. Core uses the external schema as the base and overlays *every* local field on top. The two diverge only when both schemas define the same key, and the three FE consumers feed the result into `getSchemaDefaults()`, which reads `properties` — so the drift is accepted rather than compensated for. `isReadOnly`, which the BE returns via `ApplicationTypeSchemaWithValidation`, is not available from Core and is not used downstream.

**Enforce the meta-schema client-side.**
Core validates nothing on write for this kind, and the admin BE's four layers — `SchemaConformToMetaSchemaValidator`, `ApplicationTypeSchemaValidator`, the configurable `$id` pattern, and `ApplicationTypeSchemaCoreConfigNormalizer` — are all bypassed. The rules enumerated in the `assets-app-runners` spec are the subset this surface can violate through its own editors. Core publishes the meta-schema at `GET /v1/application_type_schemas/meta_schema` if fuller conformance checking is wanted later.

**Interceptor picker reads from the admin BE.**
Interceptors are themselves a `ConfigResourceController` type (`/v1/interceptors/platform/{name}`), but `ConfigResourceMetadataController` lists blob storage only, and today's interceptors arrive via the aggregated config push — so a Core-sourced picker would be empty. `assets-applications/[id]/page.tsx` already fetches `interceptorsApi.getInterceptorsList()` for a Core-direct asset view, so this follows existing precedent rather than introducing a new pattern.

**No Audit tab, revisions, rollback, or sync banner.**
DIAL Core has no audit, revision, history, or snapshot surface for config resources — its only audit artefact is `ExternalServiceAuditLog`, unrelated — and records only `author` and timestamps on the blob. The admin BE's audit is fed by JPA entity listeners on its own tables, so a Core-direct write produces no record. No existing Core-direct asset surface has these, and `Assets > Models` set the precedent by shipping without them. `getCoreSyncStatusUrl` returns `null` for unmapped routes, so leaving the new view out of that map disables the banner with no code change.

## Risks / Trade-offs

- **Ugly Core-side names.** Stored resource names and canonical IDs contain percent escapes (`schemas/platform/https%3A%2F%2F…`). Cosmetic, but visible to anyone inspecting blob storage or Core's config map directly. → Accepted as the cost of keeping `$id` as the FE identity.
- **Double-encoding is easy to get wrong.** An off-by-one-layer bug produces a 400 on write or an unparseable name on read. → Mitigated by isolating both directions in two pure functions with round-trip unit tests, rather than inlining `encodeURIComponent` calls at call sites.
- **No write-time validation means a bad payload persists silently.** A save that bypasses the client-side rules is accepted by Core with a 200 and only surfaces later as `status: "invalid"`. → Mitigated by the enumerated client-side rules; residual risk is accepted since the raw JSON editor can always produce a body the tab editors cannot.
- **Empty list on existing installs.** Only runners created through this surface appear, because `ConfigResourceMetadataController` reads blob storage and existing runners live in the aggregated config. → Expected for a new additive surface; documented in the proposal's non-goals.
- **Asset runners are not yet selectable by applications.** With the picker extension out of scope, a created asset runner cannot be attached to an application through the UI. → Accepted; the reference mechanism itself works (`BlobEntityValidator.appendSchemaWarning` resolves `application_type_schema_id` against the same map), so the follow-up is picker wiring only.
- **`core-asset-client` delta overlap.** `add-model-asset-resource` is unarchived, so its `core-asset-client` delta is not yet folded into `openspec/specs/core-asset-client/spec.md`. Both deltas add requirements to the same capability without touching each other's, so they are independent; whichever archives second simply appends. → No action taken on the other change's artifacts.

## Migration Plan

Purely additive. No existing route, component, server action, or admin-BE integration is modified; `Entities > Application Runners` and all six reference-data consumers of `getApplicationSchemesList` are untouched. Ships unconditionally with no feature flag, matching how the six prior asset changes and `add-model-asset-resource` shipped. Rollback is a plain revert — new files plus a menu entry, one `ResourceType` member, and additive entries in shared maps.

Depends on the flat/unversioned machinery merged with `add-model-asset-resource`; written against a tree that includes it, no coordination needed.

## Open Questions

None outstanding. The identity scheme, tab set, interceptor-picker source, audit-trio treatment, and picker/create-button scope are all settled above.
