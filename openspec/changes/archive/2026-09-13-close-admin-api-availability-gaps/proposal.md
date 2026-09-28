## Why

PR #4516 (`2026-09-10-hide-ui-without-admin-api`) hid admin-backend-dependent UI and added a
redirect guard for the routes owned by the Entities/Builders/Access Management/Audit menu groups
when `DIAL_ADMIN_API_URL` is unset. Two admin-backend-dependent surfaces sit outside that guard's
reach and were missed:

1. The per-entity **Audit tab** (`EntityAudit`, added by `auditTab()`) is reachable on several
   surfaces that are gated by flags other than `adminApiEnabled` — Deployments (Containers, Images),
   Analytics (Pipelines, Tables), and Assets ▸ Platform Models / Toolsets (gated only by
   `dashboardEnabled`). On all of these, the tab's Activities pane calls `ActivityAuditApi`, which is
   built on `DIAL_ADMIN_API_URL` and fails when that variable is unset.
2. The Assets ▸ Applications list and detail pages (`assets-applications/page.tsx`,
   `assets-applications/[id]/page.tsx`) unconditionally call `applicationRunnersApi` and
   `applicationsApi` — both admin-backend clients — to build runner options and populate the
   Dependencies tab, even though this is otherwise a Core-direct surface with no other admin-API
   dependency.

## What Changes

- Gate the per-entity Audit tab on `featureFlags.adminApiEnabled` everywhere it is added
  (`utils/tabs/utils.ts`'s per-entity tab builders and `getTabsForAsset`'s `AssetsToolsets` /
  `PlatformModels` branches), so it disappears consistently with the top-nav Audit group whenever
  the admin API is unavailable — regardless of which other feature flag (`dashboardEnabled`,
  `deploymentsEnabled`, evaluation/analytics flags) governs the surface it lives on.
- Thread `featureFlags` into the ~10 client `View.tsx` components that build their tab list via
  those builders but don't currently read `useAppContext()`.
- Skip the `applicationRunnersApi.getApplicationSchemesList` and `applicationsApi.getApplicationsList`
  calls on the Assets ▸ Applications list and detail server pages when
  `process.env.DIAL_ADMIN_API_URL` is unset, falling back to the Core-direct data
  (`assetRunners`/`getModelsList`/`readConfigEntities`) the pages already fetch.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `admin-api-availability`: adds a requirement that the per-entity Audit tab and the Assets ▸
  Applications admin-backend enrichment calls are also gated on `adminApiEnabled` /
  `DIAL_ADMIN_API_URL`, extending the existing menu/footer/redirect-guard requirements to these two
  surfaces the original change missed.

## Impact

- `apps/ai-dial-admin/src/utils/tabs/utils.ts` — `getRouteTabs`, `getApplicationTabs`,
  `getModelsTabs`, `getAdapterTabs`, `getAppRunnerTabs`, `getRoleTabs`, `getInterceptorTabs`,
  `getToolsetTabs`, `getInterceptorTemplateTabs`, `getKeyTabs`, `getDeploymentsViewTabs`,
  `getTabsForAsset`.
- ~11 `View.tsx` components (`Adapter`, `ApplicationRunners`, `Applications`, `Containers`,
  `Images`, `Interceptors`, `InterceptorTemplates`, `Keys`, `Models`, `Roles`, `Routes`,
  `Toolsets`) — wiring `featureFlags` from `useAppContext()` into their tab-builder call.
- `apps/ai-dial-admin/src/app/[lang]/assets-applications/page.tsx` and
  `apps/ai-dial-admin/src/app/[lang]/assets-applications/[id]/page.tsx`.
- No change to `assets-toolsets/page.tsx` or `assets-toolsets/[id]/page.tsx` — already free of
  admin-API calls.
- No backend/API contract changes; no new environment variables.

## Non-goals

- Splitting `EntityAudit`'s sidebar into independently-gated sub-panes (e.g. hiding only Activities
  while keeping Dashboard/Traces visible) — the whole Audit tab is hidden as one unit, matching how
  the top-nav Audit group is already hidden as a whole.
- Changing behavior for the entities whose routes are already redirect-guarded when the admin API is
  unavailable (Models, Applications, Roles, Keys, Interceptors, InterceptorTemplates, Adapters,
  ApplicationRunners, Routes, Toolsets) — their Audit tab is currently unreachable either way; this
  change gates it there too only for defense-in-depth and consistency, not because it fixes an
  observable bug on those routes.
- Any change to `assets-toolsets` — investigation confirmed both its list and detail pages are
  already free of admin-backend calls.
