## ADDED Requirements

### Requirement: Platform-bucket application resources served directly by DIAL Core
The system SHALL route platform-bucket application list, get, create, update, delete, and bulk-delete
operations to DIAL Core via the same shared Core asset client used for public-bucket applications,
targeting `platform/`-prefixed paths instead of `public/`-prefixed ones. This is additive to the
existing public-bucket contract — `getApps`/`createApp`/`getApp`/`updateApp`/`removeApp`/
`bulkDeleteApps` and their `public/`-bucket behavior are unchanged.

#### Scenario: Platform-bucket CRUD operations call Core with a platform-prefixed path
- **WHEN** a platform-bucket application list, get, create, update, delete, or bulk-delete action runs
- **THEN** the request path passed to the shared Core asset client is prefixed with `platform/`
  instead of `public/`

#### Scenario: Public-bucket behavior is unaffected
- **WHEN** any existing public-bucket application action (`getApps`, `createApp`, `getApp`,
  `updateApp`, `removeApp`, `bulkDeleteApps`) runs with a `public/`-prefixed path
- **THEN** its request and response shape are unchanged from current behavior

### Requirement: Platform-bucket application writes omit version and folder placement
The system SHALL NOT include a `version` suffix or a folder-derived path segment when creating or
updating a platform-bucket application, since Core has no folder or versioning concept for the
`platform` bucket. Public-bucket writes are unaffected and keep computing a versioned,
folder-prefixed path as they do today.

#### Scenario: Platform-bucket create path has no version suffix
- **WHEN** a platform-bucket application is created
- **THEN** the path written to Core is the bare application name under `platform/`, with no
  `__version` suffix

#### Scenario: Platform-bucket update path has no folder segment
- **WHEN** a platform-bucket application is updated
- **THEN** the path written to Core carries no folder-derived prefix beyond the fixed `platform/`
  bucket segment
