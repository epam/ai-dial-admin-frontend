# admin-api-availability Specification

## Purpose
The `adminApiEnabled` feature flag itself, the menu-action visibility it gates (Import/Export
config), the Footer/status-polling suppression, and the direct-URL redirect guard for every route
owned by the groups and actions the admin backend alone supports. Exists because the admin backend
(`ai-dial-admin-backend`) is being phased out, and deployments that stop configuring
`DIAL_ADMIN_API_URL` need those unsupported surfaces hidden rather than rendering broken pages or
issuing calls to a host that no longer exists. Menu-group visibility itself is covered by
`menu-group-visibility`.

## Requirements

### Requirement: `adminApiEnabled` feature flag reflects `DIAL_ADMIN_API_URL` presence

The system SHALL expose an `adminApiEnabled: boolean` field on the `FeatureFlags` object, computed at request time in the root layout as `process.env.DIAL_ADMIN_API_URL != null`.

#### Scenario: Flag is true when the env var is set

- **WHEN** `process.env.DIAL_ADMIN_API_URL` is set to any non-null value and the root layout
  initializes `FeatureFlags`
- **THEN** `featureFlags.adminApiEnabled` is `true`

#### Scenario: Flag is false when the env var is unset

- **WHEN** `process.env.DIAL_ADMIN_API_URL` is unset
- **THEN** `featureFlags.adminApiEnabled` is `false`

### Requirement: Import/Export config menu actions are hidden without the admin API

The Menu content SHALL render the "Import config" and "Export config" actions (in both the expanded actions bar and the collapsed `MenuActions` bar) only when `featureFlags.adminApiEnabled` is `true`. The "System properties" action MUST NOT be affected by this flag. The Home page (`WelcomeView`) quick-actions row SHALL apply the same `featureFlags.adminApiEnabled` gate to its own "Import config" and "Export config" buttons, in addition to its existing read-only-admin check.

#### Scenario: Admin API disabled hides Import/Export actions

- **WHEN** `featureFlags.adminApiEnabled` is `false`
- **THEN** neither the "Import config" nor "Export config" action is rendered in the menu
- **AND** "System properties" is still rendered

#### Scenario: Admin API enabled shows Import/Export actions

- **WHEN** `featureFlags.adminApiEnabled` is `true`
- **THEN** both "Import config" and "Export config" actions are rendered in the menu

#### Scenario: Admin API disabled hides Import/Export quick actions on the Home page

- **WHEN** `featureFlags.adminApiEnabled` is `false`
- **AND** the user is not a read-only admin
- **THEN** neither the "Import config" nor "Export config" quick-action button is rendered on the Home page
- **AND** "System properties" is still rendered

#### Scenario: Admin API enabled shows Import/Export quick actions on the Home page

- **WHEN** `featureFlags.adminApiEnabled` is `true`
- **AND** the user is not a read-only admin
- **THEN** both "Import config" and "Export config" quick-action buttons are rendered on the Home page

### Requirement: Footer and its polling are suppressed without the admin API

The `Content` component SHALL NOT render the `Footer`, and SHALL NOT start the `checkAppStatus` / `checkCoreVersion` polling intervals (nor issue their initial calls), when `featureFlags.adminApiEnabled` is `false`. Both actions call the admin backend, which is unreachable without `DIAL_ADMIN_API_URL`.

#### Scenario: Admin API disabled hides Footer and stops polling

- **WHEN** `featureFlags.adminApiEnabled` is `false`
- **THEN** the Footer is absent from the page
- **AND** `getAppProcessStatus` and `getCoreVersions` are never called

#### Scenario: Admin API enabled renders Footer and polling as today

- **WHEN** `featureFlags.adminApiEnabled` is `true`
- **THEN** the Footer renders
- **AND** `checkAppStatus` and `checkCoreVersion` run on mount and on their existing intervals

### Requirement: Direct navigation to admin-API-only routes redirects home

The system SHALL redirect to `ApplicationRoute.Home`, before issuing any admin-backend request, when `process.env.DIAL_ADMIN_API_URL` is unset and a user navigates directly to any route owned exclusively by the Entities group (`/models`, `/applications`, `/interceptors`, `/toolsets`, `/routes`), the Builders group (`/adapters`, `/application-runners`, `/interceptor-templates`), the Access Management group (`/roles`, `/keys`), the Audit group (`/activity-audit`, `/dashboard`, `/usage-log`), or the Import/Export actions (`/import-config`, `/export-config`) — including every `[id]` and `[id]/[subId]` sub-route under them — **except** the `[id]` detail route of `/models`, `/applications`, `/interceptors`, `/routes`, `/roles`, and `/toolsets`, which SHALL render instead of redirecting when the request carries a `configFile=true` query parameter, per `config-file-entity-views`.

#### Scenario: Bookmarked entity URL redirects when the admin API is disabled

- **WHEN** a user navigates directly to `/<lang>/models`, `/<lang>/models/<id>`, `/<lang>/roles`, `/<lang>/import-config`, or any other route listed above
- **AND** `DIAL_ADMIN_API_URL` is unset
- **THEN** the server issues a redirect to `ApplicationRoute.Home`
- **AND** no admin-backend call is made for that page

#### Scenario: Routes render normally when the admin API is enabled

- **WHEN** a user navigates to any of those routes
- **AND** `DIAL_ADMIN_API_URL` is set
- **THEN** the page renders as it does today

#### Scenario: A covered detail route with `configFile=true` renders instead of redirecting

- **WHEN** `DIAL_ADMIN_API_URL` is unset
- **AND** a user navigates to `/<lang>/models/<id>?configFile=true` (or the equivalent `/applications/<id>`, `/interceptors/<id>`, `/routes/<id>`, `/roles/<id>`, or `/toolsets/<id>` route)
- **THEN** the server does not redirect, and the page renders the config-file-sourced entity read-only

#### Scenario: The same detail route without the query flag still redirects

- **WHEN** `DIAL_ADMIN_API_URL` is unset
- **AND** a user navigates to `/<lang>/models/<id>` with no `configFile` query parameter
- **THEN** the server issues a redirect to `ApplicationRoute.Home`, unchanged from before this change

#### Scenario: Keys and App Runners are unaffected

- **WHEN** `DIAL_ADMIN_API_URL` is unset and a user navigates to `/<lang>/keys/<id>` or `/<lang>/application-runners/<id>` with any query parameters
- **THEN** the server redirects to `ApplicationRoute.Home`, since neither route is part of the `configFile=true` exception

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
