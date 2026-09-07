## ADDED Requirements

### Requirement: Roles tab on platform toolset detail view
The system SHALL provide a Roles tab on the platform-bucket toolset detail view, editing the
resource's `user_roles` field, with the selectable roles read from DIAL Core's own role population
(the union of its API-written and configuration-file-declared roles), not the admin-backend's role
list. The public-bucket toolset detail view SHALL NOT gain this tab.

#### Scenario: Roles tab appears on the platform toolset detail view
- **WHEN** a user opens a platform-bucket toolset's detail view
- **THEN** a `Roles` tab is present alongside Properties and Tools

#### Scenario: Roles selection round-trips on the platform toolset resource
- **WHEN** a user selects roles on a platform toolset and saves
- **THEN** the selection persists to the resource's `user_roles` field and is rendered as selected
  when the view is reopened

#### Scenario: A role declared only in Core's configuration file is selectable
- **WHEN** the Roles tab's option list is built for a platform toolset
- **THEN** it includes a role declared in Core's configuration file even though the admin backend's
  own role list cannot see it

#### Scenario: The public-bucket toolset detail view has no Roles tab
- **WHEN** a user opens a public-bucket toolset's detail view (its URL carries a `?path=` query
  param)
- **THEN** no `Roles` tab is shown, unchanged from current behavior

#### Scenario: An option-list read failure is reported, not silently emptied
- **WHEN** the Roles tab's option population read fails or is partial
- **THEN** the tab still renders with whatever population it could read, and the incomplete-list
  warning already used elsewhere on this asset surface is shown

#### Scenario: A read-only admin sees the Roles tab without mutating controls
- **WHEN** a read-only admin opens a platform toolset's Roles tab
- **THEN** the assigned roles are shown, and no add or remove control is offered
