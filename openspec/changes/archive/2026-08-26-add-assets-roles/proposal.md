## Why

`Assets > Models`, `Assets > App Runners`, `Assets > Interceptors`, and `Assets > Routes` already expose
their DIAL Core config resource directly — read and written through Core rather than the admin backend.
`ResourceType.ROLE` is already registered in the same Core-asset infrastructure as those (platform
bucket, versionless, `CORE_RESOURCE_URL`/metadata routes) — added during the app-runners/routes work far
enough to be listed via metadata, but explicitly marked "no asset surface writes it through `AssetApi`".
Migrating `Roles` continues the entities-to-assets migration and closes that gap: it gives admins a
Core-direct view of the same `roles/platform` resources Core enforces `userRoles`/limits/cost against.

## What Changes

- Add a `DialRoleResource` model (Core's `Role` shape: `limits`, `costLimit`, `share` — no
  `grantedKeys`, which has no Core-side field; see Non-goals) and a `mergeRoleResource` entry in
  `ASSET_MERGERS`, mirroring `mergeRouteResource`/`mergeInterceptorResource` (flat, unversioned,
  `flatMetadataFields`).
- Add `assets-roles` server actions (`createRole`/`getRole`/`updateRole`/`removeRole`/
  `bulkDeleteRoles`/`getRoles`) mirroring `assets-routes/actions.ts`'s shape, using `assetApi.put`/
  `.delete`/`.list`/`.getMergedWithEtag` against `ResourceType.ROLE`.
- Add a `RolesFolderContext` (mirroring `RoutesFolderContext`) and a flat, unversioned `Assets > Roles`
  list (create/delete/bulk-delete, no folders beyond the standard asset folder tree, no version
  control — Role is unversioned like Route/Model/Interceptor), built on `BaseAssetList`.
- Add an `Assets > Roles` detail view with a single **Properties** tab (name, cost limit, sharing
  settings — `RolesDefaults`/`Sharing`/`CostLimits` building blocks already exist in
  `components/Roles/View/Properties/` and get adapted to the Core-direct `DialRoleResource` model), no
  ADMIN/CORE format toggle, and no Entities or Keys tab (see Non-goals).
- Add a new `Roles` menu item, with its own new `AssetsRoles` i18n key (distinct from the existing
  `Entities > Roles` key) and `ApplicationRoute.AssetsRoles`, to the Assets section of the admin menu,
  directly after `Routes`.
- **BREAKING**: none. This is a new, additive surface.

**Non-goals**:

- No Entities tab (per-model/application/toolset/route limit assignment). Deferred to a follow-up
  change. When it lands, it should source its rows from the asset lists (`assets-models`,
  `assets-applications`, `assets-toolsets`, `assets-routes`) rather than the legacy pre-migration
  lists the current `Entities > Roles` Entities tab uses — and it should account for Core's `Limit`
  class exposing **six** tokens (`minute`, `day`, `week`, `month`, `requestHour`, `requestDay`), not
  the four (`minute`/`day`/`week`/`month`) the current `DialRoleLimits` model and
  `ROLES_ENTITIES_COLUMNS` grid know about.
- No Keys tab (grant/revoke this role to API keys). Deferred to a follow-up change, to land once Keys
  itself migrates to assets. Root cause it must design around: Core's `Role.class` has no
  `grantedKeys` field — the real relationship is inverted, stored on Core's `Key.roles`/`Key.role`
  fields — so granting/revoking a key must become a direct write to that key's `roles` array via the
  keys API, not a field on the Role PUT payload (today's admin-backend `rolesApi.updateRole` presumably
  fans this out server-side; Core's `ConfigResourceController.saveRole` does not).
- No ADMIN/CORE format toggle. `Entities > Roles` today can read/write through a distinct admin-backend
  `/roles/core/{name}` endpoint in parallel with its normal `/roles/{name}` endpoint. The new
  Core-direct asset surface talks to Core through one path only — the toggle and its `getCoreRole`/
  `updateCoreRole` actions are not ported.
- No client-side meta-schema-validation layer — Core validates a `Role.class` write server-side, the
  same way it validates `Interceptor.class`/`Route.class`.
- `Entities > Roles` (its route, admin-BE storage, Entities/Keys/Audit tabs, and its existing
  Admin/CORE format toggle) is left completely unchanged.

## Capabilities

### New Capabilities

- `assets-roles`: the `Assets > Roles` Core-direct list + detail view — menu entry, flat
  create/delete list, and a Properties-only detail view over DIAL Core's `roles/platform` resources.

### Modified Capabilities

- `assets-models`: the Roles tab's option population now explicitly sources from Core's own
  API-written ∪ config-file-declared role population (`readConfigEntities`), not the admin-backend's
  role list — see the Post-implementation additions above and design D10.
- `assets-routes`: gains a membership-only Roles tab (`userRoles`), un-deferring `assets-routes`'
  original design D4 — see design D11. `assets-interceptors` and `assets-app-runners` remain
  unaffected.

## Post-implementation additions

Fixes and scope widenings discovered after the initial implementation landed (see `design.md`'s D8–D11
for the full rationale):

- Fixed a real precision bug: Core's `Long.MAX_VALUE` "unlimited" `costLimit`/`limits` sentinel
  silently rounds through JS's native `JSON.parse`/`JSON.stringify`. Added a shared big-integer-safe
  parse/stringify pair at the app's one request choke point (`utils/api/big-integer-json.ts`), and a
  Role-specific normalization layer on top (`utils/roles/limits.ts`).
- Fixed a real wire-shape bug: Core's `share` field is snake_case and already in hours, not the
  admin-backend's camelCase, ms-scaled equivalent the original port copied. Added `DialCoreRoleShare`
  and rewrote `Sharing.tsx` against it.
- Widened `Assets > Models`' Roles tab to read Core's own role population (matching `Assets > App
  Runners`, which already did this correctly) instead of the admin-backend's list, and generalized
  the membership-editing widget into a shared `AssetRoles` component.
- Un-deferred a **membership-only** Roles tab on `Assets > Routes` (not the role-*limits* tab
  `assets-routes`'s design deferred) — `userRoles` is a real `RoleBasedEntity` field Core already
  accepts.

## Impact

- **New files**: `app/[lang]/assets-roles/{page.tsx,[id]/page.tsx,actions.ts}`,
  `components/Assets/Roles/**` (List, Properties, TabsContent, View), `context/assets/
  RolesFolderContext.tsx`, a `DialRoleResource` model.
- **Modified files**: `server/core/asset-metadata.ts` (`ASSET_MERGERS` + `mergeRoleResource`),
  `components/Menu/menu-configuration.tsx`, `constants/i18n.ts` (new `AssetsRoles` key),
  `types/routes.ts` (new `ApplicationRoute.AssetsRoles`).
- **No changes** to `Entities > Roles`, the admin backend, or DIAL Core itself. No changes to
  `types/resource-type.ts`, `constants/assets-core.ts`, or `constants/publications-core.ts` — `ROLE`'s
  entries there already exist.
