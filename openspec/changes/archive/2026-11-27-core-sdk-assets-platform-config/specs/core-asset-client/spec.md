## MODIFIED Requirements

### Requirement: Verbatim-body resource support (app-runner)

The system SHALL provide content GET/PUT/DELETE and metadata GET for the app-runner resource kind directly against DIAL Core (`GET/PUT/DELETE /v1/schemas/platform/{name}` for content, `GET /v1/metadata/schemas/platform/` for metadata), treating it as flat and unversioned like the model resource kind, but recognising that Core stores its request body **verbatim** rather than round-tripping it through a typed entity.

This is a second, distinct family within the client. For the typed-entity kinds Core rejects or silently drops fields its entity class does not declare; for the app-runner kind (`WriteSpec.entityClass == null`, `blobBody = requestNode.toString()`) every field sent is persisted permanently. The client SHALL therefore treat payload construction for this kind as lossy-forward: callers are responsible for sending only fields intended for permanent storage, and the client SHALL NOT rely on Core to filter them.

#### Scenario: App-runner content and metadata are fetched separately and merged

- **WHEN** an app-runner resource is requested by name
- **THEN** the client issues a content GET and a metadata GET to Core and returns a single merged object combining both, with no version field parsed from the name

#### Scenario: Verbatim storage means unfiltered persistence

- **WHEN** a field not declared by the app-runner meta-schema is included in a write payload
- **THEN** Core accepts the write and the field is present in the stored resource on the next read

#### Scenario: No write-time validation is available for this kind

- **WHEN** a structurally invalid app-runner body is written
- **THEN** Core responds with success rather than a validation error, so the client SHALL NOT treat a successful write as evidence of a valid payload

#### Scenario: App-runner requests go through the SDK to the same endpoints with the body unchanged

- **WHEN** an app-runner resource is read, saved or deleted
- **THEN** the request is sent by the SDK to `/v1/schemas/platform/{name}` (or `/v1/metadata/schemas/platform/{name}` for its metadata, `/v1/metadata/schemas/platform/` for the root listing), the same path and method the hand-written client used, and a saved body reaches Core with every field the caller sent, none added or dropped
