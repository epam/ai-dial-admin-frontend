## REMOVED Requirements

### Requirement: Whitelist errors filtered out of UI

**Reason**: Reversed. As of deployment-manager commit #359, each invalid global-firewall domain produces its own `GLOBAL_DOMAIN_WHITELIST` error keyed by the domain in `entityIdentifier`. The frontend now joins these errors to their domain rows and surfaces them inline instead of discarding them.

**Migration**: Firewall errors MUST NOT be dropped from the validation summary, tab indicator, Configuration step, or import gating. They are reduced to a per-domain map and rendered as inline decoration in the Global Firewall `DomainList`. The per-row State column, per-row `__import` enrichment, and the generic per-tab banner remain firewall-free (firewall stays out of `COMPONENT_TYPE_TO_TAB_ID`).

## MODIFIED Requirements

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

## ADDED Requirements

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
