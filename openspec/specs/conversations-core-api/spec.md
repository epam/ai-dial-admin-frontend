# conversations-core-api Specification

## Purpose
Conversation list, get, delete, and bulk-delete executed directly against DIAL Core via the shared `core-asset-client`, replacing the admin-BE proxy, while the FE-facing `DialConversation` contract, routes, and server-action signatures stay identical — created by archiving change `migrate-conversations-to-core`.

## Requirements

### Requirement: Conversations served directly by DIAL Core
The system SHALL route conversation list, get, delete, and bulk-delete operations to DIAL Core unconditionally via the shared Core asset client — there is no admin-BE fallback and no feature flag. The cutover SHALL NOT change the `/conversations` routes, the `ConversationsList`/`ConversationView` components, the server-action signatures in `conversations/actions.ts`, or the `DialConversation` model.

#### Scenario: Conversation operations call Core
- **WHEN** any of `getConversations`, `getConversation`, `deleteConversation`, `deleteConversations` runs
- **THEN** it calls DIAL Core via the shared asset client, not the admin BE

#### Scenario: Contract unchanged
- **WHEN** the conversations list page or a single conversation page renders
- **THEN** the data shape passed to `ConversationsList`/`ConversationView` is identical to what the admin-BE path returned previously

### Requirement: Conversation list uses metadata defaults
The system SHALL list conversations via the shared Core asset client's metadata read, relying on that client's default path (`"public/"`) and default limit when the caller omits either.

#### Scenario: Listing without an explicit path
- **WHEN** `getConversations` is called without a path (or with an empty path)
- **THEN** the underlying metadata read defaults to `"public/"` and returns the same top-level conversation list the BE-backed path returned

#### Scenario: Listing a specific folder
- **WHEN** `getConversations` is called with a folder path (e.g. a conversation's `folderId`)
- **THEN** only conversations under that folder are returned

### Requirement: Conversation get uses conditional GET and metadata+content merge
The system SHALL fetch a single conversation via the shared Core asset client's conditional GET (honoring the supplied etag) merged with its metadata, returning the same `DialConversation` shape and etag the admin-BE path returned.

#### Scenario: Get returns conversation and etag
- **WHEN** `getConversation(path, etag)` is called
- **THEN** the response includes both the merged `DialConversation` and the resource's current etag

### Requirement: Conversation delete is conditional; bulk delete is unconditional per item
The system SHALL send `If-Match` for single conversation delete when a concrete etag is supplied, and SHALL send no conditional header (matching the existing `DEFAULT_ETAG`/`*` sentinel behavior) when it is omitted. Bulk delete SHALL continue to delete each path unconditionally, with no per-item etag.

#### Scenario: Single delete with an etag is conditional
- **WHEN** `deleteConversation(path, etag)` is called with a concrete etag
- **THEN** the delete request to Core includes `If-Match` set to that etag

#### Scenario: Single delete without an etag is unconditional
- **WHEN** `deleteConversation(path)` is called without an etag
- **THEN** the delete request to Core sends no `If-Match` header

#### Scenario: Bulk delete has no per-item etag
- **WHEN** `deleteConversations(paths)` is called
- **THEN** each path is deleted without a conditional header, matching current behavior
