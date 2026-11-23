## ADDED Requirements

### Requirement: Core role grids offer source-neutral role navigation

The system SHALL offer an accessible, localized Open in a new tab row action for every displayed role reference in Core-direct role grids: platform keys, models, routes, routers, applications, toolsets, and Core-backed embedded application routes and app-runner routes. The action SHALL open the referenced bare role name at `/platform-roles/{encoded-name}` in a new tab without a `configFile` parameter. It SHALL be available independently of whether the row has an origin discriminator or the option-list read succeeded. Existing role-membership mutation permissions and actions SHALL remain unchanged.

#### Scenario: Open a role in a new tab

- **WHEN** a user selects Open in a new tab for a displayed Core role reference
- **THEN** a new tab opens the platform-role detail URL for that role's name without `configFile=true`
- **AND** the current page remains open

#### Scenario: Role origin is unavailable

- **WHEN** a granted role is displayed as a name-only row because it is absent from the loaded option list
- **THEN** Open in a new tab remains available and uses that role's name

#### Scenario: Read-only and unrestricted grids permit navigation

- **WHEN** a user views a Core role grid in read-only mode, including an unrestricted asset's all-roles display
- **THEN** Open in a new tab remains available for displayed roles
- **AND** mutation actions remain unavailable

#### Scenario: Writable grids retain removal

- **WHEN** a user who can edit role membership opens a role's action menu
- **THEN** Open in a new tab and the existing permitted removal action are available
- **AND** opening the role does not change membership

#### Scenario: A name containing reserved characters round-trips

- **WHEN** a displayed role has a supported name containing URL-reserved characters
- **THEN** its new-tab URL encodes the name as one path segment and the detail lookup receives the original name

### Requirement: Shared embedded route grids preserve their source context

The system SHALL determine whether an embedded route role refers to Core or the admin backend from the owning surface, not from the contents or origins of the role option list. Core-backed route roles SHALL use the platform-role reference address; legacy admin-backend route roles SHALL continue to use `/roles`.

#### Scenario: Core route options are empty or partial

- **WHEN** a Core-backed application or app-runner route displays an existing role grant and its role option list is empty or partial
- **THEN** Open in a new tab targets that role's unqualified `/platform-roles` detail address

#### Scenario: Legacy route navigation is unchanged

- **WHEN** an admin-backend-backed application or app-runner route opens a role
- **THEN** the new tab targets the existing admin-backend `/roles` detail address
