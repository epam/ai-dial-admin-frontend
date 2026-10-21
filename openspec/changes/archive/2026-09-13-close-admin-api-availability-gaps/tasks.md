## 1. Gate the per-entity Audit tab in `utils/tabs/utils.ts`

- [x] 1.1 Add a `featureFlags: FeatureFlags` parameter to `getRouteTabs`, `getApplicationTabs`,
      `getModelsTabs`, `getAdapterTabs`, `getAppRunnerTabs`, `getRoleTabs`, `getInterceptorTabs`,
      `getToolsetTabs`, `getInterceptorTemplateTabs`, and `getKeyTabs`; only push `auditTab(t)` when
      `featureFlags.adminApiEnabled` is `true`.
- [x] 1.2 Add the same `featureFlags` parameter to `getDeploymentsViewTabs` and gate its three
      `auditTab(t)` pushes (generic route, `Images`, `McpContainers`) the same way.
- [x] 1.3 In `getTabsForAsset`, change the `AssetsToolsets` and `PlatformModels` branches' guard from
      `featureFlags?.dashboardEnabled` to `featureFlags?.dashboardEnabled && featureFlags?.adminApiEnabled`
      before pushing `auditTab(t)`.
- [x] 1.4 Update `apps/ai-dial-admin/src/utils/tabs/tests/utils.spec.ts` (or the equivalent spec file)
      with cases covering: `adminApiEnabled: false` omits the Audit tab from each updated builder;
      `adminApiEnabled: true` preserves today's output; the `AssetsToolsets`/`PlatformModels` branches
      require both `dashboardEnabled` and `adminApiEnabled`.

## 2. Wire `featureFlags` into the tab-builder call sites

- [x] 2.1 In `components/Adapter/View/View.tsx`, `components/ApplicationRunners/View/View.tsx`,
      `components/Applications/View/View.tsx`, `components/Interceptors/View/View.tsx`,
      `components/InterceptorTemplates/View/View.tsx`, `components/Keys/View/View.tsx`,
      `components/Models/View/View.tsx`, `components/Roles/View/View.tsx`,
      `components/Routes/View/View.tsx`, and `components/Toolsets/View/View.tsx`, import
      `useAppContext` from `@/src/context/AppContext`, destructure `featureFlags`, and pass it into
      that view's `getXxxTabs(t, ...)` call (including the `toSpliced`/`setTabs` call sites in
      `Applications/View/View.tsx` that rebuild the list).
- [x] 2.2 In `components/Containers/View/ContainerView.tsx` (which already destructures
      `useAppContext()`) and `components/Images/View/ImageView.tsx`, pass `featureFlags` into their
      existing `getDeploymentsViewTabs(...)` calls.
- [x] 2.3 Checked existing component specs for the touched `View.tsx` files
      (`InterceptorTemplates/View/View.spec.tsx`, `Containers/View/tests/ContainerView.spec.tsx` — the
      only two with a top-level View spec): both mock away the Header component that actually renders
      `DialTabs`, so tab-list *content* is never asserted at the View level in this codebase's existing
      pattern — it's covered once, at its source, by the tab-builder unit tests (§1.4). No new View-level
      assertions added; global `useAppContext` mock in `test-setup.tsx` already defaults
      `adminApiEnabled: true`, so no existing test regressed (confirmed via the full suite in §4.1).

## 3. Skip admin-backend calls on Assets ▸ Applications when the admin API is unavailable

- [x] 3.1 In `apps/ai-dial-admin/src/app/[lang]/assets-applications/page.tsx`, skip the
      `applicationRunnersApi.getApplicationSchemesList(token)` call when
      `process.env.DIAL_ADMIN_API_URL` is unset, leaving `runners` as `[]` so
      `buildAppRunnerOptions` falls back to `assetRunners` alone.
- [x] 3.2 In `apps/ai-dial-admin/src/app/[lang]/assets-applications/[id]/page.tsx`, skip both
      `applicationRunnersApi.getApplicationSchemesList(token)` and
      `applicationsApi.getApplicationsList(token)` under the same condition, leaving
      `applicationSchemes` and `applications` as `[]`.
- [x] 3.3 Added `assets-applications/tests/admin-api-gating.spec.tsx` covering: `DIAL_ADMIN_API_URL`
      unset skips both admin-backend calls on the list and detail pages; `DIAL_ADMIN_API_URL` set
      preserves today's calls. Updated `runner-sources.spec.tsx` to `vi.stubEnv('DIAL_ADMIN_API_URL', …)`
      since its cases exercise the admin-BE read itself and previously relied on the (now-gated) call
      always firing.

## 4. Final quality checks

- [x] 4.1 Ran lint, typecheck, and the full coverage test run from `apps/ai-dial-admin/`. Lint and
      typecheck clean. Full suite: 1008/1008 test files, 11840/11856 tests passed (16 pre-existing
      skips), 0 failures. Found and fixed two regressions along the way: `getModelsList` had drifted
      inside the admin-API gate on the Assets Applications detail page (moved back outside — it's
      Core-direct) and `Assets/Platform/Models/tests/{tabs,view-tabs}.spec.ts(x)` needed
      `adminApiEnabled: true` added to their dashboard-enabled cases per the D2 both-flags gate.
