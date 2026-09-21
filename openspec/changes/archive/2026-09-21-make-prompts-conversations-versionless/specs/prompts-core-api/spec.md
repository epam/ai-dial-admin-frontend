# prompts-core-api

## ADDED Requirements

### Requirement: Prompt get uses a conditional GET by path
The system SHALL fetch a single prompt by its storage path via the shared Core asset client's conditional GET (honoring the supplied etag), merged with its metadata, returning the `DialPrompt` shape and etag — mirroring how conversations are fetched today. The prompt model SHALL NOT carry a `version` field.

#### Scenario: Get resolves by path
- **WHEN** `getPrompt(path, etag)` is called
- **THEN** the prompt at that exact path is fetched with the supplied etag, with no folder listing, no name matching, and no version matching

#### Scenario: A prompt whose name contains double underscores is fetched unchanged
- **WHEN** `getPrompt` is called for a stored prompt named `foo__bar`
- **THEN** the request addresses the path containing `foo__bar` verbatim and the returned model's name is `foo__bar`

### Requirement: Prompt delete is conditional and move uses plain destination names
The system SHALL send `If-Match` for single prompt delete when a concrete etag is supplied and no conditional header when omitted; bulk delete SHALL remain unconditional per item. Move SHALL build destination paths from the plain resource name — when a duplicate name is supplied, that name is used verbatim, with no version suffix extracted from or reapplied to the source path.

#### Scenario: Single delete is conditional when an etag is present
- **WHEN** `removePrompt(path, etag)` is called with a concrete etag
- **THEN** the delete request to Core includes `If-Match` set to that etag

#### Scenario: Move with a duplicate name uses the name verbatim
- **WHEN** `movePrompts` is called with a `duplicateName`
- **THEN** the destination path uses `duplicateName` as the resource name, unchanged by anything in the source path

#### Scenario: Move of a name containing double underscores preserves it
- **WHEN** `movePrompts` moves a prompt named `foo__1.0`
- **THEN** the destination resource is named `foo__1.0` (or the verbatim `duplicateName` in the duplicate flow), with the `__` treated as part of the name

## MODIFIED Requirements

### Requirement: Prompt import resolves conflicts against Core's live state
The system SHALL validate each incoming prompt's `id` against the versionless prompt path shape (`prompts/{bucket}/{folders}/{name}`, where the name segment is any valid filename and `__` is neither required nor forbidden), check whether a prompt already exists at its resolved destination path directly against DIAL Core, and apply the caller-supplied conflict-resolution policy: `OVERRIDE` writes through regardless of an existing conflict; `SKIP` treats an existing conflict as a non-error skipped outcome rather than a failure. Ids from documents exported before this change — whose names carry a `__version` suffix — SHALL be accepted, the suffix being part of the name.

#### Scenario: OVERRIDE writes through despite an existing prompt
- **WHEN** an incoming prompt targets a path where a prompt already exists and the policy is `OVERRIDE`
- **THEN** the import writes the incoming prompt to that path

#### Scenario: SKIP treats an existing prompt as a non-failure
- **WHEN** an incoming prompt targets a path where a prompt already exists and the policy is `SKIP`
- **THEN** that entry is reported as skipped, not as a failure, and does not count toward the consecutive-failure circuit breaker

#### Scenario: An id that fails the path-shape check is rejected
- **WHEN** an incoming prompt's `id` does not match the versionless prompt path shape
- **THEN** that entry is rejected before any write is attempted against Core

#### Scenario: A previously exported versioned id imports as a literal name
- **WHEN** an incoming prompt's `id` is `prompts/public/foo__1.0` (exported before this change)
- **THEN** the import resolves it to a prompt named `foo__1.0`, and the `__1.0` suffix is treated as part of the name

## REMOVED Requirements

### Requirement: Prompt get resolves path via folder listing, then conditional GET
**Reason**: Prompt get no longer resolves by listing a folder and matching on `name` and `version` — prompts are versionless, so there is no version to match, and the detail page already holds the full path. Replaced by "Prompt get uses a conditional GET by path".
**Migration**: `getPrompt(folderId, name, version, etag)` becomes `getPrompt(path, etag)`; callers pass the storage path directly.

### Requirement: Prompt delete and move preserve existing conditional/duplicate semantics
**Reason**: The move-with-duplicate behavior of reappling the source's version suffix to the duplicate name depends on the version convention being removed. Replaced by "Prompt delete is conditional and move uses plain destination names", which preserves the conditional-delete semantics.
**Migration**: Move flows for prompts stop computing a version suffix; destination names are the supplied names verbatim.
