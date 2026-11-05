## ADDED Requirements

### Requirement: Schedule validation remains active across tabs and resets

The system SHALL validate all stored schedule fields for the page lifetime, including when Rate Limit Schedule has not been opened or is no longer active. An absent schedule SHALL remain valid. A save-validation reset SHALL NOT clear validation of the current draft.

#### Scenario: Invalid schedule on a hidden tab blocks saving
- **WHEN** the stored schedule is invalid or the user makes it invalid and switches to another tab
- **THEN** Save is disabled and no update request is sent

#### Scenario: Earlier save completes after a newer invalid edit
- **WHEN** a successful save resets validation after the user has made the schedule invalid
- **THEN** Save remains disabled for the current draft

### Requirement: Invalid tabs show an error status

The system SHALL show an accessible error status on each System Properties tab containing invalid settings, including when that tab is not active. The status SHALL clear when the settings are corrected or discarded.

#### Scenario: Hidden invalid cost object is identifiable
- **WHEN** the stored default cost object is blank and another tab is active
- **THEN** the Spending Limits tab has an accessible error status

### Requirement: Rejected updates show an error

The system SHALL show a localized error notification when an update request rejects, preserve the edits, and avoid a success notification, validation reset or refresh.

#### Scenario: Update request rejects
- **WHEN** the user saves and the update request rejects
- **THEN** an error notification is shown and edits remain available
