# core-client Specification

## Purpose
The transport contract every DIAL Core call made through `@epam/ai-dial-typescript-sdk` follows: one client per Core host, per-call authorization, logout cancellation, and a response mapping identical to the hand-written `CoreApi` path so callers cannot tell which one served them. Also names the calls that stay hand-written because the SDK cannot express them. Created by archiving change `adopt-core-sdk-pilot`, which moved `BucketApi.getBucket` and `CoreUtilityApi.getUserInfo` onto the SDK.
## Requirements
### Requirement: One SDK client per Core host with per-call authorization
The system SHALL reach DIAL Core through `@epam/ai-dial-typescript-sdk` via a single client instance per Core host, created without any default token. Each call SHALL carry the caller's JWT as its own `authorization` header, taken from the API method's `token` argument.

#### Scenario: Clients for the same host share one SDK instance
- **WHEN** two Core API clients are constructed for the same host
- **THEN** both use the same SDK instance

#### Scenario: Each call is authorized with its caller's token
- **WHEN** an SDK-backed Core method is called with a user's token
- **THEN** the request carries `authorization: Bearer <that token>`, and no other caller's token

### Requirement: SDK requests are cancellable, uncached, and JSON by default
Every SDK request SHALL register an abort controller in the shared request registry for its duration, so that cancelling all requests on logout aborts it. A signal supplied by the caller SHALL be combined with the registry's, so either one aborts the request. Every request SHALL be sent with `cache: 'no-store'` and SHALL default `Accept` to `application/json` when the call sets none.

#### Scenario: Logout aborts an in-flight Core call
- **WHEN** the request registry cancels all requests while an SDK call is in flight
- **THEN** the call is aborted and its controller is no longer registered

#### Scenario: A caller's own signal aborts only its request
- **WHEN** a caller passes an abort signal and aborts it
- **THEN** that request is aborted without cancelling other registered requests

### Requirement: Envelope responses match the existing Core client
An SDK-backed method that returns a `ServerActionResponse` SHALL produce the same envelope the existing Core client produces for the same HTTP response: success is decided by the HTTP status alone; `etag` comes from the `etag` header and `requestId` from `traceparent`; failure messages are normalized through the Core error normalizer whatever the body is (JSON, plain text, or empty); a 2xx body carrying an `error` field is a failure; a `text/plain` success body is returned as text; and a cancelled request resolves to `{ success: false, status: 0, errorMessage: 'Request cancelled' }`. One known difference: a non-JSON success body that is not `text/plain` SHALL be returned as its raw text by the SDK-backed method, while the existing Core client still resolves it to `''` until its body handling is aligned in a change of its own.

#### Scenario: Empty-body failure is still a failure
- **WHEN** Core answers an envelope call with a non-2xx status and an empty body
- **THEN** the envelope has `success: false`, that status, and the status's fallback error message

#### Scenario: Cancelled envelope call
- **WHEN** an envelope call is aborted
- **THEN** it resolves to `{ success: false, status: 0, errorMessage: 'Request cancelled' }` instead of throwing

### Requirement: Value responses match the existing Core client
An SDK-backed method that returns a value (not an envelope) SHALL resolve to the parsed body on success, `undefined` on a 403, and `null` on any other failure or when the request is cancelled.

#### Scenario: Forbidden value read
- **WHEN** Core answers a value call with 403
- **THEN** the method resolves to `undefined`

#### Scenario: Other failed value read
- **WHEN** Core answers a value call with any other non-2xx status, or the call is aborted
- **THEN** the method resolves to `null`

### Requirement: Calls the SDK cannot express stay on the hand-written client
Core calls the SDK cannot express SHALL stay on the hand-written Core client: multipart uploads, file streaming, `text/plain` reads, `v2/skills`, generic `v1/metadata/{type}`, the MCP client, and streamed chat completion. The SDK-backed calls are `BucketApi.getBucket`, `CoreUtilityApi.getUserInfo`, the deployment lookups `CoreUtilityApi.checkDeploymentByName` and `CoreUtilityApi.getDeploymentById`, the global-settings read and write on `SettingsApi`, and the eight publication operations of `CorePublicationsApi` (list, get, create, rule list, approve, reject, delete, update). The per-resource enrichment calls a publication makes (asset get and put, file, skill and project metadata, file upload) are not publication operations and stay on their own clients.

#### Scenario: The plain-text Core version read is unchanged
- **WHEN** the current Core version is requested
- **THEN** it is fetched by the hand-written client with `Accept: text/plain`, not through the SDK

#### Scenario: Publication operations are SDK-backed
- **WHEN** any of the eight publication operations runs
- **THEN** it is sent by the SDK to the Core host with the caller's token, not by the hand-written client

#### Scenario: Publication enrichment stays on its own clients
- **WHEN** a publication is resolved and its resources are enriched
- **THEN** the asset, file, skill and project lookups are made by their existing clients, not through the publication SDK calls

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

