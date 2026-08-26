## Context

`Assets > Models`, `Assets > App Runners`, `Assets > Interceptors`, and `Assets > Routes` established
the pattern for exposing a DIAL Core config resource directly through `AssetApi`. `Role` is different
from the other four in one respect that shapes this whole design: `ResourceType.ROLE` is **already
registered** in every piece of Core-asset infrastructure those other migrations had to add from
scratch —

- `CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL[ROLE]` → `v1/roles/platform/...` (`assets-core.ts`)
- `PLATFORM_BUCKET_RESOURCE_TYPES` and the `VersionedResourceType` exclusion list both already list
  `ROLE` — flat, unversioned, same tier as `MODEL`/`INTERCEPTOR`/`ROUTE`
- `RESOURCE_TYPE_PREFIX[ROLE] = 'roles/platform/'` (`publications-core.ts`)
- Activity Audit and the publications resolver already branch on `ActivityAuditResourceType.ROLE`/
  `ResourceType.ROLE`

The one comment on `ResourceType.ROLE` says exactly what's missing: *"Read-only here... No asset
surface writes it through `AssetApi`."* This change is narrower than `assets-routes` was as a result —
no enum member to add, no bucket/prefix wiring, no publications-resolver branch. It only needs the
write surface: model, actions, list, view, menu entry.

On the Core side, `Role.java` is a plain class — `name`, `limits: Map<String, Limit>`,
`costLimit: CostLimit`, `share: Map<String, ShareResourceLimit>` — and does **not** extend
`RoleBasedEntity` (it has no `userRoles` of its own) or `Deployment` (no `displayName`/`description`).
`ConfigResourceController` already implements full `GET/PUT/DELETE /v1/roles/{bucket}/{path}` against
it, same ETag/`If-Match`/`If-None-Match` semantics as `Route`/`Model`/`Interceptor`.

The admin-BE-backed `Entities > Roles` surface (`components/Roles/**`) already has real UI for the
`costLimit`/`share` slice of this shape: `RoleCostLimit` (`CostLimits.tsx`) drives Core's `CostLimit`
class exactly (`minute`/`day`/`week`/`month`, `BigDecimal`), and `RoleSharing` (`Sharing.tsx`) drives
`ShareResourceLimit` exactly (`invitationTtl`, `maxAcceptedUsers`). Both are reusable verbatim. Its
`Entities` tab, by contrast, drives the *different* `Map<String, Limit>` field — Core's `Limit` class
has six tokens (`minute`, `day`, `week`, `month`, `requestHour`, `requestDay`), while the current
`DialRoleLimits` model and `ROLES_ENTITIES_COLUMNS` grid only know about four. That tab, and its
`grantedKeys` sibling (Keys tab — a field with no Core-side representation on `Role` at all; the real
relationship lives on Core's `Key.roles`/`Key.role`), are both explicitly deferred (see Non-Goals).

## Goals / Non-Goals

**Goals:**
- Add a `DialRoleResource` model (`limits`, `costLimit`, `share` + `ModifiedEntity` fields for display)
  and a `mergeRoleResource` entry in `ASSET_MERGERS`, following `mergeRouteResource`/
  `mergeInterceptorResource`'s `flatMetadataFields` shape.
- Add `app/[lang]/assets-roles/actions.ts` (`createRole`/`getRole`/`updateRole`/`removeRole`/
  `bulkDeleteRoles`/`getRoles`), following `assets-routes/actions.ts`'s shape.
- Add a `RolesFolderContext` and a flat, unversioned `Assets > Roles` list on `BaseAssetList`.
- Add an `Assets > Roles` detail view with a single **Properties** tab, reusing `RoleCostLimit`/
  `RoleSharing` verbatim (adapted to `DialRoleResource`), and its own dedicated create/identity
  control rather than the generic `EntityProperties` dispatcher (see D3).
- Add a `Roles` menu item (new `AssetsRoles` i18n key) to the Assets section, directly after `Routes`.

**Non-Goals:**
- No Entities tab (per-model/application/toolset/route `Limit` assignment) — deferred; see D4.
- No Keys tab (`grantedKeys`) — deferred until Keys itself migrates to assets; see D5.
- No ADMIN/CORE format toggle — see D6.
- No `TopicsControl` — `Role` has no topic-like field on the Core side to attach it to; `Entities >
  Roles`' use of it is an admin-BE-only affordance this change doesn't carry over.
- No client-side meta-schema-validation layer — Core validates `Role.class` writes server-side.
- No changes to `Entities > Roles`, DIAL Core, or the admin backend.

## Decisions

### D1: No `ResourceType`/bucket/prefix wiring — it already exists
Unlike `assets-routes`, which added `ResourceType.ROUTE` and its full Core-asset wiring from scratch,
`ROLE` only needs `ASSET_MERGERS[ROLE]` filled in (D2) — `types/resource-type.ts`,
`constants/assets-core.ts`, and `constants/publications-core.ts` are untouched by this change.

### D2: `DialRoleResource` model + `mergeRoleResource`, flat/unversioned like `Route`/`Interceptor`
`models/dial/resource.ts` gains:
```ts
export interface DialRoleResource extends ModifiedEntity {
  name: string;
  limits?: Record<string, DialRoleLimits>;
  costLimit?: DialRoleLimits;
  share?: Record<string, DialRoleShare>;
}
```
reusing the existing `DialRoleLimits`/`DialRoleShare` types from `models/dial/role-limits.ts` as-is —
`grantedKeys` is dropped (see D5) and the per-entity `Limit` map (`limits`) carries over on the model
even though no tab renders it yet, so a round-trip through the JSON editor (if one is added later)
doesn't silently lose data written by `Entities > Roles`' admin-BE path. `mergeRoleResource` follows
`mergeInterceptorResource` exactly: `{ ...content, ...flatMetadataFields(metadata,
RESOURCE_TYPE_PREFIX[ResourceType.ROLE]) }`, added to `ASSET_MERGERS`.

### D3: Properties tab reuses `RoleCostLimit`/`RoleSharing` verbatim; identity gets its own control
`RoleCostLimit` drives Core's `CostLimit` class field-for-field and `RoleSharing` drives
`ShareResourceLimit` field-for-field — both port to `DialRoleResource` unchanged beyond their prop
type. Neither reuses `EntityProperties`, so the risk `assets-routes` found the hard way (D6/D7 there:
the generic dispatcher unconditionally writes `displayName` and seeds a stray `description`, both of
which `Route.class` rejected because `Route` doesn't declare them) doesn't apply to *those* two pieces.

It does apply to the identity field, though: `Entities > Roles`' `RoleProperties` renders the name
field via `EntityProperties entity={selectedRole} ... isEntityImmutable={true}`, and `Role.class` is
exactly as bare as `Route.class` — no `displayName`, no `description`. This asset surface therefore
follows `assets-routes`' `RouteCreateProperties` precedent instead: a dedicated, minimal identity
control (just `IdControl`, immutable after creation) wired ahead of `EntityProperties`'s generic
`isSimpleEntity` branch, plus a `toRolePayload` in `actions.ts` that strips `status`,
`validationWarnings`, `path`, `folderId`, `author`, `createdAt`, `updatedAt`, and `description`
before every `assetApi.put` — the same defensive list `toRoutePayload` ended up with, applied
up front rather than discovered after a rejected write.

### D4: No Entities tab — deferred, and scoped for the follow-up
`Entities > Roles`' Entities tab assigns per-model/application/toolset/route `Limit` (token
day/week/month/minute) and lets an admin flip "no limits". Two things make this a separate change
rather than a straight port:
- It should source its rows from the asset lists (`assets-models`, `assets-applications`,
  `assets-toolsets`, `assets-routes`), not the legacy lists `page.tsx` fetches today
  (`getModelsList`, `applicationsApi`, `toolSetsApi`, `routesApi`) — those are the pre-migration
  surfaces this whole effort is moving away from.
- Core's `Limit` class has six tokens, not four: `minute`, `day`, `week`, `month`, plus `requestHour`
  and `requestDay`, which `DialRoleLimits`/`ROLES_ENTITIES_COLUMNS` don't expose today. Porting the
  tab as-is would silently under-represent whatever an admin already set on those two tokens through
  another path (e.g. directly via Core's API) — worth its own review rather than folding into this
  change's scope.

### D5: No Keys tab — deferred until Keys migrates to assets
`grantedKeys` has no field on Core's `Role.class`. Its actual on-Core representation is the reverse:
`Key.roles: List<String>` / `Key.role: String` (`Key.getMergedRoles()`). Today's admin-BE
`rolesApi.updateRole` presumably fans a `grantedKeys` diff out across the affected `Key` resources
server-side; `ConfigResourceController.saveRole` does a single-resource PUT into `Role.class` and has
no equivalent fan-out, so a payload carrying `grantedKeys` would not be silently ignored the way an
unknown JSON property might be under a lenient mapper — it would need to be a real feature, not a
field on this model. Deferred until Keys has an asset surface of its own to write those key-side
`roles` arrays through.

### D6: No ADMIN/CORE format toggle
`Entities > Roles` can read/write through a parallel admin-BE `/roles/core/{name}` endpoint
(`getCoreRole`/`updateCoreRole`) alongside its normal `/roles/{name}` endpoint. This asset surface
talks to Core through exactly one path (`assetApi`), the same as every other migrated asset — there is
no second representation to toggle to.

### D7: List reuses `BaseAssetList`/`RolesFolderContext`, no version control
`Role` is in the unversioned tier (`VersionedResourceType` exclusion already includes it), so the list
follows `Assets > Routes`' shape exactly: flat, folder-capable via the standard asset folder tree,
create/delete/bulk-delete, no version/compare UI.

### D8: `costLimit`/`limits` treat an out-of-range token as absent, not as a value to preserve exactly
D3 assumed porting `RoleCostLimit` verbatim was sufficient because it already compares tokens
against the string constant `UNLIMITED_VALUE`. That comparison is necessary but not sufficient: Core
serializes `Limit`/`CostLimit`'s `Long.MAX_VALUE` default (9223372036854775807, 19 digits) as a bare
JSON number, and JS's native `JSON.parse` cannot represent an integer past `Number.MAX_SAFE_INTEGER`
exactly — the value silently rounds (visibly `9223372036854776000` in a browser).

An initial fix preserved the sentinel's exact digits end-to-end (a custom big-integer-safe parse at
the shared request choke point, quoting an out-of-range integer into a string on read and marking it
for raw-literal re-emission on write). That is correct but unnecessarily heavy for what the domain
actually needs: the UI never has to know the sentinel's *value*, only whether a token is unlimited,
and `Role`'s `WriteSpec` has `hasEncryptedFields = false`
(`ConfigResourceController.prepareWrite`), so a role PUT's update arm skips
`mergePreservingOmittedSecrets` entirely and deserializes the request body verbatim — there is no
merge with the stored blob. A role write is therefore always a **full replace**, and Core's own
`Limit`/`CostLimit` field defaults already mean "unlimited" the moment a token is missing from the
JSON. Omitting an out-of-range token on write is exactly equivalent to sending the sentinel, with no
merge-with-existing to risk a stale value surviving underneath it.

`utils/roles/limits.ts` (`normalizeRoleLimits`/`toWireRoleLimits`) implements this directly, with no
shared-infra change at all: on read, a token failing `Number.isSafeInteger` (the lossily-rounded
`Long.MAX_VALUE` included — its exact digits are already gone by the time a plain `JSON.parse` hands
it over, but that no longer matters) is dropped from the normalized object rather than kept; every
remaining token stays a plain `number` (`DialCoreRoleLimits`, a new asset-side type — deliberately
**not** a stringified value, unlike the admin-backend's `DialRoleLimits`, since Core's `Limit`/
`CostLimit` fields have no `@JsonFormat(shape=STRING)` and a number is what the wire actually
carries). On write, every token that reaches `toWireRoleLimits` is therefore already known-safe, so
it's a plain null-filtering passthrough — no conversion, no marker, no raw-literal step in either
direction.

`RoleCostLimit` (`Assets/Roles/CostLimits.tsx`) therefore does **not** reuse the entity-side
`LimitsControl`/`LimitControl` (`EntityMainProperties/Limits/*`) — both are built around
`DialRoleLimits`'s string fields and `Big.js` precision handling, a concern this surface doesn't
have once every value is a plain safe-integer `number`. It renders its own four `DialNumberInput`
fields bound directly to `DialCoreRoleLimits`, and represents "the toggle is off" as `costLimit: {}`
(every token absent) instead of explicitly writing `UNLIMITED_VALUE` into all four — its "is a limit
set" check is `Object.keys(costLimit || {}).length > 0`, since a present key is now guaranteed to be
a real, finite value by construction.

### D9: `share`'s wire shape is snake_case and already in hours — `Sharing.tsx` was not actually portable verbatim
Two things D3 got wrong for `Sharing.tsx` specifically (not `CostLimits.tsx`, which needed no
change): Core's `ShareResourceLimit` carries `@JsonNaming(SnakeCaseStrategy.class)` — its wire fields
are `invitation_ttl`/`max_accepted_users`, not the admin-backend `DialRoleShare`'s camelCase
`invitationTtl`/`maxAcceptedUsers` — and `ShareResourceLimit.invitationTtl` is documented, on the
Core class itself, as already measured in **hours**. The ported component read/wrote against the
wrong field names entirely (silently no-op — reads always missed) and additionally multiplied by
3,600,000 on write (`getMsFromHours`, correct for the admin-backend's own ms-scaled field, wrong
here by a factor of 3600).

Added `DialCoreRoleShare` (`models/dial/role-limits.ts`) as `DialRoleResource.share`'s real type, and
rewrote `Sharing.tsx` against a new `components/Assets/Roles/utils.ts`: `getAssetSharingData` reads
the snake_case fields with no unit conversion, `toCoreShareField` maps the shared grid columns'
camelCase `field` (`SHARING_COLUMNS`, still reused verbatim — the column defs are wire-shape-agnostic)
to Core's real key, and `applySharingChange` is the edit handler's logic extracted to a pure,
directly unit-testable function (matching `components.md`'s "logic lives elsewhere" rule) rather
than left inline in a `useCallback`.

### D10: The Roles tab's role population needs widening the same way Interceptors' does
`Assets > Models`' Roles tab sourced its options from `rolesApi.getRolesList` — the admin-backend's
own role list — while `Assets > App Runners`' equivalent tab already used
`readConfigEntities<DialRole>(ConfigFileEntityType.Roles)`, Core's own union of its API-written and
config-file-declared role populations. These are different populations: the admin-backend list can't
see a role declared only in Core's static configuration file, and going through it at all reintroduces
exactly the admin-backend dependency this whole migration is removing. Fixed by switching
`assets-models/[id]/page.tsx` to the same `readConfigEntities` call App Runners already makes.

Generalized `components/Assets/Models/Roles.tsx` (`ModelAssetRoles`, hard-typed to
`DialModelResource`) into `components/EntityView/Roles/AssetRoles.tsx` — generic over
`<T extends { userRoles?: string[] }>` — the same "one shared component, multiple entity/asset
consumers" shape `EntityInterceptors` already established for Interceptors. `Assets > Models` and the
new `Assets > Routes` Roles tab (D11) both render it directly; each supplies its own `view` so the
component's empty-state message (`getNoAvailableTitle`) reads correctly per surface.

### D11: Un-defer the Routes Roles tab — membership-only, not the role-limits tab `assets-routes` deferred
`assets-routes`'s design D4 deferred a Roles tab entirely, reasoning that "role-limit handling on
Core-direct asset surfaces is being reconsidered separately." That reconsideration is exactly
`AssetRoles` (D10): a membership-only widget backed by `RoleBasedEntity.userRoles`, deliberately not
the role-*limits* tab (`roleLimits`/`isPublic`/per-role share, admin-BE constructs Core doesn't store
against a deployment or route at all — see `AssetRoles`'s own doc comment). With that widget now
built for Models, adding it to Routes needs only what D4 didn't have yet: `userRoles?: string[]`
back on `DialRouteResource` (a real `RoleBasedEntity` field Core already accepts — no backend
change), a `rolesTab` branch in `getTabsForAsset` for `AssetsRoutes`, and the same
`readConfigEntities`-fed roles prop threaded through `assets-routes/[id]/page.tsx` → `View.tsx` →
`TabsContent.tsx`. Role-*limits* editing for Routes remains exactly as deferred as D4 left it.

## Risks / Trade-offs

- **Core's server-side validation error shape for a rejected `Role.class` write is unverified from
  this surface** → mitigated the same way `assets-routes`/`assets-interceptors` did: surface Core's
  `errorMessage` verbatim rather than adding client-side guessing, and apply D3's payload-stripping
  list up front, since it's now a known failure mode rather than something to discover per-field.
- **Deferring the Entities tab (D4) leaves a real capability gap** relative to `Entities > Roles` —
  acceptable short-term since it's tied to a documented, separate follow-up (asset-list sourcing +
  the six-token `Limit` gap), not an oversight.
- **Deferring the Keys tab (D5) leaves a real capability gap** relative to `Entities > Roles` —
  acceptable short-term; the correct fix depends on Keys having an asset surface to write through,
  which doesn't exist yet.

## Open Questions

None outstanding for this change's scope — the two deferred capabilities (D4, D5) have a documented
reason and a documented direction for their own follow-up changes.
