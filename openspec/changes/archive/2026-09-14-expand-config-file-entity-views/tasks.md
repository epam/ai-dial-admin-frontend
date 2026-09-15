## 1. Spike: confirm App Runners' config-file type

- [x] 1.1 Confirmed statically against the `ai-dial-core` source (`FileConfigController.java`,
      `RouteTemplate.ADMIN_FILE_CONFIG`): `GET /v1/admin/config/file/schemas` (`listFileConfigSchemas`)
      is documented as "List of file-sourced application type schemas" — App Runners' own term for
      themselves — and `entitySource()` resolves `APP_TYPE_SCHEMA` to `config.getApplicationTypeSchemas()`.
      `handleSingle` injects `name`/`status` into the parsed schema JSON the same way every other
      type's response is built, so `getEntity<DialAppRunnerResource>` needs no special-casing. `keys` is
      the only type Core refuses outright; `schemas` requires the same admin auth as every other type.
      `catalog_schemas` is confirmed a distinct, unrelated map (`CATALOG_SCHEMA -> getCatalogSchemas()`).
      App Runners is in scope for the remaining tasks.

## 2. Fix: open-in-new-tab query param

- [x] 2.1 In `EntityListView.tsx`, thread `isConfigFileSource` into the `openInNewTab` callback so it
      appends `CONFIG_FILE_URL_SUFFIX` the same way `onCellClicked` and `getHref` already do.
- [x] 2.2 Add/extend a component test on `EntityListView`/`BaseEntityList` asserting the "open in new
      tab" row action opens `.../{id}?configFile=true` when `isConfigFileSource` is true, and the bare
      route when it is false.

## 3. Fix: hide the ADMIN|CORE format toggle for config-file entities

- [x] 3.1 In each of `Models/View/View.tsx`, `Interceptors/View/View.tsx`, `Routes/View/View.tsx`,
      `Roles/View/View.tsx`, `Applications/View/View.tsx`, `Toolsets/View/View.tsx` (and
      `ApplicationRunners/View/View.tsx`, if task 1 confirms App Runners is in scope), add
      `onHideFormatSelector: () => !!isConfigFileSource` to the `jsonConfiguration` memo, adding
      `isConfigFileSource` to its dependency array.
- [x] 3.2 Add/extend a test per updated `View.tsx` asserting `onHideFormatSelector()` returns `true` when
      `isConfigFileSource` is true and `false` otherwise. (`ApplicationRunners/View/View.tsx` covered in
      task 8.5/9.1 below, alongside its own config-file wiring.)

## 4. `core-config-file-client`: add Schemas, remove the N+1 `list` method

- [x] 4.1 Add `ConfigFileEntityType.Schemas` to `READABLE_CONFIG_FILE_TYPES` in `config-file-core.ts`
      (only if task 1's spike confirms the shape).
- [x] 4.2 Grep-verify `ConfigFileApi.list` and `ConfigFileListResult<T>` have no callers outside the six
      `getConfigFile<Entity>s` actions this change is about to migrate (task 5), then remove `list` from
      `config-file-api.ts` and `ConfigFileListResult<T>` from `models/dial/config-file.ts`.
- [x] 4.3 Update `config-file-api.spec.ts` to drop `list`'s test coverage and confirm `listNames`'s
      existing coverage still exercises the Schemas type once added.

## 5. Migrate the six (seven) list actions to `listNames`

- [x] 5.1 In `platform-models/actions.ts`, `platform-interceptors/actions.ts`, `platform-routes/actions.ts`,
      `platform-roles/actions.ts`, `assets-applications/actions.ts`, `assets-toolsets/actions.ts`, change
      `getConfigFile<Entity>s` to call `configFileApi.listNames(token, Type)` instead of `.list<T>(...)`.
- [x] 5.2 Added `getConfigFileAppRunners` to `platform-app-runners/actions.ts`, calling
      `configFileApi.listNames(token, ConfigFileEntityType.Schemas)`.
- [x] 5.3 Update each action's existing spec to assert `listNames` is called instead of `list`.

## 6. Shared name-only config-file list component

- [x] 6.1 Reused the existing `NAME_COLUMN_WITH_SORT` from `constants/grid-columns/base-columns.ts`
      (resolves design.md's open question) instead of adding a new definition — it is already the
      established single-column shape for flat, name-only entities.
- [x] 6.2 Added `ConfigFileEntityList` under `components/Common/` — takes `names: string[]`,
      `route: ApplicationRoute`, and `headerExtra?: ReactNode`; renders `BaseEntityList` with
      `[NAME_COLUMN_WITH_SORT]` and `isConfigFileSource` always true, so remove/duplicate/move stay
      hidden and only "open in new tab" renders in the action column.
- [x] 6.3 Unit-tested `ConfigFileEntityList`: maps names to rows, passes only the name column, and
      always forwards `isConfigFileSource=true` (the open-in-new-tab `?configFile=true` behavior itself
      is covered by `EntityListView.spec.tsx`, task 2.2).

## 7. Wire the shared list into each covered `PageList.tsx`

- [x] 7.1 Update `Assets/Platform/Models/PageList.tsx`, `Assets/Platform/Interceptors/PageList.tsx`,
      `Assets/Platform/Routes/PageList.tsx`, `Assets/Platform/Roles/PageList.tsx`,
      `Assets/Apps/PageList.tsx`, `Assets/Toolsets/PageList.tsx` to render `<ConfigFileEntityList>` in
      `renderConfigFileList` instead of each entity's own `AdminXList`, passing the fetched names through
      unchanged (no more `.entities` unwrap).
- [x] 7.2 Update `useConfigFileEntityList<T>` and `ConfigFileListSwap<T>` to operate on `string[]`
      (`listNames`'s return shape) instead of `ConfigFileListResult<T>`.
- [x] 7.3 Update each `PageList.spec.tsx` for the six views to match the new `renderConfigFileList` output
      and the `string[]` data shape.

## 8. App Runners: seventh covered view (only if task 1 confirms)

- [x] 8.1 Add `ApplicationRoute.PlatformAppRunners` to `CONFIG_FILE_ENTITY_VIEWS` and
      `ApplicationRoute.ApplicationRunners → ApplicationRoute.PlatformAppRunners` to
      `CONFIG_FILE_DETAIL_TO_LIST_ROUTE` in `config-file-entity-views.ts`.
- [x] 8.2 Added `Assets/Platform/AppRunners/PageList.tsx` wrapping the existing `List.tsx` (unchanged,
      still a bare `BaseAssetList`) in `ConfigFileListSwap`, following the same shape as the other six;
      `platform-app-runners/page.tsx` now renders it instead of `List.tsx` directly.
- [x] 8.3 `ConfigFilesToggle` on the App Runners asset page follows for free from task 8.1:
      `BaseAssetList` already gates its own header toggle on `CONFIG_FILE_ENTITY_VIEWS.has(view)`.
- [x] 8.4 Added the `configFile=true` branch to `application-runners/[id]/page.tsx` — fetches via
      `configFileApi.getEntity<DialApplicationScheme>(token, ConfigFileEntityType.Schemas, id)`, reads
      roles/applications/interceptors via `readConfigEntities`, renders `ApplicationRunnersView` read-only,
      mirroring `models/[id]/page.tsx`'s existing branch.
- [x] 8.5 In `ApplicationRunnersView/View.tsx`, wired `setEntityReadOnly`/`isConfigFileSource`, the
      `onHideFormatSelector` override from task 3, skipped the `getCoreRunner` compare-with-Core fetch,
      and branched the Application Properties schema resolve to `getResolvedRunnerSchema` (Core-direct,
      the same branch `AppRunners.tsx`/`ParametersTab.tsx` already use for Asset-origin runners) instead
      of `getResolvedApplicationScheme` (admin-BE) when config-file-sourced.
- [x] 8.6 `Breadcrumbs/utils.ts`'s config-file breadcrumb fix-up already reads
      `CONFIG_FILE_DETAIL_TO_LIST_ROUTE` generically, so task 8.1 alone covers
      `ApplicationRoute.ApplicationRunners` — no code change needed here, verified by a new test
      (task 9.3).

## 9. Tests for App Runners' new coverage (only if task 1 confirms)

- [x] 9.1 Component tests for the `application-runners/[id]/page.tsx` `configFile=true` branch (fetch
      source, read-only rendering) mirroring the existing `models/[id]/page.spec.tsx` coverage. Also
      added `ApplicationRunnersView/View.spec.tsx` covering the `onHideFormatSelector` wiring from 8.5.
- [x] 9.2 Component test for `Assets/Platform/AppRunners/PageList.tsx`'s new `ConfigFileListSwap` wiring
      (the swap lives in the new `PageList.tsx`, not `List.tsx`, matching the other six).
- [x] 9.3 Test for the breadcrumb fix-up covering `ApplicationRunners → PlatformAppRunners` (added to
      `Breadcrumbs/tests/utils.spec.ts`, which had no prior config-file-mode coverage for any route).

## 10. Update specs already covering config-file entity views

- [x] 10.1 Implementation now matches both delta specs (`config-file-entity-views`,
      `core-config-file-client`) written during planning — no divergence found during implementation, so
      no delta edits were needed. Folding into `openspec/specs/` itself happens at archive time.

## 11. Quality gate

- [x] 11.1 Ran `npm run typecheck` (clean) and `npm run lint` (clean after one prettier fix in
      `ApplicationRunners/View/View.tsx`). Every touched spec file was also run individually and passes.
      The full-coverage `npm run test` run was explicitly skipped at the user's request — not run this
      session.

## 12. Correct config-file detail navigation target (pre-archive review)

See design.md's D5. Config-file rows currently navigate to each entity's bare/"hidden" admin-grid
detail route, which renders that entity's write-capable admin `View.tsx` — never designed for a
config-file-sourced, platform-only entity. This retargets navigation and the `configFile=true`
fetch/render branch at the platform/asset route instead, and reverts the bare routes/Views.

- [x] 12.1 Swapped the `route` prop passed to `ConfigFileEntityList` in each of the 7 `PageList.tsx` files
      per D5's table: `Assets/Platform/Models/PageList.tsx` (`Models`→`PlatformModels`),
      `Assets/Platform/Interceptors/PageList.tsx` (`Interceptors`→`PlatformInterceptors`),
      `Assets/Platform/Routes/PageList.tsx` (`Routes`→`PlatformRoutes`),
      `Assets/Platform/Roles/PageList.tsx` (`Roles`→`PlatformRoles`),
      `Assets/Platform/AppRunners/PageList.tsx` (`ApplicationRunners`→`PlatformAppRunners`),
      `Assets/Apps/PageList.tsx` (`Applications`→`AssetsApplications`),
      `Assets/Toolsets/PageList.tsx` (`Toolsets`→`AssetsToolsets`).
- [x] 12.2 Added the `configFile` search-param branch to `platform-models/[id]/page.tsx`: fetches via
      the moved `getConfigFileModel` action when `configFile=true` instead of the normal asset fetch,
      passes `isConfigFileSource` to `Assets/Platform/Models/View`; wired that View's read-only
      behavior (`setEntityReadOnly`, `onHideFormatSelector`) the same way the bare `Models/View/View.tsx`
      used to.
- [x] 12.3 Same for `platform-interceptors/[id]/page.tsx` + `Assets/Platform/Interceptors/View`
      (moved `getConfigFileInterceptor`).
- [x] 12.4 Same for `platform-routes/[id]/page.tsx` + `Assets/Platform/Routes/View` (moved
      `getConfigFileRoute`).
- [x] 12.5 Same for `platform-roles/[id]/page.tsx` + `Assets/Platform/Roles/View` (moved
      `getConfigFileRole`).
- [x] 12.6 Same for `platform-app-runners/[id]/page.tsx` + `Assets/Platform/AppRunners/View`; added
      `getConfigFileAppRunner` to `platform-app-runners/actions.ts` (the bare route built this fetch
      inline rather than via a helper). This View already resolves its Application Properties schema
      Core-direct (`getResolvedRunnerSchema`) regardless of source, so no extra branch was needed there.
- [x] 12.7 Added the same branch to `assets-applications/[id]/page.tsx`'s existing `isPlatformBucket`
      branch (config-file entities are flat/platform-bucket) + `Assets/Platform/Applications/View`
      (`PlatformApplicationView`) — no new bucket branch or component; moved `getConfigFileApplication`
      to `assets-applications/actions.ts`. This View has no ADMIN|CORE format toggle at all, so only
      `setEntityReadOnly` wiring was needed, not `onHideFormatSelector`.
- [x] 12.8 Same for `assets-toolsets/[id]/page.tsx`'s `isPlatformBucket` branch +
      `Assets/Platform/Toolsets/View` (`PlatformToolsetView`); moved `getConfigFileToolset` to
      `assets-toolsets/actions.ts`. Same no-format-toggle note as 12.7.
- [x] 12.9 Reverted the bare routes/Views to admin-only: removed the `configFile` search param, the
      `isConfigFileSource` prop, and every branch it gated (config-file fetch, `onHideFormatSelector`,
      skipped Core-compare fetch) from `models/[id]/page.tsx`, `interceptors/[id]/page.tsx`,
      `routes/[id]/page.tsx`, `roles/[id]/page.tsx`, `applications/[id]/page.tsx`,
      `toolsets/[id]/page.tsx`, `application-runners/[id]/page.tsx`, and their `Models/View/View.tsx`,
      `Interceptors/View/View.tsx`, `Routes/View/View.tsx`, `Roles/View/View.tsx`,
      `Applications/View/View.tsx`, `Toolsets/View/View.tsx`, `ApplicationRunners/View/View.tsx` — each
      diffed against the pre-`add-config-file-entity-views` commit to confirm the revert was exact and
      touched nothing unrelated (each `View.tsx` keeps the `featureFlags` param its Audit-tab-visibility
      fix still needs; only the `isConfigFileSource`-gated branches were removed). Grep-verified no code
      outside `ConfigFileEntityList` and its own tests constructs a `<bare-route>/[id]?configFile=true`
      URL.
- [x] 12.10 Removed `CONFIG_FILE_DETAIL_TO_LIST_ROUTE` from `constants/config-file-entity-views.ts` and
      the `isConfigFileMode`/`listRouteOverride` branch from `components/Breadcrumbs/utils.ts` and
      `Breadcrumbs.tsx` (which dropped its now-unused `useSearchParams` read).
- [x] 12.11 Updated tests: the 7 `PageList.spec.tsx` files now assert the platform/asset `route` prop;
      added config-file-source coverage (`setEntityReadOnly`, `onHideFormatSelector` where the View has
      one) to the `Assets/Platform/{Models,Interceptors,Routes,Roles,AppRunners,Applications,Toolsets}`
      `View.spec.tsx` files; the moved `getConfigFile<Entity>` single-get actions gained test coverage
      in their new platform/asset `actions.spec.ts` files, mirroring the coverage removed from the bare
      `actions.spec.ts` files; removed the now-invalid `configFile`/`isConfigFileSource` coverage
      (bare-route `page.spec.tsx` files and bare `View.spec.tsx` files, all added solely for this by
      `add-config-file-entity-views` — deleted rather than reverted, since they tested nothing else);
      updated `Breadcrumbs/tests/utils.spec.ts` and `Breadcrumbs/tests/Breadcrumbs.spec.tsx` to drop the
      config-file-mode override cases. No `[id]/page.spec.tsx` files were added for the platform/asset
      pages themselves — consistent with this repo's existing convention that `page.tsx` route handlers
      are not unit-tested directly (none of the seven platform/asset `[id]/page.tsx` files had one
      before this change either); their fetch/render logic is covered via the actions and View tests
      above.
- [x] 12.12 Quality gate: `npm run typecheck` (clean) and targeted `vitest run` across every touched
      spec file (all pass). `npm run lint` and the full-coverage `npm run test` are left for the final
      quality gate before archiving.
