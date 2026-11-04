## ADDED Requirements

### Requirement: Platform App Runner response errors disable form Save

For each route in the staged Core `dial:applicationTypeRoutes` map, a present `dial:response` SHALL contain a non-empty string `dial:body` and a status numerically between 100 and 999 inclusive, matching the existing Response form validation. Numeric strings and whitespace-only body strings SHALL follow the existing form behavior. While any route has an invalid response, the form Save action SHALL be disabled, regardless of the active route or tab. The existing form validation errors SHALL remain visible for the active route. Other Save gates SHALL continue to apply.

The system SHALL validate these response rules before writing a Platform App Runner to DIAL Core, including when the staged runner was edited as JSON. A rejected save SHALL issue the existing invalid-runner notification and SHALL NOT call the Core update action. Successful saves SHALL retain the existing success notification and refresh behavior. The JSON editor's existing Save-button and syntax-error behavior SHALL remain unchanged.

#### Scenario: Newly selected Response disables Save

- **WHEN** a user selects Response for a route and its status and body are empty
- **THEN** the form shows inline required errors
- **AND** Save is disabled

#### Scenario: Both response fields must be valid

- **WHEN** a route response has an empty body or a missing, nonnumeric, or out-of-range status
- **THEN** form Save is disabled
- **AND** entering a non-empty body and a status from 100 through 999 removes the response-specific Save block

#### Scenario: An invalid inactive route continues to block Save

- **WHEN** a runner has an invalid route response and the user selects another route or tab
- **THEN** form Save remains disabled
- **AND** unrelated staged changes remain intact

#### Scenario: Removing an invalid response restores the response-specific gate

- **WHEN** a user switches an invalid response to Upstreams, deletes its route, or discards the changes
- **THEN** that response no longer prevents form Save
- **AND** other existing Save gates remain in effect

#### Scenario: Invalid JSON response is rejected

- **WHEN** a user saves a syntactically valid JSON runner containing an invalid route response
- **THEN** the existing invalid-runner notification is shown
- **AND** the Core update action is not called

#### Scenario: Valid response is saved

- **WHEN** the response has a valid status and non-empty body and all other save conditions are met
- **THEN** Save updates the runner through the existing Core-backed action
- **AND** the existing success notification and refresh behavior apply
