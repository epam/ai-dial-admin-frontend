## Why

GitHub issue [#2925](https://github.com/epam/ai-dial-admin-frontend/issues/2925) asks the deployments Config Import preview to surface validation errors before the user clicks Import. The deployment manager backend (PR for spec `010-import-validations`) now validates every deserialized entity during preview and returns a `validationErrors` array on `ImportConfigPreviewDto`. Today the frontend ignores this field — invalid configs only fail at import time with a generic error toast, forcing users to guess what to fix and re-upload blind.

## What Changes

- **Response model**: extend `DeploymentImportPreviewResponse` (`src/models/deployments/preview.ts`) with `validationErrors?: ValidationError[]`. Add `ValidationError`, `ValidationState`, and `ExportConfigComponentType` under `src/types/deployments/import.ts`. Add `RowImportMeta` and `ValidationSummary` under `src/models/deployments/import.ts`.
- **Per-row enrichment**: in `getDeploymentConfigurationPreview` (`src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils.ts`), join errors to rows and attach a `__import` namespace per row carrying `{ validationState, validationErrors }`.
- **Multi-candidate join**: for each row, try matching against `next.name`, `next.id`, `next.name(version)`, `prev.name`, `prev.id`, `prev.name(version)` (in that order), scoped by `entityType`. The composite `${name}(${version})` candidate handles the BE's image-definition convention; capturing from the original `componentItem.next` (not display fields) survives the IMAGE-tab transform that clobbers `row.name`.
- **Filter whitelist errors**: errors with `entityType === 'GLOBAL_DOMAIN_WHITELIST'` are dropped from the FE — out of scope for this change (rare hand-edit case; backend still rejects on Import, surfaced via existing toast).
- **Per-tab banner**: new `ValidationBanner` renders a red `DialNotification` *inside* the active tab's content area (between `DialTabs` and the grid) when `validationSummary.errorsByTab[selectedTab] > 0`. Message is composed of two i18n keys — `ValidationBannerHeading` (semi-bold, with `{count}`) followed by `ValidationBannerHelp` (regular).
- **State column**: new `ImportValidationCellRenderer` (`src/components/Grid/CellRenderers/`) appended to `colDefs` via `DeploymentConfigurationGrid`. Renders `IconCheck` (green) for `VALIDATED`, `IconX` (red) for `FAILED`, plus a right-aligned (`ml-auto`) `IconInfoCircle` (gray, `text-secondary`) wrapped in `DialTooltip` for failed rows. The info icon carries `aria-label` matching the state label.
- **Tab indicator**: tabs whose component-type errors > 0 get `invalid: true` on their `TabModel` — the existing `DialTab` renders a red `IconExclamationCircle` next to the label automatically. Reuses ui-kit affordance.
- **Configuration step status**: `ConfigurationPreview` exposes an `onValidationChange(hasErrors)` callback that `ImportConfig` uses to set the Configuration step's `status` to `StepStatus.ERROR` (when errors exist) or `StepStatus.VALID` (when clean) on the wizard `DialSteps`.
- **Import button gate**: `ConfigurationPreview` extends `isImportDisabled` with `totalFailed > 0`. The Import button is wrapped in a single `DialTooltip` whose `hideTooltip` is true unless errors are the SOLE disable reason; tooltip text is *"File errors must be resolved before importing"*.
- **Import-time 400**: unchanged. Existing `getErrorNotification` toast covers the rare race where the file changes between preview and import.

## Non-goals

- **No checkboxes / no partial import.** Backend `010-import-validations` FR-006 forbids partial imports of valid entities when others are invalid. The current `POST /configs/import` endpoint accepts only the whole file plus `resolutionPolicy` — no per-entity selection.
- **No global firewall validation UI.** Per-domain errors (`GLOBAL_DOMAIN_WHITELIST`) are filtered out. The Global Firewall tab renders unchanged.
- **No changes to admin (non-deployment) Config Import.** `ConfigurationGrid` and `getConfigurationPreview` are untouched. This change is scoped to `isDeployments === true`.
- **No 400-message parsing.** Errors that arrive only at import time (not preview) continue to surface as the existing generic toast — they should be vanishingly rare once preview validation gates the button.
- **No changes to `previewDeploymentImportConfig` action signature** — only the response shape evolves.

## Capabilities

### New Capabilities

- `deployment-import-preview-validation-errors`: per-tab banner, per-row state cell, tab error indicator, Configuration wizard step status, Import button gate — all driven by the new `validationErrors` field on the preview response.

## Impact

- **Models / types**:
  - `src/models/deployments/preview.ts` — extend response with `validationErrors?`.
  - `src/types/deployments/import.ts` — add `ValidationError`, `ValidationState`, `ExportConfigComponentType`.
  - `src/models/deployments/import.ts` (new) — `RowImportMeta`, `ValidationSummary`.
- **Constants**:
  - `src/constants/import.tsx` — add `ROW_IMPORT_META_KEY`.
  - `src/constants/deployments/import.ts` (new) — `GLOBAL_FIREWALL_TAB_ID`, `DEPLOYMENT_RESPONSE_KEYS`, `COMPONENT_TYPE_TO_TAB_ID`.
- **Utils**: `src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils.ts` — extend `getDeploymentConfigurationPreview` to return `validationSummary`; add `filterArtifactErrors`, `groupErrorsByEntity`, `buildErrorsByTab`, `formatValidationLine`, `getRowCandidateIdentifiers`, `buildRowImportMeta`.
- **Components**:
  - `ConfigurationPreview.tsx` — capture summary, render per-tab banner, extend `isImportDisabled`, wrap Import button in `DialTooltip` with `hideTooltip` prop, surface validation status to parent via `onValidationChange`.
  - `ImportConfig.tsx` — add `onValidationChange` handler to update Configuration step status.
  - `DeploymentConfigurationGrid.tsx` — append State column to `colDefs`.
  - New `ValidationBanner.tsx` co-located under `ConfigurationPreview/`.
  - New `ImportValidationCellRenderer.tsx` under `src/components/Grid/CellRenderers/`.
- **i18n**: new keys under `ImportI18nKey` in `src/constants/i18n.ts` and `src/locales/en.ts` — `ValidationBannerHeading`, `ValidationBannerHelp`, `ImportBlockedTooltip`, `State`. New `BasicI18nKey.Validated` (reuses existing `BasicI18nKey.Failed`). Reuse existing `ButtonsI18nKey.Import`.
- **Test setup**: `test-setup.tsx` global `useI18n` mock returns a closure-stable `t` (matches `next-international` semantics) so components with `t` in effect deps don't loop. No per-test override needed.
- **Tests**: new specs covering joining/grouping/summary, multi-candidate matching (including IMAGE-tab clobber and `${name}(${version})` composite), banner visibility, cell renderer states, button disable + tooltip, per-tab banner switching, failed-preview toast path. Centralized mocks in `test-setup.tsx` reused.
- **Behavior**:
  - Valid previews render exactly as today (no banner, no Step status changes, Import enabled).
  - Previews with errors block Import, mark failed rows, mark failed tabs, mark Configuration step as error, show per-tab banner — without changing existing layout, scrolling, or load states.
- **Backend dependency**: requires deployment manager backend to emit `validationErrors` on `ImportConfigPreviewDto`. Spec `010-import-validations` in `ai-dial-admin-mcp-manager-backend`. Until BE ships, the FE tolerates absent/empty `validationErrors` (treated as no errors — same as today's behavior).
