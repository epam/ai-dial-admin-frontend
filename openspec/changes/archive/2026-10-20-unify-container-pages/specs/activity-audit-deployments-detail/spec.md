## MODIFIED Requirements

### Requirement: Resource identifier chip navigates to the container's edit page

The "Resource identifier" chip in the `AuditView` header SHALL be clickable for container activities and SHALL navigate to the entity's edit page in the appropriate section, using the `auditResourceRoute` map. The five container subtypes route as follows:

- `McpDeployment`, `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment` → `ApplicationRoute.Containers` (`/containers/{id}`)
- `InferenceDeployment` → `ApplicationRoute.ModelServings` (`/model-servings/{id}`)

#### Scenario: MCP container chip navigates to McpContainers route
- **WHEN** the user clicks the Resource identifier chip on an `McpDeployment` activity
- **THEN** the browser navigates to `/{lang}/containers/{resourceId}`

#### Scenario: HF inference serving chip navigates to ModelServings route
- **WHEN** the user clicks the Resource identifier chip on an `InferenceDeployment` activity
- **THEN** the browser navigates to `/{lang}/model-servings/{resourceId}`
