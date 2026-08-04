## MODIFIED Requirements

### Requirement: Pod termination message in Execution log header

The Execution log tab's pod metadata header SHALL display the selected pod's last Kubernetes termination message, sourced from the `lastTerminationMessage` field of the `/deployments/{id}/pods` response, under the label "Termination message", alongside the existing Restarts, Last restarted at, and Last reason fields. The field SHALL keep its inline single-line truncated presentation, and the full message SHALL be reachable through its tooltip.

#### Scenario: Pod has a termination message

- **WHEN** the selected pod has `lastTerminationMessage` as a non-empty string
- **THEN** the header displays a "Termination message" field showing that message verbatim (not mapped through the restart-reason lookup)
- **AND** the full message is the tooltip content of that field

#### Scenario: Long termination message

- **WHEN** the `lastTerminationMessage` is long (e.g. a multi-hundred-line stack trace)
- **THEN** the header layout is preserved (the message is constrained/wrapped) and the other header fields remain readable
- **AND** the tooltip content is rendered inside a height-capped, independently scrollable container, so the tooltip never grows the document or distorts the surrounding page layout
- **AND** scrolling the tooltip content does not chain into scrolling the page behind it
