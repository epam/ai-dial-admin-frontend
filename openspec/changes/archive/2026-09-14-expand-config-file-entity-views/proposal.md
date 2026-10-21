## Why

`add-config-file-entity-views` (archived) shipped six config-file-backed list/detail views, but left three
gaps found during follow-up review of PR #4536: the list's "open in new tab" row action forgets the
`configFile=true` query param the row click itself already adds, so it lands on a route that either
redirects home or renders editable instead of read-only; a config-file-sourced detail view still shows
the ADMIN|CORE format toggle even though there is nothing to compare against; and App Runners was
excluded on the stated grounds that "`ConfigFileEntityType` has no member for them" — which turns out to
be wrong. App Runners' own resource-metadata prefix is `schemas/platform/` (`SCHEMAS_PREFIX`,
`ResourceType.APP_TYPE_SCHEMA`), and `ConfigFileEntityType.Schemas = 'schemas'` already exists in the
enum; it was never added to `READABLE_CONFIG_FILE_TYPES` or probed against Core, so the "no matching
type" conclusion was never actually tested.

Separately, every one of the six (soon seven) config-file list fetches N+1 requests today —
`ConfigFileApi.list<T>` calls `listNames` then `getEntity` for every name in parallel — purely to
populate list columns that mostly go unused once a config-file entity is only ever opened read-only.
Fixing the App Runners gap is a natural point to also fix this: rather than growing the N+1 fetch to a
seventh entity type, this change removes it and moves every covered list to a names-only fetch (a single
`listNames` call) with a shared, name-only column set, since the row-level fields a full read provides
were never worth their per-row request cost for a read-only list.

A pre-archive review of this change (and of PR #4536) surfaced a further defect in the same surface:
every covered list navigates a config-file row to the entity's bare/"hidden" admin-grid detail route
(`/models/{id}`, `/application-runners/{id}`, etc. — the same route the six-then-seven `[id]/page.tsx`
files already special-cased for `configFile=true`). That route renders the entity's write-capable admin
`View.tsx`, which was never designed to represent a config-file-sourced, platform-only entity — the
`isConfigFileSource` read-only wiring added in tasks 3/8 papers over the write affordances but not the
surrounding layout/tabs, which assume the admin-backend shape. The actual fix is mechanical: point the
same `?configFile=true` navigation at each entity's platform/asset detail route instead
(`platform-models/[id]`, `platform-app-runners/[id]`, `assets-applications/[id]`,
`assets-toolsets/[id]`, etc.), and move the read-only fetch/render logic there. See design.md's D5.

## What Changes

- **Open in new tab**: the row action icon on a config-file-backed list now appends `?configFile=true`
  to the URL it opens, matching what row-click and the anchor `href` already do.
- **Hide the format toggle on config-file detail views**: `JsonToggleWithFormats`'s `onHideFormatSelector`
  escape hatch (already defined, never wired up) is set on all covered `<Entity>/View/View.tsx` components
  when `isConfigFileSource` is true, so the ADMIN|CORE `DialSelect` does not render once the JSON editor
  opens.
- **App Runners becomes the seventh covered entity type**: `ConfigFileEntityType.Schemas` is added to
  `READABLE_CONFIG_FILE_TYPES`; `platform-app-runners` gets the `showConfigFiles` toggle and list swap
  (`Assets/Platform/AppRunners/List.tsx`, currently a bare `BaseAssetList`, gains the same
  `ConfigFileListSwap` wiring the other six already have); `application-runners/[id]/page.tsx` gains the
  `configFile=true` branch that fetches via `configFileApi` and renders read-only, mirroring
  `models/[id]/page.tsx`; `CONFIG_FILE_ENTITY_VIEWS` and `CONFIG_FILE_DETAIL_TO_LIST_ROUTE` gain the
  corresponding entries. This is contingent on confirming Core's `v1/admin/config/file/schemas` route
  actually serves app-runner-shaped entities — see `design.md` Open Questions and `tasks.md`'s spike task.
- **Remove the N+1 full-entity read; lists become names-only**: `ConfigFileApi.list<T>` and
  `ConfigFileListResult<T>` are removed (verified unused outside the seven list actions this change
  touches). The seven `getConfigFile<Entity>s` actions call `configFileApi.listNames` instead. A new
  shared list component renders a name-only column plus the existing (now-fixed) open-in-new-tab action
  column, replacing each entity's own full-columns admin-grid list component for the config-file-backed
  branch. **BREAKING** for anyone relying on the config-file list showing more than an entity's name
  (e.g. status, endpoint) — full detail remains available on the entity's own read-only detail page.
- **Config-file detail navigation targets the platform/asset route, not the bare admin-grid route**:
  `ConfigFileEntityList`'s `route` prop (fed by each covered `PageList.tsx`) changes from the bare
  `ApplicationRoute` member to the corresponding platform/asset one (`PlatformModels`,
  `PlatformInterceptors`, `PlatformRoutes`, `PlatformRoles`, `PlatformAppRunners`, `AssetsApplications`,
  `AssetsToolsets`). The `configFile=true` fetch/read-only-render branch moves from each bare
  `[id]/page.tsx` + admin `View.tsx` to the platform/asset `[id]/page.tsx` + platform `View.tsx` (for
  Applications/Toolsets, the existing `isPlatformBucket` branch already in `assets-applications`/
  `assets-toolsets`). The bare routes/Views (`models/[id]`, `interceptors/[id]`, `routes/[id]`,
  `roles/[id]`, `applications/[id]`, `toolsets/[id]`, `application-runners/[id]`) revert to admin-only,
  dropping `isConfigFileSource` entirely. The breadcrumb fix-up (`CONFIG_FILE_DETAIL_TO_LIST_ROUTE`) is
  removed as dead code, since the detail route now *is* the list's own route.

## Capabilities

### Modified Capabilities

- `config-file-entity-views`: the open-in-new-tab action includes `configFile=true`; a config-file
  detail view hides the ADMIN|CORE format toggle; App Runners (`platform-app-runners`) becomes a
  seventh covered view instead of an explicitly excluded one; the config-file-backed list
  renders names only, via a shared list component, instead of each entity's full admin-grid columns;
  config-file detail navigation and rendering moves from each entity's bare admin-grid route to its
  platform/asset route, and the bare-route breadcrumb fix-up is removed as unnecessary.
- `core-config-file-client`: `ConfigFileEntityType.Schemas` joins the readable allow-list;
  `ConfigFileApi.list<T>` and the full-entity-population read it provides are removed in favor of the
  existing `listNames` read, which is now the only read a config-file list issues.

## Impact

- `apps/ai-dial-admin/src/components/EntityListView/EntityListView.tsx` (open-in-new-tab fix)
- `apps/ai-dial-admin/src/server/core/config-file-api.ts`, `src/models/dial/config-file.ts` (remove
  `list`/`ConfigFileListResult`)
- `apps/ai-dial-admin/src/hooks/use-config-file-entity-list.ts`,
  `src/components/Common/ConfigFileListSwap/ConfigFileListSwap.tsx` (names-only generic)
- `apps/ai-dial-admin/src/app/[lang]/{platform-models,platform-interceptors,platform-routes,platform-roles,
  assets-applications,assets-toolsets,platform-app-runners}/actions.ts` (`listNames` instead of `list`)
- `apps/ai-dial-admin/src/components/Assets/Platform/{Models,Interceptors,Routes,Roles,AppRunners}/PageList.tsx`,
  `Assets/{Apps,Toolsets}/PageList.tsx` (render the new shared list, targeting the platform/asset `route`)
- `apps/ai-dial-admin/src/app/[lang]/{platform-models,platform-interceptors,platform-routes,platform-roles,
  platform-app-runners,assets-applications,assets-toolsets}/[id]/page.tsx` and
  `src/components/Assets/Platform/{Models,Interceptors,Routes,Roles,AppRunners,Applications,Toolsets}/View.tsx`
  (new `configFile=true` branch, moved from the bare routes)
- `apps/ai-dial-admin/src/app/[lang]/{models,interceptors,routes,roles,applications,toolsets,
  application-runners}/[id]/page.tsx` and their `View.tsx` components (revert to admin-only, no
  `isConfigFileSource`)
- `apps/ai-dial-admin/src/constants/config-file-core.ts`, `constants/config-file-entity-views.ts` (remove
  `CONFIG_FILE_DETAIL_TO_LIST_ROUTE`)
- `apps/ai-dial-admin/src/components/Breadcrumbs/utils.ts` (remove the `isConfigFileMode` override)
- A new shared `Common` list component + one shared name-only column definition

## Non-goals

- No write path for App Runners' config-file population — it stays read-only like the other six.
- No change to `getConfigEntityOptions`/`readConfigEntities` (the picker union read) — this change is
  scoped to the six-now-seven admin-grid list/detail surface, not the reference-picker surface, and the
  picker's own `list`-less design is untouched.
- No change to the shared `ConfigFileEntityList`/`ConfigFileListSwap` mechanism itself, or to the
  `showConfigFiles` toggle's placement/persistence — only the route value fed to them, and where the
  resulting `configFile=true` fetch/render lives, changes.
