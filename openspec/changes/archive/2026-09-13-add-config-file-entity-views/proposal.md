## Why

`close-admin-api-availability-gaps` made the platform/asset surfaces (Models, Interceptors, Routes,
Roles, Applications, Toolsets) fully usable without `DIAL_ADMIN_API_URL`, but those pages only ever
show entities written through Core's API (asset/resource storage). DIAL Core also resolves entities
declared in its own configuration file (`aidial.config.json`), readable read-only through
`configFileApi` — today that surface is used only to widen a handful of reference pickers
(`getConfigEntityOptions`), never to let an admin actually browse or open a config-file-declared
entity. Without the admin backend, config-file entities are the only place some of these entities can
be *defined* at all, and the admin console currently has no way to view them.

## What Changes

- Add a `showConfigFiles` toggle to `AppContextType` (boolean + toggle function), persisted the same
  way as `sidebarOpen` (localStorage, default `false`), rendered as a header control next to the title
  only on the six views this covers, and only when `featureFlags.adminApiEnabled` is `false`.
- On each of those views, toggling it swaps the page's existing `BaseAssetList` (file/folder browser)
  for that entity's existing admin-grid list component (`Models/List`, `ApplicationsList`,
  `InterceptorsList`, `RoutesList`, `RolesList`, `ToolsetsList`), fed by config-file data instead of
  the admin backend. The same toggle control is rendered in that grid's header too, so the user can
  switch back.
- Add `configFileApi.list`/`getList` (name TBD in design) that returns full config-file entities for a
  type in one call, instead of the existing `listNames` (names only) plus a per-entity `getEntity`
  follow-up — the grid needs the full entity to render its columns, and a per-row read defeats the
  point of a list. Fetched lazily, client-triggered, only when the toggle is switched on.
- Widen `READABLE_CONFIG_FILE_TYPES` to include `Models`, `Routes`, `Applications`, `Toolsets`
  (`Interceptors`/`Roles` are already readable; `Keys` stays excluded — Core refuses that route
  unconditionally).
- Add a `showConfigFiles` parameter to `getConfigEntityOptions`/`readConfigEntities`: when set, skip
  the asset-metadata (`apiWritten`) half and always attempt the config-file read regardless of
  `DIAL_ADMIN_API_URL`, rather than resolving it as empty. Thread the parameter through every existing
  call site.
- Clicking a config-file-sourced row navigates to that entity's existing "hidden" admin detail route
  (`/models/[id]`, `/applications/[id]`, `/interceptors/[id]`, `/routes/[id]`, `/roles/[id]`,
  `/toolsets/[id]`) with a `?configFile=true` query param, rather than a new dedicated route. That
  route's breadcrumb "back to list" segment is remapped to the platform/asset route in this mode —
  its default, path-derived href points at the hidden route's own list, which redirects home without
  the admin backend.
- Those detail pages: read `configFile=true` to fetch the entity via `configFileApi` instead of the
  admin backend, resolve their own embedded pickers (Roles/Interceptors) through
  `readConfigEntities(..., showOnlyConfigFiles: true)` instead of direct admin-backend list calls, and
  render the view **read-only** — via a new `AppContext` setter the view calls on mount, folding into
  the existing `isReadOnlyAdmin` computation so the ~140 existing `disabled={... || isReadOnlyAdmin}`
  call sites need no change.
- The existing admin-API-only redirect guard on those detail routes becomes conditional: redirect home
  only when `DIAL_ADMIN_API_URL` is unset **and** `configFile` is not `true`.
- **BREAKING** (internal only): `getConfigEntityOptions`/`readConfigEntities` signatures gain a
  required-in-practice parameter; every current call site is updated in this change.

### Non-goals

- Keys and App Runners are excluded: Core refuses the config-file `keys` route unconditionally, and
  App Runners have no config-file type at all. No toggle, no config-file list, no fallback route for
  either.
- No write/edit path for config-file entities — the detail view is read-only, matching
  `core-config-file-client`'s existing read-only-by-design stance.
- No changes to the existing asset/platform (`BaseAssetList`) editing experience — the toggle only
  adds an alternate read path alongside it.
- Entity-shape compatibility between Core's raw config-file JSON and the `DialModel`/`DialApplication`/
  etc. types the existing grids/views expect is not assumed here; verifying it (and adding a per-type
  adapter if needed) is implementation work, tracked in design/tasks.

## Capabilities

### New Capabilities
- `config-file-entity-views`: the `showConfigFiles` toggle, the list-swap behavior on the six covered
  views, the lazy full-entity config-file fetch, the `configFile=true` detail-page fallback and its
  read-only rendering.

### Modified Capabilities
- `core-config-file-client`: widen `READABLE_CONFIG_FILE_TYPES`; add a full-entity list read
  (`list`/`getList`) alongside the existing name-only `listNames`; add the `showConfigFiles` parameter
  to the union read (`getConfigEntityOptions`/`readConfigEntities`) that skips the asset-metadata half
  and forces the config-file read even without the admin backend.
- `admin-api-availability`: the direct-navigation redirect guard for `/models/<id>`,
  `/applications/<id>`, `/interceptors/<id>`, `/routes/<id>`, `/roles/<id>` (and their sub-routes) gains
  an exception when `configFile=true` is present.

## Impact

- `src/context/AppContext.tsx` — new `showConfigFiles` state + toggle.
- `src/server/core/config-file-api.ts`, `src/constants/config-file-core.ts` — new full-entity list
  method, widened readable-type set.
- `src/server/config-entities/read.ts`, `read-page-options.ts` — `showConfigFiles` parameter.
- Six `page.tsx` pairs: `platform-models`, `platform-interceptors`, `platform-routes`,
  `platform-roles` (+ their `[id]`), `assets-applications`, `assets-toolsets` (+ `models/[id]`,
  `applications/[id]`, `interceptors/[id]`, `routes/[id]`, `roles/[id]` — the "hidden" admin-grid
  detail routes these link to).
- Every current `readConfigEntities` call site: `platform-models/[id]`, `platform-app-runners/[id]`,
  `platform-routes/[id]`, `platform-keys/[id]` + its `actions.ts`, `assets-applications/[id]`,
  `assets-toolsets/[id]`, `tables/actions.ts`, `system-properties/page.tsx`.
- `ListView`/`FileManager` header rendering (toggle placement), `Header` (isReadOnlyAdmin computation).
