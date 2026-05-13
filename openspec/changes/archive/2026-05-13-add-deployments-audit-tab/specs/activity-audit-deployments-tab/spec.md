## ADDED Requirements

### Requirement: Audit tab appears on container deployment edit pages

The deployment edit page tab set returned by `getDeploymentsViewTabs` SHALL include an Audit tab, positioned last, for the following routes: `ApplicationRoute.ModelServings`, `ApplicationRoute.McpContainers`, `ApplicationRoute.AdapterContainers`, `ApplicationRoute.ApplicationContainers`, `ApplicationRoute.InterceptorContainers`. The tab SHALL use the existing `auditTab(t)` factory and the label resolved from `TabsI18nKey.Audit`. Read-only admins SHALL be able to open the tab and read its contents (no write actions are exposed on it).

#### Scenario: Model Servings edit page exposes Audit tab

- **WHEN** a user opens a Model Serving at `/model-servings/[id]`
- **THEN** the page's top-level tab bar includes an `Audit` tab as the last tab
- **AND** clicking the tab activates it without errors

#### Scenario: MCP / Adapter / Application / Interceptor Containers edit pages expose Audit tab

- **WHEN** a user opens any container edit page (`/mcp-containers/[id]`, `/adapter-containers/[id]`, `/application-containers/[id]`, `/interceptor-containers/[id]`)
- **THEN** the page's top-level tab bar includes an `Audit` tab as the last tab

#### Scenario: Read-only admin can view Audit tab

- **WHEN** a read-only admin user opens any container deployment edit page
- **THEN** the `Audit` tab is enabled and selectable
- **AND** selecting it shows the Activities list without write actions

### Requirement: Audit tab appears on the Deployment Images edit page

The image edit page tab set SHALL include an Audit tab, positioned last, for `ApplicationRoute.Images`. The tab SHALL use the existing `auditTab(t)` factory and the label resolved from `TabsI18nKey.Audit`.

#### Scenario: Deployment Image edit page exposes Audit tab

- **WHEN** a user opens an image at `/deployment-images/[id]`
- **THEN** the page's top-level tab bar includes an `Audit` tab as the last tab
- **AND** clicking the tab activates it without errors

### Requirement: Deployment Audit tab renders only the Activities sub-tab

When opened on a container deployment or Deployment Image edit page, the Audit tab SHALL render the existing `EntityAudit` component with a single inner tab — `Activities` — selected by default. The Dashboard, Traces, and Conversations sub-tabs SHALL NOT be rendered for these routes regardless of the `dashboardEnabled` feature flag.

#### Scenario: Single Activities sub-tab on container Audit tab

- **WHEN** a user opens the Audit tab on any container deployment edit page
- **THEN** the inner sidebar shows exactly one tab labelled `Activities`
- **AND** the `Activities` tab is active by default
- **AND** no `Dashboard`, `Traces`, or `Conversations` sub-tabs are rendered

#### Scenario: `dashboardEnabled=true` does not add deployment Dashboard sub-tab

- **GIVEN** `featureFlags.dashboardEnabled === true`
- **WHEN** a user opens the Audit tab on a Model Serving edit page
- **THEN** only the `Activities` sub-tab is rendered

### Requirement: Activities list is filtered to this entity's resource type and ID

The Activities list rendered inside the Audit tab SHALL filter activities by `(resourceType, resourceId)` for the entity currently open. The `resourceId` SHALL be sourced from the container or image entity in the same way the global Deployments view does (the `Container.name` field for containers). The `resourceType` SHALL be resolved per-instance via a `CONTAINER_TYPE_TO_AUDIT` mapping keyed by the entity's `$type` discriminator, and SHALL select exactly one `ActivityAuditResourceType` value.

The mapping SHALL contain at minimum:

- `CONTAINER_TYPE.MCP` → `ActivityAuditResourceType.MCP_DEPLOYMENT`
- `CONTAINER_TYPE.NIM` → `ActivityAuditResourceType.NIM_DEPLOYMENT`
- `CONTAINER_TYPE.HF` → `ActivityAuditResourceType.INFERENCE_DEPLOYMENT`
- `CONTAINER_TYPE.ADAPTER` → `ActivityAuditResourceType.ADAPTER_DEPLOYMENT`
- `CONTAINER_TYPE.APPLICATION` → `ActivityAuditResourceType.APPLICATION_DEPLOYMENT`
- `CONTAINER_TYPE.INTERCEPTOR` → `ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT`

For the Deployment Images route, the per-instance resolution SHALL map the image entity's `$type` discriminator to the corresponding `*_IMAGE_DEFINITION` audit resource type.

#### Scenario: NIM Model Serving filters by NIM_DEPLOYMENT

- **GIVEN** a Model Serving with `container.$type === CONTAINER_TYPE.NIM` and `container.name === "gpt-4-turbo"`
- **WHEN** the Audit tab is opened
- **THEN** the Activities list datasource request includes filters `{ column: "resourceType", value: "NimDeployment", operator: "eq" }` and `{ column: "resourceId", value: "gpt-4-turbo", operator: "eq" }`

#### Scenario: Inference Model Serving filters by INFERENCE_DEPLOYMENT

- **GIVEN** a Model Serving with `container.$type === CONTAINER_TYPE.HF` and `container.name === "llama-3"`
- **WHEN** the Audit tab is opened
- **THEN** the Activities list datasource request includes a filter `{ column: "resourceType", value: "InferenceDeployment", operator: "eq" }`
- **AND** the list does NOT include activities whose `resourceType` is `NimDeployment`

#### Scenario: MCP Container filters by MCP_DEPLOYMENT

- **GIVEN** an MCP Container with `container.$type === CONTAINER_TYPE.MCP`
- **WHEN** the Audit tab is opened
- **THEN** the Activities list datasource request includes a filter `{ column: "resourceType", value: "McpDeployment", operator: "eq" }`

#### Scenario: Adapter / Application / Interceptor Containers filter by their respective audit types

- **GIVEN** a container with `$type` of `'adapter'`, `'application'`, or `'interceptor'`
- **WHEN** the Audit tab is opened
- **THEN** the Activities list datasource request filters by `AdapterDeployment`, `ApplicationDeployment`, or `InterceptorDeployment` respectively

### Requirement: Activities list calls the deployment-manager backend

When rendered inside the Audit tab of a container deployment or Deployment Image edit page, `ActivityAuditList` SHALL invoke `getDeploymentActivities` (the deployment-manager backend) for every datasource page request, regardless of feature-flag or session-state defaults. It SHALL NOT call `getActivities` (the admin backend) in this context.

#### Scenario: Datasource uses deployment-manager fetcher

- **WHEN** the Audit tab is opened on any container deployment edit page and AG Grid requests the first row block
- **THEN** the request is forwarded to `getDeploymentActivities`
- **AND** the request is NOT forwarded to `getActivities`

#### Scenario: Pagination on the deployment audit list keeps using the deployment fetcher

- **GIVEN** the Audit tab is open on a container deployment edit page
- **WHEN** AG Grid requests a subsequent page
- **THEN** the next call also targets `getDeploymentActivities` with the incremented `pageNumber`

### Requirement: View-type selector is hidden inside the entity Audit tab

The `Config / Deployments / Asset` view-type dropdown rendered above the global activity-audit grid SHALL NOT be visible when `ActivityAuditList` is rendered inside an entity's Audit tab. The fetcher selection is fixed by the caller via the `viewMode` prop and not user-toggleable from this surface.

#### Scenario: View selector not rendered in entity context

- **WHEN** a user opens the Audit tab on any container deployment edit page
- **THEN** the `View` dropdown showing `Config / Deployments / Asset` options is not rendered
- **AND** the user cannot switch the fetcher selection

### Requirement: Row click navigates to an entity-namespaced detail page

Clicking a row in the deployment Audit tab's Activities list SHALL navigate the user to an entity-namespaced detail URL `/<route>/<entityName>/<activityId>`, mirroring how admin entities (Models, Adapters, Roles, etc.) link from their Audit tab.

The destination URL pattern SHALL be produced by `getAuditActivityHref`, which SHALL resolve the route via a lookup in the existing `auditResourceRoute` map (covering admin, container deployment, image-definition, and system-properties resource types). The hardcoded resource-type switch previously in `getAuditActivityHref` SHALL be removed.

The destination page SHALL be a thin wrapper that loads the activity and revisions via the shared deployment resolver (see "Deployment audit resolver is shared between global and entity-namespaced pages") and renders `<AuditView ... isEntityActivity />`, matching the admin per-entity audit detail page contract.

#### Scenario: Click on a Model Serving audit row opens the entity-namespaced detail page

- **GIVEN** the Audit tab on a Model Serving (`container.name === "gpt-4-turbo"`) shows one or more activities
- **WHEN** the user clicks an activity row with `activityId === "abc-123"`
- **THEN** the application navigates to `/model-servings/gpt-4-turbo/abc-123`

#### Scenario: Click on an MCP / Adapter / Application / Interceptor Container audit row opens the corresponding entity-namespaced page

- **GIVEN** the Audit tab on any container deployment shows one or more activities
- **WHEN** the user clicks an activity row
- **THEN** the application navigates to `/<container-route>/<container-name>/<activityId>` where `<container-route>` is the path for that container type (`mcp-containers`, `adapter-containers`, `application-containers`, `interceptor-containers`)

#### Scenario: Click on a Deployment Image audit row opens the image-namespaced page

- **GIVEN** the Audit tab on a Deployment Image shows one or more activities
- **WHEN** the user clicks an activity row
- **THEN** the application navigates to `/deployment-images/<image-name>/<activityId>`

#### Scenario: `getAuditActivityHref` resolves the route via the existing map

- **GIVEN** an activity row's `resourceType` is any audit resource type registered in `auditResourceRoute`
- **WHEN** `getAuditActivityHref(entity, resourceType, activityId)` is called
- **THEN** the function returns `${getUrnForEntity(auditResourceRoute[resourceType], entity)}/${encodeURIComponent(activityId)}`
- **AND** the function does NOT use a hardcoded switch statement to map types to routes

### Requirement: A single unified resolver loads activity audit detail for every page

The codebase SHALL contain exactly one audit-detail resolver, located at `apps/ai-dial-admin/src/utils/audit/get-activity-audit-detail-data.ts`, exporting `getActivityAuditDetailData(activityId, token): Promise<ActivityAuditDetailData>`. Every audit detail page SHALL import from this module:

- the global `/activity-audit/[id]/page.tsx`
- the 6 deployment entity-namespaced `[subId]/page.tsx` wrappers (Model Servings, MCP / Adapter / Application / Interceptor Containers, Deployment Images)
- the 10 admin entity-namespaced `[subId]/page.tsx` pages (Models, Adapters, Applications, Interceptors, Roles, Keys, Routes, Toolsets, ApplicationRunners, InterceptorTemplates)

The resolver SHALL try `activityAuditApi.getActivityById` first and fall back to `deploymentAuditApi.getActivityById`, dispatch via `pickActivityHandlers` to admin / image / firewall / container handlers, and fetch the current revision, previous revision, and the entity-context snapshot in parallel via `Promise.all`. It SHALL return `{ activity, activityRevision, previousRevision, entity }`.

The legacy admin-only resolver at `apps/ai-dial-admin/src/utils/audit/get-audit-activity-data.ts` SHALL be deleted, and the prior route-folder resolver `apps/ai-dial-admin/src/app/[lang]/activity-audit/[id]/resolver.ts` SHALL no longer exist.

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

### Requirement: Empty state when entity has no audit history

When `getDeploymentActivities` returns zero rows for the filtered `(resourceType, resourceId)` pair, the Activities list SHALL display the existing empty-state used by AG Grid in this component (no errors, no spinners after the initial load). The Audit tab SHALL remain selectable and the user SHALL be able to navigate away normally.

#### Scenario: Newly created container with no audit events

- **GIVEN** a deployment entity that has just been created and has no audit revisions
- **WHEN** the user opens the Audit tab
- **THEN** the grid shows the empty-state without error
- **AND** the tab remains usable

### Requirement: Time-period filter is preserved across deployment Audit tabs

The Audit tab SHALL render the same time-period filter currently used by `EntityAudit` for admin entities, initialized to `DEFAULT_TIME_PERIOD`. Changing the time range SHALL re-fetch the Activities list with the new range, using `getDeploymentActivities`.

#### Scenario: Time range change triggers refetch with deployment fetcher

- **GIVEN** the Audit tab is open on a container deployment edit page
- **WHEN** the user changes the time-period filter
- **THEN** the next datasource call to `getDeploymentActivities` includes the updated time range

### Requirement: `ActivityAuditList` accepts a `viewMode` prop that fixes the fetcher and hides the toggle

The `ActivityAuditList` component SHALL accept an optional `viewMode?: ActivityAuditView` prop. When the prop is provided, the component SHALL:

- Use the supplied mode for fetcher selection (`Deployments` → `getDeploymentActivities`, `Config` → `getActivities`) and for column-set selection.
- Hide the `Config / Deployments / Asset` view-type dropdown.
- Ignore any internal state transitions of the view-type radio.

When the prop is omitted, the component's behavior SHALL be unchanged from the existing global activity-audit page (local view-type state initialized to `Config`, dropdown rendered when no entity is present).

#### Scenario: viewMode forces deployment-manager fetcher

- **GIVEN** `ActivityAuditList` is rendered with `viewMode={ActivityAuditView.Deployments}`
- **WHEN** AG Grid requests a row block
- **THEN** the datasource invokes `getDeploymentActivities`
- **AND** the `View` dropdown is not rendered

#### Scenario: Omitting viewMode preserves global page behavior

- **GIVEN** `ActivityAuditList` is rendered on `/activity-audit` with no `viewMode` prop and no `entity` prop
- **WHEN** the page loads
- **THEN** the `View` dropdown is rendered with `Config / Deployments / Asset`
- **AND** the initial fetcher is `getActivities` (Config view default)
