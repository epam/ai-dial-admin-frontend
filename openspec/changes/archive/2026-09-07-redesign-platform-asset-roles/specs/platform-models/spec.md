## MODIFIED Requirements

### Requirement: Roles tab
The system SHALL provide a Roles tab on the model asset detail view, matching the layout of the
config-entity Roles tab (`EntityRoles`/`RolesGrid`): a title with a live count of granted roles, a
"Make available to specific roles" toggle, and an Add-role control styled as a primary button. The
tab SHALL edit the resource's `userRoles`, with the selectable roles read from DIAL Core's own role
population (the union of its API-written and configuration-file-declared roles), not the
admin-backend's role list.

`userRoles` SHALL be interpreted as three distinct states: an empty array means the model is
available to no user; a populated array means the model is available only to the listed roles;
`undefined` or `null` means the model is available to all users. The toggle SHALL reflect and drive
this: switching it on (from `undefined`/`null`) SHALL set `userRoles` to an empty array; switching it
off (from any array) SHALL clear `userRoles` to `undefined`.

When the grid has no granted roles, it SHALL show "No Roles" as its empty state, rather than a
warning message. When the model is available to no user (`userRoles` is an empty array), a
notification SHALL be shown below the grid stating the model is not available to any end-users;
this notification SHALL NOT be shown when `userRoles` is `undefined`/`null` or non-empty.

#### Scenario: Roles selection round-trips on the model resource
- **WHEN** a user selects roles on a model asset and saves
- **THEN** the selection persists to the resource's `userRoles` and is rendered as selected when the view is reopened

#### Scenario: A role declared only in Core's configuration file is selectable
- **WHEN** the Roles tab's option list is built
- **THEN** it includes a role declared in Core's configuration file even though the admin backend's own role list cannot see it

#### Scenario: An option-list read failure is reported, not silently emptied
- **WHEN** the Roles tab's option population read fails or is partial
- **THEN** the tab still renders with whatever population it could read, and the incomplete-list warning already used on `Assets > App Runners`/the Interceptors tab is shown

#### Scenario: The header shows a live role count
- **WHEN** a user grants or revokes a role on a model asset's Roles tab
- **THEN** the header's count updates immediately to match the number of currently granted roles

#### Scenario: Toggling availability on narrows to no one
- **WHEN** a user switches "Make available to specific roles" on for a model whose `userRoles` was `undefined` or `null`
- **THEN** `userRoles` becomes an empty array and the roles grid is available to start adding roles

#### Scenario: Toggling availability off restores available-to-all
- **WHEN** a user switches "Make available to specific roles" off for a model with any `userRoles` array
- **THEN** `userRoles` becomes `undefined` and, on save, the request body carries no `userRoles` property

#### Scenario: Empty roles grid shows "No Roles"
- **WHEN** a model asset's Roles tab has no granted roles
- **THEN** the grid's empty state reads "No Roles"

#### Scenario: Unavailable-to-all notification appears only when genuinely empty
- **WHEN** a model asset's `userRoles` is an empty array
- **THEN** a notification below the grid states the model is not available to any end-users

#### Scenario: No notification when available to all
- **WHEN** a model asset's `userRoles` is `undefined` or `null`
- **THEN** no "not available" notification is shown

## ADDED Requirements

### Requirement: New platform model defaults to unavailable
The system SHALL initialize a newly created model asset's `userRoles` to an empty array, so it is
unavailable to any end-user until roles are explicitly granted, rather than defaulting to available
to all by omission.

#### Scenario: A freshly created model starts with no granted roles
- **WHEN** a user creates a new model asset and opens its Roles tab before granting any role
- **THEN** the tab shows zero granted roles and the "not available to any end-users" notification is shown
