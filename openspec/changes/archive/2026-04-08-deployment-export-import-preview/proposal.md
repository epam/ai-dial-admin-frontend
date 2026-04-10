## Why

The deployment manager backend now supports export and import previews (PRs #224, #225, #229, #235 — all merged). The frontend currently shows "Preview currently unavailable" with an eye-off icon for all deployment export/import operations, making it impossible for users to review what will be exported or imported before committing. This creates a blind-spot workflow where users must export/import without seeing the contents first.

## What Changes

- **Export preview enabled for deployments** — `PreviewModal` calls `POST /configs/export/preview` instead of showing "Preview unavailable"; tabbed grid shows entities grouped by type (Images, MCP Container, etc.) with Display name, Description, ID columns
- **Import preview enabled for deployments** — `ConfigurationPreview` calls `POST /configs/import/preview` instead of showing "Preview unavailable"; tabbed grid shows entities with Action column (Create/Update/Skip) plus entity details
- **Global Firewall tab on import** — dedicated tab showing domain whitelist entries with "Compare changes" button opening a Before/After diff popup with AG Grid domain tables and color-coded additions
- **Shared constants extracted** — `DEPLOYMENT_ENTITY_TABS` single-sourced for export/import tab generation, `DIFF_ROW_CLASS_RULES` extracted to `ag-grid.ts`, `DomainList` component extracted from `Whitelists`

## Capabilities

### New Capabilities

- `deployment-export-preview`: Export preview modal shows deployment entities in tabbed grid (Images, container types) with Display name, Description, ID columns; "Include secrets" and "Include global firewall" checkboxes affect exported file only (not preview); button label "Prepare file"
- `deployment-import-preview`: Import configuration step shows deployment entities in tabbed grid with Action column (Create/Update/Skip with colored status dots), Display name, Description, ID; same patterns as admin import preview
- `global-firewall-preview`: Dedicated "Global Firewall" tab (no counter) on import preview showing domain whitelist via `DomainList` component; `DialGhostButton` with `IconReplace` opens `GlobalFirewallCompareModal` — a `DialPopup` with `LabelledText` header, `DiffLegend`, and two `GridView` tables (Before/After) using `DIFF_ROW_CLASS_RULES` for row highlighting

### Modified Capabilities

- `Whitelists` component refactored to use new `DomainList` component for global domain list rendering
- `AuditEntityGrid` refactored to use shared `DIFF_ROW_CLASS_RULES` from `ag-grid.ts`

## Impact

### Code
- **Modified API**: `src/server/deployments/config.ts` — add `previewExportConfig` and `previewImportConfig` methods
- **Modified actions**: `src/app/[lang]/export-config/actions.ts` — add `previewDeploymentExportConfig` server action
- **Modified actions**: `src/app/[lang]/import-config/actions.ts` — add `previewDeploymentImportConfig` server action
- **Modified components**:
  - `ExportConfig/Preview/PreviewModal.tsx` — remove `isDeploymentExport` guard, add deployment preview API call and tab/grid rendering, "Prepare file" button label
  - `ExportConfig/ExportConfig.tsx` — pass `deploymentExportRequest` via `buildDeploymentExportPreviewRequest` util
  - `ExportConfig/deployment-utils.ts` — export `DEPLOYMENT_ENTITY_TABS`, add `buildDeploymentExportPreviewRequest`
  - `ImportConfig/ConfigurationPreview/ConfigurationPreview.tsx` — remove `isDeployments` guard, add deployment preview API call, delegate to `DeploymentConfigurationGrid`
  - `ImportConfig/ConfigurationPreview/ConfigurationPreview.utils.ts` — add `getDeploymentConfigurationPreview` with deployment key mapping
  - `ExportConfig/Preview/utils.ts` — add `getDeploymentExportPreviewTabs` reusing `DEPLOYMENT_ENTITY_TABS`
  - `Deployments/Common/Whitelists/Whitelists.tsx` — refactored to use `DomainList`
  - `ActivityAudit/EntityGrid/EntityGrid.tsx` — refactored to use `DIFF_ROW_CLASS_RULES`
  - `constants/ag-grid.ts` — add `DIFF_ROW_CLASS_RULES`
  - `constants/grid-columns/grid-columns.tsx` — add `DOMAIN_COLUMN`
  - `constants/i18n.ts` + `locales/en.ts` — add `ButtonsI18nKey.PrepareFile`
- **New components**:
  - `Deployments/Common/Whitelists/DomainList.tsx` — read-only domain list with Cloud icon (extracted from `Whitelists`)
  - `ImportConfig/ConfigurationPreview/DeploymentConfigurationGrid.tsx` — deployment entity grid + Global Firewall tab rendering
  - `ImportConfig/ConfigurationPreview/GlobalFirewallCompareModal.tsx` — Before/After diff popup with `GridView` tables and `DIFF_ROW_CLASS_RULES` highlighting
- **New types**: `src/types/deployments/preview.ts` — `DeploymentExportPreviewResponse`, `DeploymentImportPreviewResponse`, `ExportComponentInfo`

### APIs consumed (already implemented on BE)
- `POST /api/v1/configs/export/preview` — deployment export preview (same request as export, returns `ExportComponentInfo[]` grouped by type; BE returns lowercase type values e.g. `mcp_deployment`)
- `POST /api/v1/configs/import/preview` — deployment import preview (multipart/form-data + resolutionPolicy, returns `ImportComponentDto<T>[]` per entity type + `globalImageBuildDomainWhitelist`)

### Non-goals
- Validation errors display (`validationErrors` field from BE PR #235) — deferred
- Per-row "Compare changes" for deployment entities — deferred
- JSON Editor toggle on import preview — deferred
- Changes to admin (non-deployment) export/import flows
