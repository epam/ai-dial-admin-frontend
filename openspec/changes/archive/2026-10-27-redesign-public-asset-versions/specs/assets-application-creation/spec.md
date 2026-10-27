## MODIFIED Requirements

### Requirement: Assets Applications use a guided creation modal

When an administrator creates an application from `ApplicationRoute.AssetsApplications`, the system SHALL open a dedicated two-step `CreateApplication` modal instead of the generic one-screen entity creation form.

The first step SHALL contain the existing Assets Application identity controls for id, display name, version, and description, with destination-aware behavior: version is required for a public-bucket destination and omitted for a platform-bucket destination. Public Version SHALL accept text according to `public-asset-versions`, validate complete destination-path uniqueness rather than name-only uniqueness, and synchronize content `display_version` without a separate input. The first step SHALL NOT display source configuration.

The second step SHALL contain source configuration and SHALL constrain its popup content to a maximum height of 540px while keeping the content accessible through scrolling.

#### Scenario: Identity fields precede source configuration
- **WHEN** an administrator opens creation from Assets Applications
- **THEN** the first modal step displays id, display name, version when the destination is public, and description
- **AND** source configuration is not displayed until the administrator advances to the second step

#### Scenario: Platform destination omits version
- **WHEN** an administrator creates an Assets Application with the platform bucket selected
- **THEN** the first modal step does not display a version field
- **AND** the administrator can advance without a version value

#### Scenario: Second step bounds long source content
- **WHEN** an administrator advances to source configuration
- **THEN** the second-step popup content has a maximum height of 540px
- **AND** source controls beyond the visible area remain reachable by scrolling

#### Scenario: Public creation accepts a new text version of an existing name
- **WHEN** the folder contains `assistant__stable` and the administrator enters id `assistant` and Version `release candidate`
- **THEN** the available complete destination is accepted without a semver or name-only uniqueness error
- **AND** no separate Display version input appears and the submitted content display version equals `release candidate`

#### Scenario: Invalid or occupied public version blocks advancement
- **WHEN** an entered public Version violates text/path validation or targets an existing complete path
- **THEN** localized validation feedback is shown and advancing/submitting is blocked
