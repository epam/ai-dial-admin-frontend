## MODIFIED Requirements

### Requirement: Deployments view row action menu shows Open-in-new-tab; click behavior depends on resource type

The per-row action menu in the Deployments view SHALL render exactly one item: `Open in new tab`. Click behavior depends on the row's `resourceType`:

- For `*ImageDefinition` activities (`AdapterImageDefinition`, `ApplicationImageDefinition`, `InterceptorImageDefinition`, `McpImageDefinition`) and `ImageBuildDomainWhitelist` activities: clicking `Open in new tab` SHALL open `/activity-audit/{activityId}` in a new browser tab, and a row-body click anywhere outside the action menu SHALL navigate to the same URL in the current tab.
- For the six container subtypes (`AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`): clicking `Open in new tab` and a row-body click SHALL both remain no-ops, until a follow-up change ships container detail rendering.

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

#### Scenario: Container row clicks remain no-ops
- **WHEN** the user clicks `Open in new tab` or the row body on any of the six `*Deployment` rows
- **THEN** no navigation occurs in either the current tab or a new tab
- **AND** no audit detail page request is issued

#### Scenario: Audit detail route resolves deployment-manager activities for image and firewall types
- **WHEN** the user opens `/activity-audit/{activityId}` for an activity whose `resourceType` is one of the four `*ImageDefinition` types or `ImageBuildDomainWhitelist`
- **THEN** the detail page resolves the activity from the deployment-manager backend (falling back from the admin-backend lookup)
- **AND** renders the full diff view through `AuditView`

#### Scenario: Audit detail route still resolves admin-backend activities unchanged
- **WHEN** the user opens `/activity-audit/{activityId}` for an admin-backend activity
- **THEN** the detail page renders the full diff view as it does today, with the deployment-manager fallback not invoked
