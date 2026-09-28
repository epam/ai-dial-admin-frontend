## ADDED Requirements

### Requirement: The per-entity Audit tab is hidden without the admin API

The system SHALL omit the per-entity Audit tab whenever `featureFlags.adminApiEnabled` is `false`, wherever that tab is added (`auditTab()` in `getRouteTabs`, `getApplicationTabs`, `getModelsTabs`, `getAdapterTabs`, `getAppRunnerTabs`, `getRoleTabs`, `getInterceptorTabs`, `getToolsetTabs`, `getInterceptorTemplateTabs`, `getKeyTabs`, `getDeploymentsViewTabs`, and the `AssetsToolsets`/`PlatformModels` branches of `getTabsForAsset`), regardless of the state of any other feature flag that governs the surface it appears on (`dashboardEnabled`, `deploymentsEnabled`, or an evaluation/analytics flag) and independent of whether the surface's own route is already redirect-guarded by the existing admin-API route guard.

#### Scenario: Admin API disabled hides the Audit tab on a redirect-guarded entity

- **WHEN** `featureFlags.adminApiEnabled` is `false`
- **AND** a Models, Applications, Routes, Roles, Keys, Interceptors, InterceptorTemplates, Adapters,
  ApplicationRunners, or Toolsets entity view renders its tab list
- **THEN** the Audit tab is absent from that tab list

#### Scenario: Admin API disabled hides the Audit tab on Deployments Containers and Images

- **WHEN** `featureFlags.adminApiEnabled` is `false`
- **AND** `featureFlags.deploymentsEnabled` is `true`
- **AND** a Deployments Containers or Images entity view renders its tab list
- **THEN** the Audit tab is absent from that tab list

#### Scenario: Admin API disabled hides the Audit tab on Assets Platform Models and Toolsets

- **WHEN** `featureFlags.adminApiEnabled` is `false`
- **AND** `featureFlags.dashboardEnabled` is `true`
- **AND** an Assets ▸ Platform Models or Assets ▸ Toolsets entity view renders its tab list
- **THEN** the Audit tab is absent from that tab list

#### Scenario: Admin API enabled leaves the Audit tab unaffected

- **WHEN** `featureFlags.adminApiEnabled` is `true`
- **THEN** each entity view's Audit tab renders exactly as it does today, governed only by that
  view's own other feature-flag checks (if any)

### Requirement: Assets ▸ Applications list and detail pages skip admin-backend calls without the admin API

The Assets ▸ Applications list page (`assets-applications/page.tsx`) and detail page (`assets-applications/[id]/page.tsx`) SHALL NOT call `applicationRunnersApi.getApplicationSchemesList` or `applicationsApi.getApplicationsList` when `process.env.DIAL_ADMIN_API_URL` is unset, and SHALL still render using their Core-direct data (`assetRunners`, `getModelsList`, `getApps`/`getPlatformApplication`, `readConfigEntities`), with `applicationSchemes`/`applications` resolving to an empty list.

#### Scenario: Admin API disabled skips admin-backend calls on the Assets Applications list page

- **WHEN** `process.env.DIAL_ADMIN_API_URL` is unset
- **AND** a user navigates to the Assets ▸ Applications list page
- **THEN** `applicationRunnersApi.getApplicationSchemesList` is never called
- **AND** the page renders using only Core-direct runner options

#### Scenario: Admin API disabled skips admin-backend calls on the Assets Applications detail page

- **WHEN** `process.env.DIAL_ADMIN_API_URL` is unset
- **AND** a user navigates to an Assets ▸ Applications detail page
- **THEN** neither `applicationRunnersApi.getApplicationSchemesList` nor
  `applicationsApi.getApplicationsList` is called
- **AND** the page renders with `applicationSchemes` and `applications` as empty lists

#### Scenario: Admin API enabled preserves existing Assets Applications behavior

- **WHEN** `process.env.DIAL_ADMIN_API_URL` is set
- **THEN** the Assets ▸ Applications list and detail pages call the admin-backend APIs and render as
  they do today
