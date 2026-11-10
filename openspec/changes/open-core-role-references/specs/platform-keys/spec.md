## ADDED Requirements

### Requirement: Key role references open their Core role details

The system SHALL offer Open in a new tab for each role shown in a Core platform key's Roles tab, following `core-role-reference-navigation`, without changing the key's bearer-role membership behavior.

#### Scenario: Open a key role

- **WHEN** a user selects Open in a new tab on a key role row
- **THEN** the unqualified platform-role detail address for that role opens in a new tab

#### Scenario: Read-only key role

- **WHEN** a read-only administrator views a key's role row
- **THEN** the open action is available and remove is not
