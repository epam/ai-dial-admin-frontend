## ADDED Requirements

### Requirement: Content-addressed unversioned resource support (Model)
The system SHALL provide content GET/PUT/DELETE and metadata GET for the model resource kind directly against DIAL Core (`GET/PUT/DELETE /v1/models/platform/{name}` for content, `GET /v1/metadata/models/platform/` for metadata), matching the four versioned types' content-addressed shape (a real content endpoint, not just metadata+blob like `FILE`) but without applying the `__`-suffix version-parsing logic, since Core's `ConfigResourceController`-backed model resources carry no version.

#### Scenario: Model content and metadata are fetched separately and merged
- **WHEN** a model resource is requested by name
- **THEN** the client issues a content GET and a metadata GET to Core and returns a single merged object combining both, with no version field parsed from the name

#### Scenario: Model resource name is never suffixed with a version
- **WHEN** a model resource is created, updated, or fetched
- **THEN** its Core-facing path is `models/platform/{name}` with no `__version` suffix applied or expected

### Requirement: Model resource etag sourced from the metadata response, not the content response
Unlike the four versioned types, DIAL Core's per-entity model content GET does not set an `ETag` response header. The system SHALL resolve a model resource's etag from the metadata GET's `etag` field instead, and SHALL use that value when constructing subsequent conditional `If-Match`/`If-None-Match` requests.

#### Scenario: Model etag comes from metadata, not a content ETag header
- **WHEN** a model resource is fetched
- **THEN** the resolved etag is read from the metadata response's `etag` field, and the content response's headers are not consulted for it

#### Scenario: Model conditional requests still work with a metadata-sourced etag
- **WHEN** a model resource update or delete is issued with a metadata-sourced etag
- **THEN** the request's `If-Match` header carries that etag, and Core honors it for the conditional write
