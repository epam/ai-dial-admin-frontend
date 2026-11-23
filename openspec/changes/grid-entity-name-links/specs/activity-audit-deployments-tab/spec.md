## MODIFIED Requirements

### Requirement: Row click navigates to an entity-namespaced detail page

The Activity ID link of a row in the deployment Audit tab's Activities list SHALL open, in a new browser tab, an entity-namespaced detail URL `/<route>/<entityName>/<activityId>`, mirroring how admin entities (Models, Adapters, Roles, etc.) link from their Audit tab.

The destination URL pattern SHALL be produced by `getAuditActivityHref`, which SHALL resolve the route via a lookup in the existing `auditResourceRoute` map (covering admin, container deployment, image-definition, and system-properties resource types). The hardcoded resource-type switch previously in `getAuditActivityHref` SHALL be removed.

The destination page SHALL be a thin wrapper that loads the activity and revisions via the shared deployment resolver (see "Deployment audit resolver is shared between global and entity-namespaced pages") and renders `<AuditView ... isEntityActivity />`, matching the admin per-entity audit detail page contract.

#### Scenario: Click on a Model Serving audit row opens the entity-namespaced detail page

- **GIVEN** the Audit tab on a Model Serving (`container.name === "gpt-4-turbo"`) shows one or more activities
- **WHEN** the user clicks the Activity ID link of the row with `activityId === "abc-123"`
- **THEN** `/model-servings/gpt-4-turbo/abc-123` opens

#### Scenario: Click on an MCP / Adapter / Application / Interceptor Container audit row opens the corresponding entity-namespaced page

- **GIVEN** the Audit tab on any container deployment shows one or more activities
- **WHEN** the user clicks an activity row's Activity ID link
- **THEN** `/containers/<container-name>/<activityId>` opens for every container type (MCP, Adapter, Application, Interceptor)

#### Scenario: Click on a Deployment Image audit row opens the image-namespaced page

- **GIVEN** the Audit tab on a Deployment Image shows one or more activities
- **WHEN** the user clicks an activity row's Activity ID link
- **THEN** `/deployment-images/<image-name>/<activityId>` opens

#### Scenario: `getAuditActivityHref` resolves the route via the existing map

- **GIVEN** an activity row's `resourceType` is any audit resource type registered in `auditResourceRoute`
- **WHEN** `getAuditActivityHref(entity, resourceType, activityId)` is called
- **THEN** the function returns `${getUrnForEntity(auditResourceRoute[resourceType], entity)}/${encodeURIComponent(activityId)}`
- **AND** the function does NOT use a hardcoded switch statement to map types to routes
