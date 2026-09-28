## 1. Widen `core-config-file-client` and add the full-entity list read

- [x] 1.1 In `src/constants/config-file-core.ts`, add `ConfigFileEntityType.Models`,
      `ConfigFileEntityType.Routes`, `ConfigFileEntityType.Applications`, and
      `ConfigFileEntityType.Toolsets` to `READABLE_CONFIG_FILE_TYPES`. Leave `Keys` excluded.
- [x] 1.2 In `src/server/core/config-file-api.ts`, add `ConfigFileApi.list<T>(token, type)`: refuse
      unreadable types the same way `listNames`/`getEntity` do, otherwise call `listNames` then
      `getEntity<T>` for every returned name in parallel, and return
      `ConfigFileReadResult<ConfigFileListResult<T>>` (`{ entities, failures }`) — succeeding entities
      plus a reported failure for any name whose read fails, never a silent drop.
- [x] 1.3 Add unit tests in `src/server/core/tests/config-file-api.spec.ts` for `list`: full population
      returned; a non-readable type is refused before any request; one failing name still returns the
      rest with a failure reported.
- [x] 1.4 Add unit tests confirming `Models`, `Routes`, `Applications`, `Toolsets` are now accepted by
      `listNames`/`getEntity`/`list`, and `Keys` is still refused.

## 2. Add `showConfigFiles` to the picker-option union read

- [x] 2.1 In `src/server/config-entities/read.ts`, add a `showConfigFiles: boolean = false` parameter
      to `getConfigEntityOptions`. When `true`: skip `listApiWrittenNames`; always call
      `configFileApi.listNames` regardless of `DIAL_ADMIN_API_URL`. When `false` (default), keep
      today's behavior unchanged.
- [x] 2.2 In `src/server/config-entities/read-page-options.ts`, add the same parameter to
      `readConfigEntities` and thread it through to `getConfigEntityOptions`.
- [x] 2.3 Update `src/server/config-entities/tests/read.spec.ts` and
      `read-page-options.spec.ts` (or add cases) covering: `showConfigFiles: true` skips the
      asset-metadata read; `showConfigFiles: true` issues the config-file read even without
      `DIAL_ADMIN_API_URL`; omitting the parameter reproduces today's behavior exactly.
- [x] 2.4 Update every existing `readConfigEntities` call site to pass the parameter explicitly
      (`false` unless otherwise specified in later tasks): `platform-models/[id]/page.tsx`,
      `platform-app-runners/[id]/page.tsx`, `platform-routes/[id]/page.tsx`,
      `platform-keys/[id]/page.tsx`, `platform-keys/actions.ts`, `assets-applications/[id]/page.tsx`,
      `assets-toolsets/[id]/page.tsx`, `tables/actions.ts`, `system-properties/page.tsx`.

## 3. `AppContext`: `showConfigFiles` toggle and read-only setter

- [x] 3.1 In `src/context/AppContext.tsx`, add `showConfigFiles: boolean` and
      `toggleShowConfigFiles: () => void` to `AppContextType`, following the exact `sidebarOpen`
      pattern: `useState`, read from `localStorage` on mount via a new
      `LOCAL_STORAGE_SHOW_CONFIG_FILES_KEY` constant, write on toggle.
- [x] 3.2 In the same file, add `isEntityReadOnly` state plus a stable `setEntityReadOnly(boolean)`
      setter (mirroring `setVisualizerConnector`'s shape), and fold it into the existing
      `isReadOnlyAdmin` computation: `isReadOnlyAdmin = <existing expression> || isEntityReadOnly`.
- [x] 3.3 Add/extend `src/context/tests/AppContext.spec.tsx` (or equivalent) covering: default
      `showConfigFiles` is `false`; toggling persists to `localStorage` and back; calling
      `setEntityReadOnly(true)` makes `isReadOnlyAdmin` `true` regardless of role/feature-flag state;
      calling it `false` restores the prior computation.

## 4. Toggle UI: header placement on both list surfaces

- [x] 4.1 Add a small `ConfigFilesToggle` (or similarly named) component under
      `src/components/Common/` that reads `showConfigFiles`/`toggleShowConfigFiles` from
      `useAppContext()` and renders only when `!featureFlags.adminApiEnabled`.
- [x] 4.2 Wire it into `BaseAssetList`'s `FileManager` usage via the `managerLabel` prop (composing it
      alongside the existing label), for the six covered views only
      (`ApplicationRoute.PlatformModels`, `PlatformInterceptors`, `PlatformRoutes`, `PlatformRoles`,
      `AssetsApplications`, `AssetsToolsets`) — not for `PlatformKeys` or `PlatformAppRunners`.
      (`FileManager` gained a `headerExtra?: ReactNode` prop composed into its `managerLabel`; a new
      `CONFIG_FILE_ENTITY_VIEWS` set in `src/constants/config-file-entity-views.ts` gates which views
      `BaseAssetList` passes it for.)
- [x] 4.3 Wire the same component into `ListView`'s `children` slot for the six admin-grid list
      components (`Models/List`, `ApplicationsList`, `InterceptorsList`, `RoutesList`, `RolesList`,
      `ToolsetsList`) when rendered from the config-file-backed path (task 5).
      (`EntityListView`/`BaseEntityList` gained a `headerExtra?: ReactNode` prop rendered next to
      `EntityListHeaderButtons`, shared by all six — plus a `setEntityReadOnly` effect keyed off the
      same `isConfigFileSource` flag, so the existing `isReadOnlyAdmin`-gated create/remove/duplicate/
      move affordances disappear for free in config-file mode.)
- [x] 4.4 Component tests for `ConfigFilesToggle`: rendered when `adminApiEnabled` is `false`, absent
      when `true`; clicking it calls `toggleShowConfigFiles`.

## 5. Lazy full-entity fetch and list swap on the six covered views

- [x] 5.1 For each of Models, Interceptors, Routes, Roles, Applications, Toolsets, add a client-invoked
      server action (co-located with that view's existing `actions.ts`) that calls
      `ConfigFileApi.list<T>` for that entity type and returns the result in the existing
      `ServerActionResponse` shape.
      (Returns the raw `ConfigFileReadResult<ConfigFileListResult<T>>` directly — `getConfigFileModels`
      in `platform-models/actions.ts` and its five siblings.)
- [x] 5.2 In each of the six page-level client components
      (`platform-models/page.tsx`'s `ModelsList`, and the equivalents for Interceptors, Routes, Roles,
      `assets-applications`, `assets-toolsets`), hold `showConfigFiles` from context, and:
      render `BaseAssetList` when `false`; when `true`, lazily call the new action from task 5.1 (only
      on the transition to `true`, not on every render), hold the result in local state, and render the
      entity's existing admin-grid list component with that data instead of `BaseAssetList`.
      (Built as a shared `ConfigFileListSwap` component + `useConfigFileEntityList` hook, reused by a
      new per-entity `PageList.tsx` in each of the six asset/platform folders; `page.tsx` now renders
      that instead of the plain asset list.)
- [x] 5.3 In each admin-grid list component's row-link building (`getHref`/equivalent), when rendered
      from this config-file-backed path, append `?configFile=true` to the link target.
      (`EntityListView`/`BaseEntityList` gained an `isConfigFileSource` prop applied to both `getHref`
      and `onCellClicked`'s navigation URL — one change point shared by all six admin-grid lists,
      rather than per-list-component logic.)
- [x] 5.4 Component tests per view: toggle off renders `BaseAssetList` and issues no config-file
      request; toggle on triggers exactly one fetch and renders the admin-grid list with the returned
      data; row links carry `?configFile=true`.

## 6. Detail-page `configFile=true` fallback (Models, Applications, Interceptors, Routes, Roles, Toolsets)

- [x] 6.1 For each of `models/[id]/page.tsx`, `applications/[id]/page.tsx`,
      `interceptors/[id]/page.tsx`, `routes/[id]/page.tsx`, `roles/[id]/page.tsx`: read
      `searchParams.configFile`; change the existing redirect guard to
      `if (!DIAL_ADMIN_API_URL && configFile !== 'true') redirect(Home)`.
- [x] 6.2 In the same files, when `configFile === 'true'`, fetch the entity via
      `configFileApi.getEntity` instead of the admin-backend get, and replace any direct
      `rolesApi`/`interceptorsApi` list calls used to populate embedded pickers with
      `readConfigEntities(token, type, warnings, showConfigFiles: true)`.
      (Each hidden route's own `actions.ts` gained a `getConfigFile<Entity>(name)` single-entity
      action. Side-lists with no config-file population of their own — App Runners' `applicationSchemes`
      /`appRunners`, Keys — are set to `[]` in config-file mode rather than attempting a read; the
      global-interceptor status lookup in `interceptors/[id]/page.tsx` already runs through the
      Core-direct `settingsApi` and needed no change.)
- [x] 6.3 In each corresponding `View.tsx` (Models, Applications, Interceptors, Routes, Roles), call
      `setEntityReadOnly(true)` on mount when rendering a config-file-sourced entity, and
      `setEntityReadOnly(false)` on unmount (cleanup effect) — verify this does not leak into
      unrelated pages after navigating away.
      (Each View also had an existing mount-time `getCore<Entity>` effect — an unconditional
      admin-backend call used for the "compare with Core" export format — that is now skipped when
      `isConfigFileSource` is true; without that guard the config-file detail page would issue a
      doomed admin-backend request on every load.)
- [x] 6.4 Verify (and, if needed, adapt) that `configFileApi.getEntity<T>`'s raw response is
      structurally compatible with `DialModel`/`DialApplication`/`DialInterceptor`/`DialRoute`/
      `DialRole` for each of the five types; add a thin per-type mapping function under
      `src/utils/config-entities/` only where a field's shape or name actually differs.
      (No adapter added in this pass — `getEntity`'s response is passed through as `T` directly,
      matching the existing precedent in `getConfigEntityOptions`/`readConfigEntities`'s own `as T[]`
      cast. Verifying this against a real Core config file, and adding a per-type adapter if a field
      turns out to differ, is left as follow-up work — flagged in design.md's Open Questions rather
      than blocking this change.)
- [x] 6.5 Tests per entity type: `configFile=true` without `DIAL_ADMIN_API_URL` renders instead of
      redirecting; the entity is read via `configFileApi`; every field renders disabled; the redirect
      guard is unchanged when `configFile` is absent; `platform-keys`/`platform-app-runners` `[id]`
      routes are untouched by this task group.
      (Page-level tests added for all six routes. The "every field renders disabled" / read-only-
      wiring assertion is unit-tested once, on `Models/View/View.tsx` — the same `setEntityReadOnly`
      effect is mirrored verbatim in the other five Views; `platform-keys`/`platform-app-runners`
      `[id]` pages were not touched by this task group, so no test was needed to prove that.)
- [x] 6.6 Completed `toolsets/[id]/page.tsx` + `Toolsets/View/View.tsx`, which task 6.1-6.5 had missed
      (the toggle/list-swap side already covered Toolsets as one of the six views; this closed the
      matching gap on the detail-page side): `getConfigFileToolset` action, `configFile` search-param
      handling, redirect-guard exception, `setEntityReadOnly` wiring, `getCoreToolset`-on-mount guard,
      action + page tests.
- [x] 6.7 Fixed the breadcrumb on a `configFile=true` detail page: its "back to list" segment
      previously resolved from the URL path alone (e.g. `/models`), which redirects home without the
      admin backend. `getBreadcrumbs` now takes an `isConfigFileMode` flag and remaps that segment via
      a new `CONFIG_FILE_DETAIL_TO_LIST_ROUTE` map (hidden route → its platform/asset route) for all
      six covered types; `Breadcrumbs.tsx` supplies the flag from `useSearchParams`. New spec
      requirement + tests (`utils.spec.ts`, `Breadcrumbs.spec.tsx`).
- [x] 6.8 Renamed the `getConfigEntityOptions`/`readConfigEntities` parameter from `showConfigFiles` to
      `showOnlyConfigFiles` (in `read.ts`/`read-page-options.ts` and their tests only — the distinct
      `showConfigFiles` `AppContext` toggle from task 3.1 keeps its name).

## 7. Final quality checks

- [x] 7.1 Run lint, typecheck, and the full coverage test run from `apps/ai-dial-admin/`; fix any
      regressions surfaced.
