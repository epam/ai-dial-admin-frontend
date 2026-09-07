## ADDED Requirements

### Requirement: Roles tab on platform application detail view
The system SHALL provide a Roles tab on the platform-bucket application detail view, editing the
resource's `user_roles` field, with the selectable roles read from DIAL Core's own role population
(the union of its API-written and configuration-file-declared roles), not the admin-backend's role
list. The public-bucket application detail view SHALL NOT gain this tab.

#### Scenario: Roles tab appears on the platform application detail view
- **WHEN** a user opens a platform-bucket application's detail view
- **THEN** a `Roles` tab is present alongside Properties, Features, Parameters, Interceptors,
  Dependencies, and App Routes

#### Scenario: Roles selection round-trips on the platform application resource
- **WHEN** a user selects roles on a platform application and saves
- **THEN** the selection persists to the resource's `user_roles` field and is rendered as selected
  when the view is reopened

#### Scenario: A role declared only in Core's configuration file is selectable
- **WHEN** the Roles tab's option list is built for a platform application
- **THEN** it includes a role declared in Core's configuration file even though the admin backend's
  own role list cannot see it

#### Scenario: The public-bucket application detail view has no Roles tab
- **WHEN** a user opens a public-bucket application's detail view (its URL carries a `?path=` query
  param)
- **THEN** no `Roles` tab is shown, unchanged from current behavior

#### Scenario: An option-list read failure is reported, not silently emptied
- **WHEN** the Roles tab's option population read fails or is partial
- **THEN** the tab still renders with whatever population it could read, and the incomplete-list
  warning already used elsewhere on this surface (e.g. the Interceptors tab) is shown

#### Scenario: A read-only admin sees the Roles tab without mutating controls
- **WHEN** a read-only admin opens a platform application's Roles tab
- **THEN** the assigned roles are shown, and no add or remove control is offered
