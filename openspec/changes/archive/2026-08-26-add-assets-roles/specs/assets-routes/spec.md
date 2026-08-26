## MODIFIED Requirements

### Requirement: Route asset detail view tab set
The system SHALL render a route asset's detail view with exactly two tabs, `Properties` and `Roles`, and SHALL NOT
include a `Features` or `Configuration` tab, a Core-sync status banner, or any
reverse-index tab showing which other entities reference this route.

#### Scenario: Detail view renders exactly Properties and Roles
- **WHEN** a user opens a route asset's detail view
- **THEN** the tab list contains exactly `Properties` and `Roles`

#### Scenario: No Features or Configuration tab
- **WHEN** a user opens a route asset's detail view
- **THEN** no `Features` or `Configuration` tab is shown

## ADDED Requirements

### Requirement: Roles tab
The system SHALL provide a Roles tab on the route asset detail view, editing the resource's `userRoles` (membership only — no per-role limits, matching every other Core-direct asset surface's Roles tab), with the selectable roles read from DIAL Core's own role population (the union of its API-written and configuration-file-declared roles).

#### Scenario: Roles selection round-trips on the route resource
- **WHEN** a user selects roles on a route asset and saves
- **THEN** the selection persists to the resource's `userRoles` and is rendered as selected when the view is reopened

#### Scenario: A role granted directly on the resource but absent from the fetched list is still shown
- **WHEN** a route asset's `userRoles` names a role the fetched role list does not contain
- **THEN** that role is still shown as granted, rather than being silently dropped from the display

#### Scenario: An option-list read failure is reported, not silently emptied
- **WHEN** the Roles tab's option population read fails or is partial
- **THEN** the tab still renders with whatever population it could read, and the incomplete-list warning already used elsewhere is shown
