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

### Requirement: Model resource GET surfaces Core's validity status and its warnings as read-only; update strips them before writing
DIAL Core's model resource GET injects a synthetic `status` field that has no backing property on the underlying `Model` entity, and it does so through two distinct projections: a resource read normally is projected with a valid status, while a resource recorded as invalid during the merged-config rebuild is projected with an invalid status and, for admin callers, an accompanying `validationWarnings` array naming the offending fields. The system SHALL surface both the status and, when present, the warnings as read-only on the fetched model resource, and SHALL remove them (along with the client-side-only path fields `path`/`folderId`, but not `name`, which is a real `Model` field inherited from `RoleBasedEntity`) from the payload before sending any create/update request to Core. Echoing the raw GET body back verbatim as a PUT payload is unsupported and SHALL NOT be relied upon, since Core's model deserialization rejects unrecognized fields.

#### Scenario: Get includes status
- **WHEN** `getModel` fetches a model resource
- **THEN** the returned resource includes a `status` field sourced from Core's GET response

#### Scenario: Get preserves validation warnings for an invalid model
- **WHEN** `getModel` fetches a model resource Core reports as invalid with validation warnings
- **THEN** the returned resource carries both the invalid status and the warnings, rather than discarding the warnings

#### Scenario: Update omits status and warnings
- **WHEN** `updateModel` sends a request to Core
- **THEN** the request body includes neither a `status` nor a `validationWarnings` field

### Requirement: Model resource writes omit empty upstream secrets so Core preserves the stored values
DIAL Core marks an upstream's `key` and `secretExtraData` as encrypted, write-only fields: it never returns them on read, and on write it restores an omitted or null secret from the previously stored resource while treating any literal string — including an empty one — as a new value to encrypt and store. The system SHALL therefore remove an empty or unset `key`/`secretExtraData` from each upstream in the create/update payload, and SHALL NOT send an empty string for either.

#### Scenario: An empty upstream secret is absent from the request body
- **WHEN** `updateModel` sends a model whose upstream carries an empty or unset `key`
- **THEN** that upstream object in the request body has no `key` property

#### Scenario: A populated upstream secret is sent
- **WHEN** `updateModel` sends a model whose upstream carries a non-empty `key`
- **THEN** that upstream object in the request body carries the supplied value

#### Scenario: Secret omission applies per upstream, not to the array as a whole
- **WHEN** `updateModel` sends a model with several upstreams, only some of which carry a secret
- **THEN** each upstream is stripped independently, and the upstreams supplying secrets still carry them

### Requirement: Every written upstream carries its endpoint so Core can match its stored secret
DIAL Core pairs each upstream in a write request with its stored counterpart by matching the `endpoint` value, falling back to positional matching only for entries that carry no endpoint, and its own contract documents that mixing the two forms makes preservation unreliable. The system SHALL include an `endpoint` on every upstream it writes.

#### Scenario: Upstreams are written with endpoints
- **WHEN** `updateModel` sends a model with upstreams
- **THEN** every upstream object in the request body carries an `endpoint` property

### Requirement: A written model resource becomes a served deployment under its canonical id
DIAL Core merges API-written model resources into its runtime configuration alongside file-defined models, keying API entries by their canonical id (`models/platform/{name}`) and setting each deployment's name from that key, while file-defined entries keep their bare-name keys. A model created through this surface is therefore routable without any further reference from another entity. The system SHALL treat the canonical id as the model's served deployment identifier, and SHALL NOT present the bare resource name as the identifier a caller invokes.

#### Scenario: A created model is servable without being referenced
- **WHEN** a model resource is created through this surface
- **THEN** it becomes part of DIAL Core's served configuration without requiring any other entity to reference it

#### Scenario: The served identifier is the canonical id
- **WHEN** a model resource named `{name}` is created through this surface
- **THEN** the deployment identifier it is served under is `models/platform/{name}`, not the bare `{name}`

### Requirement: Model resource create/update can be rejected with cross-reference validation warnings
The system SHALL surface DIAL Core's cross-reference validation failure (HTTP 422 with a `validationWarnings` array) as a recognizable error to the caller, rather than a generic failure. Core's write-time validation of a model covers exactly two conditions: every entry in the model's `interceptors` must resolve as a key in the merged configuration's interceptor map (either a file entry's bare name or an API entry's canonical id), and no upstream may declare the same top-level key in both its `extraData` and its `secretExtraData`. Nothing else about a model — including a missing endpoint or absent upstreams — is validated on write, so the frontend SHALL NOT rely on Core to reject a structurally unroutable model.

#### Scenario: An unresolvable interceptor reference is rejected with validation warnings
- **WHEN** `createModel` or `updateModel` is called with a model referencing an interceptor absent from Core's merged configuration
- **THEN** the action returns a recognizable error carrying the validation warnings, and no partial write is applied

#### Scenario: Overlapping upstream extra-data keys are rejected
- **WHEN** `createModel` or `updateModel` is called with an upstream whose `extraData` and `secretExtraData` share a top-level key
- **THEN** the action returns a recognizable error, and no partial write is applied

#### Scenario: A model with no endpoint is not rejected by Core
- **WHEN** `createModel` is called with a model carrying neither an endpoint nor upstreams
- **THEN** Core accepts the write, and the resulting deployment is registered but unroutable

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
