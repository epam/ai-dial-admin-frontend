## MODIFIED Requirements

### Requirement: Deployments view row action menu shows Open-in-new-tab; click behavior depends on resource type

The per-row action menu in the Deployments view SHALL render exactly one item: `Open in new tab`. For every deployment-manager resource type (the four `*ImageDefinition` types, `ImageBuildDomainWhitelist`, and the six `*Deployment` container subtypes), clicking `Open in new tab` SHALL open `/activity-audit/{activityId}` in a new browser tab, and a row-body click anywhere outside the action menu SHALL navigate to the same URL in the current tab. No deployment-manager resource type remains as a no-op.

#### Scenario: Only Open-in-new-tab is present in the menu
- **WHEN** the user opens the action menu on a Deployments view row
- **THEN** the only item is `Open in new tab`

#### Scenario: Image row Open-in-new-tab opens the detail page in a new tab
- **WHEN** the user clicks `Open in new tab` on a row whose `resourceType` is one of the four `*ImageDefinition` types
- **THEN** a new browser tab opens at `/activity-audit/{activityId}`

#### Scenario: Image row body click navigates in the current tab
- **WHEN** the user clicks anywhere on an image-definition row outside the action menu
- **THEN** the current tab navigates to `/activity-audit/{activityId}`

#### Scenario: Global firewall row Open-in-new-tab opens the detail page in a new tab
- **WHEN** the user clicks `Open in new tab` on a row whose `resourceType` is `ImageBuildDomainWhitelist`
- **THEN** a new browser tab opens at `/activity-audit/{activityId}`

#### Scenario: Container row Open-in-new-tab opens the detail page in a new tab
- **WHEN** the user clicks `Open in new tab` on a row whose `resourceType` is one of `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, or `InferenceDeployment`
- **THEN** a new browser tab opens at `/activity-audit/{activityId}`

#### Scenario: Container row body click navigates in the current tab
- **WHEN** the user clicks anywhere on a container-deployment row outside the action menu
- **THEN** the current tab navigates to `/activity-audit/{activityId}`

#### Scenario: Audit detail route resolves deployment-manager activities for every supported resource type
- **WHEN** the user opens `/activity-audit/{activityId}` for an activity whose `resourceType` is any of the four `*ImageDefinition` types, `ImageBuildDomainWhitelist`, or any of the six `*Deployment` container subtypes
- **THEN** the detail page resolves the activity from the deployment-manager backend (falling back from the admin-backend lookup)
- **AND** renders the full diff view through `AuditView`

#### Scenario: Audit detail route still resolves admin-backend activities unchanged
- **WHEN** the user opens `/activity-audit/{activityId}` for an admin-backend activity
- **THEN** the detail page renders the full diff view as it does today, with the deployment-manager fallback not invoked
