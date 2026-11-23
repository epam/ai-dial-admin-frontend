## ADDED Requirements

### Requirement: Model role references open their Core role details

The model's Core-direct Roles tab SHALL offer Open in a new tab for each displayed role, following `core-role-reference-navigation`, without altering `userRoles` membership or the unrestricted display.

#### Scenario: Open a model role

- **WHEN** a user selects Open in a new tab on a model role row
- **THEN** the unqualified platform-role detail address for that role opens in a new tab

#### Scenario: Unrestricted model role

- **WHEN** a model's Roles tab displays all roles because access is unrestricted
- **THEN** each displayed role retains the open action and membership is not editable from that grid
