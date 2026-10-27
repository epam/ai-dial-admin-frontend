## MODIFIED Requirements

### Requirement: Configuration wizard step reflects validation status
The `Configuration` step in the import wizard (`Steps`) SHALL be marked with `StepStatus.ERROR` when `validationSummary.totalFailed > 0`, and `StepStatus.VALID` otherwise. `validationSummary.totalFailed` SHALL count both artifact-entity failures and `GLOBAL_DOMAIN_WHITELIST` (firewall domain) errors. The status update is driven from `ConfigurationPreview` via an `onValidationChange(hasErrors: boolean)` callback to `ImportConfig`.

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
