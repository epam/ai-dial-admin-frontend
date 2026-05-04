## 1. Types and response model

- [x] 1.1 Add `ValidationError` interface and `ValidationState` enum to `apps/ai-dial-admin/src/types/deployments/import.ts`:
  - `ValidationError`: `{ entityType: string; entityIdentifier: string; fieldPath: string; message: string; }`
  - `ValidationState` enum: `VALIDATED`, `FAILED`
- [x] 1.2 Add `ExportConfigComponentType` enum to `apps/ai-dial-admin/src/types/deployments/import.ts` mirroring backend values: `MCP_DEPLOYMENT`, `ADAPTER_DEPLOYMENT`, `APPLICATION_DEPLOYMENT`, `INTERCEPTOR_DEPLOYMENT`, `NIM_DEPLOYMENT`, `INFERENCE_DEPLOYMENT`, `MCP_IMAGE_DEFINITION`, `ADAPTER_IMAGE_DEFINITION`, `APPLICATION_IMAGE_DEFINITION`, `INTERCEPTOR_IMAGE_DEFINITION`, `GLOBAL_DOMAIN_WHITELIST`
- [x] 1.3 Extend `DeploymentImportPreviewResponse` in `apps/ai-dial-admin/src/models/deployments/preview.ts` with `validationErrors?: ValidationError[]`
- [x] 1.4 Add internal model `RowImportMeta` type to `apps/ai-dial-admin/src/components/ImportConfig/ConfigurationPreview/models.ts` (new file): `{ entityIdentifier: string; validationState: ValidationState; validationErrors: ValidationError[]; }`
- [x] 1.5 Add `ValidationSummary` type in the same `models.ts`: `{ totalFailed: number; errorsByTab: Record<string, number>; }`

## 2. i18n

- [x] 2.1 Verify whether `Validated` / `Failed` exist under `BasicI18nKey` or other shared i18n sections (per repo rule); reuse if present
- [x] 2.2 Add new keys to `ImportI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts`:
  - `ValidationBannerMessage`
  - `ImportBlockedTooltip`
  - `Validated` (only if not reusable from a shared section)
  - `Failed` (only if not reusable from a shared section)
- [x] 2.3 Add corresponding strings to `apps/ai-dial-admin/src/locales/en.ts`:
  - `ValidationBannerMessage: '{count} artifacts could not be imported. Update or replace the invalid files and try uploading again.'`
  - `ImportBlockedTooltip: 'File errors must be resolved before importing'`
  - `Validated: 'Validated'`
  - `Failed: 'Failed'`
- [x] 2.4 Mirror new keys in any other locale files that exist (audit `apps/ai-dial-admin/src/locales/`) — only `en.ts` exists; `client.ts` / `server.ts` are setup files

## 3. Validation utilities

- [x] 3.1 In `apps/ai-dial-admin/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils.ts`, add `COMPONENT_TYPE_TO_TAB_ID: Record<ExportConfigComponentType, DeploymentExportEntityType>` covering all artifact component types (no `GLOBAL_DOMAIN_WHITELIST`)
- [x] 3.2 Add `filterArtifactErrors(errors: ValidationError[]): ValidationError[]` that drops `GLOBAL_DOMAIN_WHITELIST` entries
- [x] 3.3 Add `groupErrorsByEntity(errors: ValidationError[]): Map<string, ValidationError[]>` keyed by `${entityType}::${entityIdentifier}`
- [x] 3.4 Add `buildErrorsByTab(errors: ValidationError[]): Record<string, number>` using `COMPONENT_TYPE_TO_TAB_ID`
- [x] 3.5 Add `formatValidationLine(e: ValidationError): string` returning `${e.fieldPath}: ${e.message}` when `fieldPath` truthy, else `e.message`
- [x] 3.6 Update `getDeploymentConfigurationPreview` signature to additionally return `validationSummary: ValidationSummary`
- [x] 3.7 Inside `getDeploymentConfigurationPreview`, capture `__import.entityIdentifier` from `componentItem.next.name` *before* the IMAGE-tab transform that overwrites `name` (around current line 225)
- [x] 3.8 Inside `getDeploymentConfigurationPreview`, after building rows, attach `__import.validationState` and `__import.validationErrors` per row using the grouped errors
- [x] 3.9 Compute `validationSummary` (filtered errors): `totalFailed = filtered.length`, `errorsByTab = buildErrorsByTab(filtered)`

## 4. Validation banner component

- [x] 4.1 Create `apps/ai-dial-admin/src/components/ImportConfig/ConfigurationPreview/ValidationBanner.tsx`
  - Props: `{ count: number }`
  - Renders nothing when `count <= 0`
  - Otherwise renders `DialAlert` (error variant) with translated message including `count`
  - Use `useI18n()` and `ImportI18nKey.ValidationBannerMessage`

## 5. Validation state cell renderer

- [x] 5.1 Create `apps/ai-dial-admin/src/components/Grid/CellRenderers/ValidationStateCellRenderer.tsx`
  - Reads `params.data.__import` (typed via `RowImportMeta`)
  - `VALIDATED`: green dot (`bg-status-success` or theme equivalent — verify against existing `StatusCellRenderer` palette), label `t(ImportI18nKey.Validated)` (or shared key)
  - `FAILED`: red dot, label `t(ImportI18nKey.Failed)`, plus `IconExclamationCircle` wrapped in `DialTooltip`. Tooltip content joins each error via `formatValidationLine` separated by newlines (or `<br/>` JSX content if `DialTooltip` accepts `ReactNode`)
  - Layout: flex row with gap, mirror `StatusCellRenderer` padding
- [x] 5.2 Add `getValidationStateColumn(t)` helper in `ConfigurationPreview.utils.ts` returning `ColDef` that uses `ValidationStateCellRenderer`. Header: `t(ImportI18nKey.State)` if a `State` i18n key exists, otherwise reuse a shared label key

## 6. Wire up DeploymentConfigurationGrid

- [x] 6.1 In `apps/ai-dial-admin/src/components/ImportConfig/ConfigurationPreview/DeploymentConfigurationGrid.tsx`, append the State column from `getValidationStateColumn(t)` to `colDefs` for non-firewall tabs
- [x] 6.2 Verify image-tab rows still render their existing columns correctly (no regression from the join-key change)

## 7. Wire up ConfigurationPreview

- [x] 7.1 In `apps/ai-dial-admin/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.tsx`, capture `validationSummary` from `getDeploymentConfigurationPreview` into local state alongside existing `tabs` / `data`
- [x] 7.2 Render `<ValidationBanner count={validationSummary.totalFailed} />` above `<DialTabs />`
- [x] 7.3 When building tabs (in `getDeploymentConfigurationPreview` or by post-processing in the component), set `tab.invalid = (validationSummary.errorsByTab[tab.id] ?? 0) > 0`
- [x] 7.4 Extend `isImportDisabled` with `validationSummary.totalFailed > 0`
- [x] 7.5 When the disable reason is errors specifically, wrap `DialPrimaryButton` in `DialTooltip` showing `t(ImportI18nKey.ImportBlockedTooltip)`. Do not show the tooltip when disabled for other reasons (loading, no files)
- [x] 7.6 Remove the `console.log(res)` left at line 92 while in this file

## 8. Tests

- [x] 8.1 `ConfigurationPreview.utils.spec.ts` — `filterArtifactErrors`: input mixing artifact and `GLOBAL_DOMAIN_WHITELIST` errors → only artifact entries returned
- [x] 8.2 `ConfigurationPreview.utils.spec.ts` — `groupErrorsByEntity`: same `entityType + entityIdentifier` with three messages → one group of three
- [x] 8.3 `ConfigurationPreview.utils.spec.ts` — `buildErrorsByTab`: errors across `MCP_DEPLOYMENT` and `MCP_IMAGE_DEFINITION` → `{ MCP_CONTAINER: n, IMAGE: m }`
- [x] 8.4 `ConfigurationPreview.utils.spec.ts` — `formatValidationLine`: with non-empty `fieldPath` → `field: message`; with empty `fieldPath` → message only
- [x] 8.5 `ConfigurationPreview.utils.spec.ts` — `getDeploymentConfigurationPreview`:
  - empty/absent `validationErrors` → all rows `VALIDATED`, summary `totalFailed: 0`, no tabs marked
  - mixed valid/invalid rows on a single tab → only failing rows have `__import.validationState === 'FAILED'`
  - errors keyed only by `GLOBAL_DOMAIN_WHITELIST` → summary clean (filtered out)
  - **IMAGE-tab join correctness**: a `MCP_IMAGE_DEFINITION` error with `entityIdentifier = "img-foo"` matches the row whose `next.name === "img-foo"` even after the IMAGE-tab transform clobbers `row.name`
  - identifier collision: `MCP_DEPLOYMENT 'echo'` errors do not bleed into `ADAPTER_DEPLOYMENT 'echo'` rows
- [x] 8.6 `ValidationBanner.spec.tsx` — renders when `count > 0` with translated message including count; renders nothing when `count === 0`
- [x] 8.7 `ValidationStateCellRenderer.spec.tsx` —
  - VALIDATED row: green dot + `Validated` label, no tooltip trigger
  - FAILED row with two errors: red dot + `Failed` label + tooltip content lists both lines via `formatValidationLine`
  - FAILED row with `fieldPath: ""`: tooltip line is message-only
- [x] 8.8 `ConfigurationPreview.spec.tsx` —
  - response with errors → banner visible, Import button disabled, tooltip shows `ImportBlockedTooltip` on hover
  - response without errors → banner hidden, Import button enabled (assuming files present)
  - tabs that have errors carry `invalid: true`
- [x] 8.9 Reuse existing mocks from `apps/ai-dial-admin/test-setup.tsx` (no new global mocks expected). Verify `previewDeploymentImportConfig` mock supports returning a response with `validationErrors`
- [x] 8.10 Update `apps/ai-dial-admin/src/components/ImportConfig/tests/ImportConfig.spec.tsx` if any existing assertion depends on the preview response shape

## 9. Quality checks

- [x] 9.1 Run `npm run lint` from repo root and fix any issues
- [x] 9.2 Run `npm run format:write` to apply formatting
- [x] 9.3 Run `npm run test` (from `apps/ai-dial-admin/`) and ensure no regressions
- [x] 9.4 Run `npm run build` to confirm no TypeScript errors introduced
