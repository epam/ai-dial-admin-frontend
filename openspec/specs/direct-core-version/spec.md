# direct-core-version Specification

## Purpose
TBD

## Requirements

### Requirement: Core-only current-version retrieval
The system SHALL retrieve the current DIAL Core version from authenticated `GET /version` on `DIAL_CORE_API_URL` when `DIAL_ADMIN_API_URL` is not configured. The request SHALL accept a `text/plain` response, and the system SHALL expose a successful returned value as the detected Core version in the existing Core-version response shape.

#### Scenario: Core-only deployment returns its current version
- **WHEN** the Admin API is not configured and Core returns a plain-text version from `GET /version`
- **THEN** the Core-version action returns that value as `autoDetectedVersion`

#### Scenario: Core version request fails
- **WHEN** the Admin API is not configured and the request to Core's `GET /version` endpoint fails
- **THEN** the Core-version action returns no detected Core version and does not substitute an Admin-managed default or manual version

### Requirement: Footer version display in Core-only deployments
The system SHALL request the Core version when the shared content layout mounts and at the configured version-refresh interval, including when the Admin API is not configured. In a Core-only deployment, the footer SHALL display the retrieved Core version and SHALL remain display-only.

#### Scenario: Core-only footer receives a version
- **WHEN** the Admin API is not configured and the Core-version action returns a detected version
- **THEN** the footer displays that Core version without Admin-backend version information or version-edit controls

#### Scenario: Core-only footer refreshes the version
- **WHEN** the Admin API is not configured and the configured Core-version refresh interval elapses
- **THEN** the content layout requests the current Core version again

### Requirement: Admin-backed version behavior remains unchanged
The system SHALL continue to use the Admin backend's Core-version endpoint when `DIAL_ADMIN_API_URL` is configured, preserving its auto-detected, default, and manually-set version state and existing edit controls.

#### Scenario: Admin-backed deployment requests version state
- **WHEN** the Admin API is configured
- **THEN** the Core-version action delegates to the Admin backend version client and returns its existing Core-version response
