## MODIFIED Requirements

### Requirement: Config-file entity population is exposed through file roots

The system SHALL expose DIAL Core configuration-file entities through a synthetic, flat, read-only `file` root in the shared FileManager rather than through a global `showConfigFiles` toggle or a swapped list component. The root SHALL be available for Models, Interceptors, Translators, Routes, Roles, App Runners, Catalog Schemas, Applications, and Toolsets, regardless of whether the admin API is configured. Keys and every unsupported route SHALL NOT expose a `file` root.

#### Scenario: Platform Models shows a file root
- **WHEN** a user opens `platform-models`
- **THEN** the FileManager shows `file` and `platform` roots, with no config-file display toggle

#### Scenario: Keys has no file root
- **WHEN** a user opens `platform-keys`
- **THEN** no `file` root or config-file display toggle is rendered

#### Scenario: Applications and Toolsets expose three roots
- **WHEN** a user opens Assets Applications or Assets Toolsets
- **THEN** the FileManager shows `file`, `platform`, and `public` roots in that order
