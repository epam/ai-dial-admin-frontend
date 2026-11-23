## ADDED Requirements

### Requirement: Application role references open their Core role details

The Core-direct application Roles tab and embedded Core-backed application route role grids SHALL offer Open in a new tab for each displayed role, following `core-role-reference-navigation`. The system SHALL preserve membership and route-grant behavior.

#### Scenario: Open an application role

- **WHEN** a user selects Open in a new tab on a Core application role row
- **THEN** the unqualified platform-role detail address for that role opens in a new tab

#### Scenario: Open an embedded application-route role

- **WHEN** a user selects Open in a new tab on a Core-backed application route role row
- **THEN** the unqualified platform-role detail address for that role opens in a new tab even if the role option list is empty
