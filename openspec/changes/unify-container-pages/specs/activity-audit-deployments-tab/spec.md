## MODIFIED Requirements

### Requirement: Audit tab appears on container deployment edit pages

The deployment edit page tab set returned by `getDeploymentsViewTabs` SHALL include an Audit tab, positioned last, for the following routes: `ApplicationRoute.ModelServings`, `ApplicationRoute.McpContainers`, `ApplicationRoute.AdapterContainers`, `ApplicationRoute.ApplicationContainers`, `ApplicationRoute.InterceptorContainers`. The tab SHALL use the existing `auditTab(t)` factory and the label resolved from `TabsI18nKey.Audit`. Read-only admins SHALL be able to open the tab and read its contents (no write actions are exposed on it).

#### Scenario: Model Servings edit page exposes Audit tab

- **WHEN** a user opens a Model Serving at `/model-servings/[id]`
- **THEN** the page's top-level tab bar includes an `Audit` tab as the last tab
- **AND** clicking the tab activates it without errors

#### Scenario: MCP / Adapter / Application / Interceptor Containers edit pages expose Audit tab

- **WHEN** a user opens any container edit page (`/containers/[id]`) of type MCP, Adapter, Application or Interceptor
- **THEN** the page's top-level tab bar includes an `Audit` tab as the last tab

#### Scenario: Read-only admin can view Audit tab

- **WHEN** a read-only admin user opens any container deployment edit page
- **THEN** the `Audit` tab is enabled and selectable
- **AND** selecting it shows the Activities list without write actions

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
- **THEN** the application navigates to `/containers/<container-name>/<activityId>` for every container type (MCP, Adapter, Application, Interceptor)

#### Scenario: Click on a Deployment Image audit row opens the image-namespaced page

- **GIVEN** the Audit tab on a Deployment Image shows one or more activities
- **WHEN** the user clicks an activity row
- **THEN** the application navigates to `/deployment-images/<image-name>/<activityId>`

#### Scenario: `getAuditActivityHref` resolves the route via the existing map

- **GIVEN** an activity row's `resourceType` is any audit resource type registered in `auditResourceRoute`
- **WHEN** `getAuditActivityHref(entity, resourceType, activityId)` is called
- **THEN** the function returns `${getUrnForEntity(auditResourceRoute[resourceType], entity)}/${encodeURIComponent(activityId)}`
- **AND** the function does NOT use a hardcoded switch statement to map types to routes
