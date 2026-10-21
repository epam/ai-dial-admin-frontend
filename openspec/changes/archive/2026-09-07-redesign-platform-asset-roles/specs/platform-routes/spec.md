## MODIFIED Requirements

### Requirement: Roles tab
The system SHALL provide a Roles tab on the route asset detail view, matching the layout of the
config-entity Roles tab (`EntityRoles`/`RolesGrid`): a title with a live count of granted roles, a
"Make available to specific roles" toggle, and an Add-role control styled as a primary button. The
tab SHALL edit the resource's `userRoles` (membership only — no per-role limits, matching every other
Core-direct asset surface's Roles tab), with the selectable roles read from DIAL Core's own role
population (the union of its API-written and configuration-file-declared roles).

`userRoles` SHALL be interpreted as three distinct states: an empty array means the route is
available to no user; a populated array means the route is available only to the listed roles;
`undefined` or `null` means the route is available to all users. The toggle SHALL reflect and drive
this: switching it on (from `undefined`/`null`) SHALL set `userRoles` to an empty array; switching it
off (from any array) SHALL clear `userRoles` to `undefined`.

When the grid has no granted roles, it SHALL show "No Roles" as its empty state, rather than a
warning message. When the route is available to no user (`userRoles` is an empty array), a
notification SHALL be shown below the grid stating the route is not available to any end-users; this
notification SHALL NOT be shown when `userRoles` is `undefined`/`null` or non-empty.

#### Scenario: Roles selection round-trips on the route resource
- **WHEN** a user selects roles on a route asset and saves
- **THEN** the selection persists to the resource's `userRoles` and is rendered as selected when the view is reopened

#### Scenario: A role granted directly on the resource but absent from the fetched list is still shown
- **WHEN** a route asset's `userRoles` names a role the fetched role list does not contain
- **THEN** that role is still shown as granted, rather than being silently dropped from the display

#### Scenario: An option-list read failure is reported, not silently emptied
- **WHEN** the Roles tab's option population read fails or is partial
- **THEN** the tab still renders with whatever population it could read, and the incomplete-list warning already used elsewhere is shown

#### Scenario: The header shows a live role count
- **WHEN** a user grants or revokes a role on a route asset's Roles tab
- **THEN** the header's count updates immediately to match the number of currently granted roles

#### Scenario: Toggling availability on narrows to no one
- **WHEN** a user switches "Make available to specific roles" on for a route whose `userRoles` was `undefined` or `null`
- **THEN** `userRoles` becomes an empty array and the roles grid is available to start adding roles

#### Scenario: Toggling availability off restores available-to-all
- **WHEN** a user switches "Make available to specific roles" off for a route with any `userRoles` array
- **THEN** `userRoles` becomes `undefined` and, on save, the request body carries no `userRoles` property

#### Scenario: Empty roles grid shows "No Roles"
- **WHEN** a route asset's Roles tab has no granted roles
- **THEN** the grid's empty state reads "No Roles"

#### Scenario: Unavailable-to-all notification appears only when genuinely empty
- **WHEN** a route asset's `userRoles` is an empty array
- **THEN** a notification below the grid states the route is not available to any end-users

#### Scenario: No notification when available to all
- **WHEN** a route asset's `userRoles` is `undefined` or `null`
- **THEN** no "not available" notification is shown

## ADDED Requirements

### Requirement: New platform route defaults to unavailable
The system SHALL initialize a newly created route asset's `userRoles` to an empty array, so it is
unavailable to any end-user until roles are explicitly granted, rather than defaulting to available
to all by omission.

#### Scenario: A freshly created route starts with no granted roles
- **WHEN** a user creates a new route asset and opens its Roles tab before granting any role
- **THEN** the tab shows zero granted roles and the "not available to any end-users" notification is shown
