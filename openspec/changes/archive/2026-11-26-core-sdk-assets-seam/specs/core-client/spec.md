## MODIFIED Requirements

### Requirement: Envelope responses match the existing Core client
An SDK-backed method that returns a `ServerActionResponse` SHALL produce the same envelope the existing Core client produces for the same HTTP response: success is decided by the HTTP status alone; `etag` comes from the `etag` header and `requestId` from `traceparent`; failure messages are normalized through the Core error normalizer whatever the body is (JSON, plain text, or empty); a 2xx body carrying an `error` field is a failure; a `text/plain` success body is returned as text; and a cancelled request resolves to `{ success: false, status: 0, errorMessage: 'Request cancelled' }`. The success body of a `DELETE` SHALL be returned as its raw response text (`''` when the body is empty, including a `204`) and SHALL NOT be parsed as JSON, as the existing Core client does; for the same reason the `error`-field rule does not apply to a `DELETE`, so a 2xx `DELETE` whose body carries an `error` field is a success with that body as text. One known difference: a non-JSON success body that is not `text/plain` SHALL be returned as its raw text by the SDK-backed method, while the existing Core client still resolves it to `''` until its body handling is aligned in a change of its own.

#### Scenario: Empty-body failure is still a failure
- **WHEN** Core answers an envelope call with a non-2xx status and an empty body
- **THEN** the envelope has `success: false`, that status, and the status's fallback error message

#### Scenario: Cancelled envelope call
- **WHEN** an envelope call is aborted
- **THEN** it resolves to `{ success: false, status: 0, errorMessage: 'Request cancelled' }` instead of throwing

#### Scenario: DELETE with an empty body succeeds
- **WHEN** Core answers a `DELETE` with `200` or `204` and an empty body
- **THEN** the envelope has `success: true` and `response: ''`

#### Scenario: DELETE success body stays text
- **WHEN** Core answers a `DELETE` with `200` and a JSON body such as `{"deleted":true}`
- **THEN** the envelope has `success: true` and `response` is the string `{"deleted":true}`, not a parsed object

#### Scenario: DELETE body with an error field is not parsed
- **WHEN** Core answers a `DELETE` with `200` and a JSON body that carries an `error` field
- **THEN** the envelope has `success: true` and `response` is that body as a string, as the existing Core client returns it

#### Scenario: Failed DELETE is a failure
- **WHEN** Core answers a `DELETE` with a non-2xx status, for example `412` for a stale etag
- **THEN** the envelope has `success: false`, that status, and the normalized error message

#### Scenario: Not-modified conditional read
- **WHEN** a conditional read sends `If-None-Match` and Core answers `304`
- **THEN** the envelope is the same one the existing Core client produces for that status: `success: false`, status `304`, the response `etag` kept and `requestId` taken from `traceparent`

### Requirement: Calls the SDK cannot express stay on the hand-written client
Core calls the SDK cannot express SHALL stay on the hand-written Core client: multipart uploads, file streaming, `text/plain` reads, `v2/skills`, the generic `v1/metadata/{type}` reads of every resource type that has no SDK operation, the MCP client, and streamed chat completion. The SDK-backed calls are `BucketApi.getBucket`, `CoreUtilityApi.getUserInfo`, the deployment lookups `CoreUtilityApi.checkDeploymentByName` and `CoreUtilityApi.getDeploymentById`, the global-settings read and write on `SettingsApi`, the eight publication operations of `CorePublicationsApi` (list, get, create, rule list, approve, reject, delete, update), and the model content get, metadata get, save and delete of `AssetApi`. The per-resource enrichment calls a publication makes (asset get and put, file, skill and project metadata, file upload) are not publication operations and stay on their own clients.

#### Scenario: The plain-text Core version read is unchanged
- **WHEN** the current Core version is requested
- **THEN** it is fetched by the hand-written client with `Accept: text/plain`, not through the SDK

#### Scenario: Publication operations are SDK-backed
- **WHEN** any of the eight publication operations runs
- **THEN** it is sent by the SDK to the Core host with the caller's token, not by the hand-written client

#### Scenario: Publication enrichment stays on its own clients
- **WHEN** a publication is resolved and its resources are enriched
- **THEN** the asset, file, skill and project lookups are made by their existing clients, not through the publication SDK calls

#### Scenario: Model asset operations are SDK-backed
- **WHEN** a model's content, metadata, save or delete is requested through the asset client
- **THEN** it is sent by the SDK to the Core host with the caller's token, not by the hand-written client

#### Scenario: A resource type not yet routed through the SDK stays hand-written
- **WHEN** the content or metadata of a type that has no SDK route registered yet, such as a role, is requested through the asset client
- **THEN** it is fetched by the hand-written client at the same URL as before

## ADDED Requirements

### Requirement: Asset operations are dispatched per resource type
The asset client SHALL send a resource type's content get, metadata get, save and delete through the SDK when the type has an SDK operation registered for that verb, and through the hand-written client otherwise. A request through the SDK SHALL reach Core at exactly the URL and with exactly the query parameters, conditional headers and body the hand-written client sent for the same input. Each path segment SHALL be percent-encoded exactly once, as the hand-written client does, with `/` kept, and the SDK SHALL add no further encoding; so a name that already contains an escape such as `%20` is sent as `%2520`, exactly as before. Query parameters SHALL be sent in the same order as before, with `recursive` always present on a metadata read, and each SHALL decode to the same value as before; their bytes SHALL match the hand-written request except that a space is sent as `%20` instead of `+` and `~ ! ' ( )` are left unencoded. A type that has neither an SDK operation nor a hand-written URL SHALL fail with an error that names the type. A `403` on a content or metadata read SHALL resolve to `undefined`, any other failure to `null`.

#### Scenario: A model path reaches Core unchanged
- **WHEN** the metadata of a platform model is read with `recursive` and a continuation token
- **THEN** the request is `GET /v1/metadata/models/platform/` with the query string `recursive=…&token=…`, identical to the hand-written request byte for byte for a token that contains `+`, `/`, `=` or non-ASCII characters
- **AND** for a token that contains a space or `~ ! ' ( )` the `token` parameter decodes to the same value as in the hand-written request

#### Scenario: A single model's metadata path
- **WHEN** the metadata of one platform model is read by name
- **THEN** the request is `GET /v1/metadata/models/platform/{name}` with `recursive=false`, identical to the hand-written request

#### Scenario: Special characters reach Core exactly as before
- **WHEN** a model named with `%`, `+`, `?`, `#`, a space, a non-ASCII letter, an existing `%20` or a nested `/` is read, written or deleted
- **THEN** each request path equals the one the hand-written client built for that name (for example `100%` is sent as `100%25`, `a+b` as `a%2Bb`, `q?x#y` as `q%3Fx%23y`, `m%20n` as `m%2520n`), whatever path normalization the SDK applies to its own input

#### Scenario: Empty and folder paths keep their shape
- **WHEN** model metadata is read with an empty path, with the path `platform/`, or with a path that ends in `/`
- **THEN** the first two requests are `GET /v1/metadata/models/platform/` (the root listing) and the third keeps its trailing `/`, each identical to the hand-written request

#### Scenario: Content and write paths are not stripped
- **WHEN** a model content read, save or delete is made for a name that begins with `platform/`
- **THEN** that segment is sent as part of the name, and only the metadata read strips a leading `platform/`

#### Scenario: A create does not overwrite
- **WHEN** a model is saved without an etag and without the override flag
- **THEN** the request carries `If-None-Match: *`; with an etag it carries `If-Match` with that etag and no `If-None-Match`

#### Scenario: Forbidden and failed reads
- **WHEN** Core answers a model content or metadata read with `403`, or with another failure
- **THEN** the read resolves to `undefined` for the `403` and `null` for the other failure

#### Scenario: An unrouted type fails loudly
- **WHEN** a content request names a resource type that has no SDK operation and no hand-written URL
- **THEN** the call fails with an error that names that type instead of requesting a malformed URL
