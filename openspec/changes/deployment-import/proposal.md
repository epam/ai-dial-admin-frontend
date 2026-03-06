## Why

The deployment export feature is already implemented, but there is no way to import deployment configurations back. Users need the ability to restore or migrate deployment entities (containers, images, model servings) across environments using the same import flow pattern established for admin config import.

## What Changes

- Add deployment import support to the existing import config page (`/import-config`)
- Extract the Export Scope selector (Admin vs Deployments) into a reusable `ConfigScopeSelector` component shared between export and import pages
- When "Deployments" is selected in import, hide the File Type radio group (only ZIP archive is supported for deployment import)
- On the Configuration step (step 2), show "Preview not available" using `DialNoDataContent` + `IconEyeOff` pattern instead of the preview grid (backend has no preview endpoint for deployment import)
- Create a new `DeploymentConfigApi` class under `server/deployments/` for deployment import/export API calls (currently export may be inline; consolidate)
- Add new `DeploymentImportResolutionPolicy` enum with backend values: `OVERWRITE`, `SKIP_IF_EXISTS` (map to UI labels Override/Skip)
- Conflict resolution policy is sent as query parameter `resolutionPolicy` on `POST /api/v1/configs/import` (deployment manager backend)
- Import accepts a single ZIP file upload via multipart form-data

## Capabilities

### New Capabilities
- `deployment-import`: Import of deployment configurations (containers, images, model servings) via ZIP archive upload with conflict resolution policy support

### Modified Capabilities

## Impact

- `apps/ai-dial-admin/src/components/ImportConfig/` - Add config scope selector, conditional rendering for deployment import flow
- `apps/ai-dial-admin/src/components/ImportConfig/Files/Files.tsx` - Add config scope radio, hide file type group for deployments
- `apps/ai-dial-admin/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.tsx` - Show "preview not available" for deployments
- `apps/ai-dial-admin/src/components/ExportConfig/ExportConfig.tsx` - Extract config scope radio to shared component
- `apps/ai-dial-admin/src/server/deployments/` - New `DeploymentConfigApi` class for import/export
- `apps/ai-dial-admin/src/app/[lang]/import-config/actions.ts` - New server actions for deployment import
- `apps/ai-dial-admin/src/types/deployments/` - New import types and enums
- `apps/ai-dial-admin/src/constants/import.tsx` - Deployment-specific import constants
- `apps/ai-dial-admin/src/app/api/api.ts` - Register new `DeploymentConfigApi` instance
