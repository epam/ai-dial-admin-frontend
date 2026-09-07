## MODIFIED Requirements

### Requirement: Roles tab on platform application detail view
The system SHALL provide a Roles tab on the platform-bucket application detail view, matching the
layout of the config-entity Roles tab (`EntityRoles`/`RolesGrid`): a title with a live count of
granted roles, a "Make available to specific roles" toggle, and an Add-role control styled as a
primary button. The tab SHALL edit the resource's `user_roles` field, with the selectable roles read
from DIAL Core's own role population (the union of its API-written and configuration-file-declared
roles), not the admin-backend's role list. The public-bucket application detail view SHALL NOT gain
this tab.

`user_roles` SHALL be interpreted as three distinct states: an empty array means the application is
available to no user; a populated array means the application is available only to the listed roles;
`undefined` or `null` means the application is available to all users. The toggle SHALL reflect and
drive this: switching it on (from `undefined`/`null`) SHALL set `user_roles` to an empty array;
switching it off (from any array) SHALL clear `user_roles` to `undefined`.

When the grid has no granted roles, it SHALL show "No Roles" as its empty state, rather than a
warning message. When the application is available to no user (`user_roles` is an empty array), a
notification SHALL be shown below the grid stating the application is not available to any
end-users; this notification SHALL NOT be shown when `user_roles` is `undefined`/`null` or non-empty.

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

#### Scenario: The header shows a live role count
- **WHEN** a user grants or revokes a role on a platform application's Roles tab
- **THEN** the header's count updates immediately to match the number of currently granted roles

#### Scenario: Toggling availability on narrows to no one
- **WHEN** a user switches "Make available to specific roles" on for a platform application whose `user_roles` was `undefined` or `null`
- **THEN** `user_roles` becomes an empty array and the roles grid is available to start adding roles

#### Scenario: Toggling availability off restores available-to-all
- **WHEN** a user switches "Make available to specific roles" off for a platform application with any `user_roles` array
- **THEN** `user_roles` becomes `undefined` and, on save, the request body carries no `user_roles` property

#### Scenario: Empty roles grid shows "No Roles"
- **WHEN** a platform application's Roles tab has no granted roles
- **THEN** the grid's empty state reads "No Roles"

#### Scenario: Unavailable-to-all notification appears only when genuinely empty
- **WHEN** a platform application's `user_roles` is an empty array
- **THEN** a notification below the grid states the application is not available to any end-users

#### Scenario: No notification when available to all
- **WHEN** a platform application's `user_roles` is `undefined` or `null`
- **THEN** no "not available" notification is shown

## ADDED Requirements

### Requirement: New platform application defaults to unavailable
The system SHALL initialize a newly created platform-bucket application's `user_roles` to an empty
array, so it is unavailable to any end-user until roles are explicitly granted, rather than
defaulting to available to all by omission. Applications created in the public bucket (config
entities) are unaffected.

#### Scenario: A freshly created platform application starts with no granted roles
- **WHEN** a user creates a new platform-bucket application and opens its Roles tab before granting any role
- **THEN** the tab shows zero granted roles and the "not available to any end-users" notification is shown
