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
An SDK-backed method that returns a `ServerActionResponse` SHALL produce the same envelope the existing Core client produces for the same HTTP response: success is decided by the HTTP status alone; `etag` comes from the `etag` header and `requestId` from `traceparent`; failure messages are normalized through the Core error normalizer whatever the body is (JSON, plain text, or empty); a 2xx body carrying an `error` field is a failure; a `text/plain` success body is returned as text and a non-JSON success body as its raw text; and a cancelled request resolves to `{ success: false, status: 0, errorMessage: 'Request cancelled' }`.

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
Core calls the SDK cannot express SHALL stay on the hand-written Core client: multipart uploads, file streaming, `text/plain` reads, `v2/skills`, generic `v1/metadata/{type}`, the MCP client, and streamed chat completion. The SDK-backed calls are `BucketApi.getBucket` and `CoreUtilityApi.getUserInfo`.

#### Scenario: The plain-text Core version read is unchanged
- **WHEN** the current Core version is requested
- **THEN** it is fetched by the hand-written client with `Accept: text/plain`, not through the SDK
