## ADDED Requirements

### Requirement: App-runner route role references open their Core role details

Core-backed embedded app-runner route role grids SHALL offer Open in a new tab for each displayed role, following `core-role-reference-navigation`, without changing route-grant behavior.

#### Scenario: Open an app-runner route role

- **WHEN** a user selects Open in a new tab on a Core-backed app-runner route role row
- **THEN** the unqualified platform-role detail address for that role opens in a new tab even if the role option list is empty
