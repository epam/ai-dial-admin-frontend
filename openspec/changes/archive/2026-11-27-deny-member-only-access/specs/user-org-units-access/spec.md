## MODIFIED Requirements

### Requirement: Start mode follows the access read
The system SHALL resolve one of three modes. Authentication disabled SHALL resolve to full without calling
Core. A `404` answer (org units off) SHALL resolve to full. `adminAccess` `FULL` SHALL resolve to full.
`adminAccess` `NONE` with at least one unit that grants `read` on a namespace the panel shows a section for SHALL
resolve to unit mode. `NONE` with no units, with units that grant `read` on no such namespace (a caller whose only
role is `member` holds `org-units: read` alone), or any other failure, SHALL resolve to denied, which renders the 403
page with no menu.

#### Scenario: Full admin
- **WHEN** Core answers `adminAccess: FULL`
- **THEN** the full panel renders and `isFullAdmin` is `true`

#### Scenario: Unit user
- **WHEN** Core answers `adminAccess: NONE` with one or more units, one of which grants `read` on a content namespace
- **THEN** the panel renders in unit mode, `isFullAdmin` is `false` and `isUnitMode` is `true`

#### Scenario: Unit user holding only a publications read
- **WHEN** Core answers `adminAccess: NONE` with a unit that grants `publications: [read]` and nothing else
- **THEN** the panel renders in unit mode

#### Scenario: No access
- **WHEN** Core answers `adminAccess: NONE` with no units
- **THEN** the 403 page renders

#### Scenario: Member-only caller
- **WHEN** Core answers `adminAccess: NONE` with a unit whose permissions are `org-units: [read]` only
- **THEN** the 403 page renders, with no menu and no panel
- **AND** `isUnitMode` is `false`

#### Scenario: Member above a unit with content
- **WHEN** Core answers `adminAccess: NONE` with `public/Acme/` granting `org-units: [read]` and `public/Acme/Risk/`
  granting `applications: [read]`
- **THEN** the panel renders in unit mode
- **AND** both units remain in the caller's units

#### Scenario: Org units off
- **WHEN** Core answers `404` for the access read
- **THEN** the caller is treated as a full admin and the full panel renders

#### Scenario: Authentication disabled
- **WHEN** authentication is disabled
- **THEN** the caller is treated as a full admin and Core's access endpoint is not called

#### Scenario: Access read fails
- **WHEN** the access read answers `401`, `403` or `5xx`
- **THEN** the 403 page renders
