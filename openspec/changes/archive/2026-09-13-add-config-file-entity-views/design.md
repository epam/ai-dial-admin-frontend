## Context

Two surfaces already exist per entity type:

- The **platform/asset** surface (`platform-models`, `platform-interceptors`, `platform-routes`,
  `platform-roles`, `assets-applications`, `assets-toolsets`) — a `BaseAssetList` file/folder browser
  over Core's resource-metadata route, Core-direct, works with no admin backend.
- The **admin-grid** surface (`models`, `interceptors`, `routes`, `roles`, `applications`, `toolsets`)
  — a `ListView`/`GridView` grid backed by structured `DialModel`/`DialApplication`/etc. types, fetched
  from the admin backend; its `page.tsx` unconditionally `redirect(ApplicationRoute.Home)`s when
  `DIAL_ADMIN_API_URL` is unset (`admin-api-availability`).

Neither surface reads Core's config-file population (`aidial.config.json`, exposed read-only via
`configFileApi`) as a source of full entities to browse — `core-config-file-client` only ever
flattens it to `{name, origin}` pairs for reference pickers. Without the admin backend, config-file
declarations may be the only place some of these entities exist, and there is currently no way to see
them in the admin console at all.

Six entity types are in scope: **Models, Interceptors, Routes, Roles** (platform pages) and
**Applications, Toolsets** (asset pages). **Keys** and **App Runners** are out of scope — Core refuses
the config-file `keys` route unconditionally (`READABLE_CONFIG_FILE_TYPES` already documents this),
and App Runners have no config-file type at all (`ConfigFileEntityType` has no member for them; they
are their own resource kind, unrelated to `ConfigFileEntityType.Applications`).

## Goals / Non-Goals

**Goals:**
- Let an admin without `DIAL_ADMIN_API_URL` browse the six in-scope entity types as Core's config file
  declares them, reusing the existing admin-grid list/detail components rather than building new ones.
- Keep the toggle off, and the cost of this feature at zero, for everyone who doesn't use it.
- Keep config-file entities read-only, consistent with `core-config-file-client`'s existing
  read-only-by-design stance.

**Non-Goals:**
- No write path for config-file entities.
- No change to the `BaseAssetList` editing experience.
- No support for Keys or App Runners.
- No guarantee, yet, that Core's raw config-file JSON is a drop-in `DialModel`/`DialApplication`/etc.
  — see Open Questions.

## Decisions

### D1: One global `showConfigFiles` toggle in `AppContext`, not per-entity-type

`AppContextType` gains `showConfigFiles: boolean` and a `toggleShowConfigFiles()` function, following
the exact `sidebarOpen`/`toggleSidebar` pattern: `useState` + `getFromLocalStorage`/`setToLocalStorage`
under a new `LOCAL_STORAGE_SHOW_CONFIG_FILES_KEY`, default `false`.

A single flag is simpler to reason about and matches how the user described it ("this toggle should
appear... and list view should be changed", singular). The control itself is rendered only on the six
in-scope pages, and only when `!featureFlags.adminApiEnabled` — the context value exists globally, but
nothing reads or shows it when the admin backend is configured.

**Alternative considered:** a `Record<ConfigFileEntityType, boolean>` per-type toggle. Rejected —
no requirement calls for viewing e.g. Models in config-file mode while Interceptors stays in
asset-browser mode, and it complicates persistence and the "same control renders in both headers"
requirement for no expressed benefit.

### D2: Toggle placement reuses each surface's existing title-adjacent slot

- `BaseAssetList` renders via ui-kit's `DialFileManager`, whose `managerLabel` prop is `ReactNode` (not
  just a string) — the toggle is composed into the same node as the existing label text.
- The admin-grid `ListView` already renders `{title}` and `{children}` side by side in its header row
  — the toggle is passed as `children`.

No new header/title component is introduced; both surfaces already have a slot for this.

### D3: List swap is a client-side component swap, not a route change

Each of the six `page.tsx` files keeps rendering both possibilities from one route: `showConfigFiles`
false → today's `BaseAssetList`-backed list component; true → that entity's existing admin-grid list
component (`Models/List`, `ApplicationsList`, `InterceptorsList`, `RoutesList`, `RolesList`,
`ToolsetsList`), reused as-is. No new route, no new list component.

### D4: Config-file entity data is fetched lazily, client-triggered, only on toggle-on

The six `page.tsx` files do not eagerly fetch config-file data on every request. A new client-invoked
server action (per entity type) is called only when the user flips the toggle on; its result is held
in local component state and feeds the admin-grid list component in place of the props those
components normally receive from server-side data. This keeps the cost of the feature at exactly zero
for the default (toggle-off) case, and for every admin-backend-configured deployment where the toggle
is never shown.

### D5: `ConfigFileApi` gains a full-entity `list<T>` method — not a raw Core endpoint, a composite

Core's config-file **list** route (`GET /v1/admin/config/file/{type}`) only ever returns bare names —
`FileConfigController.handleList` builds each item as `{name: key}` and nothing else; there is no
bulk-read-with-bodies route to call instead. The existing `listNames` is correct for what it does, but
a grid needs full entities, and building it via `listNames` + a per-name `getEntity` follow-up is
exactly the "picker" shape (`getConfigEntityOptions`/`toConfigEntityRows`) that deliberately drops
everything but name and origin — reusing it for a grid would mean re-fetching each entity a second
time just to get its columns.

`ConfigFileApi.list<T>(token, type)` is added as a composite: it calls `listNames`, then issues
`getEntity<T>` for every name in parallel, and returns
`ConfigFileReadResult<ConfigFileListResult<T>>`, where `ConfigFileListResult<T>` is
`{ entities: T[]; failures: ConfigFileReadFailure[] }` — mirroring `ConfigEntityOptions`'s
partial-success shape (a plain `ConfigFileReadResult<T[]>` has no room to carry both the entities that
did read and the failures for the ones that didn't, since its two branches are mutually exclusive).
The outer `ConfigFileReadResult` only fails when the type is unreadable or the name listing itself
fails; once names are in hand, every entity that read successfully is returned, and one failed name is
recorded in `failures` rather than discarded silently.

**Cost:** N+1 requests per type (one `listNames` + one `getEntity` per name), same shape Core's route
family already forces on any full-entity read. Acceptable because D4 makes this lazy — it only runs
when a user actually opts into the config-file list for one entity type at a time.

**Alternative considered:** teaching `listNames` itself to return full bodies. Rejected — Core's list
route cannot serve that regardless of client changes; the client would still need one `getEntity` per
name, and conflating "list of names" with "list of full entities" under one method obscures which is
which for the picker call sites that only ever wanted names.

### D6: `READABLE_CONFIG_FILE_TYPES` widens to the six in-scope types

Today: `{Interceptors, Roles, Settings}`. This change adds `Models`, `Routes`, `Applications`,
`Toolsets`. `Keys` stays excluded (Core's unconditional 403). `Settings` is retained (unrelated
singleton, already read elsewhere) and is not part of the six.

### D7: `showOnlyConfigFiles` parameter on `getConfigEntityOptions`/`readConfigEntities`

Both gain a `showOnlyConfigFiles: boolean` parameter (default `false`, threaded through every
existing call site) — named for what it does to the read (scope it to config-file entities only),
not for the `showConfigFiles` UI toggle (D1), which is a different concept driving a different layer.
When `true`:
- the asset-metadata (`apiWritten`) read is skipped — this call is happening because the caller
  already knows it wants the config-file population specifically, not the union a picker wants.
- the config-file (`configFileApi.listNames`) read is always attempted, regardless of
  `DIAL_ADMIN_API_URL` — today it resolves to an empty population whenever the admin backend is
  unset; that is precisely the case this parameter exists to override.

This keeps the default (`false`) behavior byte-for-byte identical to today for every call site that
doesn't pass it, including every existing picker on the admin-backend-configured path.

### D8: Detail-page fallback and read-only rendering are driven by a `configFile=true` query param, not by context or a cookie

A config-file list row's link carries `?configFile=true` to the existing "hidden" admin-grid detail
route (e.g. `/models/{id}?configFile=true`). That route's `page.tsx` (a server component) reads
`searchParams.configFile` directly — no cookie, no server-side read of `AppContext` (which is
client-only state and was never going to be visible to a server component at request time regardless
of how it's persisted).

When `configFile === 'true'`:
- the entity itself is fetched via `configFileApi.getEntity` instead of the admin-backend get.
- the page's own embedded picker reads (Roles/Interceptors) go through
  `readConfigEntities(..., showOnlyConfigFiles: true)` instead of direct `rolesApi`/`interceptorsApi`
  list calls.
- the redirect guard (`admin-api-availability`) becomes: redirect home only when
  `DIAL_ADMIN_API_URL` is unset **and** `configFile !== 'true'`.
- the view is marked read-only (D9).
- the breadcrumb's "back to list" segment points at the platform/asset route, not this hidden route's
  own list (D10) — reaching that list directly would redirect home.

### D9: Read-only rendering reuses `isReadOnlyAdmin`'s existing wiring via a context setter

~140 leaf field components across this codebase already call `useIsReadOnlyAdmin()` (a thin wrapper
over `useAppContext().isReadOnlyAdmin`) directly, disabling themselves with
`disabled={... || isReadOnlyAdmin}`. None of them accept a read-only prop.

Rather than threading a new prop through every one of those components (or duplicating the
computation with a second, separately-checked flag), `AppContext` gains a setter —
`setEntityReadOnly(boolean)` — following the same shape as its existing `setVisualizerConnector`. All
six detail `View` components (Models, Applications, Interceptors, Routes, Roles, Toolsets) call it on
mount when rendering a config-file entity, and clear it on unmount. `isReadOnlyAdmin`'s computation
folds this in: `isReadOnlyAdmin = <existing computation> || isEntityReadOnly`. Every existing call
site keeps working unmodified.

**Alternative considered:** a separate `isConfigFileReadOnly` flag, checked alongside
`isReadOnlyAdmin` at each of the ~140 call sites. Rejected — far larger diff, for a distinction
(admin-role-driven vs config-file-driven read-only) that no requirement needs a reader to be able to
tell apart; both mean "this field cannot be edited here."

**Risk:** a setter-on-mount pattern must reliably clear itself on unmount/navigation-away, or a config-
file detail view could leave the whole app read-only after the user navigates elsewhere. Mitigated by
the same cleanup-effect pattern `setVisualizerConnector`'s callers already use, and covered explicitly
in tasks/tests.

### D10: Breadcrumb "back to list" is remapped to the platform/asset route in config-file mode

`getBreadcrumbs` computes every segment's `href` purely from the URL path (via `usePathname`), so on
`/models/{id}?configFile=true` its first segment resolves to `/models` — the hidden route's *own*
list, which redirects home without the admin backend (D8's guard fires again, one level up). That is
never where the user came from in this mode; they reached the detail page from `/platform-models`'s
config-file-backed grid.

`getBreadcrumbs` gains an `isConfigFileMode` parameter; `Breadcrumbs.tsx` supplies it from
`useSearchParams().get('configFile') === 'true'`. When true, the root segment's `href` is looked up in
a new `CONFIG_FILE_DETAIL_TO_LIST_ROUTE` map (hidden route → its platform/asset route) instead of
being derived from the path, for every one of the six covered types. A route with no entry in that
map (everything outside this feature) is unaffected.

## Risks / Trade-offs

- **[Risk] Core's raw config-file JSON may not match `DialModel`/`DialApplication`/etc. exactly** for
  every one of the six types (Core injects `name`/`status` and strips `@EncryptedField`s, per
  `ConfigFileApi.getEntity`'s own doc comment, but full structural parity is unverified) →
  Mitigation: verify per type during implementation; add a thin per-type adapter in
  `src/utils/config-entities/` if a field is shaped or named differently, rather than assuming
  compatibility. Tracked as a task per type, not resolved by this design.
- **[Risk] N+1 fetch cost (D5) is real, not a documentation gap** — confirmed against DIAL Core's own
  source (`FileConfigController.handleList`): the list route's response is `{name}` per entry, always,
  with no way to ask for full bodies, so there is no alternative implementation of `list<T>` that
  avoids one `getEntity` per name → Mitigation: lazy/toggle-triggered (D4) keeps this opt-in and pays
  the cost only for a user who deliberately turns the toggle on for one entity type; a future change
  can add pagination, a loading state, or (a larger change) switch the config-file grid to name-only
  columns if a real deployment's population turns out to be large enough to matter.
- **[Trade-off] The six `page.tsx` files each grow a second data path (BaseAssetList's existing props
  vs. the new client-fetched config-file state)** rather than a single unified data model → accepted
  because the two paths have genuinely different fetch timing (server-eager vs. client-lazy) and
  merging them would force the eager cost onto the toggle-off default case (D4 exists specifically to
  avoid that).

## Open Questions

- Exact per-type shape mapping from `configFileApi.getEntity<T>`'s raw response to `DialModel` /
  `DialApplication` / `DialInterceptor` / `DialRoute` / `DialRole` — resolved during implementation,
  per type, as each is wired up.
- Final method name for D5 — `list` vs `getList` — decided at implementation time to match the
  existing `ConfigFileApi` naming (`listNames`, `getEntity`); this design uses `list` as a placeholder.
