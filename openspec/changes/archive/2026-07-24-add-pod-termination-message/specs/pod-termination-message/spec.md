## ADDED Requirements

### Requirement: Pod termination message in Execution log header

The Execution log tab's pod metadata header SHALL display the selected pod's last Kubernetes termination message, sourced from the `lastTerminationMessage` field of the `/deployments/{id}/pods` response, under the label "Termination message", alongside the existing Restarts, Last restarted at, and Last reason fields.

#### Scenario: Pod has a termination message

- **WHEN** the selected pod has `lastTerminationMessage` as a non-empty string
- **THEN** the header displays a "Termination message" field showing that message verbatim (not mapped through the restart-reason lookup)

### Requirement: Termination message visibility is decoupled from restart count

The backend emits `restartCount` and the `lastTermination*` fields independently — a container can be terminated (e.g. fail-to-start) with a termination message while `restartCount` is `0`. The termination message SHALL be shown whenever `lastTerminationMessage` is present, independent of `restartCount`. The existing restart row (Restarts, Last restarted at, Last reason) remains gated on `restartCount > 0`. The metadata header SHALL render when either `restartCount` is non-zero or `lastTerminationMessage` is present.

#### Scenario: Terminated pod that has not restarted

- **WHEN** the selected pod has `restartCount` of `0` but a non-empty `lastTerminationMessage`
- **THEN** the header is shown with the Termination message
- **AND** the Restarts / Last restarted at / Last reason row is omitted (restart count is `0`)

#### Scenario: Pod with no restarts and no termination message

- **WHEN** the selected pod has `restartCount` of `0` and no `lastTerminationMessage`
- **THEN** no metadata header is rendered

#### Scenario: Pod has no termination message

- **WHEN** the selected pod has no `lastTerminationMessage` (missing or empty)
- **THEN** no "Termination message" field is rendered (no empty label)

#### Scenario: Long termination message

- **WHEN** the `lastTerminationMessage` is long
- **THEN** the header layout is preserved (the message is constrained/wrapped) and the other header fields remain readable
