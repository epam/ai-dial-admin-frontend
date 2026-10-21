## Context

`config-file-entity-views` (archived) added a `showConfigFiles` toggle to six platform/asset list pages
that swaps `BaseAssetList` for that entity's own admin-grid list component, fed by
`ConfigFileApi.list<T>` — a composite of `listNames` + one `getEntity` per name. Follow-up review of
PR #4536 found three problems, traced in full against the current code:

1. `BaseEntityList`'s row action icon ("open in new tab", wired through `EntityListView.tsx`'s
   `openInNewTab` callback) calls `onOpenInNewTab(route, entity)` directly, never receiving the
   `CONFIG_FILE_URL_SUFFIX` (`?configFile=true`) that the row-click handler (`onCellClicked`) and the
   `<ListView>`'s own `getHref` prop already append. Confirmed by reading all three call sites side by
   side in `EntityListView.tsx`.
2. `JsonToggleWithFormats` already has an `onHideFormatSelector?: () => boolean` prop on
   `JsonConfiguration` — built for exactly this kind of per-instance override — but no covered `View.tsx`
   sets it. `Models/View/View.tsx` already skips fetching `coreModel` when `isConfigFileSource` (there is
   nothing to compare against), yet still renders the ADMIN|CORE `DialSelect` once the editor opens.
3. The archived design doc excluded App Runners with "`ConfigFileEntityType` has no member for them."
   That's contradicted by the enum itself (`Schemas = 'schemas'`) and by App Runners' own
   resource-metadata prefix (`SCHEMAS_PREFIX = 'schemas/platform/'`, `RESOURCE_TYPE_PREFIX[APP_TYPE_SCHEMA]`)
   — `app-runner-schema-api.ts`'s own comment even traces this lineage ("Core PR #1813 changed the key
   from the canonical config-map path `schemas/platform/{name}`..."). `READABLE_CONFIG_FILE_TYPES` never
   included `Schemas`, so nothing was ever probed against Core to confirm or refute this. Unlike the
   other six, App Runners already has the full "hidden admin-grid route + platform/asset route" pairing
   this feature relies on (`application-runners/[id]/page.tsx` ⟷ `platform-app-runners`, using
   `applicationRunnersApi.getApplicationScheme`/`getCoreRunner` — the same ADMIN/CORE shape as `models`),
   it just was never wired into `config-file-entity-views`. **Correction (pre-archive review):** wiring
   App Runners into the bare `application-runners/[id]` route this way repeats the same routing mistake
   already made for the other six — see D5.

Separately, `ConfigFileApi.list<T>` is an N+1 read (one `getEntity` per name, in parallel) whose only
consumers, repo-wide, are the six `getConfigFile<Entity>s` list actions this feature added. Every one of
those lists' columns come from the entity's full admin-grid column set (`MODELS_COLUMNS`, etc.),
regardless of `isConfigFileSource` — the column shape was never adapted for a read-only, no-write list.
Since these rows exist only to be clicked through to a read-only detail page, the per-row fields were
never worth the fetch cost.

## Goals / Non-Goals

**Goals:**
- Fix the open-in-new-tab and format-toggle gaps with the same shape the existing five other call sites
  already use — no new pattern.
- Confirm (not assume) that Core's config-file `schemas` type serves App-Runner-shaped entities before
  building on it, and add App Runners as a seventh covered view once confirmed.
- Remove the N+1 full-entity read; every covered list becomes a single `listNames` call rendering a
  name-only column, via one shared component instead of six (soon seven) separate ones.

**Non-Goals:**
- No change to the picker/reference-option union read (`getConfigEntityOptions`, `readConfigEntities`) —
  that surface never used `ConfigFileApi.list` and is untouched.
- No write path for any config-file entity, App Runners included.
- No change to the `ConfigFileEntityList`/`ConfigFileListSwap` mechanism, or to the `showConfigFiles`
  toggle's placement/persistence — D5 changes the route value fed to them and where the resulting
  `configFile=true` fetch/render lives, not the mechanism itself.

## Decisions

### D1: Confirm the `schemas` config-file type before writing any App Runners code

Before wiring `ConfigFileEntityType.Schemas` into `READABLE_CONFIG_FILE_TYPES`, issue one manual read
against a running Core instance's `GET /v1/admin/config/file/schemas` (and
`GET /v1/admin/config/file/schemas/{name}` for one known runner) and diff the shape against
`DialAppRunnerResource`. This is a single spike task, not a design fork — if the shape matches (as the
`SCHEMAS_PREFIX` lineage strongly suggests), the rest of this design applies unchanged; if it doesn't
match or the route 403s the way `keys` does, App Runners' scope narrows back to "excluded, now for a
verified reason" and every other part of this change (bug fixes, N+1 removal for the original six) still
stands on its own.

**Alternative considered:** build the App Runners wiring speculatively behind the same
`READABLE_CONFIG_FILE_TYPES` gate the other six use, and let a failed request surface as the existing
per-type refusal/failure path. Rejected — that would ship a feature nobody has seen work, in a system
where "unreadable type" and "route exists but shape doesn't match `DialAppRunnerResource`" fail
differently (one is a clean refusal, the other is a runtime type mismatch reaching the view layer).

### D2: One shared, name-only list component replaces six per-entity admin-grid lists for this branch

Today, `ConfigFileListSwap`'s `renderConfigFileList` callback in each `PageList.tsx` renders that entity's
own full-columns list component (`AdminModelsList`, `InterceptorsList`, etc.) with `isConfigFileSource`.
This design replaces that with one new `ConfigFileEntityList` (in `components/Common/`), taking
`names: string[]` and a `route: ApplicationRoute`, internally rendering `BaseEntityList` with a single
shared name column plus the (now-fixed) `openInNewTab` action column. `getUrnForEntity`'s existing
`PlatformModels`-style case already only needs `{name}` — no change required there.

```
PageList.tsx (× 7)
  <ConfigFileListSwap
    assetList={<AssetXList />}
    fetchConfigFileList={getConfigFileXNames}        // listNames(), not list()
    renderConfigFileList={(names) => (
      <ConfigFileEntityList names={names} route={ApplicationRoute.X} headerExtra={<ConfigFilesToggle />} />
    )}
  />
```

**Alternative considered:** keep each entity's own list component, just pass it a name-only column set
as an extra prop. Rejected — every one of the six list components hard-codes its own `baseColumns` via
`useMemo(() => X_COLUMNS(t), [t])`; branching that per-component on `isConfigFileSource` duplicates the
same one-column definition six times for no benefit, when the entity-specific list component was doing
nothing else config-file mode still needs (data mapping, create/remove handlers — all no-ops here since
the list is read-only and never creates).

### D3: `listNames`-only fetch, `list<T>` and `ConfigFileListResult<T>` removed rather than deprecated

Confirmed via repo-wide search that `ConfigFileApi.list<T>` has no caller outside the six
`getConfigFile<Entity>s` actions this change touches. There is no reason to keep a composite read whose
only reason to exist (populating full-entity list columns) no longer applies anywhere. Each action
switches its single line from `configFileApi.list<T>(token, Type)` to `configFileApi.listNames(token,
Type)`; `useConfigFileEntityList<T>` and `ConfigFileListSwap<T>` collapse their generic to the `string[]`
`listNames` already returns (no more `.entities`/`.failures` unwrap — `listNames` fails wholesale, not
per-row, so the existing `ConfigFileReadResult` success/failure split is all that's needed).

### D4: `onHideFormatSelector` is set per-view from `isConfigFileSource`, not a new static route list

`JsonToggleWithFormats`'s existing `ONLY_ADMIN_ENTITIES` list is keyed by `ApplicationRoute` alone, which
can't express "hide only when this specific entity came from config-file" — the same route
(`PlatformModels`'s paired `Models` route) renders both admin-backend and config-file-sourced entities.
Each of the seven `View.tsx` components already computes `isConfigFileSource` as a prop and already uses
it to skip the `coreModel` fetch; this change adds one line to each `jsonConfiguration` memo:
`onHideFormatSelector: () => !!isConfigFileSource` (with `isConfigFileSource` added to the memo's deps).
No change to `JsonToggleWithFormats` itself — the prop it needs already exists.

### D5: Config-file navigation targets the platform/asset detail route, not the bare admin-grid route

Confirmed while reviewing this change ahead of archiving: `ConfigFileEntityList`'s `route` prop is fed
the bare `ApplicationRoute` member by all seven `PageList.tsx` callers (e.g. `ApplicationRoute.Models`,
`.ApplicationRunners`, `.Applications`, `.Toolsets`). `getUrnForEntity`/`getEntityPath`
(`utils/open-in-new-tab.ts`) resolve the URL prefix from `route.split('/')[1]` alone — they already
handle the platform/asset route variants (`PlatformModels`, `PlatformAppRunners`, `AssetsApplications`,
`AssetsToolsets`) via the same flat, name-based path logic the bare routes fall through to by default. So
the only change needed to retarget navigation is the `route` value each `PageList.tsx` passes in:

| Entity | Route prop today | Corrected |
|---|---|---|
| Models | `ApplicationRoute.Models` | `PlatformModels` |
| Interceptors | `.Interceptors` | `PlatformInterceptors` |
| Routes | `.Routes` | `PlatformRoutes` |
| Roles | `.Roles` | `PlatformRoles` |
| App Runners | `.ApplicationRunners` | `PlatformAppRunners` |
| Applications | `.Applications` | `AssetsApplications` |
| Toolsets | `.Toolsets` | `AssetsToolsets` |

The `configFile=true` fetch/read-only-render branch (tasks 3/8's `isConfigFileSource` wiring) moves with
it — off the bare `[id]/page.tsx` + admin `View.tsx` pair and onto the platform/asset `[id]/page.tsx` +
platform `View.tsx` pair:

```
platform-models/[id]/page.tsx        + Assets/Platform/Models/View
platform-interceptors/[id]/page.tsx  + Assets/Platform/Interceptors/View
platform-routes/[id]/page.tsx        + Assets/Platform/Routes/View
platform-roles/[id]/page.tsx         + Assets/Platform/Roles/View
platform-app-runners/[id]/page.tsx   + Assets/Platform/AppRunners/View
assets-applications/[id]/page.tsx    + Assets/Platform/Applications/View  (existing isPlatformBucket branch)
assets-toolsets/[id]/page.tsx        + Assets/Platform/Toolsets/View     (existing isPlatformBucket branch)
```

For Applications and Toolsets, config-file entities are inherently flat/platform-bucket, so they land on
the `isPlatformBucket === true` branch these two pages already have — no new branch or component.

The bare routes/Views (`models/[id]`, `interceptors/[id]`, `routes/[id]`, `roles/[id]`,
`applications/[id]`, `toolsets/[id]`, `application-runners/[id]`) fully revert: the `configFile` search
param, `isConfigFileSource` prop, and every branch it gated (config-file fetch, `onHideFormatSelector`,
skipped Core-compare fetch) are removed, restoring pre-`add-config-file-entity-views` behavior. They are
never a `configFile=true` navigation target once this lands.

`CONFIG_FILE_DETAIL_TO_LIST_ROUTE` and `Breadcrumbs/utils.ts`'s `isConfigFileMode`/`listRouteOverride`
branch are removed: that map existed only to correct the breadcrumb after landing on the wrong (bare)
route's list link. Once the detail route is the platform/asset route itself, its own `breadcrumbConfig`
entry already resolves correctly with no override.

**Alternative considered:** keep navigation on the bare route and instead fix the bare admin `View.tsx`
components to render correctly for a config-file-sourced, platform-only entity. Rejected — that means
teaching every bare View (which assumes an admin-backend-shaped, editable entity reachable only via the
six/seven admin-grid list routes) a second, platform-only rendering mode, duplicating logic the platform
Views already have correct. Routing to the entity's actual platform/asset home is the smaller, more
correct change.

## Risks / Trade-offs

- **[Risk]** The `schemas` config-file route may not return `DialAppRunnerResource`-shaped bodies, or
  may 403 like `keys` does. → **Mitigation:** D1's spike runs first, before any App Runners-specific code
  is written; the rest of this change does not depend on its outcome.
- **[Risk]** Removing `ConfigFileApi.list<T>` is a breaking change to that class's public surface.
  → **Mitigation:** confirmed zero external callers repo-wide; `tasks.md` includes a final grep-verify
  step before deletion.
- **[Trade-off]** Config-file list rows now show only a name, where they previously showed full entity
  columns (status, endpoint, etc. — populated at real per-row request cost). A user who wants those
  fields must open the row's read-only detail page. This is the explicit point of the change (see
  proposal's **BREAKING** note), not an accidental regression.
- **[Risk]** Reverting the bare routes/Views (D5) must not leave any other caller pointed at
  `<bare-route>/[id]?configFile=true`. → **Mitigation:** `tasks.md`'s task 12 includes a grep-verify that
  `ConfigFileEntityList`/its tests are the only source of that URL shape before the bare routes drop their
  `configFile` branch.

## Open Questions

- Should the shared `ConfigFileEntityList`'s name column reuse an existing generic "Name" column
  definition from `constants/grid-columns/`, or is a new minimal one warranted? Left to implementation —
  neither choice changes any spec-level behavior.
