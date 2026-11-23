## ADDED Requirements

### Requirement: Unqualified role details resolve Core's effective role

For `/platform-roles/{name}` without `configFile=true`, the system SHALL read the Core platform role first. If that role is found, the system SHALL display it with normal platform permissions and its resource ETag. Only a confirmed platform content 404 SHALL cause a configuration-file role lookup. If that lookup succeeds, the system SHALL display its result read-only at the same unqualified URL. If both reads return confirmed 404s, the system SHALL show not found. Core's resource and metadata clients and the read-only `GET /v1/admin/config/file/roles/{name}` contract in `core-config-file-client` are the sources of these reads; the admin backend SHALL NOT be required.

#### Scenario: Platform-only role

- **WHEN** the unqualified detail URL names a platform role
- **THEN** the platform role is displayed with its ETag and normal permission-dependent controls
- **AND** the configuration-file role is not read

#### Scenario: File-only role

- **WHEN** the platform content read returns 404 and the configuration-file read finds the role
- **THEN** the file-defined role is displayed at the unqualified URL with no mutating controls and no ADMIN/CORE format selector

#### Scenario: Both populations contain the name

- **WHEN** a role name is present in both platform and configuration-file populations
- **THEN** the unqualified detail URL displays the platform role

#### Scenario: Neither population contains the name

- **WHEN** the platform content and configuration-file reads both return 404 for a role name
- **THEN** the detail route shows not found

#### Scenario: Read-only state is reset

- **WHEN** a user leaves a file-defined role opened through the unqualified URL and opens a platform role
- **THEN** the platform role uses its normal permissions rather than inheriting file read-only state

### Requirement: Explicit file-source role addresses remain source-specific

When `/platform-roles/{name}?configFile=true` is requested, the system SHALL read only the configuration-file role and SHALL render it read-only. It SHALL NOT substitute a same-name platform role. A confirmed file 404 SHALL show not found; other failures SHALL follow the role lookup failure requirement.

#### Scenario: A file-root link selects the file role on collision

- **WHEN** a file-root role link has `configFile=true` and a platform role has the same name
- **THEN** the file-defined role is displayed read-only and no platform-role lookup is used

### Requirement: Role lookup failures are not treated as absence

The system SHALL distinguish confirmed 404s from access denial, service, transport, cancellation, malformed-response and indeterminate failures on either lookup. Such failures SHALL surface through the established server error presentation, without displaying a different source as a fallback or showing a not-found result. A failed or missing metadata response after successful platform content SHALL be treated as an indeterminate error, not proof that the platform role is absent. User-visible errors SHALL NOT expose backend secrets.

#### Scenario: Platform access is denied

- **WHEN** the platform role read returns 401 or 403
- **THEN** the user sees an error rather than a file role or not-found page
- **AND** no configuration-file fallback is attempted

#### Scenario: Metadata cannot be resolved

- **WHEN** platform role content is returned successfully but its metadata read fails or returns no metadata
- **THEN** the user sees an error and the configuration-file role is not substituted

#### Scenario: File-source access is denied

- **WHEN** a configuration-file role lookup is refused, whether explicit or after a platform 404
- **THEN** the user sees an access error rather than a not-found page

#### Scenario: Service or transport failure

- **WHEN** either applicable lookup fails with a server error, cancellation, network error or an indeterminate result
- **THEN** the user sees an error rather than a not-found page or a different source's role
