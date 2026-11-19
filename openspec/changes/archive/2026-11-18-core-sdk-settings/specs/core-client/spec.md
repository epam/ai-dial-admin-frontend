## ADDED Requirements

### Requirement: Callers can add request headers without losing authorization
An SDK-backed method SHALL be able to send extra request headers, such as `If-Match` or `If-None-Match`, alongside the caller's `authorization` header. Extra headers SHALL be added to the request and SHALL NOT remove, replace, or supply `authorization`, whatever their casing. A header the method does not set SHALL NOT be sent.

#### Scenario: Extra header travels with the token
- **WHEN** an SDK-backed method sends `If-None-Match: "abc"` for a caller with a token
- **THEN** the request carries both `authorization: Bearer <that token>` and `If-None-Match: "abc"`

#### Scenario: Extra header cannot displace authorization
- **WHEN** an SDK-backed method passes an extra header named `Authorization` (any casing) for a caller with a token
- **THEN** the request carries exactly one authorization value, the caller's own

#### Scenario: Extra header cannot supply authorization
- **WHEN** an SDK-backed method passes an extra header named `authorization` for a caller with no token
- **THEN** the request carries no `authorization` header

#### Scenario: Unset conditional header is omitted
- **WHEN** an SDK-backed write has no etag to send
- **THEN** the request carries no `If-Match` header

### Requirement: Global settings are read and written conditionally through the SDK
The global-settings singleton SHALL be read and written through the SDK on the `platform` bucket's `global` entry. A read SHALL send `If-None-Match` only when the caller gives a real etag, and SHALL send no `If-None-Match` for `DEFAULT_ETAG` (`*`) or an empty etag, so a plain read cannot be answered with 304; a write SHALL send `If-Match` with the etag when one is given — including `DEFAULT_ETAG`, sent as `If-Match: *` to assert the settings already exist — and no `If-Match` when the etag is undefined, which makes it a create. The envelope SHALL match the existing Core client for every outcome: a read of a settings blob that does not exist yet is a failure with status 404; a write rejected by a stale etag is a failure with status 412; and the response `etag` is the `etag` header. Metadata fields `name` and `status` SHALL be omitted from the settings a read returns, and every other field SHALL be kept so that a save writes back what the read returned.

#### Scenario: Plain read sends no If-None-Match
- **WHEN** the settings are read with `DEFAULT_ETAG`
- **THEN** the request carries no `If-None-Match` header

#### Scenario: Read with a real etag is conditional
- **WHEN** the settings are read with etag `"e1"`
- **THEN** the request carries `If-None-Match: "e1"`

#### Scenario: Read before any override exists
- **WHEN** Core answers the settings read with 404
- **THEN** the envelope has `success: false` and `status: 404`, so callers can tell "no override yet" from an error

#### Scenario: Write with a current etag
- **WHEN** the settings are saved with etag `"e1"`
- **THEN** the request carries `If-Match: "e1"` and the envelope carries the new `etag` header

#### Scenario: Update of existing settings with DEFAULT_ETAG
- **WHEN** the settings are saved with `DEFAULT_ETAG`
- **THEN** the request carries `If-Match: *`

#### Scenario: Create when no settings exist
- **WHEN** the settings are saved with an undefined etag
- **THEN** the request carries no `If-Match` header

#### Scenario: Write with a stale etag
- **WHEN** Core answers a settings save with 412
- **THEN** the envelope has `success: false` and `status: 412`

#### Scenario: Unmodelled settings survive a round trip
- **WHEN** Core returns settings containing `name`, `status`, and a field admin does not model
- **THEN** the read omits `name` and `status`, keeps the unmodelled field, and a save of that value sends the unmodelled field and neither `name` nor `status`

## MODIFIED Requirements

### Requirement: Calls the SDK cannot express stay on the hand-written client
Core calls the SDK cannot express SHALL stay on the hand-written Core client: multipart uploads, file streaming, `text/plain` reads, `v2/skills`, generic `v1/metadata/{type}`, the MCP client, and streamed chat completion. The SDK-backed calls are `BucketApi.getBucket`, `CoreUtilityApi.getUserInfo`, and the global-settings read and write on `SettingsApi`.

#### Scenario: The plain-text Core version read is unchanged
- **WHEN** the current Core version is requested
- **THEN** it is fetched by the hand-written client with `Accept: text/plain`, not through the SDK
