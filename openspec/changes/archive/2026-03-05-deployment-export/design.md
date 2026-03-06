## Context

The admin frontend has a well-structured Export Config page (`/export-config`) that supports exporting core admin entities (models, applications, roles, keys, etc.) via `DIAL_ADMIN_API_URL`. The deployment manager backend (`DIAL_DEPLOYMENTS_API_URL`) now offers its own export API at `POST /api/v1/configs/export` with a different request schema supporting `addSecrets`, `addGlobalImageBuildDomainWhitelist`, and 8 granular component types: `MCP_DEPLOYMENT`, `ADAPTER_DEPLOYMENT`, `INTERCEPTOR_DEPLOYMENT`, `NIM_DEPLOYMENT`, `INFERENCE_DEPLOYMENT`, `MCP_IMAGE_DEFINITION`, `ADAPTER_IMAGE_DEFINITION`, `INTERCEPTOR_IMAGE_DEFINITION`.

The feature flag `DEPLOYMENTS_ENABLED` already controls visibility of deployment-related navigation items and is available via `AppContext.featureFlags.deploymentsEnabled`.

Current export flow: ExportConfig component → Structure panel (Format radio, Type radio, Dependencies checkboxes) + Content panel (entity grid) → PreviewModal → download.

## Goals / Non-Goals

**Goals:**
- Extend the Export Config page to support deployment entity export alongside existing admin export
- Reuse existing export components (ConfigContent, ConfigContentGrid, PreviewModal, AddEntities) with minimal duplication
- Call the deployment manager export API with the correct request schema
- Support custom export only (select individual entities) for deployments
- Show "Include Secrets" and "Include Global Firewall" checkboxes in the deployment preview modal (no preview data — NoContent placeholder)

**Non-Goals:**
- Import of deployment entities (separate feature)
- Full export mode for deployments
- Modifying the deployment manager backend API
- Export format selection for deployments (implicit: Custom, ZIP — no UI label needed)

## Decisions

### 1. Top-level Component Selector in Structure Panel

**Decision**: Add a new "Components" radio group at the top of the Structure panel with options "Entities, Builders, Access Management" and "Deployments". This radio group controls which export context is active. The entire Components radio group is only rendered when `deploymentsEnabled` is true — when false, the page behaves as if "Entities, Builders, Access Management" is selected (no visible change from current behavior).

**Rationale**: When deployments are disabled, showing a single-option radio group adds clutter with no value. Hiding it entirely keeps the current UX unchanged for non-deployment environments.

**Alternative considered**: Separate pages for each export type. Rejected — adds navigation complexity and duplicates the page structure.

### 2. Separate API Class (`DeploymentExportApi`)

**Decision**: Create a new `DeploymentExportApi` class in `server/deployments/export.ts` extending `BaseApi`, configured with `DIAL_DEPLOYMENTS_API_URL`. This class handles export and entity listing for deployment entities. No preview endpoint exists on the backend.

**Rationale**: The deployment export API has a different host, different URL paths (`/api/v1/configs/export` vs `/api/configs/export`), and a different request schema (no `exportFormat`, no `componentTypes`, no `topics`; has `addGlobalImageBuildDomainWhitelist`). A separate API class keeps concerns cleanly separated following the existing pattern (ContainersApi, ImagesApi).

**Alternative considered**: Extending UtilityApi with deployment methods. Rejected — different host configuration and request schema make it a poor fit.

### 3. Separate Export Request Model

**Decision**: Create `DeploymentExportRequest` interface alongside existing `ExportRequest`:
```typescript
enum DeploymentExportComponentType {
  MCP_IMAGE_DEFINITION = 'MCP_IMAGE_DEFINITION',
  ADAPTER_IMAGE_DEFINITION = 'ADAPTER_IMAGE_DEFINITION',
  INTERCEPTOR_IMAGE_DEFINITION = 'INTERCEPTOR_IMAGE_DEFINITION',
  MCP_DEPLOYMENT = 'MCP_DEPLOYMENT',
  ADAPTER_DEPLOYMENT = 'ADAPTER_DEPLOYMENT',
  INTERCEPTOR_DEPLOYMENT = 'INTERCEPTOR_DEPLOYMENT',
  NIM_DEPLOYMENT = 'NIM_DEPLOYMENT',
  INFERENCE_DEPLOYMENT = 'INFERENCE_DEPLOYMENT',
}

interface DeploymentExportRequest {
  $type: ExportType; // 'full' | 'custom'
  addSecrets?: boolean;
  addGlobalImageBuildDomainWhitelist?: boolean;
  components: DeploymentExportComponent[];
}

interface DeploymentExportComponent {
  name: string;
  type: DeploymentExportComponentType;
}
```

**Rationale**: The deployment export request is structurally different from `ExportRequest` — no `exportFormat`, no `componentTypes`, no `topics`, no `dependencies` on components. The API uses granular component types (e.g., `MCP_DEPLOYMENT`, `ADAPTER_IMAGE_DEFINITION`) rather than generic `DEPLOYMENT`/`IMAGE_DEFINITION`, so each container/image entity maps to its specific type based on `CONTAINER_TYPE` or `IMAGE_TYPE`. A dedicated enum captures all 8 valid types.

### 4. Reuse ConfigContentGrid and AddEntities Pattern

**Decision**: Reuse `ConfigContentGrid` for displaying selected deployment entities and the `AddEntitiesButton`/`AddEntitiesModal` pattern for the custom selection flow. Create deployment-specific tab definitions and column definitions.

**Rationale**: The grid display and add-entity flow are generic enough to work with deployment data. Only the data source (server actions fetching containers/images) and column definitions differ.

### 5. Deployment Entity Types for Export

**Decision**: Introduce a `DeploymentEntityType` enum or constants to represent the 5 entity categories in the export UI:
- Model Servings (containers with type NIM → `NIM_DEPLOYMENT`, INFERENCE/HF → `INFERENCE_DEPLOYMENT`)
- MCP Containers (containers with type MCP → `MCP_DEPLOYMENT`)
- Interceptor Containers (containers with type INTERCEPTOR → `INTERCEPTOR_DEPLOYMENT`)
- Adapter Containers (containers with type ADAPTER → `ADAPTER_DEPLOYMENT`)
- Images (MCP images → `MCP_IMAGE_DEFINITION`, Adapter images → `ADAPTER_IMAGE_DEFINITION`, Interceptor images → `INTERCEPTOR_IMAGE_DEFINITION`)

A utility function `getDeploymentExportComponentType(tabType, entitySubType)` maps each entity to its granular API component type based on both the UI tab and the entity's `$type`/`type` field.

**Rationale**: The UI groups entities into 5 tabs matching navigation, while the API uses 8 granular component types. The mapping function bridges this gap using the entity's sub-type.

### 6. Extend PreviewModal for Deployment Context

**Decision**: Add optional props to `PreviewModal` for deployment mode:
- `isDeploymentExport?: boolean` — switches the preview behavior
- `onPrepare` callback signature extended to include `addGlobalFirewall` parameter
- When in deployment mode, show a `DialNoDataContent` component with "Preview currently unavailable" instead of the tabbed preview data (no preview endpoint exists)
- Show "Include Secrets" and "Include Global Firewall" checkboxes below the NoContent area

Additionally, replace the existing `DialSwitch` for "Include Secrets" with `DialCheckbox` in both admin and deployment contexts.

**Rationale**: The deployment backend has no preview endpoint. The modal still serves as a confirmation step with export options (secrets, firewall) before triggering the actual download. Using the same modal with conditional content keeps the UX pattern consistent.

## Risks / Trade-offs

**[Risk] Deployment export API may evolve** → The separate `DeploymentExportApi` class isolates changes. If the API changes, only one class needs updating.

**[Risk] Entity grid data format mismatch** → Container and Image models differ from admin entities. Mitigation: Create mapping functions similar to existing `getModelsForEntitiesGrid` etc., converting deployment entities to `EntitiesGridData` format.

**[Trade-off] Custom-only export limits utility** → Full export would be simpler for bulk operations. Accepted per requirements — can be added later by enabling the Full radio option for deployment context.

**[Trade-off] No shared state between the two export contexts** → Switching between "Entities" and "Deployments" resets selections. Accepted — the two contexts are independent and mixing would be confusing.
