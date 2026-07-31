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

- No changes to `Entities > Application Runners`. Of the eight `getApplicationSchemesList` consumers, the follow-up (Issue #4078) touches only the two `Assets > Applications` pages; the other six are unchanged.
- No versioning, publications, sharing, move, or import/export.
- No `Applications` tab, `Audit` tab, revision links, rollback, or Core-sync banner.
- ~~No extension of the application source-field runner picker~~ — extended on `Assets > Applications` only by the follow-up. No outbound create-application actions.
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

**Grant this view explicit exceptions to the asset list's filename assumptions.**
Reusing `BaseAssetList` supplies the list, tree, toolbar, and modals for free, but that stack assumes a row's name is a short filename and is also the row's identity. An app-runner name is neither: it is a URI, and the identity that addresses the resource is the separately-held encoded `path`. Three places enforce the filename assumption and each needs a scoped exception rather than a global relaxation:

- The ui-kit file manager's default forbidden-symbols regex (`:;,=/{}%&\"` plus control characters) drives the name cell's `isInvalidName` styling *and* gates the grid and bulk context-menu actions. Overridden per view with a control-characters-only pattern; every other view keeps the ui-kit default.
- `isItemNameValid` (`% / \ ;`) gated row opening. Opening navigates by encoded `path`, so the name's shape is irrelevant to whether a row can open — replaced with a view-aware check.
- The folder tree's action set offered add-sibling/add-child, which route into the shared create-folder handler. That handler submits `getEmptyAsset`, which carries no `$id`, so a folder create on a flat type could only ever fail. The tree now exposes no actions for this view.

The general shape: each exception is keyed to this view and leaves the default intact elsewhere, because the assumption is correct for filename-shaped types and wrong only here.

**Treat the `$id`'s encoding as a single invariant, not per-call-site handling.**
The `$id` crosses four encode/decode boundaries between Core and the detail view: Core's metadata `url`, the parsed row `path`, the detail-view query parameter (which the framework decodes once on its own), and `encodeCorePath` on the way back out. The invariant is that the row `path` stays *singly* encoded throughout, so exactly one layer is re-applied on the outbound request. Only the displayed name is fully decoded. A consumer that decodes the path defensively — reasonable-looking, and harmless for `MODEL`, whose names contain no escapes — turns `://` into path separators and the read 404s. Pinned by a round-trip test asserting the reconstructed request path equals the form used on write, rather than by asserting each boundary in isolation.

**Register the view in `isSimpleEntity` rather than relying on dispatcher ordering.**
The shared create-form dispatcher consults `isSimpleEntity`, which returns `true` for any route not explicitly listed. An unlisted new route therefore silently receives the generic `name`-based form, which renders plausibly and drops `$id` entirely. Listing the route as not-simple states the fact at its source; the dispatcher branch is also ordered ahead of that check so it no longer depends on the default.

**No Audit tab, revisions, rollback, or sync banner.**
DIAL Core has no audit, revision, history, or snapshot surface for config resources — its only audit artefact is `ExternalServiceAuditLog`, unrelated — and records only `author` and timestamps on the blob. The admin BE's audit is fed by JPA entity listeners on its own tables, so a Core-direct write produces no record. No existing Core-direct asset surface has these, and `Assets > Models` set the precedent by shipping without them. `getCoreSyncStatusUrl` returns `null` for unmapped routes, so leaving the new view out of that map disables the banner with no code change.

## Risks / Trade-offs

- **Ugly Core-side names.** Stored resource names and canonical IDs contain percent escapes (`schemas/platform/https%3A%2F%2F…`). Cosmetic, but visible to anyone inspecting blob storage or Core's config map directly. → Accepted as the cost of keeping `$id` as the FE identity.
- **Double-encoding is easy to get wrong.** An off-by-one-layer bug produces a 400 on write or an unparseable name on read. → Mitigated by isolating both directions in two pure functions with round-trip unit tests, rather than inlining `encodeURIComponent` calls at call sites.
- **No write-time validation means a bad payload persists silently.** A save that bypasses the client-side rules is accepted by Core with a 200 and only surfaces later as `status: "invalid"`. → Mitigated by the enumerated client-side rules; residual risk is accepted since the raw JSON editor can always produce a body the tab editors cannot.
- **Empty list on existing installs.** Only runners created through this surface appear, because `ConfigResourceMetadataController` reads blob storage and existing runners live in the aggregated config. → Expected for a new additive surface; documented in the proposal's non-goals.
- **Asset runners are not yet selectable by applications.** With the picker extension out of scope, a created asset runner cannot be attached to an application through the UI. → Accepted; the reference mechanism itself works (`BlobEntityValidator.appendSchemaWarning` resolves `application_type_schema_id` against the same map), so the follow-up is picker wiring only.
- **Shared-code exceptions accumulate per non-filename type.** Four separate defects in this change traced to one root: the asset scaffolding assumes name-is-filename-is-identity, and each place that assumes it failed independently and invisibly — the create form rendered plausibly while dropping `$id`, the grid greyed valid rows, the click was swallowed silently, the detail read 404'd. None were caught by the unit suite, because each was a wiring assumption rather than a logic error. → Mitigated by tests that assert the *behaviour* at each seam (id lands on `$id`; a URI name is openable; the reconstructed request path matches the written one) and verified to fail against the pre-fix code. Residual risk: the tabs and delete flow have had less manual exercise than list and create, so further instances of the same class should be expected there.
- **Non-locale-aware column defs silently render raw values.** The ui-kit's date columns are `(locale, options) => ColDef` factories the file manager resolves; a plain `ColDef` is passed through untouched, so a hand-written timestamp column renders epoch milliseconds with no error. → The created-at column is derived from the ui-kit's updated-at factory rather than hand-written, overriding `field` and `colId` (a shared `colId` collides in ag-grid).
- **`core-asset-client` delta overlap.** `add-model-asset-resource` is unarchived, so its `core-asset-client` delta is not yet folded into `openspec/specs/core-asset-client/spec.md`. Both deltas add requirements to the same capability without touching each other's, so they are independent; whichever archives second simply appends. → No action taken on the other change's artifacts.

## Decisions — follow-up (Issue #4078)

**A runner option is identified by its *reference value*, not by `$id`.**
The two populations are addressed differently in Core's single `applicationTypeSchemas` map: entity runners arrive via the admin BE's aggregated config push keyed by `$id`; asset runners are blob-written and keyed by their canonical ID, `schemas/platform/{encodeURIComponent($id)}`. So `application_type_schema_id` holds a different string shape depending on where the runner came from — confirmed against a Core-side review comment giving the exact expected value (`schemas/platform/http%3A%2F%2Fasdqwe`), which `SCHEMAS_PREFIX + toCoreRunnerName($id)` reproduces character-for-character with helpers already in the tree. The option's `value` therefore becomes the reference value, computed once per population at the point the merged list is built, rather than read off `$id` at the point of use. Every consumer that today compares against `$id` compares against the reference value instead.

**Origin travels on the row, not inferred from the value's shape.**
Three behaviours branch on which population an option came from: which resolved-schema endpoint to call on select, where the "Open" button navigates, and what the `Source` column renders. Sniffing the origin by testing whether the value starts with `schemas/platform/` would work today and silently misclassify the moment an entity runner's `$id` happens to look like one. An explicit discriminator on the merged row is the same amount of code and cannot drift. This is also the seam that would be reused if `Assets > Models` ever gets the same treatment — the mechanism is population-tagging a merged option list, not anything runner-specific.

**Flat merged grid rather than two tabs.**
The alternative — one modal, two tabs, each keeping its native columns — avoids empty cells and makes origin structural. It was considered and rejected in favour of a single grid, on the grounds that "one list of runners" is what the user is actually choosing between and a tab split makes them pick a source before they pick a runner. The cost is accepted and mitigated: asset rows have no `Display Name`, `Description`, or `Topics`, so those cells render empty, and `Display Name` being the grid's sort key means the sort needs a fallback to the reference value or the row would clump every asset runner at one end.

**Every row is labelled by `$id`, and the picker's presentation is therefore shared with `Entities > Applications`.**
The picker started out showing `Display Name` (sorted), `Description`, `ID`, `Topics`, and both timestamps — a set only the entity half can fill. It was reduced to `ID`, `Source`, `Author`, `Updated time`: everything either population has without a content read. With `Display Name` gone from the grid, keeping it as the *selected-value* label would mean browsing by one name and ending up with another, so the label follows the grid and is `$id` everywhere.

`AppRunners` and `SelectAppRunnersModal` are shared by both application surfaces (`SourceField.tsx` for entities, `ResourceSourceField.tsx` for assets), so this reaches `Entities > Applications` as well: its runner picker now presents `$id` rather than display names. That is a cosmetic change to a surface this change's non-goals declared untouched, accepted deliberately — the alternative is per-surface label and column overrides on a component whose whole value is being shared, and no reference value, fetch, save path, or option set changes there. The two call sites *are* cleanly distinguishable (`entity` prop vs `selectedValue` prop) if that ever needs revisiting.

**Asset rows carry no content, so only metadata-backed columns are populated.**
Core's listing returns `ResourceItemMetadata` — verified against `epam/ai-dial-core`: `name`, `path`, `bucket`, `url`, `nodeType`, `resourceType` from `MetadataBase`, plus `createdAt`, `updatedAt`, `etag`, `author`. No body. So `author` and the timestamps are free and are mapped onto the option; a display name, description, or topic list would cost one content `GET` per runner on every render of both `Assets > Applications` pages, working against the lazy folder context that exists precisely to avoid that. `$id` is also what the shipped `Assets > App Runners` list already shows, under a column literally headed `ID`, so the picker and the list agree on what an asset runner is called.

Two Core-side facts were confirmed directly rather than inferred, both load-bearing here: `ResourceTypes` has no version concept at all for `APP_TYPE_SCHEMA` (the boolean beside it is `requireCompression`), and `ENTITY_NAME_PATTERN` — `^[A-Za-z0-9._%:-]+$`, applied to the URL-decoded segment — admits no `/`, so a runner name can never contain a path separator. The first keeps this resource kind out of `VERSIONED_RESOURCE_TYPES`; the second is why the flat list is sufficient and the recursive read was dropped.

**No recursive list read — the resource kind is flat, so there is nothing to recurse into.**
This was originally specified as a recursive, folder-flattening variant of `assetApi.list`, on the assumption that a flat picker grid must gather runners out of nested folders. It must not: `PLATFORM_BUCKET_RESOURCE_TYPES` is documented as "flat, unversioned, and stored under the single fixed `platform` bucket", `parseEncodedFlatPath` returns `folderId: ''` unconditionally, and section 12.4 of this change already removed the folder tree's create actions for this view because "a folder create on a flat type could only ever fail". The bucket root therefore holds every runner, and the existing `list` — which already follows `nextToken` to completion — covers the picker in one call. `getAllRunners` is a thin wrapper that supplies the empty path.

The discarded version was worse than redundant: `parseEncodedFlatPath` correctly refuses to split a folder out of a flat path, so a nested node would have surfaced with `nested/http://b` as its *name*. Keeping the recursive read would have meant changing that shared helper to support a case Core cannot currently produce. Caught by a test asserting the flattening, which failed on data Core does not emit — the fixture was wrong, and the wrongness was the point.

**The asset fetch degrades rather than failing the page.**
`Assets > Applications` renders from a server component that already performs four admin-BE fetches inside one `try`. Adding a Core read to that block would let a Core outage — or an install whose token lacks Core's admin role — take down a page that works fine today. The asset-runner read is isolated so a failure yields the entity-only list, matching the behaviour before this follow-up.

**Spec drift noted, not silently reconciled.**
`openspec/specs/application-source/spec.md` states that the flat schema-id field is removed and that asset applications read `getSchemaSourceId(entity.source)`. The shipped code disagrees: `DialApplicationResource` carries a flat snake_case `application_type_schema_id`, `ResourceSourceField` reads and writes it directly, and `assets-applications/actions.ts` falls back to `source.applicationTypeSchemaId` only if the flat field is absent. This follow-up is specified against the code as it is, and does not rewrite the `application-source` capability — reconciling that drift is its own piece of work and folding it in here would hide a behavioural change inside a picker fix.

## Migration Plan

Purely additive. No existing route, component, server action, or admin-BE integration is modified; `Entities > Application Runners` and all six reference-data consumers of `getApplicationSchemesList` are untouched. Ships unconditionally with no feature flag, matching how the six prior asset changes and `add-model-asset-resource` shipped. Rollback is a plain revert — new files plus a menu entry, one `ResourceType` member, and additive entries in shared maps.

Depends on the flat/unversioned machinery merged with `add-model-asset-resource`; written against a tree that includes it, no coordination needed.

## Risks / Trade-offs — follow-up (Issue #4078)

- **The reference-value asymmetry is a silent-failure class, not a visible one.** Writing the wrong form saves a 200 and produces an application that simply never resolves its runner; reading the wrong form produces a blank field on an application that saved correctly. Neither raises an error. → Pinned by tests asserting the exact stored string for each population and a save → reopen → still-selected round trip, rather than by asserting the picker renders.
- **The picker is shared with `Entities > Applications`.** `AppRunners.tsx` serves both surfaces, so a merge applied at the component rather than at the two `Assets > Applications` pages would hand deployment applications options that fail on save against an admin-BE foreign key. → The merged list is assembled per-page and passed in; the component stays source-agnostic.
- **Empty content columns on asset rows are visible to every user of the picker.** Display name, description, and topics are blank for the asset half. → Accepted as the cost of not doing N content reads per render; consistent with what `Assets > App Runners` already shows.
- **Day-one emptiness on existing installs.** The asset half of the grid is empty until someone creates a runner through the new surface, since `ConfigResourceMetadataController` reads blob storage only. → Expected; the `Source` column makes the split legible rather than looking like missing data.
- **A large `platform` bucket makes the runner list the page's slowest fetch.** The read is unpaginated in aggregate (it follows `nextToken` to completion) and runs on every render of both pages. → Acceptable at the scale a single flat `platform` bucket implies; if it stops being so, the fix is the two-tab shape with a lazy asset pane, which was the rejected alternative above.

## Open Questions

None outstanding. The identity scheme, tab set, interceptor-picker source, audit-trio treatment, and create-button scope are all settled above; the picker scope is settled by the follow-up decisions.
