# core-asset-client

## ADDED Requirements

### Requirement: Direct Core read/write for content-addressed asset resources
The system SHALL provide a server-side client that reads and writes application-resource, toolset-resource, conversation, and prompt content directly against DIAL Core (`GET/PUT/DELETE /v1/{type}/{path}` for content, `GET /v1/metadata/{type}/{path}` for metadata), authenticating with the logged-in user's JWT via the existing Core client pipeline. Application-resource and toolset-resource are versioned (their paths carry a `__version` suffix); conversation and prompt are versionless (their paths are plain `/`-joined segments, and `__` within a name is never interpreted) — the same content-addressed, unversioned treatment the model resource kind already receives.

#### Scenario: Content and metadata are fetched separately and merged
- **WHEN** an application-resource, toolset-resource, conversation, or prompt is requested by path
- **THEN** the client issues a content GET and a metadata GET to Core and returns a single merged domain object combining both

#### Scenario: No admin-BE call is made
- **WHEN** any operation on this client executes
- **THEN** the request goes to `DIAL_CORE_API_URL`, never to the admin-BE host

#### Scenario: Prompt and conversation names are never version-parsed
- **WHEN** a conversation or prompt is read or written and its name contains `__`
- **THEN** the name is used verbatim in the path with no `__` split applied and no version extracted

## MODIFIED Requirements

### Requirement: Single consolidated version-path helper
The system SHALL provide exactly one implementation of the `__`-suffix versioned-name parsing and building logic (extract name/version from a versioned name, build a versioned name, build and encode a versioned path), used by every asset mapper that needs it. Its scope SHALL be the versioned group — application-resource and toolset-resource — only; conversation and prompt mappers SHALL NOT use it, in any bucket.

#### Scenario: Version suffix extracted using the last occurrence
- **WHEN** a versioned name of an application-resource or toolset-resource contains more than one `__` occurrence
- **THEN** the name/version split uses the last `__` occurrence, not the first

#### Scenario: Blank or missing version is treated as unversioned
- **WHEN** a name has no `__` suffix, or the version portion is blank
- **THEN** the parsed version is treated as absent (not an empty string) and the name is returned unchanged

#### Scenario: Versionless group never passes through the helper
- **WHEN** a conversation or prompt name or path is parsed or built
- **THEN** the version-path helper is not applied, and a name containing `__` is preserved whole

### Requirement: Content+metadata field merge matches per-type source-of-truth
For application-resource and toolset-resource, the system SHALL populate `name`, `folderId`, `updatedAt`, `author`, and the parsed version from the metadata response, and populate the type-specific content fields from the content response. For conversation and prompt, the system SHALL populate `name`, `folderId`, `updatedAt`, and `author` from the metadata response and the type-specific content fields from the content response, with no `version` grafted from the URL — a `__` in the name stays part of the name.

#### Scenario: Metadata-sourced fields
- **WHEN** any of the four content-addressed types is merged from a content and metadata response pair
- **THEN** `name`, `folderId`, `updatedAt`, and `author` come from the metadata response's parsed URL, not the content response, and `version` comes from it only for application-resource and toolset-resource

#### Scenario: Content-sourced fields
- **WHEN** any of the four content-addressed types is merged
- **THEN** its type-specific fields (e.g. `endpoint`/`viewerUrl`/`editorUrl` for application-resource, `content`/`description` for prompt) come from the content response

#### Scenario: Conversation and prompt merge without a version
- **WHEN** a conversation or prompt is merged from a content and metadata response pair
- **THEN** the returned model carries no `version` field, and its `name` is the full last path segment including any `__`

### Requirement: Write operations resolve with normalized admin-format path fields

On a successful `put` (create or update) of a content-addressed asset resource, the client SHALL resolve with a response that includes the admin-format identity fields `path`, `folderId`, and `name`, derived from the resource path written to. For the versioned group (application-resource, toolset-resource) the response SHALL additionally include `version`, derived via the shared version-path helper; for conversation and prompt no `version` is included, since their paths carry no version part. This matches the field shape the merge readers already return, so post-write consumers (redirects, list refresh) receive a consistent object regardless of Core's raw response shape.

Existing Core-format fields on the response SHALL be preserved; the admin-format fields SHALL be added alongside them.

#### Scenario: Successful versioned write returns parsed path fields
- **WHEN** `put` succeeds for an application-resource or toolset-resource written to `folder/Name__1.0`
- **THEN** the resolved response SHALL include `path`, `folderId=folder/`, `name=Name`, and `version=1.0`

#### Scenario: Successful versionless write returns path fields without version
- **WHEN** `put` succeeds for a conversation or prompt written to `folder/Name` (whatever `Name` contains, including `__`)
- **THEN** the resolved response SHALL include `path`, `folderId=folder/`, and `name=Name`, with `version` undefined

#### Scenario: Failed write is unchanged
- **WHEN** `put` fails (non-success `ServerActionResponse`)
- **THEN** the response SHALL be returned unchanged, with no path fields added

#### Scenario: Unparseable path does not break the write
- **WHEN** `put` succeeds but the written path cannot be parsed into folder + name (e.g. a path with no `/` separator)
- **THEN** the successful response SHALL be returned unchanged rather than raising an error

## REMOVED Requirements

### Requirement: Direct Core read/write for versioned asset resources
**Reason**: Conversation and prompt are no longer versioned, so a requirement titled and scoped to "versioned asset resources" no longer describes the four content-addressed kinds it covers. Replaced by "Direct Core read/write for content-addressed asset resources", which keeps the identical read/write mechanics and states the group split.
**Migration**: None — the replacement carries the same endpoints, auth, and merge behavior; only the version treatment of conversation and prompt changes.
