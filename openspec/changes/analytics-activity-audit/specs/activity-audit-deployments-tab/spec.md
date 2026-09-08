## MODIFIED Requirements

### Requirement: A single unified resolver loads activity audit detail for every page

The codebase SHALL contain exactly one audit-detail resolver, located at
`apps/ai-dial-admin/src/utils/audit/get-activity-audit-detail-data.ts`, exporting
`getActivityAuditDetailData(activityId, token): Promise<ActivityAuditDetailData>`. Every audit detail
page SHALL import from this module:

- the global `/activity-audit/[id]/page.tsx`
- the 6 deployment entity-namespaced `[subId]/page.tsx` wrappers (Model Servings, MCP / Adapter /
  Application / Interceptor Containers, Deployment Images)
- the 10 admin entity-namespaced `[subId]/page.tsx` pages (Models, Adapters, Applications,
  Interceptors, Roles, Keys, Routes, Toolsets, ApplicationRunners, InterceptorTemplates)

The resolver SHALL try `activityAuditApi.getActivityById` first, fall back to
`deploymentAuditApi.getActivityById`, and then — only when the analytics feature is enabled in the
environment it runs in — fall back to `analyticsAuditApi.getActivityById`. It SHALL dispatch via
`pickActivityHandlers` to admin / image / firewall / container / analytics handlers, and fetch the
current revision, previous revision, and the entity-context snapshot in parallel via `Promise.all`.
It SHALL return `{ activity, activityRevision, previousRevision, entity }`.

The legacy admin-only resolver at `apps/ai-dial-admin/src/utils/audit/get-audit-activity-data.ts`
SHALL be deleted, and the prior route-folder resolver
`apps/ai-dial-admin/src/app/[lang]/activity-audit/[id]/resolver.ts` SHALL no longer exist.

#### Scenario: Global detail page uses the unified resolver

- **GIVEN** the codebase after this change
- **WHEN** the global `/activity-audit/[id]/page.tsx` file is read
- **THEN** its activity resolution import resolves to `@/src/utils/audit/get-activity-audit-detail-data`
- **AND** the prior `apps/ai-dial-admin/src/app/[lang]/activity-audit/[id]/resolver.ts` file no longer exists

#### Scenario: Deployment entity-namespaced pages use the unified resolver

- **GIVEN** any of the 6 deployment `[subId]/page.tsx` files
- **WHEN** the file is read
- **THEN** its activity resolution import resolves to `@/src/utils/audit/get-activity-audit-detail-data`
- **AND** the page renders `<AuditView ... isEntityActivity />` with the resolved `{ activity, activityRevision, previousRevision, entity }`

#### Scenario: Admin entity-namespaced pages use the unified resolver

- **GIVEN** any of the 10 admin `[subId]/page.tsx` files (Models, Adapters, Applications, Interceptors, Roles, Keys, Routes, Toolsets, ApplicationRunners, InterceptorTemplates)
- **WHEN** the file is read
- **THEN** its activity resolution import resolves to `@/src/utils/audit/get-activity-audit-detail-data`
- **AND** the legacy `getAuditActivityData` symbol from `@/src/utils/audit/get-audit-activity-data` is no longer referenced anywhere in the codebase

#### Scenario: Admin audit-detail load benefits from parallel revision fetches

- **GIVEN** an admin audit-detail page is opened (e.g. `/models/<id>/<activityId>`)
- **WHEN** the resolver runs
- **THEN** the current revision, previous revision, and activities list are fetched concurrently via `Promise.all` rather than sequentially

#### Scenario: The analytics fallback is the last step and is skipped when the feature is off

- **GIVEN** an activity the admin backend resolves
- **WHEN** the resolver runs
- **THEN** neither the deployment-manager nor the analytics lookup is issued
- **AND** when neither existing backend resolves the activity and the analytics feature is disabled, no analytics lookup is issued either

### Requirement: `ActivityAuditList` accepts a `viewMode` prop that fixes the fetcher and hides the toggle

The `ActivityAuditList` component SHALL accept an optional `viewMode?: ActivityAuditView` prop. When
the prop is provided, the component SHALL:

- Use the supplied mode to select the fetcher and the column set from the single per-view lookup that
  every view is resolved through (`Deployments` → `getDeploymentActivities`, `Config` →
  `getActivities`, `Analytics` → `getAnalyticsActivities`).
- Hide the view-type dropdown.
- Ignore any internal state transitions of the view-type radio.

When the prop is omitted, the component's behavior SHALL be unchanged from the existing global
activity-audit page (local view-type state initialized to `Config`, dropdown rendered when no entity
is present).

#### Scenario: viewMode forces deployment-manager fetcher

- **GIVEN** `ActivityAuditList` is rendered with `viewMode={ActivityAuditView.Deployments}`
- **WHEN** AG Grid requests a row block
- **THEN** the datasource invokes `getDeploymentActivities`
- **AND** the `View` dropdown is not rendered

#### Scenario: viewMode forces the analytics fetcher

- **GIVEN** `ActivityAuditList` is rendered with `viewMode={ActivityAuditView.Analytics}`
- **WHEN** AG Grid requests a row block
- **THEN** the datasource invokes `getAnalyticsActivities`
- **AND** the `View` dropdown is not rendered

#### Scenario: Omitting viewMode preserves global page behavior

- **GIVEN** `ActivityAuditList` is rendered on `/activity-audit` with no `viewMode` prop and no `entity` prop
- **WHEN** the page loads
- **THEN** the `View` dropdown is rendered with `Config` and `Deployments`, plus `Analytics` when the analytics feature is enabled
- **AND** the initial fetcher is `getActivities` (Config view default)
