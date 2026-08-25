## Why

`Assets > Models`, `Assets > App Runners`, and `Assets > Interceptors` already expose their DIAL Core
config resource directly — read and written through Core rather than the admin backend. `Route` is
the remaining first-class Core resource type (`ResourceTypes.ROUTE`, same tier as `MODEL`/
`INTERCEPTOR`/`ROLE`) with no frontend wiring at all yet — not even read-only. Migrating it continues
the entities-to-assets migration and gives admins a Core-direct view of the same `routes/platform`
resources DIAL Core resolves requests against.

## What Changes

- Add a `ResourceType.ROUTE` resource type to the frontend's Core-asset infrastructure
  (`CORE_RESOURCE_URL`/`CORE_RESOURCE_METADATA_URL`, `PLATFORM_BUCKET_RESOURCE_TYPES`, the
  `VersionedResourceType` exclusion list, `RESOURCE_TYPE_PREFIX`, `ASSET_MERGERS`), following the
  `assets-interceptors` change's wiring exactly.
- Add a `DialRouteResource` model (Core's `Route` shape: `paths`, `methods`, `rewritePath`, `response`,
  `upstreams`, `maxRetryAttempts`, `order`, `permissions`, `attachmentPaths`) and `assets-routes`
  server actions (`createRoute`/`getRoute`/`updateRoute`/`removeRoute`/`bulkDeleteRoutes`/`getRoutes`)
  mirroring `assets-interceptors/actions.ts`'s shape, using `assetApi.put`/`.delete`/`.list`/
  `.getMergedWithEtag`.
- Add a flat, unversioned `Assets > Routes` list (create/delete/bulk-delete, no folders, no move),
  built on `BaseAssetList`, with a create form using the same plain name field `Assets > Models`
  already uses (Route is `RoleBasedEntity`-named, not `$id`-shaped).
- Add an `Assets > Routes` detail view with a single **Properties** tab, composed from the same
  building blocks the admin-BE `RouteProperties`/`RouteAttachments` components already use (paths,
  rewrite-path switch, methods, response/upstreams output radio, status/body, upstream endpoints,
  max-retry-attempts, order, request/response attachment paths) — adapted to the Core-direct
  `DialRouteResource` model instead of the admin-BE `DialRoute` model.
- Add a new `Routes` menu item, with its own new `AssetsRoutes` i18n key (distinct from the existing
  `Entities > Routes` key), to the Assets section of the admin menu, directly after `Interceptors`.
- **BREAKING**: none. This is a new, additive surface.

**Non-goals**:
- No attach-picker widening. Unlike an interceptor, nothing references a route by name from another
  entity — Core resolves routes by path/method match against its global `routes` map, so there is no
  `AssetRouteOrigin` axis to introduce anywhere.
- No Configuration tab and no Features tab. `Route extends RoleBasedEntity` directly, not `Deployment`
  — it has no `features` field and no `configurationEndpoint`, so neither tab has anything to render.
- No Roles tab. `Entities > Routes` already has a real Roles/role-limits tab for this
  `RoleBasedEntity`, but it is intentionally left out of this asset surface for now — role-limit
  handling on Core-direct asset surfaces is being reconsidered separately and will be revisited later
  rather than ported as-is here.
- No client-side meta-schema-validation layer — Core validates a `Route.class` write server-side, the
  same way it validates `Interceptor.class`.
- `Entities > Routes` (its route, admin-BE storage, Roles/Audit tabs, and its existing Admin/CORE
  format toggle) is left completely unchanged.

## Capabilities

### New Capabilities

- `assets-routes`: the `Assets > Routes` Core-direct list + detail view — menu entry, flat
  create/delete list, and a Properties-only detail view over DIAL Core's `routes/platform` resources.

### Modified Capabilities

_None._ `assets-models`, `assets-interceptors`, and `assets-app-runners` are unaffected — this change
introduces no attach-picker widening and touches no shared component those capabilities specify.

## Impact

- **New files**: `app/[lang]/assets-routes/{page.tsx,[id]/page.tsx,actions.ts}`,
  `components/Assets/Routes/**` (List, Properties, TabsContent, View), a `DialRouteResource` model.
- **Modified files**: `types/resource-type.ts`, `constants/assets-core.ts`,
  `constants/publications-core.ts` (`RESOURCE_TYPE_PREFIX`), `server/core/asset-metadata.ts`
  (`ASSET_MERGERS`), `components/Menu/menu-configuration.tsx`, `constants/i18n.ts` (new
  `AssetsRoutes` key), `types/routes.ts` (new `ApplicationRoute.AssetsRoutes`).
- **No changes** to `Entities > Routes`, the admin backend, or DIAL Core itself.
