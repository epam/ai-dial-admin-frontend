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
