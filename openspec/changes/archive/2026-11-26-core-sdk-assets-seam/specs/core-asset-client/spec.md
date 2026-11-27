## MODIFIED Requirements

### Requirement: Content-addressed unversioned resource support (Model)
The system SHALL provide content GET/PUT/DELETE and metadata GET for the model resource kind directly against DIAL Core through the SDK (`GET/PUT/DELETE /v1/models/platform/{name}` for content, `GET /v1/metadata/models/platform/{name}` for one model's metadata and `GET /v1/metadata/models/platform/` for the root listing), matching the four versioned types' content-addressed shape (a real content endpoint, not just metadata+blob like `FILE`) but without applying the `__`-suffix version-parsing logic, since Core's `ConfigResourceController`-backed model resources carry no version. The requests SHALL reach the same Core endpoints the hand-written client used.

#### Scenario: Model content and metadata are fetched separately and merged
- **WHEN** a model resource is requested by name
- **THEN** the client issues a content GET and a metadata GET to Core and returns a single merged object combining both, with no version field parsed from the name

#### Scenario: Model resource name is never suffixed with a version
- **WHEN** a model resource is created, updated, or fetched
- **THEN** its Core-facing path is `models/platform/{name}` with no `__version` suffix applied or expected

#### Scenario: Model requests go through the SDK to the same endpoints
- **WHEN** a model is read, saved or deleted
- **THEN** the request is sent by the SDK to `/v1/models/platform/{name}` (or `/v1/metadata/models/platform/{name}` for its metadata, `/v1/metadata/models/platform/` for the root listing), the same path and method the hand-written client used
