## ADDED Requirements

### Requirement: Platform App Runner creation checks the declared ID with Core

When the user activates Create for an otherwise locally valid Platform App Runner form, the system SHALL call `getResolvedRunnerSchema` with the proposed declared `$id` before invoking the existing Core-backed create callback.

If the resolved-schema request returns a schema, the system SHALL treat the declared `$id` as existing, show the standard existing-ID error inline under ID, keep the Create modal open, and SHALL NOT invoke the Core-backed create callback. This error SHALL participate in the form validity state and SHALL clear when the user edits ID.

If the request does not return a schema or if resolution fails, the system SHALL invoke the existing Core-backed create callback. The normal Core success or error result, including a write-time conflict response, SHALL remain visible.

#### Scenario: Core-resolved ID blocks Platform App Runner creation

- **WHEN** a user activates Create for a valid Platform App Runner form and Core returns a schema for the proposed `$id`
- **THEN** the Create modal shows the standard existing-ID error under ID
- **AND** Create is disabled
- **AND** the Core-backed create callback is not invoked

#### Scenario: Editing an occupied Platform App Runner ID restores creation

- **WHEN** the Create modal displays the resolved existing-ID error
- **AND** the user changes ID to a locally valid value
- **THEN** the resolved existing-ID error is removed
- **AND** Create is enabled when Name and Display Name are also valid

#### Scenario: An unresolved or unavailable Platform App Runner ID uses the normal create flow

- **WHEN** a user activates Create for a valid Platform App Runner form and the resolved-schema request returns no schema or fails
- **THEN** the system invokes the existing Core-backed create callback with the edited Name, ID, and Display Name
- **AND** the normal Core success or error result remains visible
