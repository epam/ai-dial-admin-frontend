## ADDED Requirements

### Requirement: Catalog Schema creation validates an existing declared ID inline

When the user activates Create for a locally valid Catalog Schema form, the system SHALL resolve the proposed declared `$id` through the existing Core Catalog Schema resolver before invoking the Core-backed create action. A resolved Catalog Schema SHALL be treated as an occupied declared ID, regardless of whether its source is an API-written resource or a configuration file.

When the declared ID is occupied, the Create modal SHALL render the standard existing-ID error beneath the `$id` input, SHALL keep the modal open, and SHALL NOT invoke the create action. The error SHALL participate in the form validity state so that Create remains disabled until `$id` is corrected. Editing `$id` SHALL remove this resolved-ID error and restore the control's normal local validation state.

When the resolver does not find a Catalog Schema, the system SHALL use the existing Core-backed create flow. When the resolver request fails, the system SHALL also retain that existing create flow rather than report the ID as available; Core's final create response SHALL remain authoritative for concurrent writes and resolver failures.

#### Scenario: Existing declared ID blocks creation in the modal

- **WHEN** a user activates Create for an otherwise valid Catalog Schema form and Core resolves the proposed `$id`
- **THEN** the modal shows the standard existing-ID error under `$id`
- **AND** Create is disabled
- **AND** the Core-backed create action is not invoked

#### Scenario: Correcting a declared ID restores creation

- **WHEN** the Create modal displays the resolved existing-ID error
- **AND** the user changes `$id` to a locally valid value
- **THEN** the resolved existing-ID error is removed
- **AND** Create is enabled when every other form field is valid

#### Scenario: An unresolved ID uses the normal create flow

- **WHEN** a user activates Create for an otherwise valid Catalog Schema form and Core does not resolve the proposed `$id`
- **THEN** the system invokes the existing Core-backed create action with the form values
- **AND** the normal success or error result remains visible

#### Scenario: A resolver failure does not replace Core enforcement

- **WHEN** the Catalog Schema resolver request fails after a user activates Create for an otherwise valid form
- **THEN** the system invokes the existing Core-backed create action
- **AND** any Core conflict response remains visible through the existing error handling
