## ADDED Requirements

### Requirement: Model resources served directly by DIAL Core
The system SHALL route model-resource list, get, create, update, and delete operations to DIAL Core's `ConfigResourceController`-backed routes (`GET/PUT/DELETE /v1/models/platform/{name}`, list via `GET /v1/metadata/models/platform/`) unconditionally — there is no admin-BE fallback and no feature flag for these operations. This is a distinct resource kind from `Entities > Models` (admin-BE-backed); the two SHALL NOT share server actions or API clients.

#### Scenario: Model-resource CRUD operations call Core
- **WHEN** any of `getModels`, `createModel`, `getModel`, `updateModel`, `removeModel` (the asset-side actions) runs
- **THEN** its content and metadata are read from or written to DIAL Core via the shared asset client, not the admin BE

### Requirement: Model resource list and storage are flat, with a single fixed root
The system SHALL treat `platform` as the only listable root for model resources and SHALL NOT expose folder-create, rename-folder, or move-into-folder affordances for this resource kind, matching `ConfigResourceController`'s flat (non-nested) storage model.

#### Scenario: Listing returns only entries under platform
- **WHEN** `getModels` lists model resources
- **THEN** every returned entry's path is a direct child of the `platform` root, with no nested subfolders

#### Scenario: No folder-create action is available
- **WHEN** the model asset list is requested
- **THEN** the response contains no folder-creation capability, unlike the four versioned asset types

### Requirement: Model resource create rejects on conflict; update requires the current etag
The system SHALL create a model resource with `If-None-Match: *` (rejecting if a resource already exists at that name) and SHALL update with `If-Match` set to the caller's etag.

#### Scenario: Create conflicts with an existing model resource
- **WHEN** `createModel` targets a name that already exists in Core
- **THEN** the create request is rejected with a recognizable "already exists" error

#### Scenario: Update sends the caller's etag
- **WHEN** `updateModel(model, etag)` is called
- **THEN** the update request to Core includes `If-Match` set to that etag

### Requirement: Model resource etag is sourced from metadata, not content
Since DIAL Core's per-entity model GET (`GET /v1/models/platform/{name}`) does not set an `ETag` response header, the system SHALL resolve a fetched model resource's etag from the corresponding metadata GET's `etag` field, and SHALL use that value for subsequent conditional update/delete calls.

#### Scenario: Get resolves etag from metadata
- **WHEN** `getModel` fetches a model resource
- **THEN** the returned etag comes from the metadata response, not from an `ETag` header on the content response

### Requirement: Model resource GET surfaces Core's computed validity status as a read-only field; update strips it before writing
DIAL Core's model resource GET injects a synthetic `status` field (`"valid"`/`"invalid"`) that has no backing property on the underlying `Model` entity. The system SHALL surface that `status` value as a read-only field on the fetched model resource, and SHALL remove `status` (along with other non-Model identity fields such as `path`/`folderId`) from the payload before sending any create/update request to Core. Echoing the raw GET body back verbatim as a PUT payload is unsupported and SHALL NOT be relied upon, since Core's model deserialization rejects unrecognized fields.

#### Scenario: Get includes status
- **WHEN** `getModel` fetches a model resource
- **THEN** the returned resource includes a `status` field sourced from Core's GET response

#### Scenario: Update omits status
- **WHEN** `updateModel` sends a request to Core
- **THEN** the request body does not include a `status` field

### Requirement: Model resource create/update can be rejected with cross-reference validation warnings
The system SHALL surface DIAL Core's cross-reference validation failure (HTTP 422 with a `validationWarnings` array, raised when a model resource references another entity that does not exist or conflicts) as a recognizable error to the caller, rather than a generic failure.

#### Scenario: A cross-reference conflict is rejected with validation warnings
- **WHEN** `createModel` or `updateModel` is called with a model that fails Core's cross-reference validation
- **THEN** the action returns a recognizable error carrying the validation warnings, and no partial write is applied

### Requirement: Model resource update preserves secret fields omitted from the payload
Model resources carry at least one Core-encrypted field. The system SHALL NOT require the caller to resend an existing secret field's value on update — omitting an encrypted field from the update payload SHALL preserve its previously stored value on Core, matching Core's preserve-on-omit merge behavior for secret fields.

#### Scenario: Omitting a secret field on update preserves its stored value
- **WHEN** `updateModel` is called with a payload that omits a previously set encrypted field
- **THEN** that field's previously stored value remains unchanged on Core after the update

### Requirement: Model resource delete preserves conditional semantics
The system SHALL send `If-Match` for model-resource delete when a concrete etag is supplied, and no conditional header when the etag is omitted.

#### Scenario: Delete is conditional when an etag is present
- **WHEN** `removeModel(name, etag)` is called with a concrete etag
- **THEN** the delete request to Core includes `If-Match` set to that etag

### Requirement: Model resources have no versioning, publications, sharing, move, or bulk import/export
The system SHALL NOT apply `__version` suffix parsing, publication/sharing metadata, move-between-folders, or bulk zip/JSON import/export to model resources in this change, since `ConfigResourceController` has no version or sharing concept and a flat single-bucket resource has no meaningful move target.

#### Scenario: A model resource path never carries a version suffix
- **WHEN** a model resource is listed, created, or fetched
- **THEN** its name contains no `__version` suffix, and no version selector is presented
