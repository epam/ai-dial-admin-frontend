## 1. Types and Constants

- [ ] 1.1 Create `DeploymentImportResolutionPolicy` enum (`OVERWRITE`, `SKIP_IF_EXISTS`) in `types/deployments/import.ts`
- [ ] 1.2 Create `ConfigScope` enum (`ADMIN`, `DEPLOYMENTS`) in a shared types location (e.g., `types/config-scope.ts`)
- [ ] 1.3 Add deployment import resolution radio button constants in `constants/import.tsx` (Override mapped to `OVERWRITE`, Skip mapped to `SKIP_IF_EXISTS`)

## 2. API Layer

- [ ] 2.1 Create `DeploymentConfigApi` class in `server/deployments/config.ts` with `importConfig(file: FormData, resolutionPolicy: string)` method that sends `POST /api/v1/configs/import?resolutionPolicy=<policy>` with multipart form-data
- [ ] 2.2 Register `deploymentConfigApi` instance in `app/api/api.ts` using `DIAL_DEPLOYMENTS_API_URL`
- [ ] 2.3 Add `importDeploymentConfig` server action in `app/[lang]/import-config/actions.ts` that extracts the resolution policy from FormData and calls `deploymentConfigApi.importConfig`

## 3. Shared Config Scope Selector

- [ ] 3.1 Create `ConfigScopeSelector` component in `components/Common/ConfigScopeSelector/` with Admin/Deployments radio buttons using `DialRadioGroup`
- [ ] 3.2 Refactor `ExportConfig.tsx` to use the new `ConfigScopeSelector` component instead of inline radio group (if one exists)

## 4. Import Page UI Changes

- [ ] 4.1 Add `ConfigScopeSelector` to `ImportConfig.tsx` — render it inside the Files step, controlling a `configScope` state
- [ ] 4.2 Update `Files.tsx` to accept a `configScope` prop — when Deployments: hide File Type radio group, show only ZIP upload, show Override/Skip conflict resolution
- [ ] 4.3 Create deployment-specific `ConfigurationPreview` variant (or add conditional inside existing) that shows `DialNoDataContent` + `IconEyeOff` with "Preview not available" message and an Import button
- [ ] 4.4 Wire up the Import button in the deployment preview step to call `importDeploymentConfig` server action
- [ ] 4.5 Update `ImportConfig.tsx` to pass `configScope` through to Files and ConfigurationPreview, and use deployment import action when config scope is Deployments
- [ ] 4.6 Reset file upload state and conflict resolution when config scope changes (clear files, reset resolution to default)
- [ ] 4.7 Add import notifications for deployment import: loading spinner during import, success toast on completion, error toast on failure (reuse existing notification utils)

## 5. Tests

- [ ] 5.1 Add unit tests for `DeploymentConfigApi` import method
- [ ] 5.2 Add tests for `ConfigScopeSelector` component
- [ ] 5.3 Add tests for import page behavior when Deployments is selected (file type hidden, preview not available shown)
