# Deployment Import Preview

## Purpose

Enables the import configuration step to show deployment entities with their import actions (Create/Update/Skip) before importing, replacing the current "Preview currently unavailable" placeholder. Uses `ConfigurationPreview` with deployment-specific API call and `DeploymentConfigurationGrid` for rendering.

## ADDED Requirements

### Requirement: Import preview shows deployment entities with actions in tabbed grid

When the import scope is Deployments, `ConfigurationPreview` SHALL call `POST /configs/import/preview` and delegate rendering to `DeploymentConfigurationGrid`.

#### Scenario: Preview loads on file upload
- **WHEN** user uploads a deployment config ZIP and advances to the Configuration step
- **THEN** the system SHALL call `previewDeploymentImportConfig` with the uploaded file and selected resolution policy
- **AND** display a `DialLoader` with "Configuration parsing..." message while the request is in-flight
- **AND** render tabbed content on success via `DeploymentConfigurationGrid`

#### Scenario: Tabs grouped by container type with counts
- **WHEN** the preview response is received
- **THEN** tabs SHALL be generated using `DEPLOYMENT_ENTITY_TABS` by grouping BE response keys:
  - `mcpDeployments` → MCP Containers
  - `adapterDeployments` → Adapter Containers
  - `interceptorDeployments` → Interceptor Containers
  - `nimDeployments` + `inferenceDeployments` → Model Servings
  - `mcpImageDefinitions` + `adapterImageDefinitions` + `interceptorImageDefinitions` → Images
  - `globalImageBuildDomainWhitelist` → Global Firewall (see separate spec)
- **AND** each tab label SHALL include the entity count (e.g., "MCP Containers: 5")
- **AND** the first tab with data SHALL be selected by default

#### Scenario: Grid shows Action column with colored status dots
- **WHEN** a deployment entity tab is selected
- **THEN** the grid SHALL show an Action column via `getComponentActionColumn()` as the first column
- **AND** "Create" actions SHALL show a green dot (`bg-accent-primary`)
- **AND** "Update" actions SHALL show an orange dot (`bg-orange-400`)
- **AND** "Skip" actions SHALL show a gray dot (`bg-controls-disable`)

#### Scenario: Grid columns match deployment grid
- **WHEN** a deployment entity tab is selected
- **THEN** the grid SHALL show: Action + `getDeploymentColDefs` columns (Display name, Description, ID; Version + Type for Images)

#### Scenario: Empty entity types are not shown as tabs
- **WHEN** the preview response contains an entity type with zero entities
- **THEN** no tab SHALL be rendered for that entity type

### Requirement: Import button enabled when file is uploaded

#### Scenario: Import button state
- **WHEN** a valid deployment config file has been uploaded
- **THEN** the Import button SHALL be enabled

### Requirement: Preview error handling

#### Scenario: Preview API call fails
- **WHEN** the `previewDeploymentImportConfig` call fails
- **THEN** the system SHALL display an error toast notification with error header, message, and request ID
