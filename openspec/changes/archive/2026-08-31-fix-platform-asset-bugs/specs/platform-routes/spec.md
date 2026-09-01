## ADDED Requirements

### Requirement: Route asset list offers a duplicate action

The system SHALL offer a `duplicate` row action for route assets. Activating it SHALL open the
shared `DuplicatePlatformAsset` modal, which for routes collects only the new name — no Display
Name field, since `Route` has no `displayName` — and SHALL create a copy of the selected route
under the new name.

#### Scenario: Duplicate action opens a name-only modal

- **WHEN** a user activates the duplicate row action on a route
- **THEN** a modal opens with only a name field (pre-filled with a copy-suffixed name) and no Display
  Name field

#### Scenario: Submitting creates the copy under the new name

- **WHEN** a user enters a valid name and submits the duplicate modal
- **THEN** a new route resource is created as a copy of the original under the new name, and the list
  refreshes to include it

#### Scenario: Save is blocked until the name field is non-empty

- **WHEN** the duplicate modal opens with an empty name field
- **THEN** the submit button is disabled until the user enters a valid name

#### Scenario: A read-only admin is not offered the duplicate action

- **WHEN** a read-only admin views the route asset list
- **THEN** no duplicate action is offered in row menus
