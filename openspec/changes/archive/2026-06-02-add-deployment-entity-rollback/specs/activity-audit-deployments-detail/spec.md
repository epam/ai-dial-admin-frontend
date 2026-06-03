## MODIFIED Requirements

### Requirement: Resource Rollback button is hidden for deployment-manager activities

The `AuditView` component SHALL render the Resource Rollback button for the eleven deployment-manager resource types (`AdapterImageDefinition`, `ApplicationImageDefinition`, `InterceptorImageDefinition`, `McpImageDefinition`, `ImageBuildDomainWhitelist`, `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`), routing it through the `deployment-entity-rollback` dispatch rather than the admin `rollbackEntityPerRevision` flow. The predicate `isDeploymentManagerResource(resourceType)` SHALL remain the centralized check for branching the rollback path. For `Update` activities on containers and image definitions, the button SHALL be governed by the lifecycle pre-check gate: when the current entity state blocks rollback the button is rendered disabled with an explanatory tooltip; otherwise it is enabled. The whitelist is never gated. The existing `isReadOnlyAdmin` gate continues to hide the button for read-only admins on admin-backend activities.

#### Scenario: Image detail shows rollback when build state permits
- **GIVEN** the user opens the detail page for an image-definition `Update` activity whose current `buildStatus` is `NOT_BUILT`
- **THEN** the Resource Rollback button is rendered and enabled

#### Scenario: Image detail disables rollback while building
- **GIVEN** the user opens the detail page for an image-definition `Update` activity whose current `buildStatus` is `BUILDING`
- **THEN** the Resource Rollback button is rendered disabled with an explanatory tooltip

#### Scenario: Container detail disables rollback while active
- **GIVEN** the user opens the detail page for a container `Update` activity whose current `status` is `RUNNING`
- **THEN** the Resource Rollback button is rendered disabled with an explanatory tooltip

#### Scenario: Firewall detail shows rollback
- **GIVEN** the user opens the detail page for an `ImageBuildDomainWhitelist` activity
- **THEN** the Resource Rollback button is rendered and enabled with no lifecycle gating

#### Scenario: Deployment-manager rollback uses the deployment dispatch
- **GIVEN** the user confirms rollback on any deployment-manager activity detail page
- **THEN** the request is routed through the `deployment-entity-rollback` dispatch and not the admin `rollbackEntityPerRevision` flow

#### Scenario: Admin activity keeps rollback for non-read-only admins
- **GIVEN** the user opens the detail page for an admin-backend activity such as `Model` or `Application`
- **AND** the user is NOT a read-only admin
- **THEN** the Resource Rollback button is rendered as it is today
