# core-asset-client Specification

## Purpose
Direct-to-DIAL-Core client, version-path helper, and content+metadata mappers for the assets domain (application-resource, toolset-resource, conversation, prompt, file), replacing the admin-BE proxy these operations use today. Consumed by `migrate-publications-enrichment-to-core` and the per-type asset migrations (conversation, prompt, toolset-resource, application-resource, file); introduces no consumer-facing behavior change on its own — created by archiving change `add-core-asset-client`.

## Requirements

### Requirement: Direct Core read/write for versioned asset resources
The system SHALL provide a server-side client that reads and writes application-resource, toolset-resource, conversation, and prompt content directly against DIAL Core (`GET/PUT/DELETE /v1/{type}/{path}` for content, `GET /v1/metadata/{type}/{path}` for metadata), authenticating with the logged-in user's JWT via the existing Core client pipeline.

#### Scenario: Content and metadata are fetched separately and merged
- **WHEN** an application-resource, toolset-resource, conversation, or prompt is requested by path
- **THEN** the client issues a content GET and a metadata GET to Core and returns a single merged domain object combining both

#### Scenario: No admin-BE call is made
- **WHEN** any operation on this client executes
- **THEN** the request goes to `DIAL_CORE_API_URL`, never to the admin-BE host

### Requirement: Single consolidated version-path helper
The system SHALL provide exactly one implementation of the `__`-suffix versioned-name parsing and building logic (extract name/version from a versioned name, build a versioned name, build and encode a versioned path), used by every asset mapper that needs it.

#### Scenario: Version suffix extracted using the last occurrence
- **WHEN** a versioned name contains more than one `__` occurrence
- **THEN** the name/version split uses the last `__` occurrence, not the first

#### Scenario: Blank or missing version is treated as unversioned
- **WHEN** a name has no `__` suffix, or the version portion is blank
- **THEN** the parsed version is treated as absent (not an empty string) and the name is returned unchanged

### Requirement: Content+metadata field merge matches per-type source-of-truth
For each of application-resource, toolset-resource, conversation, and prompt, the system SHALL populate `name`, `folderId`, `updatedAt`, `author`, and the parsed version from the metadata response, and populate the type-specific content fields from the content response, matching the field split the admin BE's per-type mappers use today.

#### Scenario: Metadata-sourced fields
- **WHEN** any of the four versioned types is merged from a content and metadata response pair
- **THEN** `name`, `folderId`, `updatedAt`, `author`, and `version` come from the metadata response's parsed URL, not the content response

#### Scenario: Content-sourced fields
- **WHEN** any of the four versioned types is merged
- **THEN** its type-specific fields (e.g. `endpoint`/`viewerUrl`/`editorUrl` for application-resource, `content`/`description` for prompt) come from the content response

### Requirement: File asset client without versioning
The system SHALL provide a file-specific client that reads file metadata (`GET /v1/metadata/files/{path}`, including `contentType` and `contentLength`), streams file content, and writes/deletes files against Core — without applying the `__` version-suffix logic, since files are not versioned.

#### Scenario: File metadata carries content type and length
- **WHEN** file metadata is fetched
- **THEN** the returned object includes `contentType` and `contentLength` sourced from the metadata response, with no version field

### Requirement: Conditional headers mirror BE precondition semantics
The system SHALL send `If-None-Match` on reads and `If-Match` on writes/deletes for application-resource, toolset-resource, conversation, and prompt, omitting the header entirely when the etag is `null` or the `*` sentinel, matching the admin BE's `HeaderUtils` behavior.

#### Scenario: No etag means no conditional header
- **WHEN** a read or write is issued with a `null` etag or the `*` sentinel
- **THEN** no `If-Match`/`If-None-Match` header is sent

#### Scenario: A real etag produces a real conditional header
- **WHEN** a read or write is issued with a concrete etag value
- **THEN** the corresponding `If-Match`/`If-None-Match` header carries that exact value

### Requirement: File delete requires a real etag
The system SHALL require a non-empty etag to delete a file and SHALL always send it as `If-Match`, correcting the admin BE's behavior of silently ignoring the etag on file delete.

#### Scenario: File delete without a usable etag is rejected
- **WHEN** file delete is called without a concrete etag
- **THEN** the call is rejected before any request reaches Core, rather than deleting unconditionally

#### Scenario: File delete sends If-Match
- **WHEN** file delete is called with a concrete etag
- **THEN** the request to Core includes `If-Match` set to that etag

### Requirement: Default list path and limit for conversation and prompt only
The system SHALL default the list path to `"public/"` and the page-size limit to a configured default when either is omitted, for conversation and prompt reads only. Application-resource, toolset-resource, and file reads SHALL NOT apply this defaulting.

#### Scenario: Conversation list without a path defaults to public
- **WHEN** a conversation metadata read omits `path`
- **THEN** the request uses `"public/"` as the path

#### Scenario: Application-resource list without a path is not defaulted
- **WHEN** an application-resource metadata read omits `path`
- **THEN** no default path is substituted

### Requirement: Write operations resolve with normalized admin-format path fields

On a successful `put` (create or update) of a versioned asset resource, the client SHALL resolve with a response that includes the admin-format identity fields `path`, `folderId`, `name`, and `version`, derived from the resource path written to (via the shared version-path helper). This matches the field shape the merge readers already return, so post-write consumers (redirects, list refresh) receive a consistent object regardless of Core's raw response shape.

Existing Core-format fields on the response SHALL be preserved; the admin-format fields SHALL be added alongside them.

#### Scenario: Successful versioned write returns parsed path fields
- **WHEN** `put` succeeds for a resource written to `folder/Name__1.0`
- **THEN** the resolved response SHALL include `path`, `folderId=folder/`, `name=Name`, and `version=1.0`

#### Scenario: Unversioned write omits version
- **WHEN** `put` succeeds for a resource written to a path with no `__version` suffix
- **THEN** the resolved response SHALL include `path`, `folderId`, and `name`, with `version` undefined

#### Scenario: Failed write is unchanged
- **WHEN** `put` fails (non-success `ServerActionResponse`)
- **THEN** the response SHALL be returned unchanged, with no path fields added

#### Scenario: Unparseable path does not break the write
- **WHEN** `put` succeeds but the written path cannot be parsed into folder + name (e.g. a path with no `/` separator)
- **THEN** the successful response SHALL be returned unchanged rather than raising an error

### Requirement: Post-create redirect resolves to the created resource

After creating an asset resource through the create-asset flow, the application SHALL redirect to the created resource's detail route using the normalized `path` from the write response, without producing an invalid path containing `undefined` segments.

#### Scenario: Create Asset Toolset from an MCP container
- **WHEN** a user creates an Asset Toolset from an MCP container page and the write succeeds
- **THEN** the app SHALL navigate to `/assets-toolsets/<name>?path=<encoded resource path>`
- **AND** the target page SHALL load the created toolset instead of a 404

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
