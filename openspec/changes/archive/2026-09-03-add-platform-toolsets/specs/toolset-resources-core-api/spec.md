## ADDED Requirements

### Requirement: Platform-bucket toolset resources served directly by DIAL Core
The system SHALL route platform-bucket toolset list, get, create, update, delete, and bulk-delete
operations to DIAL Core via the same shared Core asset client used for public-bucket toolsets,
targeting `platform/`-prefixed paths instead of `public/`-prefixed ones. This is additive to the
existing public-bucket contract — `getToolsets`/`createToolset`/`getToolset`/`updateToolset`/
`removeToolset`/`bulkDeleteToolsets` and their `public/`-bucket behavior are unchanged.

#### Scenario: Platform-bucket CRUD operations call Core with a platform-prefixed path
- **WHEN** a platform-bucket toolset list, get, create, update, delete, or bulk-delete action runs
- **THEN** the request path passed to the shared Core asset client is prefixed with `platform/`
  instead of `public/`

#### Scenario: Public-bucket behavior is unaffected
- **WHEN** any existing public-bucket toolset action (`getToolsets`, `createToolset`, `getToolset`,
  `updateToolset`, `removeToolset`, `bulkDeleteToolsets`) runs with a `public/`-prefixed path
- **THEN** its request and response shape are unchanged from current behavior

### Requirement: Platform-bucket toolset writes omit version and folder placement
The system SHALL NOT include a `version` suffix or a folder-derived path segment when creating or
updating a platform-bucket toolset, since Core has no folder or versioning concept for the `platform`
bucket. Public-bucket writes are unaffected and keep computing a versioned, folder-prefixed path as
they do today.

#### Scenario: Platform-bucket create path has no version suffix
- **WHEN** a platform-bucket toolset is created
- **THEN** the path written to Core is the bare toolset name under `platform/`, with no `__version`
  suffix

#### Scenario: Platform-bucket update path has no folder segment
- **WHEN** a platform-bucket toolset is updated
- **THEN** the path written to Core carries no folder-derived prefix beyond the fixed `platform/`
  bucket segment

### Requirement: Platform-bucket toolset discovered-tools, sign-in, and sign-out are unaffected
The system SHALL route discovered-tools, sign-in, and sign-out for a platform-bucket toolset through
the same `ToolsetOpsApi` calls used for a public-bucket toolset, since Core resolves these by the
toolset's resource path/name regardless of bucket.

#### Scenario: Discovered-tools works for a platform-bucket toolset
- **WHEN** the discovered-tools list is fetched for a platform-bucket toolset
- **THEN** the request resolves by that toolset's `platform/`-prefixed path, the same way a
  public-bucket toolset's request resolves by its `public/`-prefixed path

#### Scenario: Sign-in and sign-out work for a platform-bucket toolset
- **WHEN** the user signs in to or out of a platform-bucket toolset
- **THEN** the request succeeds identically to a public-bucket toolset's sign-in/sign-out
