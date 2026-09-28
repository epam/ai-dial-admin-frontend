## MODIFIED Requirements

### Requirement: The toggle control is rendered only where it applies
The system SHALL render a `showConfigFiles` toggle control, placed adjacent to the page title, on exactly seven views: `platform-models`, `platform-interceptors`, `platform-routes`, `platform-roles`, `platform-app-runners`, `assets-applications`, and `assets-toolsets` — regardless of whether `featureFlags.adminApiEnabled` is `true` or `false`. The control SHALL NOT be rendered on `platform-keys` or any other route.

#### Scenario: Toggle appears on a covered view without the admin API
- **WHEN** a user opens `platform-models` and `DIAL_ADMIN_API_URL` is unset
- **THEN** the `showConfigFiles` toggle is rendered next to the page title

#### Scenario: Toggle appears on a covered view with the admin API configured
- **WHEN** a user opens `platform-models` and `DIAL_ADMIN_API_URL` is set
- **THEN** the `showConfigFiles` toggle is rendered next to the page title, and turning it on swaps the page to the config-file-backed list exactly as it does without the admin API

#### Scenario: Toggle is absent on Keys
- **WHEN** a user opens `platform-keys`, regardless of `DIAL_ADMIN_API_URL`
- **THEN** no `showConfigFiles` toggle is rendered

#### Scenario: Toggle appears on App Runners
- **WHEN** a user opens `platform-app-runners` and `DIAL_ADMIN_API_URL` is unset
- **THEN** the `showConfigFiles` toggle is rendered next to the page title, the same as on the other six covered views
