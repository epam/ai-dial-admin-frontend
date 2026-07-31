## ADDED Requirements

### Requirement: App-runner resources served directly by DIAL Core

The system SHALL route app-runner-resource list, get, create, update, delete, and bulk-delete operations to DIAL Core's `ConfigResourceController`-backed routes (`GET/PUT/DELETE /v1/schemas/platform/{name}`, list via `GET /v1/metadata/schemas/platform/`) unconditionally — there is no admin-BE fallback and no feature flag. This is a distinct resource kind from `Entities > Application Runners` (admin-BE-backed); the two SHALL NOT share server actions or API clients.

#### Scenario: App-runner CRUD operations call Core

- **WHEN** any of the asset-side actions (`getRunners`, `createRunner`, `getRunner`, `updateRunner`, `removeRunner`, `bulkDeleteRunners`) runs
- **THEN** its content and metadata are read from or written to DIAL Core via the shared asset client, not the admin BE

#### Scenario: Entity-side runner actions are untouched

- **WHEN** `Entities > Application Runners` performs any operation
- **THEN** it continues to call `ApplicationRunnersApi` against the admin BE, unchanged by this capability

### Requirement: The runner's `$id` is the Core resource name, carried through an extra encoding layer

The Core resource name for an app-runner SHALL be the runner's `$id`, percent-encoded once by the FE before the shared path builder applies its own segment encoding. Core's route boundary decodes exactly one layer, so the stored resource name is the once-encoded `$id` and satisfies `ENTITY_NAME_PATTERN` (`^[A-Za-z0-9._%:-]+$`), which a raw `$id` URI fails because of its `/` separators. Reads SHALL reverse both layers to recover the original `$id`.

#### Scenario: Write encodes the id twice on the wire

- **WHEN** a runner with `$id` `https://mydial.epam.com/custom_application_schemas/qq` is created or updated
- **THEN** the request path is `v1/schemas/platform/https%253A%252F%252Fmydial.epam.com%252Fcustom_application_schemas%252Fqq`
- **AND** the resource name stored by Core is `https%3A%2F%2Fmydial.epam.com%2Fcustom_application_schemas%2Fqq`

#### Scenario: Read recovers the original id

- **WHEN** a runner is listed or fetched and its metadata `url` is parsed
- **THEN** the resolved `$id` is the original unencoded value, with both encoding layers reversed

#### Scenario: An id with characters outside the allowed set is rejected before the request

- **WHEN** a create or update is attempted for a `$id` containing any of `!`, `~`, `*`, `'`, `(`, `)` — characters `encodeURIComponent` leaves unescaped and `ENTITY_NAME_PATTERN` disallows
- **THEN** the action fails validation locally and no request is sent to Core

### Requirement: App-runner list and storage are flat, with a single fixed root

The system SHALL treat `platform` as the only listable root for app-runner resources and SHALL NOT expose folder-create, rename-folder, or move-into-folder affordances for this resource kind, matching `ConfigResourceController`'s flat storage model.

#### Scenario: Listing returns only entries under platform

- **WHEN** `getRunners` lists app-runner resources
- **THEN** every returned entry is a direct child of the `platform` root, with no nested subfolders

#### Scenario: No create-folder action is available

- **WHEN** the app-runner list toolbar is rendered
- **THEN** it exposes no create-folder action, unlike the four versioned asset types

### Requirement: App-runner etag is sourced from metadata, not content

Since DIAL Core's per-entity app-runner GET (`handleSchemaGet`) responds without an `ETag` header, the system SHALL resolve a fetched runner's etag from the corresponding metadata response's `etag` field, and SHALL use that value for subsequent conditional update and delete calls.

#### Scenario: Get resolves etag from metadata

- **WHEN** `getRunner` fetches an app-runner resource
- **THEN** the returned etag comes from the metadata response, not from an `ETag` header on the content response

#### Scenario: Metadata-sourced etag drives conditional writes

- **WHEN** an update or delete is issued with a metadata-sourced etag
- **THEN** the request carries `If-Match` set to that etag and Core honours it

### Requirement: Create rejects on conflict; update requires the current etag

The system SHALL create an app-runner resource with `If-None-Match: *`, rejecting when a resource already exists at that name, and SHALL update with `If-Match` set to the caller's etag.

#### Scenario: Create conflicts with an existing runner

- **WHEN** `createRunner` targets a `$id` that already exists in Core
- **THEN** the create request is rejected with a recognizable "already exists" error and no write is applied

#### Scenario: Update sends the caller's etag

- **WHEN** `updateRunner(runner, etag)` is called
- **THEN** the request to Core includes `If-Match` set to that etag

#### Scenario: Delete is conditional when an etag is present

- **WHEN** `removeRunner(name, etag)` is called with a concrete etag
- **THEN** the delete request includes `If-Match` set to that etag

### Requirement: Request body is stored verbatim, so non-schema fields are stripped before every write

DIAL Core stores the app-runner request body verbatim (`WriteSpec.entityClass == null`, `blobBody = requestNode.toString()`) with no deserialization and no field filtering, so any field sent persists permanently in the stored schema. Before every create and update the system SHALL remove `name` and `status` (both injected by Core's GET projection), and the client-side identity fields `path` and `folderId`. Echoing a GET response back verbatim as a PUT payload SHALL NOT be relied upon.

#### Scenario: Core-injected fields are removed before write

- **WHEN** `createRunner` or `updateRunner` sends a request to Core
- **THEN** the request body contains neither `name` nor `status`

#### Scenario: Client-side identity fields are removed before write

- **WHEN** `createRunner` or `updateRunner` sends a request to Core
- **THEN** the request body contains neither `path` nor `folderId`

### Requirement: GET surfaces Core's injected name and validity status as read-only

DIAL Core's app-runner GET projection (`projectSchemaItem`) spreads the stored schema and then injects `name`, set to the full canonical ID `schemas/platform/{name}` rather than a bare name, and `status` (`"valid"` or `"invalid"`). For an entry Core considers invalid the projection instead returns the raw payload with `status: "invalid"` plus a `validationWarnings` array for admin callers. The system SHALL treat both injected fields as read-only.

#### Scenario: Injected name is not mistaken for the runner identity

- **WHEN** `getRunner` fetches a runner
- **THEN** the runner's displayed identity comes from its `$id`, not from the injected `name` field

#### Scenario: Invalid status is surfaced

- **WHEN** Core reports `status: "invalid"` for a runner
- **THEN** that status is available to the caller alongside any `validationWarnings` Core returned

### Requirement: Route payloads convert between the FE array and Core's name-keyed object

Core represents `dial:applicationTypeRoutes` as an object keyed by route name whose route fields are `dial:`-prefixed, while the FE model is a `DialAppRoute[]` array with unprefixed fields. The system SHALL convert in both directions via dedicated pure functions, reproducing the field mapping the admin BE's `ApplicationTypeSchemaRouteCoreMapper` applies today.

#### Scenario: Array converts to a name-keyed object on write

- **WHEN** a runner with routes is written to Core
- **THEN** `dial:applicationTypeRoutes` is an object whose keys are the route names and whose values carry `dial:paths`, `dial:methods`, `dial:upstreams`, `dial:rewritePath`, `dial:order`, `dial:maxRetryAttempts`, `dial:permissions`, `dial:userRoles`, `dial:response`, and `dial:attachmentPaths`

#### Scenario: Object converts back to an array on read

- **WHEN** a runner is fetched from Core
- **THEN** each entry of `dial:applicationTypeRoutes` becomes one `DialAppRoute`, with the object key as its name and every `dial:`-prefixed field mapped back to its unprefixed FE equivalent

#### Scenario: Permission values change case across the boundary

- **WHEN** a route with FE permissions `read` and `write` is written
- **THEN** `dial:permissions` contains `READ` and `WRITE`
- **AND** reading them back yields `read` and `write`

#### Scenario: Upstream extra data is serialized to a string

- **WHEN** an upstream's `extraData` is an object
- **THEN** `dial:extraData` is sent as a JSON string, and reading it back restores the object

#### Scenario: Upstream fields absent from Core's contract are dropped

- **WHEN** a route upstream carries `secretExtraData`, `id`, or `responsesEndpoint`
- **THEN** none of them appear in the written `dial:upstreams` entry, whose declared fields are exactly `dial:endpoint`, `dial:key`, `dial:extraData`, `dial:weight`, and `dial:tier`

#### Scenario: Duplicate route names are reported, not silently merged

- **WHEN** two routes in the FE array resolve to the same route name
- **THEN** the conversion reports a validation error rather than letting one entry overwrite the other in the resulting object

### Requirement: Resolved parameters are read from DIAL Core

The system SHALL read a runner's resolved parameter schema from DIAL Core's `GET /v1/application_type_schemas/schema?id={canonical id}`, passing the canonical ID `schemas/platform/{name}` as the `id` query parameter, instead of the admin BE's `resolvedSchema` endpoint. Core performs the external-schema download declared by `dial:applicationTypeSchemaEndpoint` and the merge itself.

#### Scenario: Parameters read targets Core with the canonical id

- **WHEN** the Parameters tab loads for an asset runner
- **THEN** the request goes to Core's `application_type_schemas/schema` route with `id` set to `schemas/platform/{encoded $id}`, not to the admin BE

#### Scenario: External schema resolution is not reimplemented in the frontend

- **WHEN** a runner declares `dial:applicationTypeSchemaEndpoint`
- **THEN** the frontend does not fetch that URL itself; the resolved schema returned by Core is used as-is

#### Scenario: A freshly created runner is immediately resolvable

- **WHEN** a runner is created and its Parameters tab is opened straight afterwards
- **THEN** Core resolves it, because the blob write is folded into the merged config synchronously

### Requirement: App-runner resources have no versioning, publications, sharing, move, or import/export

The system SHALL NOT apply `__version` suffix parsing, publication or sharing metadata, move-between-folders, or bulk zip/JSON import/export to app-runner resources, since `ConfigResourceController` has no version or sharing concept and a flat single-bucket resource has no meaningful move target.

#### Scenario: A runner path never carries a version suffix

- **WHEN** an app-runner resource is listed, created, or fetched
- **THEN** its name contains no `__version` suffix and no version selector is presented

### Requirement: The whole app-runner bucket is readable in one list call

The system SHALL expose a list read that returns every app-runner resource in the `platform` bucket without requiring a folder path, for consumers that present one flat set of runners. Because this resource kind is flat, the bucket root holds every runner and no recursive traversal SHALL be introduced. The read SHALL follow Core's continuation token to completion so a paged bucket is returned whole.

#### Scenario: An omitted path reads the bucket root

- **WHEN** the list is requested with no folder path
- **THEN** the request targets `schemas/platform/` rather than defaulting to any other root

#### Scenario: Pagination is exhausted

- **WHEN** Core returns a continuation token
- **THEN** the read follows it until no token remains, and the returned collection is complete

#### Scenario: Rows carry the decoded id and the addressable path

- **WHEN** a runner is returned in the list
- **THEN** its name is the fully decoded `$id` and its path is the singly-encoded form the CRUD calls address
