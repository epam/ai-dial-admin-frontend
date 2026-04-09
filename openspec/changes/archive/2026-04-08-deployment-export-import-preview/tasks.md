## 1. Types and API layer

- [x] 1.1 Create `src/types/deployments/preview.ts`: `DeploymentExportPreviewResponse`, `ExportComponentInfo`, `DeploymentImportPreviewResponse`
- [x] 1.2 Extend `src/server/deployments/config.ts`: add `previewExportConfig` (via `postAction`) and `previewImportConfig` (via `postFiles`) methods with preview URL constants
- [x] 1.3 Add server action `previewDeploymentExportConfig` in `src/app/[lang]/export-config/actions.ts`
- [x] 1.4 Add server action `previewDeploymentImportConfig` in `src/app/[lang]/import-config/actions.ts`

## 2. i18n keys

- [x] 2.1 Add `ButtonsI18nKey.PrepareFile` ("Prepare file") to `src/constants/i18n.ts` and `src/locales/en.ts`; reuse existing keys `DeploymentsI18nKey.GlobalFirewall`, `DeploymentsI18nKey.GlobalWhitelist`, `CompareI18nKey.CompareChanges`

## 3. Shared constants and components

- [x] 3.1 Export `DEPLOYMENT_ENTITY_TABS` from `src/components/ExportConfig/deployment-utils.ts` — single source for tab definitions used by export preview, import preview, and `DeploymentConfigContent`
- [x] 3.2 Add `buildDeploymentExportPreviewRequest` utility to `deployment-utils.ts` — builds `DeploymentExportRequest` with `$type: Custom`, `addSecrets: false`, `addGlobalImageBuildDomainWhitelist: false`
- [x] 3.3 Extract `DIFF_ROW_CLASS_RULES` to `src/constants/ag-grid.ts` — shared by `AuditEntityGrid` and `GlobalFirewallCompareModal`
- [x] 3.4 Add `DOMAIN_COLUMN` to `src/constants/grid-columns/grid-columns.tsx` — Cloud icon cell renderer, no filter/sort
- [x] 3.5 Create `src/components/Deployments/Common/Whitelists/DomainList.tsx` — read-only domain list with Cloud icons, extracted from `Whitelists.tsx`
- [x] 3.6 Refactor `Whitelists.tsx` to use `DomainList` component
- [x] 3.7 Refactor `AuditEntityGrid` to use `DIFF_ROW_CLASS_RULES` from `ag-grid.ts`

## 4. Export preview — deployment support

- [x] 4.1 Add `getDeploymentExportPreviewTabs` in `src/components/ExportConfig/Preview/utils.ts`: groups `deployments` by `type` (normalized to uppercase) into `DEPLOYMENT_ENTITY_TABS` categories; uses `toDeploymentGridData` for containers and `toImageGridData` for images (different field mappings for grid columns)
- [x] 4.2 Update `PreviewModal.tsx`: remove `isDeploymentExport` guard; add deployment preview `useEffect` calling `previewDeploymentExportConfig`; render `GridView` with `getDeploymentColDefs` for deployments; change button label to "Prepare file"; pass `deploymentExportRequest` prop built via `buildDeploymentExportPreviewRequest`
- [x] 4.3 Update `ExportConfig.tsx`: pass `deploymentExportRequest` to `PreviewModal` using `buildDeploymentExportPreviewRequest`

## 5. Import preview — deployment support

- [x] 5.1 Add `getDeploymentConfigurationPreview` in `ConfigurationPreview.utils.ts`: maps BE response keys to `DEPLOYMENT_ENTITY_TABS` categories; extracts `globalImageBuildDomainWhitelist` separately; uses `getConfigurationItems`/`getPrevItems` pattern
- [x] 5.2 Create `DeploymentConfigurationGrid.tsx`: renders entity grid with `getComponentActionColumn()` + `getDeploymentColDefs()` for non-firewall tabs; renders `DomainList` + `DialGhostButton` (Compare changes with `IconReplace`) for Global Firewall tab
- [x] 5.3 Update `ConfigurationPreview.tsx`: remove `isDeployments` guard; add deployment preview `useEffect`; delegate to `DeploymentConfigurationGrid` for deployment rendering

## 6. Global Firewall compare modal

- [x] 6.1 Create `GlobalFirewallCompareModal.tsx`: `DialPopup` with `LabelledText` (Action + Resource type), `DiffLegend` (added count), two `GridView` tables (Before/After) using `DOMAIN_COLUMN` and `DIFF_ROW_CLASS_RULES`; action text capitalized

## 7. Tests

- [x] 7.1 Unit tests for `getDeploymentExportPreviewTabs`: tab generation, empty types omitted, counts in labels, lowercase BE type handling, image vs container field mapping
- [x] 7.2 Unit tests for `getDeploymentConfigurationPreview`: BE key → tab mapping, action extraction, prev/next splitting, Global Firewall extraction
- [x] 7.3 Unit tests for `buildDeploymentExportPreviewRequest`: correct request shape
- [x] 7.4 Component tests for `PreviewModal`: deployment grid renders, "Prepare file" button, "Include global firewall" checkbox
- [x] 7.5 Fix pre-existing TS issues in `ConfigurationPreview.utils.spec.ts`: proper typing with `makeItem` helper, `tabs[].label` instead of `.name`, typed `FileConfiguration`

## 8. Quality

- [x] 8.1 Run `npm run lint` — 0 errors
- [x] 8.2 Run `npm run format:write`
- [x] 8.3 Run `npm run test` — all tests pass
