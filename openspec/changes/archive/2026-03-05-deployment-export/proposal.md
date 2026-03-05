## Why

The admin frontend currently supports export/import only for core entities (models, applications, roles, keys, etc.) via the admin backend. Deployment entities (servings, MCP/interceptor/adapter containers, images) managed by the deployment manager backend have no export capability. Users need to export deployment configurations for backup, migration, and environment replication purposes.

## What Changes

- Add a new **Components** radio group in the Export Config Structure panel with two options:
  - "Entities, Builders, Access Management" (current behavior)
  - "Deployments" (visible only when `DEPLOYMENTS_ENABLED` env var is true)
- When "Deployments" is selected:
  - Replace the Format radio group with a labeled text showing "Format: Custom, ZIP"
  - Only Custom export type is available (no Full Config)
  - Side panel content shows deployment entity types (Model Servings, MCP Containers, Interceptor Containers, Adapter Containers, Images) with Add button to select entities
  - Preview modal shows tabbed deployment entities plus two toggles: "Include Secrets" and "Include Global Firewall"
- Add a new `DeploymentExportApi` class targeting `DIAL_DEPLOYMENTS_API_URL` with export/preview endpoints (`/api/v1/configs/export`, `/api/v1/configs/export/preview`)
- New deployment export request model with `$type`, `addSecrets`, `addGlobalImageBuildDomainWhitelist`, and `components` (types: `IMAGE_DEFINITION`, `DEPLOYMENT`)
- New server actions for deployment export and preview
- Import page is **not** in scope — only the export page gets deployment support

## Capabilities

### New Capabilities
- `deployment-export`: Export deployment entities (servings, containers, images) via the deployment manager backend API, including custom entity selection, preview, and download with secrets/firewall options

### Modified Capabilities

## Impact

- **ExportConfig component**: Major modification — new Components radio group, conditional rendering based on selected component type
- **Preview modal**: Extended with additional toggles (include global firewall) for deployment exports
- **API layer**: New `DeploymentExportApi` class under `server/deployments/`
- **Server actions**: New deployment export actions in `app/[lang]/export-config/actions.ts`
- **Types/models**: New deployment export request interface, new deployment entity types for export
- **API instances**: New `deploymentExportApi` in `app/api/api.ts`
- **Export config page**: Pass `deploymentsEnabled` feature flag to ExportConfig
