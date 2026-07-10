## ADDED Requirements

### Requirement: Application resources served directly by DIAL Core, except validity state
The system SHALL route application-resource list, get (content+metadata), create, update, delete, bulk-delete, and move operations to DIAL Core unconditionally via the shared Core asset client — there is no admin-BE fallback and no feature flag for these operations. The cutover SHALL NOT change the `/assets-applications` routes, `Apps/List`/`Apps/View` components, the server-action signatures in `assets-applications/actions.ts`, or the `AssetApp`/`DialApplicationResource` models.

#### Scenario: Application-resource CRUD and move operations call Core
- **WHEN** any of `getApps`, `createApp`, `getApp`, `updateApp`, `removeApp`, `bulkDeleteApps`, `moveApps` runs
- **THEN** its content and metadata are read from or written to DIAL Core via the shared asset client, not the admin BE

#### Scenario: Contract unchanged
- **WHEN** the applications list page or a single application page renders
- **THEN** the data shape passed to `Apps/List`/`Apps/View` is identical to what the admin-BE path returned previously

### Requirement: Validity state is sourced from the admin BE as a scoped Phase 1 dependency
The system SHALL populate `validityState` on a fetched application resource by calling the admin BE's existing `get` operation and taking only its `validityState` field, merging it onto the otherwise Core-sourced result, until a later change ports the underlying schema-conformance validation to run without the BE.

#### Scenario: Validity state is present on get
- **WHEN** `getApp` or `getApps` fetches an application resource that has an `applicationTypeSchemaId`
- **THEN** the returned resource's `validityState` matches what the admin BE currently computes for it

#### Scenario: Validity state for a resource without a type schema
- **WHEN** a fetched application resource has no `applicationTypeSchemaId`
- **THEN** its `validityState` is valid, matching the admin BE's default for that case

### Requirement: Application-resource create rejects on conflict; update requires the current etag
The system SHALL create an application-resource with `If-None-Match: *` (rejecting if a resource already exists at that path) and SHALL update with `If-Match` set to the caller's etag.

#### Scenario: Create conflicts with an existing application resource
- **WHEN** `createApp` targets a path that already exists in Core
- **THEN** the create request is rejected with a recognizable "already exists" error

#### Scenario: Update sends the caller's etag
- **WHEN** `updateApp(app, etag)` is called
- **THEN** the update request to Core includes `If-Match` set to that etag

### Requirement: Create and update validate viewerUrl, editorUrl, and maxInputAttachments identically
The system SHALL apply the same `viewerUrl`/`editorUrl` endpoint-format validation and `maxInputAttachments` positive/max-1000 range validation to both `createApp` and `updateApp` payloads, closing the admin BE's known gap where only create was validated.

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
