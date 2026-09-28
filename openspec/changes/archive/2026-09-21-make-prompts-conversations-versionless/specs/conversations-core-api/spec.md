# conversations-core-api

## MODIFIED Requirements

### Requirement: Conversation get uses conditional GET and metadata+content merge
The system SHALL fetch a single conversation via the shared Core asset client's conditional GET (honoring the supplied etag) merged with its metadata, returning the `DialConversation` shape and etag. The merged conversation and every conversation list row SHALL NOT carry a `version` field — the name, including any `__` it contains, is the whole name.

#### Scenario: Get returns conversation and etag
- **WHEN** `getConversation(path, etag)` is called
- **THEN** the response includes both the merged `DialConversation` and the resource's current etag, with no version field on the model

#### Scenario: A conversation whose name contains double underscores is returned unchanged
- **WHEN** a stored conversation is named `foo__bar`
- **THEN** the merged model's name is exactly `foo__bar`, with no version parsed from it
