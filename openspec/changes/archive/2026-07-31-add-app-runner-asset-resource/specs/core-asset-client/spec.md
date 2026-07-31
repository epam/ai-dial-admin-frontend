## ADDED Requirements

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

### Requirement: App-runner resource name carries an extra encoding layer

Unlike the five existing resource kinds, whose names pass through the shared path builder's single segment encoding, the app-runner resource name is a URI (`$id`) that must survive Core's `ENTITY_NAME_PATTERN` (`^[A-Za-z0-9._%:-]+$`) after the route boundary decodes one layer. The client SHALL apply one additional percent-encoding layer to the name before the shared path builder encodes it, and SHALL reverse both layers when parsing a name back out of a metadata `url`.

#### Scenario: Encoding layers compose on write

- **WHEN** a name containing `/` and `:` is written for the app-runner kind
- **THEN** the wire path carries the doubly-encoded form, and the resource name Core stores is the singly-encoded form

#### Scenario: Decoding layers compose on read

- **WHEN** an app-runner metadata `url` is parsed
- **THEN** both encoding layers are reversed and the original name is recovered

#### Scenario: Other resource kinds are unaffected

- **WHEN** any of application, toolset, conversation, prompt, file, or model is read or written
- **THEN** its name encoding is unchanged by this requirement

### Requirement: The listed resource path stays singly encoded end to end

The path a listing row carries SHALL remain in its singly-encoded form from the metadata parse through to the next Core request, so that the shared path builder re-applies exactly one layer. No consumer between those two points may decode it again. A second decode exposes the `$id`'s `:` and `/`, which the path builder then treats as segment separators, addressing a resource that does not exist.

#### Scenario: A listing row's path is the singly-encoded resource name

- **WHEN** an app-runner metadata `url` is parsed into a listing row
- **THEN** the row's path holds the singly-encoded resource name while its displayed name holds the fully decoded `$id`

#### Scenario: The detail read reconstructs the original wire path

- **WHEN** a listing row's path is carried through a detail-view URL parameter and used for the content read
- **THEN** the resulting Core request path equals the doubly-encoded form used when the resource was written

#### Scenario: An extra decode is rejected, not silently mis-addressed

- **WHEN** a consumer decodes the path a second time before the content read
- **THEN** the reconstructed request path no longer matches the written form, and the read fails to find the resource

### Requirement: App-runner etag sourced from the metadata response

As with the model resource kind, DIAL Core's per-entity app-runner content GET does not set an `ETag` response header. The client SHALL resolve an app-runner resource's etag from the metadata GET's `etag` field and use that value when constructing subsequent conditional `If-Match`/`If-None-Match` requests.

#### Scenario: App-runner etag comes from metadata

- **WHEN** an app-runner resource is fetched
- **THEN** the resolved etag is read from the metadata response's `etag` field, and the content response's headers are not consulted for it

### Requirement: Metadata node exposes createdAt

The client's Core resource metadata node SHALL expose `createdAt` alongside `updatedAt`, `author`, and `etag`, and the flat-type merge SHALL project it onto the returned resource, since Core's `ResourceItemMetadata` carries it and flat resource kinds have no other source for a creation timestamp.

#### Scenario: createdAt is projected for flat resource kinds

- **WHEN** a flat resource kind is merged from a content and metadata response pair
- **THEN** the returned object includes `createdAt` sourced from the metadata response
