## MODIFIED Requirements

### Requirement: Roles tab
The system SHALL provide a Roles tab on the model asset detail view, editing the resource's `userRoles`, with the selectable roles read from DIAL Core's own role population (the union of its API-written and configuration-file-declared roles), not the admin-backend's role list.

#### Scenario: Roles selection round-trips on the model resource
- **WHEN** a user selects roles on a model asset and saves
- **THEN** the selection persists to the resource's `userRoles` and is rendered as selected when the view is reopened

#### Scenario: A role declared only in Core's configuration file is selectable
- **WHEN** the Roles tab's option list is built
- **THEN** it includes a role declared in Core's configuration file even though the admin backend's own role list cannot see it

#### Scenario: An option-list read failure is reported, not silently emptied
- **WHEN** the Roles tab's option population read fails or is partial
- **THEN** the tab still renders with whatever population it could read, and the incomplete-list warning already used on `Assets > App Runners`/the Interceptors tab is shown
