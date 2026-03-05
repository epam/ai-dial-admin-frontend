## ADDED Requirements

### Requirement: Components radio group in export structure panel
When `deploymentsEnabled` feature flag is true, the export config Structure panel SHALL display a "Components" radio group with two options: "Entities, Builders, Access Management" and "Deployments". When the flag is false, the Components radio group SHALL NOT be rendered and the page SHALL behave as if "Entities, Builders, Access Management" is selected.

#### Scenario: Deployments enabled
- **WHEN** the `DEPLOYMENTS_ENABLED` environment variable is true
- **THEN** the Components radio group is displayed with both options: "Entities, Builders, Access Management" and "Deployments"

#### Scenario: Deployments disabled
- **WHEN** the `DEPLOYMENTS_ENABLED` environment variable is false or not set
- **THEN** the Components radio group is NOT rendered
- **AND** the export page behaves identically to the current admin entity export (as if first option is selected)

#### Scenario: Default selection
- **WHEN** the export page loads with deployments enabled
- **THEN** "Entities, Builders, Access Management" SHALL be selected by default

### Requirement: Admin export context when first option selected
When "Entities, Builders, Access Management" is selected in the Components radio group, the export page SHALL display the existing export configuration UI unchanged: Format radio (ADMIN/CORE/ACTIVE_CONFIG), Type radio (Full/Custom), Dependencies checkboxes, Topics filter, and entity grid.

#### Scenario: Selecting admin entities
- **WHEN** user selects "Entities, Builders, Access Management"
- **THEN** the Structure panel shows Format, Type, Dependencies, and Topics controls as currently implemented
- **AND** the Content panel shows the admin entity grid

### Requirement: Deployment export context when Deployments selected
When "Deployments" is selected in the Components radio group, the Structure panel SHALL hide the Format radio, Type radio, Dependencies checkboxes, and Topics filter. No additional format label is shown — the Structure panel only contains the Components radio group.

#### Scenario: Selecting deployments
- **WHEN** user selects "Deployments"
- **THEN** the Structure panel hides Format radio, Type radio, Dependencies checkboxes, and Topics filter
- **AND** only the Components radio group remains in the Structure panel

### Requirement: Deployment entity selection in content panel
When the deployment export context is active, the Content panel SHALL display deployment entity types as tabs: Model Servings, MCP Containers, Interceptor Containers, Adapter Containers, and Images. Users SHALL be able to add individual entities to the export selection using an Add button (custom export pattern). The entity grid SHALL display columns reused from the existing export grid where applicable: name, id, description, version for each entity type.

#### Scenario: Adding deployment entities
- **WHEN** user clicks the Add button in the deployment export content panel
- **THEN** a modal opens showing available entities for the selected deployment entity type
- **AND** user can select one or more entities to add to the export list

#### Scenario: Removing deployment entities
- **WHEN** user clicks the remove action on a selected deployment entity
- **THEN** the entity is removed from the export selection

#### Scenario: Empty selection
- **WHEN** no deployment entities are selected
- **THEN** the Export button SHALL be disabled

#### Scenario: Grid columns for deployment entities
- **WHEN** deployment entities are displayed in the content grid
- **THEN** the grid SHALL show columns for name, id, description, and version (where available per entity type)
- **AND** column definitions SHALL reuse existing export grid column patterns

### Requirement: Deployment export API integration
The system SHALL call the deployment manager backend export API at `POST {DIAL_DEPLOYMENTS_API_URL}/api/v1/configs/export` with a request body containing `$type` ("custom"), `addSecrets`, `addGlobalImageBuildDomainWhitelist`, and `components` array. Each component has a `name` and a `type` from the following granular API component types:

**Image definitions:**
- `MCP_IMAGE_DEFINITION` — MCP images
- `ADAPTER_IMAGE_DEFINITION` — Adapter images
- `INTERCEPTOR_IMAGE_DEFINITION` — Interceptor images

**Deployments:**
- `MCP_DEPLOYMENT` — MCP containers
- `ADAPTER_DEPLOYMENT` — Adapter containers
- `INTERCEPTOR_DEPLOYMENT` — Interceptor containers
- `NIM_DEPLOYMENT` — NIM model servings
- `INFERENCE_DEPLOYMENT` — Inference/HF model servings

#### Scenario: Export with selected entities
- **WHEN** user confirms export in the preview modal
- **THEN** the system sends a POST request to the deployment export endpoint with the selected components, secrets preference, and global firewall preference
- **AND** the response file (ZIP) is downloaded to the user's browser

#### Scenario: Mapping container types to API component types
- **WHEN** building the export request for containers
- **THEN** MCP containers SHALL map to `MCP_DEPLOYMENT`
- **AND** Interceptor containers SHALL map to `INTERCEPTOR_DEPLOYMENT`
- **AND** Adapter containers SHALL map to `ADAPTER_DEPLOYMENT`
- **AND** NIM model servings SHALL map to `NIM_DEPLOYMENT`
- **AND** Inference/HF model servings SHALL map to `INFERENCE_DEPLOYMENT`

#### Scenario: Mapping image types to API component types
- **WHEN** building the export request for images
- **THEN** MCP images SHALL map to `MCP_IMAGE_DEFINITION`
- **AND** Adapter images SHALL map to `ADAPTER_IMAGE_DEFINITION`
- **AND** Interceptor images SHALL map to `INTERCEPTOR_IMAGE_DEFINITION`

### Requirement: Deployment export preview unavailable
The deployment manager backend does not provide a preview endpoint. When the deployment export preview modal opens, it SHALL display a NoContent component with the message "Preview currently unavailable" instead of fetching and displaying entity data.

#### Scenario: Preview modal for deployments
- **WHEN** user clicks Export button with deployment entities selected
- **THEN** a preview modal opens showing a NoContent component with message "Preview currently unavailable"
- **AND** no preview API call is made

### Requirement: Preview modal checkboxes replace switches
The export preview modal SHALL use checkboxes instead of switches for all toggle options. This applies to both admin entity export and deployment export contexts.

#### Scenario: Admin export preview checkboxes
- **WHEN** the admin export preview modal is displayed
- **THEN** "Include Secrets" SHALL be rendered as a checkbox (not a switch)
- **AND** default SHALL be unchecked

### Requirement: Include Secrets checkbox in deployment preview
The deployment export preview modal SHALL display an "Include Secrets" checkbox that controls the `addSecrets` field in the export request. Default SHALL be unchecked.

#### Scenario: Check include secrets
- **WHEN** user checks "Include Secrets" in the deployment preview modal
- **THEN** the export request sends `addSecrets: true`

### Requirement: Include Global Firewall checkbox in deployment preview
The deployment export preview modal SHALL display an "Include Global Firewall" checkbox that controls the `addGlobalImageBuildDomainWhitelist` field in the export request. Default SHALL be unchecked. This checkbox SHALL only appear in the deployment export context.

#### Scenario: Check include global firewall
- **WHEN** user checks "Include Global Firewall" in the deployment preview modal
- **THEN** the export request includes `addGlobalImageBuildDomainWhitelist: true`

### Requirement: Separate deployment export API class
A new `DeploymentExportApi` class SHALL be created using `DIAL_DEPLOYMENTS_API_URL` as host. It SHALL provide methods for export (returns blob + filename) and fetching available deployment entities for selection. No preview method is needed as the backend does not support it.

#### Scenario: API class instantiation
- **WHEN** the application initializes
- **THEN** a `deploymentExportApi` instance is created with `DIAL_DEPLOYMENTS_API_URL` host in `app/api/api.ts`
