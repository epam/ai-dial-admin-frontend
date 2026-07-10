# application-resources-core-api Specification

## Purpose
Application-resource list, get, create, update, delete, bulk-delete, move, JSON/zip export, and JSON/zip import executed directly against DIAL Core via the shared `core-asset-client`, replacing the admin-BE proxy for these operations — CRUD/move created by archiving change `migrate-application-resources-to-core`, import/export completed by archiving change `migrate-application-import-export-to-core`. The FE-facing `AssetApp` contract, routes, and server-action signatures stay identical. `validityState` has been dropped entirely for asset applications (not deferred — there is no clean migration path, since the admin BE computes it from a fully admin-authored, BE-database-only schema table with no Core equivalent and no seed data to bundle). Discovered-tools and try-out-tool remain on the admin BE, deferred to a follow-up pending confirmation of Core's deployment-name-addressed endpoint shapes for applications.

## Requirements

### Requirement: Application resources served directly by DIAL Core
The system SHALL route application-resource list, get (content+metadata), create, update, delete, bulk-delete, and move operations to DIAL Core unconditionally via the shared Core asset client — there is no admin-BE fallback and no feature flag for these operations. The cutover SHALL NOT change the `/assets-applications` routes, `Apps/List`/`Apps/View` components, the server-action signatures in `assets-applications/actions.ts`, or the `AssetApp`/`DialApplicationResource` models.

#### Scenario: Application-resource CRUD and move operations call Core
- **WHEN** any of `getApps`, `createApp`, `getApp`, `updateApp`, `removeApp`, `bulkDeleteApps`, `moveApps` runs
- **THEN** its content and metadata are read from or written to DIAL Core via the shared asset client, not the admin BE

#### Scenario: Contract unchanged
- **WHEN** the applications list page or a single application page renders
- **THEN** the data shape passed to `Apps/List`/`Apps/View` is identical to what the admin-BE path returned previously

### Requirement: Validity state is not populated for asset applications
The system SHALL NOT call the admin BE (or any other source) to populate `validityState` on asset applications. The field remains declared as optional on the shared `AssetApp`/`DialApplication` models (used by unrelated entity types) but is always absent for asset applications.

#### Scenario: Fetched application has no validityState
- **WHEN** `getApp` fetches an application resource
- **THEN** the returned resource's `validityState` is `undefined`, and no admin-BE call is made to compute it

### Requirement: Application-resource create rejects on conflict; update requires the current etag
The system SHALL create an application-resource with `If-None-Match: *` (rejecting if a resource already exists at that path) and SHALL update with `If-Match` set to the caller's etag.

#### Scenario: Create conflicts with an existing application resource
- **WHEN** `createApp` targets a path that already exists in Core
- **THEN** the create request is rejected with a recognizable "already exists" error

#### Scenario: Update sends the caller's etag
- **WHEN** `updateApp(app, etag)` is called
- **THEN** the update request to Core includes `If-Match` set to that etag

### Requirement: Create and update validate viewerUrl, editorUrl, and maxInputAttachments identically
The system SHALL apply the same `viewerUrl`/`editorUrl` endpoint-format validation and `maxInputAttachments` positive/max-1000 range validation to both `createApp` and `updateApp` payloads, closing the admin BE's known gap where only create was validated. Both actions SHALL reject invalid payloads before any Core request is sent.

#### Scenario: Invalid viewerUrl is rejected on update
- **WHEN** `updateApp` is called with an invalid `viewerUrl`
- **THEN** the update is rejected, matching the validation `createApp` already applies

#### Scenario: Out-of-range maxInputAttachments is rejected on update
- **WHEN** `updateApp` is called with `maxInputAttachments` greater than 1000 or non-positive
- **THEN** the update is rejected

### Requirement: Application-resource delete and move preserve existing conditional/duplicate semantics
The system SHALL send `If-Match` for single application-resource delete when a concrete etag is supplied and no conditional header when omitted; bulk delete SHALL remain unconditional per item; move SHALL preserve the existing duplicate-with-renamed-version behavior when a duplicate name is supplied.

#### Scenario: Single delete is conditional when an etag is present
- **WHEN** `removeApp(path, etag)` is called with a concrete etag
- **THEN** the delete request to Core includes `If-Match` set to that etag

#### Scenario: Move with a duplicate name renames the version suffix
- **WHEN** `moveApps` is called with a `duplicateName`
- **THEN** the destination path carries the duplicate name with the source's version suffix reapplied, unchanged from current behavior

### Requirement: Application export builds a structured aggregate document directly against Core
The system SHALL build a `{ applications: AssetApp[] }` document (the existing `ParsedAssets` shape) from selected application paths by fetching each application's merged content+metadata directly from DIAL Core and setting each application's `id` to its Core-prefixed path — not a per-file zip archive, and not a new wire type.

#### Scenario: JSON export returns the aggregate document directly
- **WHEN** `exportApps` is called with `fileType=json`
- **THEN** the response is the `{ applications: AssetApp[] }` document built directly from DIAL Core content+metadata

#### Scenario: Zip export wraps the same document as a single entry
- **WHEN** `exportApps` is called with `fileType=archive`
- **THEN** the response is a zip archive containing exactly one entry, `applications/applications.json`, holding the same `{ applications: AssetApp[] }` document

### Requirement: Application import resolves conflicts against Core's live state
The system SHALL check whether an application already exists at its resolved destination path directly against DIAL Core, and apply the caller-supplied conflict-resolution policy: `OVERRIDE` writes through regardless of an existing conflict; `SKIP` treats an existing conflict as a non-error skipped outcome rather than a failure. The system SHALL abort a multi-application import batch after a configured number of consecutive real failures, reusing the same circuit-breaker mechanism already built for files/prompts/toolsets import.

#### Scenario: OVERRIDE writes through despite an existing application
- **WHEN** an incoming application targets a path where an application already exists and the policy is `OVERRIDE`
- **THEN** the import writes the incoming application to that path

#### Scenario: SKIP treats an existing application as a non-failure
- **WHEN** an incoming application targets a path where an application already exists and the policy is `SKIP`
- **THEN** that entry is reported as skipped, not as a failure, and does not count toward the consecutive-failure circuit breaker

#### Scenario: Consecutive failures abort the batch
- **WHEN** an application import hits the configured number of consecutive per-entry failures
- **THEN** the remaining entries in the batch are not attempted, and the response reflects the partial result

### Requirement: Zip import merges multiple JSON entries and rejects in-archive id collisions
The system SHALL unpack every `applications/*.json` entry from an uploaded zip archive (validating entry paths with the same path-traversal guard used for files/prompts/toolsets import), merge their `{ applications: AssetApp[] }` documents into one, and reject the archive if the same application id appears in more than one entry.

#### Scenario: Multiple JSON entries are merged into one import batch
- **WHEN** a zip archive contains more than one `applications/*.json` entry with disjoint application ids
- **THEN** all applications from every entry are imported as a single merged batch

#### Scenario: A duplicated application id across entries is rejected
- **WHEN** the same application id appears in more than one `applications/*.json` entry within the same archive
- **THEN** the import is rejected before any entry from that archive is written
