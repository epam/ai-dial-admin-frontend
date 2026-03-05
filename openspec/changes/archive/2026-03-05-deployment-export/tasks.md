## 1. Types and Models

- [x] 1.1 Add deployment entity type constants/enum for export tabs (MODEL_SERVING, MCP_CONTAINER, INTERCEPTOR_CONTAINER, ADAPTER_CONTAINER, IMAGE_DEFINITION) — either extend `EntityType` or create a dedicated `DeploymentExportEntityType` in `types/deployments/`
- [x] 1.2 Create `DeploymentExportComponentType` enum with granular API types: `MCP_IMAGE_DEFINITION`, `ADAPTER_IMAGE_DEFINITION`, `INTERCEPTOR_IMAGE_DEFINITION`, `MCP_DEPLOYMENT`, `ADAPTER_DEPLOYMENT`, `INTERCEPTOR_DEPLOYMENT`, `NIM_DEPLOYMENT`, `INFERENCE_DEPLOYMENT`
- [x] 1.3 Create `DeploymentExportRequest` and `DeploymentExportComponent` interfaces in `models/export.ts` with fields: `$type`, `addSecrets`, `addGlobalImageBuildDomainWhitelist`, `components` (each with `name` and `type: DeploymentExportComponentType`)
- [x] 1.4 Add i18n keys for new UI labels: Components radio group title, "Entities, Builders, Access Management", "Deployments", "Include Global Firewall", deployment entity tab names — in `constants/i18n.ts` and `locales/en.ts`

## 2. API Layer

- [x] 2.1 Create `DeploymentExportApi` class in `server/deployments/export.ts` extending `BaseApi` with method: `exportConfig(request, token)` → blob+filename. Export endpoint: `/api/v1/configs/export`. No preview endpoint exists.
- [x] 2.2 Register `deploymentExportApi` instance in `app/api/api.ts` with `host: process.env.DIAL_DEPLOYMENTS_API_URL`
- [x] 2.3 Add server actions in `app/[lang]/export-config/actions.ts`: `exportDeploymentConfig(request)`, `getDeploymentEntities(type)` — the last one reuses `containersApi` and `imagesApi` to fetch entities by type and map them to `EntitiesGridData[]`

## 3. Export Config Page Setup

- [x] 3.1 Update `export-config/page.tsx` to pass `deploymentsEnabled` prop (read from env/context) to `ExportConfig` component
- [x] 3.2 Add `deploymentsEnabled` prop to `ExportConfig` component interface

## 4. Components Radio Group (Structure Panel)

- [x] 4.1 Add `ExportComponentType` enum or string union (`'admin' | 'deployments'`) and state variable `selectedComponentType` in `ExportConfig.tsx`
- [x] 4.2 Conditionally render a "Components" `DialRadioGroup` at the top of the Structure panel (before Format radio) ONLY when `deploymentsEnabled` is true. When false, do not render the group — page behaves as current (admin context). Options: "Entities, Builders, Access Management" (id: `admin`) and "Deployments" (id: `deployments`)
- [x] 4.3 When `selectedComponentType` changes, reset all export selections (format, type, dependencies, custom data, topics)

## 5. Deployment Export Structure Panel

- [x] 5.1 When `selectedComponentType === 'deployments'`, hide Format radio, Type radio, Dependencies, and Topics sections — only the Components radio group remains in the Structure panel

## 6. Deployment Export Content Panel

- [x] 6.1 Create deployment-specific tab definitions mapping to the 5 deployment entity types (Model Servings, MCP Containers, Interceptor Containers, Adapter Containers, Images)
- [x] 6.2 Create `getDeploymentEntities(type)` server action that fetches containers (filtered by CONTAINER_TYPE) or images and maps to `EntitiesGridData[]` format — reuse existing `containersApi.getContainers(type)` and `imagesApi.getImages()`
- [x] 6.3 Create deployment-specific column definitions for the entity grid — reuse existing export column patterns where applicable, showing name, id, description, version for each entity type
- [x] 6.4 Wire `ConfigContent` (or a parallel `DeploymentConfigContent` component) to use deployment tabs, deployment data source, and deployment column definitions when in deployment context. Support only Custom export type (Add button, no Full grid)
- [x] 6.5 Ensure `AddEntitiesButton` and `AddEntitiesModal` work for deployment entities — pass deployment entity types and data sources. Dependencies sidebar may be hidden since deployment entities don't have the same dependency model

## 7. Deployment Export Preview Modal

- [x] 7.1 Extend `PreviewModal` with optional `isDeploymentExport` prop — when true, skip preview API call and show `DialNoDataContent` with "Preview currently unavailable" instead of tabbed entity data
- [x] 7.2 Replace existing `DialSwitch` for "Include Secrets" with `DialCheckbox` in PreviewModal (applies to both admin and deployment contexts)
- [x] 7.3 Add `addGlobalFirewall` (boolean) state and "Include Global Firewall" `DialCheckbox` below "Include Secrets" — shown only when `isDeploymentExport` is true
- [x] 7.4 Update `onPrepare` callback to pass both `addSecrets` and `addGlobalFirewall` values when in deployment mode

## 8. Export Execution

- [x] 8.1 In `ExportConfig.tsx`, create `onDeploymentExport(addSecrets, addGlobalFirewall)` handler that calls `exportDeploymentConfig()` server action with the constructed `DeploymentExportRequest` and triggers file download
- [x] 8.2 Build `DeploymentExportRequest` from `customExportData` — map each selected entity to `{ name, type }` using granular types: containers map to their specific deployment type (MCP_DEPLOYMENT, ADAPTER_DEPLOYMENT, INTERCEPTOR_DEPLOYMENT, NIM_DEPLOYMENT, INFERENCE_DEPLOYMENT based on container $type), images map to their specific image definition type (MCP_IMAGE_DEFINITION, ADAPTER_IMAGE_DEFINITION, INTERCEPTOR_IMAGE_DEFINITION based on image type)
- [x] 8.3 Wire the Export button `onTryExport` to check `selectedComponentType` and open preview modal with deployment context when applicable

## 9. Utility Functions

- [x] 9.1 Create mapping functions: `getContainersForEntitiesGrid(containers)` and `getImagesForEntitiesGrid(images)` to convert deployment models to `EntitiesGridData[]` — similar to existing `getModelsForEntitiesGrid` pattern
- [x] 9.2 Create `getDeploymentExportComponentType(entityType, subType)` mapper: given the UI entity tab type and the entity's specific sub-type (e.g., CONTAINER_TYPE or IMAGE_TYPE), return the granular API component type (e.g., MCP container → `MCP_DEPLOYMENT`, Adapter image → `ADAPTER_IMAGE_DEFINITION`)
- [x] 9.3 Create deployment-specific column definitions function (reuse existing export column patterns from `getActualColDefs` — columns: name, id, description, version per entity type)
