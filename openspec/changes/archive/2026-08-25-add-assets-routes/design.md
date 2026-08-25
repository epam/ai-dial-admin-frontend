## Context

`Assets > App Runners`, `Assets > Models`, and `Assets > Interceptors` established the pattern for
exposing a DIAL Core config resource directly. `Route` is the remaining first-class Core resource tier
with zero frontend wiring:

- `ResourceTypes.ROUTE("routes", true, TimeUnit.DAYS.toMillis(30))` in `ai-dial-core`'s
  `PlatformEntityLocationStrategy` — the same tier as `MODEL`/`INTERCEPTOR`/`ROLE`: flat, unversioned,
  stored under the fixed `platform` bucket at `routes/platform/{name}`.
- `ConfigResourceController`'s `WriteSpec(ROUTE) = new WriteSpec(descriptor, Route.class, true, false)`
  — a real Jackson entity Core validates server-side (like `Interceptor.class`), with
  `hasEncryptedFields = true` (Interceptor's is `false`). `Route.upstreams` carries the same
  `Upstream` shape `Model.upstreams` does, so Core encrypts/masks upstream secrets on write/read the
  same way it already does for models.
- `Route extends RoleBasedEntity` **directly** — unlike `Interceptor extends Deployment`, it has no
  `displayName`/`description`/`iconUrl`/`endpoint`/`features` at all. Its real fields are `paths`,
  `methods`, `rewritePath`, `response` (`status`/`body`), `upstreams`, `maxRetryAttempts`, `order`,
  `permissions`, `attachmentPaths` (`requestBody`/`responseBody`), plus `name`/`userRoles` from
  `RoleBasedEntity`.

The admin-BE-backed `Entities > Routes` surface (`components/Routes/**`) already has real UI for this
exact shape — `RouteProperties.tsx` (paths, rewrite switch, methods multiselect, response/upstreams
output radio, status/body, `UpstreamEndpoints`, max-retry-attempts, order+reset) and
`RouteAttachments.tsx` (request/response attachment paths) — built against the admin-BE `DialRoute`
model. It also already has a Roles tab (`EntityRoles`, `roleLimits`) and its own Admin/CORE-format
toggle (`getCoreRoute`/`updateCoreRoute`, admin-BE-proxied) — both stay as-is, untouched by this change.

`ResourceType` today is `FILE | PROMPT | APPLICATION | TOOLSET | CONVERSATION | SKILL | MODEL |
APP_TYPE_SCHEMA | INTERCEPTOR | ROLE` — no `ROUTE` member, so this change adds one from scratch rather
than finishing partial wiring the way `assets-interceptors` did.

## Goals / Non-Goals

**Goals:**
- Add `ResourceType.ROUTE` and complete its Core-asset wiring (`CORE_RESOURCE_URL`/
  `CORE_RESOURCE_METADATA_URL`, `PLATFORM_BUCKET_RESOURCE_TYPES`, `VersionedResourceType` exclusion,
  `RESOURCE_TYPE_PREFIX`, `ASSET_MERGERS`), so it supports full CRUD through the existing generic
  `AssetApi`, following `assets-interceptors`' wiring shape.
- Add a Core-direct `Assets > Routes` list + detail view, flat/unversioned like `Assets > Models` and
  `Assets > Interceptors`.
- Add a `Routes` menu item to the Assets section, directly after `Interceptors`, with its own new
  `AssetsRoutes` i18n key.
- Reuse the admin-BE `RouteProperties`/`RouteAttachments`/`UpstreamEndpoints` UI shape, adapted to a
  new Core-direct `DialRouteResource` model, and reuse `Assets > Models`' existing
  `UpstreamSecretWarning`/`getUpstreamsLosingSecret` for the encrypted-upstream round-trip — Route's
  `upstreams` field is the same `Upstream` shape Model's is, so the same warning applies verbatim.

**Non-Goals:**
- No attach-picker widening anywhere (`AssetRouteOrigin` does not exist). A route is never referenced
  by name from another entity the way an interceptor is (`interceptors: List<String>`); Core resolves
  a route by matching `paths`/`methods` against its global `routes` map at request time. There is no
  ambiguous-origin picker to widen.
- No Configuration tab, no Features tab — `Route` isn't a `Deployment`, so neither `features` nor
  `configurationEndpoint` exists to render.
- No Roles tab on this asset surface, even though `Entities > Routes` has one and `Route` is a
  `RoleBasedEntity`. Deliberately deferred — see D4.
- No client-side meta-schema-validation layer — Core validates `Route.class` writes itself.
- No changes to `Entities > Routes`, DIAL Core, or the admin backend.

## Decisions

### D1: Model on `Assets > Models`/`Assets > Interceptors`, not `Assets > App Runners`
Same reasoning as the Interceptor migration: `Route` is `ResourceTypes.ROUTE`, a real Jackson entity
under the flat `platform` bucket with a plain `RoleBasedEntity.name` — not a URI-shaped `$id`, not a
raw-JSON schema resource. No percent-encoding, no client-side meta-schema layer.

### D2: Finish the `ResourceType.ROUTE` wiring from scratch
Unlike `INTERCEPTOR` (which the App Runner work had already registered read-only), `ROUTE` has no
frontend presence at all. This change adds:
- `ResourceType.ROUTE = 'ROUTE'` to the enum (and drops the now-doubly-stale comment on `INTERCEPTOR`
  claiming "nothing writes it through `AssetApi`" — that stopped being true once `assets-interceptors`
  shipped).
- `RESOURCE_TYPE_PREFIX[ROUTE] = 'routes/platform/'`, mirroring Core's own `"routes"` prefix.
- `CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL` entries (`v1/routes/platform/...`,
  `v1/metadata/routes/platform/...`).
- `PLATFORM_BUCKET_RESOURCE_TYPES` and the `VersionedResourceType` exclusion list both gain `ROUTE`
  (flat/unversioned, same as `MODEL`/`INTERCEPTOR`/`ROLE`).
- `ASSET_MERGERS[ROUTE] = mergeRouteResource`, following `mergeInterceptorResource`'s
  `flatMetadataFields` shape exactly (bare name after stripping the prefix, no `/` to split).
- A `DialRouteResource` model in `models/dial/resource.ts`, scoped to the fields the Properties tab
  uses (see D3) — no `displayName`/`description`/`endpoint`/`features`, since `Route` has none.
- `app/[lang]/assets-routes/actions.ts` (`createRoute`/`getRoute`/`updateRoute`/`removeRoute`/
  `bulkDeleteRoutes`/`getRoutes`), following `assets-interceptors/actions.ts`'s shape: `assetApi.put`/
  `.delete`/`.list`/`.getMergedWithEtag`, with a `toRoutePayload` stripping `status`/`validationWarnings`/
  `path`/`folderId` the same way `toInterceptorPayload` does.

### D3: Detail view is Properties-only, composed from the admin-BE Route controls
No second tab exists to add (see Non-Goals). Properties is built from the same individual pieces
`Entities > Routes`' `RouteProperties.tsx` and `RouteAttachments.tsx` already compose — `Paths`,
`DialSwitch` (rewritePath), `Multiselect` (methods), the Response/Upstreams `DialRadioGroup`,
status/body inputs, `UpstreamEndpoints`, `MaxRetryAttempts`, order + reset-to-default, and the request/
response attachment-path `Paths` pair — rather than reusing `RouteProperties`/`RouteAttachments`
directly, since both are typed against the admin-BE `DialRoute`/`DialAppRoute` union and carry
`isAppRoute`/`isAppRunnerView` branches that don't apply to a headless Core resource. The asset
surface gets its own `Properties.tsx` composing the same underlying controls against
`DialRouteResource`, the same relationship `Assets > Interceptors`' Properties has to the entity-side
`InterceptorProperties`.

The create form uses the same `IdControl` name field `Assets > Models`'/`Assets > Interceptors`'
create modals use (no `$id`, no percent-encoding) — but see D6: unlike those two, it cannot reach that
field through the generic `EntityProperties` dispatcher branch, because that branch always renders a
display-name field and seeds a description alongside it.

### D4: No Roles tab — explicitly deferred, not silently dropped
`Entities > Routes` already has a working Roles tab (`EntityRoles`, `route.roleLimits`) for this exact
`RoleBasedEntity`, so — unlike the Interceptor asset, which had no Roles UI precedent to reuse at
all — this is a real, available option being turned down on purpose. Role-limit handling on
Core-direct asset surfaces is being reconsidered as its own piece of work; porting the entity-side
Roles tab as-is now would likely need rewriting again once that lands. `userRoles`/`roleLimits` are
therefore left off `DialRouteResource` and the asset Properties tab entirely for this change.

### D5: Reuse `UpstreamSecretWarning` verbatim for the encrypted-upstream risk
`Route.upstreams` and `Model.upstreams` are the same `Upstream` shape, and Core's encryption/masking
behavior for it is generic to the field, not specific to `MODEL`. `Assets > Models` already has
`UpstreamSecretWarning` + `getUpstreamsLosingSecret` (`components/Assets/Models/`) solving "changing an
endpoint without re-entering its secret silently drops authentication" for exactly this field shape.
The asset Route surface reuses both directly against `DialRouteResource.upstreams` rather than
building a second copy — the same component, not a re-derived one, the same way `assets-interceptors`
reused `ParameterSchema` rather than rebuilding it.

### D6: A dedicated `RouteCreateProperties`, discovered post-implementation
The initial implementation assumed the generic `EntityProperties` dispatcher branch (used by
`Assets > Models`/`Assets > Interceptors` for exactly this "plain Core name" case) would work
unchanged for Route too, since `isSimpleEntity` routes all three to it. It does not: `EntityProperties`
unconditionally renders a `DisplayNameControl` (writing `entity.displayName`) beneath the id field, and
`CreateEntity`'s shared initial-state default separately seeds `description: ''` for every view that
isn't `AssetsModels` or version-carrying. Both are harmless for `Interceptor`/`Model`, which extend
`Deployment` and declare both fields — Core simply stores them. `Route extends RoleBasedEntity`
directly and declares neither, so Core's `Route.class` deserializer rejected the entire write the
moment either field was present, surfacing only as a generic "Bad request: Failed to parse entity at
line -1, column -1" — no field-level detail, since the failure is a JSON-shape mismatch caught before
Jackson can bind anything.

Fixed with a `RouteCreateProperties` component (`components/Assets/Routes/CreateProperties.tsx`),
following the `AppRunnerCreateProperties`/`SkillCreateProperties` precedent of bypassing
`EntityProperties` entirely for a flat identity that doesn't fit its generic shape — wired into
`EntityMainProperties/Properties/Properties.tsx` ahead of `isSimpleEntity`. It renders only the shared
`IdControl`. `toRoutePayload` (`app/[lang]/assets-routes/actions.ts`) also strips `description` as a
second line of defense, since `CreateEntity`'s shared initial state still seeds it into the runtime
object regardless of which create-form component consumes it.

**Lesson for future Core-resource migrations**: don't assume a shared dispatcher branch that happens
to route the right view still produces the right *payload* — check what every control on that branch
writes onto the entity, not just which fields the target view intends to show.

### D7: Strip `author`/`createdAt`/`updatedAt` on write too — they're metadata, not `Route.class` fields
Found the same way as D6, on an edit-and-save round-trip: `mergeRouteResource` (D2) folds Core's
*metadata* node's `author`/`createdAt`/`updatedAt` onto the resource via `flatMetadataFields`, purely
so `ResourceInfoHeader` has something to display — `DialRouteResource` declares them (via
`ModifiedEntity`) for exactly that read-side purpose. Sending them back on write hits the same failure
as D6: `Interceptor`/`Model` tolerate it because `Deployment` declares real `author`/`createdAt`/
`updatedAt` fields Core round-trips; `Route extends RoleBasedEntity` directly and has none, so
Core's `Route.class` deserializer rejects the write once any of the three is present. `toRoutePayload`
now strips all three alongside `description`/`status`/`validationWarnings`/`path`/`folderId`.

This is the second field-shape mismatch found after the fact rather than caught by review, which
sharpens D6's lesson: when a resource's model class doesn't extend the same base every existing asset
surface's model happens to extend, *every* field the merge step adds for display purposes is a write
hazard until proven otherwise — not just the ones an initial pass happened to test.

## Risks / Trade-offs

- **`hasEncryptedFields = true` for `ROUTE` is otherwise unverified from the frontend side** — no
  existing asset surface has exercised Core's encryption path for `ROUTE` specifically. Mitigated by
  D5: the same `UpstreamSecretWarning`/`getUpstreamsLosingSecret` pair already carries this risk for
  `MODEL` today, so the failure mode and its UI treatment are both already-proven, not new.
- **Deferring the Roles tab (D4) leaves a real capability gap** relative to `Entities > Routes` →
  acceptable short-term since it's a deliberate, documented deferral tied to separate upcoming
  role-limit work, not an oversight.
- **Core's server-side validation error shape for `Route.class` is unverified**, same caveat
  `assets-interceptors` carried for `Interceptor.class` → mitigated the same way: surface Core's
  `errorMessage` verbatim rather than adding client-side guessing.

## Open Questions

None outstanding — the two open items raised during exploration (Roles tab, upstream-secret handling)
were resolved above (D4, D5).
