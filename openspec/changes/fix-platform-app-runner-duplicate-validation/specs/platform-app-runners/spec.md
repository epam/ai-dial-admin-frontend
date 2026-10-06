## ADDED Requirements

### Requirement: Platform App Runner duplication validates Core storage name and declared ID

The `Assets > App Runners` duplicate modal SHALL render required Name, ID, and Display Name fields for Platform App Runners. Name SHALL be the Core resource storage `name`, remain distinct from the schema body's declared `$id`, and initialize as the source storage name with a `-copy` suffix.

The Name field SHALL validate inline with the standard required, length, character, and existing-name rules against the Platform App Runner storage names supplied to the modal. A missing or existing Name SHALL show an inline error and SHALL disable Duplicate until corrected. This additional Name field SHALL NOT be rendered for other platform asset types that use the shared duplicate modal.

#### Scenario: Duplicate starts with a copied Core storage name

- **WHEN** a user opens Duplicate for the Platform App Runner with storage name `quickapps2`
- **THEN** the form shows Name `quickapps2-copy` together with the cloned ID and Display Name
- **AND** submitting valid values passes `name: "quickapps2-copy"` to the existing Core-backed create flow

#### Scenario: Existing Core storage name blocks duplication inline

- **WHEN** the user enters a Name already used by a Platform App Runner
- **THEN** the modal shows an inline existing-name error under Name
- **AND** Duplicate is disabled until the user supplies a valid unused Name

#### Scenario: Other platform asset duplicate forms are unchanged

- **WHEN** a user duplicates a Model, Route, Role, Interceptor, platform Application, or Toolset
- **THEN** that form retains its current fields and duplication behavior

### Requirement: Platform App Runner duplicate checks the declared ID with Core

When the user activates Duplicate for an otherwise valid Platform App Runner form, the system SHALL call `getResolvedRunnerSchema` with the proposed declared `$id` before invoking the existing Core-backed create flow.

If the resolved-schema request returns a schema, the system SHALL treat the declared `$id` as existing, show the existing-ID error inline under ID, and SHALL NOT invoke the create callback. This error SHALL disable Duplicate and SHALL clear when the user changes ID. If the request does not return a schema, the system SHALL proceed with the existing Core create behavior.

#### Scenario: Core-resolved ID blocks the create callback

- **WHEN** a user activates Duplicate for a valid Platform App Runner form and Core returns a schema for the proposed `$id`
- **THEN** the modal shows “This ID already exists.” under ID
- **AND** Duplicate is disabled
- **AND** the Core-backed create callback is not invoked

#### Scenario: Editing an existing declared ID restores duplication

- **WHEN** the modal displays the Core-resolved existing-ID error
- **AND** the user changes ID to a locally valid value
- **THEN** the error is removed
- **AND** Duplicate is enabled when Name and Display Name are also valid

#### Scenario: Unresolved declared ID uses the normal Core create flow

- **WHEN** a user activates Duplicate for a valid Platform App Runner form and the resolved-schema request does not return a schema
- **THEN** the system invokes the existing Core-backed create callback with the edited Name, ID, and Display Name
- **AND** the normal success or error result of the Core create flow remains visible
