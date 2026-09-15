## MODIFIED Requirements

### Requirement: The toggle control is rendered only where it applies
The system SHALL render a `showConfigFiles` toggle control, placed adjacent to the page title, on exactly eight views: `platform-models`, `platform-interceptors`, `platform-routes`, `platform-roles`, `platform-app-runners`, `platform-catalog-schemas`, `assets-applications`, and `assets-toolsets` — and only when `featureFlags.adminApiEnabled` is `false`. The control SHALL NOT be rendered on `platform-keys` or any other route, and SHALL NOT be rendered on any of the eight covered views when `featureFlags.adminApiEnabled` is `true`.

#### Scenario: Toggle appears on a covered view without the admin API
- **WHEN** a user opens `platform-models` and `DIAL_ADMIN_API_URL` is unset
- **THEN** the `showConfigFiles` toggle is rendered next to the page title

#### Scenario: Toggle is absent with the admin API configured
- **WHEN** a user opens `platform-models` and `DIAL_ADMIN_API_URL` is set
- **THEN** no `showConfigFiles` toggle is rendered

#### Scenario: Toggle is absent on Keys
- **WHEN** a user opens `platform-keys`, regardless of `DIAL_ADMIN_API_URL`
- **THEN** no `showConfigFiles` toggle is rendered

#### Scenario: Toggle appears on App Runners
- **WHEN** a user opens `platform-app-runners` and `DIAL_ADMIN_API_URL` is unset
- **THEN** the `showConfigFiles` toggle is rendered next to the page title, the same as on the other seven covered views

#### Scenario: Toggle appears on Catalog Schemas
- **WHEN** a user opens `platform-catalog-schemas` and `DIAL_ADMIN_API_URL` is unset
- **THEN** the `showConfigFiles` toggle is rendered next to the page title, the same as on the other seven covered views

## ADDED Requirements

### Requirement: Catalog schemas are a covered config-file type

Catalog schemas SHALL be readable on this surface: the toggled-on list SHALL show the names DIAL
Core's configuration file declares, and opening one SHALL render its read-only detail view, the same
way the other covered types behave.

#### Scenario: The config-file list shows file-declared schema names

- **WHEN** a user toggles `showConfigFiles` on `platform-catalog-schemas`
- **THEN** the list shows the catalog-schema names Core's configuration file declares, with no
  create, delete, or bulk-delete action

#### Scenario: A file-sourced schema renders read-only

- **WHEN** a user opens an entry from that list
- **THEN** its detail view renders the schema with no save action

#### Scenario: A schema absent from the configuration file is not found

- **WHEN** a user navigates directly to the config-file detail route for a name the configuration
  file does not declare
- **THEN** the page reports it as not found rather than rendering an empty schema
