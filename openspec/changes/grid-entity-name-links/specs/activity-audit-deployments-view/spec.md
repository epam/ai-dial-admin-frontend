## MODIFIED Requirements

### Requirement: Deployments view row action menu shows Open-in-new-tab and Rollback; click behavior depends on resource type

The per-row action menu in the Deployments view SHALL render `Open in new tab` and, for deployment-manager resource types, `Rollback`. For every deployment-manager resource type (the four `*ImageDefinition` types, `ImageBuildDomainWhitelist`, and the five `*Deployment` container subtypes), clicking `Open in new tab` SHALL open `/activity-audit/{activityId}` in a new browser tab, and the row's Activity ID link SHALL open the same URL in a new browser tab; a click elsewhere on the row body SHALL NOT navigate. No deployment-manager resource type remains as a no-op. The `Rollback` action SHALL open the rollback confirmation flow defined by the `deployment-entity-rollback` capability; for parent/aggregate rows (no single resolvable entity) the `Rollback` action SHALL be suppressed, matching the Config view's handling of grouped rows.

#### Scenario: Open-in-new-tab and Rollback are present in the menu
- **WHEN** the user opens the action menu on a deployment-manager Deployments view row
- **THEN** the menu includes `Open in new tab` and `Rollback`

#### Scenario: Rollback action opens the confirmation flow
- **WHEN** the user clicks `Rollback` on a deployment-manager row
- **THEN** the rollback confirmation flow for that activity opens

#### Scenario: Rollback suppressed on aggregate rows
- **WHEN** a row represents a parent/aggregate with child activities
- **THEN** the `Rollback` action is not offered for that row

#### Scenario: Image row Open-in-new-tab opens the detail page in a new tab
- **WHEN** the user clicks `Open in new tab` on a row whose `resourceType` is one of the four `*ImageDefinition` types
- **THEN** a new browser tab opens at `/activity-audit/{activityId}`

#### Scenario: Image row body click navigates in the current tab
- **WHEN** the user clicks the Activity ID link of an image-definition row
- **THEN** a new browser tab opens at `/activity-audit/{activityId}`

#### Scenario: Global firewall row Open-in-new-tab opens the detail page in a new tab
- **WHEN** the user clicks `Open in new tab` on a row whose `resourceType` is `ImageBuildDomainWhitelist`
- **THEN** a new browser tab opens at `/activity-audit/{activityId}`

#### Scenario: Container row Open-in-new-tab opens the detail page in a new tab
- **WHEN** the user clicks `Open in new tab` on a row whose `resourceType` is one of `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, or `InferenceDeployment`
- **THEN** a new browser tab opens at `/activity-audit/{activityId}`

#### Scenario: Container row body click navigates in the current tab
- **WHEN** the user clicks the Activity ID link of a container-deployment row
- **THEN** a new browser tab opens at `/activity-audit/{activityId}`

#### Scenario: Audit detail route resolves deployment-manager activities for every supported resource type
- **WHEN** the user opens `/activity-audit/{activityId}` for an activity whose `resourceType` is any of the four `*ImageDefinition` types, `ImageBuildDomainWhitelist`, or any of the five `*Deployment` container subtypes
- **THEN** the detail page resolves the activity from the deployment-manager backend (falling back from the admin-backend lookup)
- **AND** renders the full diff view through `AuditView`

#### Scenario: Audit detail route still resolves admin-backend activities unchanged
- **WHEN** the user opens `/activity-audit/{activityId}` for an admin-backend activity
- **THEN** the detail page renders the full diff view as it does today, with the deployment-manager fallback not invoked
