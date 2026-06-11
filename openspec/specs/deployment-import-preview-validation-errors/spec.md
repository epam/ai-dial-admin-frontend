# deployment-import-preview-validation-errors Specification

## Purpose
TBD - created by archiving change deployment-import-preview-validation-errors. Update Purpose after archive.

## Requirements

### Requirement: Preview response carries validation errors
The frontend `DeploymentImportPreviewResponse` model SHALL accept an optional `validationErrors: ValidationError[]` field where each `ValidationError` is `{ entityType: string; entityIdentifier: string; fieldPath: string; message: string; }`. When the field is absent or empty the preview MUST behave identically to a no-error preview.

Backend contract reference: `ai-dial-admin-mcp-manager-backend` spec `010-import-validations`, `ImportConfigPreviewDto`.

#### Scenario: Backend returns no validation errors
- **WHEN** the preview response omits `validationErrors` or returns an empty array
- **THEN** every row carries `__import.validationState = 'VALIDATED'`, no banner is rendered on any tab, no tab is marked invalid, and the Import button is enabled (assuming files are present and not loading)

#### Scenario: Backend returns validation errors
- **WHEN** the preview response includes `validationErrors` with entries for at least one artifact entity
- **THEN** matching rows carry `__import.validationState = 'FAILED'`, the validation banner is rendered inside the affected tab's content area, affected tabs are marked invalid, the Configuration wizard step is marked `StepStatus.ERROR`, and the Import button is disabled

---

### Requirement: Multi-candidate row-to-error matching
The matcher SHALL try each row against multiple candidate identifiers, in order, until one matches an error keyed as `${entityType}::${candidate}`. Candidate identifiers are derived from `componentItem.next` and `componentItem.prev`, in the order: `next.name`, `next.id`, `next.name(next.version)` (composite), `prev.name`, `prev.id`, `prev.name(prev.version)`. Matching MUST happen against the original `componentItem.next` data — never against display fields that may have been clobbered for the IMAGE tab. The pair is scoped by `entityType` so identifier collisions across entity types do not cross-match.

#### Scenario: Image-tab row joins by next.name even after row.name is clobbered
- **WHEN** an `MCP_IMAGE_DEFINITION` error has `entityIdentifier: "img-foo"` and the corresponding row's `next.name` is `"img-foo"` while the IMAGE-tab transform clobbers `row.name` with `prev.id`
- **THEN** the row receives `__import.validationState = 'FAILED'`

#### Scenario: Image error keyed as `${name}(${version})` matches via composite candidate
- **WHEN** a row has `next.name === "Registry image"` and `next.version === "1.0.0"`, and the error's `entityIdentifier` is `"Registry image(1.0.0)"`
- **THEN** the row receives `__import.validationState = 'FAILED'`

#### Scenario: Identifier collision across entity types is safe
- **WHEN** an `MCP_DEPLOYMENT` named `"echo"` and an `ADAPTER_DEPLOYMENT` named `"echo"` both exist, and an error targets only `MCP_DEPLOYMENT 'echo'`
- **THEN** only the MCP row is marked `FAILED`; the adapter row remains `VALIDATED`

---

### Requirement: Per-row enrichment under `__import` namespace
Each row in the deployment preview SHALL receive `row.__import = { validationState, validationErrors }`. Original entity fields (other than the FE-only `__import` namespace) MUST NOT be modified by validation enrichment.

#### Scenario: Failed row aggregates all matching errors
- **WHEN** an entity has three `validationErrors` entries with the same `entityType + entityIdentifier`
- **THEN** the row's `__import.validationErrors` contains all three entries in arrival order and `__import.validationState === 'FAILED'`

#### Scenario: Validated row keeps an empty error list
- **WHEN** none of a row's candidate identifiers match any error entry
- **THEN** the row's `__import.validationState === 'VALIDATED'` and `__import.validationErrors` is an empty array

---

### Requirement: Per-tab validation banner
A `ValidationBanner` component SHALL render inside the active tab's content area (between `DialTabs` and the grid) whenever `validationSummary.errorsByTab[selectedTab] > 0`. The banner MUST render nothing for tabs that have no failures and for the Global Firewall tab. The message SHALL be composed of two i18n keys: `ImportI18nKey.ValidationBannerHeading` (rendered with `dial-small-semi-text`, interpolating `{count}`) followed by `ImportI18nKey.ValidationBannerHelp` (rendered with `dial-small-text`). The component uses `DialNotification` with `NotificationVariant.Error`.

#### Scenario: Banner appears on the active tab when that tab has errors
- **WHEN** the active tab's failure count is `2`
- **THEN** the banner is visible inside that tab's content area, rendered as a `DialNotification` whose message contains the heading text (semi-bold, with the count interpolated) and the help text (regular weight)

#### Scenario: Banner is hidden when active tab has no errors
- **WHEN** the active tab's failure count is `0`
- **THEN** no banner element is rendered

#### Scenario: Switching tabs swaps the banner
- **WHEN** the user switches from a clean tab to a tab with failures (or vice versa)
- **THEN** the banner is rendered or removed accordingly, reflecting only the newly-active tab's count

---

### Requirement: Per-tab error indicator via `TabModel.invalid`
Each `TabModel` for an artifact tab SHALL set `invalid: true` when its error count (computed via `COMPONENT_TYPE_TO_TAB_ID`) is greater than zero. The Global Firewall tab SHALL set `invalid: true` when one or more `GLOBAL_DOMAIN_WHITELIST` errors are present in the preview response, and `invalid: false` otherwise. The visual rendering of the indicator is provided by `DialTab` from `@epam/ai-dial-ui-kit` (red `IconExclamationCircle` next to the label) and MUST NOT be reimplemented.

#### Scenario: Tab with errors is marked invalid
- **WHEN** `errorsByTab.MCP_CONTAINER === 5`
- **THEN** the `MCP_CONTAINER` `TabModel` has `invalid: true`, and the existing `DialTab` rendering surfaces the red exclamation icon next to the label

#### Scenario: Global Firewall tab is marked invalid when a domain fails
- **WHEN** the preview response includes at least one `GLOBAL_DOMAIN_WHITELIST` error
- **THEN** the Global Firewall `TabModel` has `invalid: true` and the red exclamation icon is surfaced next to its label

#### Scenario: Global Firewall tab is valid when no domain fails
- **WHEN** the preview response includes no `GLOBAL_DOMAIN_WHITELIST` error
- **THEN** the Global Firewall `TabModel` has `invalid: false`

---

### Requirement: Configuration wizard step reflects validation status
The `Configuration` step in the import wizard (`DialSteps`) SHALL be marked with `StepStatus.ERROR` when `validationSummary.totalFailed > 0`, and `StepStatus.VALID` otherwise. `validationSummary.totalFailed` SHALL count both artifact-entity failures and `GLOBAL_DOMAIN_WHITELIST` (firewall domain) errors. The status update is driven from `ConfigurationPreview` via an `onValidationChange(hasErrors: boolean)` callback to `ImportConfig`.

#### Scenario: Step turns red when an artifact fails
- **WHEN** the deployment preview returns at least one artifact validation error
- **THEN** the Configuration step's `status` is `StepStatus.ERROR`

#### Scenario: Step turns red when only a firewall domain fails
- **WHEN** the deployment preview returns only `GLOBAL_DOMAIN_WHITELIST` errors and no artifact errors
- **THEN** `validationSummary.totalFailed > 0` and the Configuration step's `status` is `StepStatus.ERROR`

#### Scenario: Step turns green when preview is clean
- **WHEN** the deployment preview returns no artifact errors and no firewall errors
- **THEN** the Configuration step's `status` is `StepStatus.VALID`

---

### Requirement: State column with tooltip
`DeploymentConfigurationGrid` SHALL append a State column to its `colDefs` for all non-firewall tabs. The cell renderer MUST be `ImportValidationCellRenderer` (located at `src/components/Grid/CellRenderers/ImportValidationCellRenderer.tsx`). For `VALIDATED` rows it renders `IconCheck` (with `text-success`) plus the translated `Validated` label. For `FAILED` rows it renders `IconX` (with `text-error`) plus the translated `Failed` label, plus a right-aligned `IconInfoCircle` (with `text-secondary`) wrapped in `DialTooltip` whose content lists every error in `__import.validationErrors`. The info icon MUST carry an `aria-label` matching the state label (`Failed`). Tooltip lines MUST be formatted via `formatValidationLine`: `${fieldPath}: ${message}` when `fieldPath` is non-empty, else `${message}`.

#### Scenario: Validated row shows green check + Validated label
- **WHEN** a row has `__import.validationState === 'VALIDATED'`
- **THEN** the State cell renders an `IconCheck` styled with `text-success`, the label `t(BasicI18nKey.Validated)`, and no tooltip trigger

#### Scenario: Failed row shows red X + label + right-aligned info icon
- **WHEN** a row has `__import.validationState === 'FAILED'` with two errors `{ fieldPath: 'name', message: 'invalid' }` and `{ fieldPath: 'displayName', message: 'must not be null' }`
- **THEN** the State cell renders an `IconX` styled with `text-error`, the label `t(BasicI18nKey.Failed)`, and a right-aligned (`ml-auto`) `IconInfoCircle` styled with `text-secondary`. Hovering the info icon opens a `DialTooltip` containing two lines: `name: invalid` and `displayName: must not be null`

#### Scenario: Empty fieldPath renders message-only line
- **WHEN** a row's error has `fieldPath: ''` and `message: 'Mapping failed: NPE'`
- **THEN** the tooltip line is exactly `Mapping failed: NPE` (no leading colon, no `:` prefix)

#### Scenario: State column is absent on Global Firewall tab
- **WHEN** the active tab is `GLOBAL_FIREWALL`
- **THEN** the rendered grid does not include a State column

---

### Requirement: Import button gated by errors with hover tooltip
`isImportDisabled` SHALL be true when `validationSummary.totalFailed > 0`, in addition to existing disable conditions (loading, missing files, ongoing import). Because `validationSummary.totalFailed` counts `GLOBAL_DOMAIN_WHITELIST` errors, an invalid firewall domain alone SHALL disable the Import button. The Import button SHALL be wrapped in a single `DialTooltip` whose `hideTooltip` prop is `true` unless the button is disabled SOLELY because of validation errors. When shown, the tooltip text is `t(ImportI18nKey.ImportBlockedTooltip)`.

#### Scenario: Artifact errors block Import with tooltip
- **WHEN** `validationSummary.totalFailed > 0` from artifact errors and files are present and not loading
- **THEN** the Import button is disabled and hovering it surfaces a `DialTooltip` with text `t(ImportI18nKey.ImportBlockedTooltip)`

#### Scenario: Firewall-only errors block Import
- **WHEN** the only validation errors are `GLOBAL_DOMAIN_WHITELIST` errors and files are present and not loading
- **THEN** the Import button is disabled and hovering it surfaces the `ImportBlockedTooltip`

#### Scenario: No tooltip when blocked for other reasons
- **WHEN** the Import button is disabled because no files are selected (and `validationSummary.totalFailed === 0`)
- **THEN** hovering the Import button does not surface the error tooltip

---

### Requirement: Component-type to tab-id mapping
The frontend SHALL define `COMPONENT_TYPE_TO_TAB_ID` (located at `src/constants/deployments/import.ts`) covering: `MCP_DEPLOYMENT → MCP_CONTAINER`, `ADAPTER_DEPLOYMENT → ADAPTER_CONTAINER`, `APPLICATION_DEPLOYMENT → APPLICATION_CONTAINER`, `INTERCEPTOR_DEPLOYMENT → INTERCEPTOR_CONTAINER`, `NIM_DEPLOYMENT → MODEL_SERVING`, `INFERENCE_DEPLOYMENT → MODEL_SERVING`, `MCP_IMAGE_DEFINITION → IMAGE`, `ADAPTER_IMAGE_DEFINITION → IMAGE`, `APPLICATION_IMAGE_DEFINITION → IMAGE`, `INTERCEPTOR_IMAGE_DEFINITION → IMAGE`. `GLOBAL_DOMAIN_WHITELIST` MUST NOT appear in this map.

#### Scenario: NIM and Inference both map to MODEL_SERVING
- **WHEN** errors arrive with `entityType: 'NIM_DEPLOYMENT'` and `entityType: 'INFERENCE_DEPLOYMENT'`
- **THEN** both contribute to `errorsByTab.MODEL_SERVING`

#### Scenario: All image-definition variants map to IMAGE
- **WHEN** errors arrive with `entityType` of any `*_IMAGE_DEFINITION` value
- **THEN** they all contribute to `errorsByTab.IMAGE`

---

### Requirement: Admin Config Import path unaffected
The admin Config Import path (`isDeployments === false`) SHALL remain untouched. `ConfigurationGrid` and `getConfigurationPreview` MUST NOT change behavior. No banner, State column, tab indicator, or Configuration step status driven by `validationErrors` is added to the admin path.

#### Scenario: Admin import preview unchanged
- **WHEN** the user opens Config Import with `configScope` set to admin (not deployments)
- **THEN** the preview renders exactly as before this change: no validation banner, no State column, no `TabModel.invalid` driven by validation errors, no Configuration step error status

---

### Requirement: Import-time 400 surfaces as toast
The `importDeploymentConfig` action's error path SHALL remain identical to today: backend `400 Bad Request` responses surface via `getErrorNotification` as a toast. This change MUST NOT parse or restructure the 400 message body.

#### Scenario: Race-time backend 400 still toasts
- **WHEN** the file changes between preview and import (or preview is skipped) and the backend returns 400 with a flattened text message
- **THEN** the existing notification toast is shown unchanged; no banner or per-row UI is updated retroactively from the 400 response

---

### Requirement: Performance and accessibility
The validation enrichment SHALL run once per preview response in O(n) over the errors array; no memoization is required because the response arrives once per upload. The banner and tooltip primitives (`DialNotification`, `DialTooltip`) MUST inherit accessibility behavior from `@epam/ai-dial-ui-kit` (WCAG AA target). The State cell's tooltip trigger MUST carry an `aria-label` matching the state label so screen readers announce failure context even if the tooltip text is not exposed.

#### Scenario: Single-pass enrichment
- **WHEN** the preview response is processed
- **THEN** `groupErrorsByEntity`, `buildErrorsByTab`, and per-row enrichment each iterate the errors array at most once

#### Scenario: Failed row info icon is labeled for assistive technology
- **WHEN** the State cell renders for a `FAILED` row
- **THEN** the trailing `IconInfoCircle` carries `aria-label="Failed"` (or the locale-translated equivalent)

---

### Requirement: Firewall errors keyed by domain and counted in the validation summary
`getDeploymentConfigurationPreview` SHALL extract `GLOBAL_DOMAIN_WHITELIST` errors from the preview response and reduce them to a per-domain map keyed by `entityIdentifier` (the offending domain; `""` for a `null` entry), each value being the list of that domain's error messages. Their count SHALL be included in `validationSummary.totalFailed`. Firewall errors SHALL NOT be added to `COMPONENT_TYPE_TO_TAB_ID`, SHALL NOT contribute to `errorsByTab`, SHALL NOT produce a per-row State column on the Global Firewall tab, and SHALL NOT mutate any row's `__import` namespace.

#### Scenario: Errors grouped by domain
- **WHEN** the preview response contains `GLOBAL_DOMAIN_WHITELIST` errors for domains `"bad!"` and `"also bad!!"`
- **THEN** the per-domain map has keys `"bad!"` and `"also bad!!"`, each mapping to that domain's message(s)

#### Scenario: Firewall errors increment totalFailed without polluting errorsByTab
- **WHEN** the preview response contains two `GLOBAL_DOMAIN_WHITELIST` errors and one `MCP_DEPLOYMENT` error
- **THEN** `validationSummary.totalFailed` is `3`, `errorsByTab` contains only the `MCP_CONTAINER` entry (count `1`), and `errorsByTab` has no Global Firewall key

---

### Requirement: Per-domain decoration in the Global Firewall domain list
The Global Firewall tab's `DomainList` SHALL accept an optional per-domain error map. For each domain that has a matching error entry, the row SHALL render the domain text in error color (`text-error`) plus a trailing `IconInfoCircle` (`text-error`) wrapped in a `DialTooltip` listing that domain's message(s). The info icon SHALL carry an `aria-label` identifying the domain. Domains without a matching entry SHALL render unchanged (cloud icon + primary-colored text, no tooltip). When no error map is provided, `DomainList` SHALL behave exactly as before (used by the editor and compare flows).

#### Scenario: Invalid domain rendered with error styling and tooltip
- **WHEN** the domain `"bad!"` has an error `"domain 'bad!' is not a valid domain name"`
- **THEN** the `"bad!"` row renders with `text-error` text and a trailing `IconInfoCircle` whose `DialTooltip` contains that message, and the icon's `aria-label` is `"bad!"`

#### Scenario: Valid domains in the same list are not decorated
- **WHEN** the list contains `"good.com"` (no error) alongside `"bad!"` (error)
- **THEN** `"good.com"` renders with the cloud icon and primary text and no tooltip trigger

#### Scenario: DomainList unchanged without an error map
- **WHEN** `DomainList` is rendered without the error map (editor / compare usage)
- **THEN** every row renders with the cloud icon and primary text, exactly as before this change
