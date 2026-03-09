## Context

The import config page (`/import-config`) currently supports importing admin configurations (models, applications, routes, etc.) via the admin backend at `DIAL_ADMIN_API_URL`. The export config page already has a Component Radio group that switches between "Admin" and "Deployments" export flows. The deployment manager backend at `DIAL_DEPLOYMENTS_API_URL` exposes `POST /api/v1/configs/import` (multipart file + `resolutionPolicy` query param) and `POST /api/v1/configs/export` (JSON body).

Key constraints:
- Deployment import only supports ZIP archive upload (no JSON or separate files)
- Backend conflict policies: `OVERWRITE`, `SKIP_IF_EXISTS` — mapped to UI labels Override and Skip
- No preview endpoint exists for deployment import on the backend
- The API paths for deployment config (`/api/v1/configs/import`, `/api/v1/configs/export`) mirror the admin backend paths but hit a different host

## Goals / Non-Goals

**Goals:**
- Add deployment import flow to the existing import config page
- Extract the Config Scope radio group (Admin/Deployments) into a shared component reused by both export and import pages
- Create a `DeploymentConfigApi` class for deployment import/export API calls
- Handle conflict resolution policy correctly per backend API contract
- Show "Preview not available" on the Configuration step for deployment import

**Non-Goals:**
- Adding preview support for deployment import (backend doesn't support it)
- Supporting JSON or separate file import for deployments
- Supporting additional conflict policies beyond Override and Skip
- Changing the existing admin config import flow

## Decisions

**1. Extract ConfigScopeSelector as a shared component**

Create `apps/ai-dial-admin/src/components/Common/ConfigScopeSelector/ConfigScopeSelector.tsx` with Admin/Deployments radio buttons. Reuse in both `ExportConfig.tsx` and `ImportConfig.tsx`. The config scope enum (`ConfigScope`) and radio button definitions will live in a shared constants/types location.

Alternative considered: Duplicating the radio group inline in both pages. Rejected because the user explicitly requested extraction for reuse.

**2. New `DeploymentConfigApi` class under `server/deployments/`**

Create `apps/ai-dial-admin/src/server/deployments/config.ts` with a `DeploymentConfigApi` class extending `BaseApi`. This class handles:
- `importConfig(file: FormData, resolutionPolicy: string)` — `POST /api/v1/configs/import?resolutionPolicy=<policy>` with multipart form-data
- `exportConfig(body: DeploymentExportRequest)` — `POST /api/v1/configs/export` with JSON body

Register as `deploymentConfigApi` in `api.ts` using `DIAL_DEPLOYMENTS_API_URL`.

Alternative considered: Extending `UtilityApi`. Rejected because `UtilityApi` is bound to `DIAL_ADMIN_API_URL` and deployment APIs use a different host.

**3. Conflict resolution policy as query parameter**

The deployment manager backend expects `resolutionPolicy` as a query parameter (not in the form body like the admin import). The `DeploymentConfigApi.importConfig` method will append it to the URL: `POST /api/v1/configs/import?resolutionPolicy=OVERWRITE`.

New enum `DeploymentImportResolutionPolicy` with values `OVERWRITE` and `SKIP_IF_EXISTS`. Mapped from UI labels Override and Skip.

Note: `BaseApi.postFiles` accepts a URL string, so the query param can be concatenated directly: `postFiles(\`/api/v1/configs/import?resolutionPolicy=${policy}\`, file, token)`.

**4. Conditional UI in import page based on config scope**

When config scope is "Deployments":
- Step 1 (Files): Hide the File Type radio group (only ZIP supported). Show conflict resolution with Override/Skip. Show ZIP file upload area.
- Step 2 (Configuration): Replace the preview grid with `DialNoDataContent` + `IconEyeOff` showing "Preview not available" message, with an Import button.

When config scope is "Admin": existing behavior unchanged.

Switching config scope resets all file upload state and conflict resolution to defaults (consistent with existing file type switch behavior in the import modal).

**5. Server actions for deployment import**

Add `importDeploymentConfig(file: FormData)` to `apps/ai-dial-admin/src/app/[lang]/import-config/actions.ts`. The FormData will contain the file. The resolution policy will be extracted from FormData and passed as a query parameter to the API.

## Risks / Trade-offs

- [Same API paths on different backends] The deployment manager uses `/api/v1/configs/import` just like the admin backend. Since they're different hosts (`DIAL_DEPLOYMENTS_API_URL` vs `DIAL_ADMIN_API_URL`), this works but could be confusing during debugging. Mitigation: Clear naming in the API class (`DeploymentConfigApi`).
- [No preview for deployment import] Users can't verify what will be imported before committing. Mitigation: Show clear "Preview not available" message. The Override/Skip policy provides a safety net.
- [Limited conflict policies] Only Override and Skip are supported. Additional policies can be added later if needed.
