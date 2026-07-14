## MODIFIED Requirements

### Requirement: Get a pending publication with enriched resources and issues
The system SHALL fetch a single publication via `POST /v1/ops/publication/get` (path prefixed with `publications/`). It SHALL treat a publication whose status is APPROVED or REJECTED as not found. For each resource it SHALL resolve the effective URL by action and status (ADD/ADD_IF_ABSENT → reviewUrl when PENDING, targetUrl when APPROVED, sourceUrl when REJECTED; DELETE → targetUrl), enrich the resource with its body **fetched directly from DIAL Core** (`GET /v1/{type}/{path}` merged with `GET /v1/metadata/{type}/{path}`, via the shared `core-asset-client`), and collect "not found" / "target already exists" problems into `resourceIssues` instead of failing the whole request. Enrichment SHALL NOT call the admin BE, except for file resources, which were already Core-native since the prior change and are unaffected by this one.

#### Scenario: Approved publication treated as not found
- **WHEN** `get` is called for a publication whose Core status is APPROVED or REJECTED
- **THEN** the system reports it as not found

#### Scenario: Pending publication enriched from Core
- **WHEN** `get` is called for a PENDING publication of a versioned type (application, conversation, prompt, toolset)
- **THEN** each resource is resolved to its review/target/source URL per its action and enriched with its body fetched from DIAL Core via the shared asset client, and the result carries the same enriched `Publication` shape consumers received from the admin BE path

#### Scenario: Missing underlying resource becomes an issue, not a failure
- **WHEN** an enriched resource cannot be found in Core (or its target already exists)
- **THEN** a corresponding entry is added to `resourceIssues` and the rest of the publication still resolves

### Requirement: Target-already-published check
For a PENDING publication resource whose action is not DELETE, the system SHALL check **against DIAL Core** (via the shared asset client's merged get) whether the resource already exists at its target path and SHALL record a "target already exists" issue when it does, matching the BE's per-type validation.

#### Scenario: Pending add over an existing target
- **WHEN** a PENDING, non-DELETE resource targets a path that already exists in Core
- **THEN** a "target already exists" issue is recorded for that resource

### Requirement: Update with file staging and target recalculation
The system SHALL update a publication via `POST /v1/ops/publication/update`. When new files are attached it SHALL fetch the user bucket (`GET /v1/bucket`), upload each file to `{bucket}/publications_updates/` (`PUT /v1/files/{path}`, OVERRIDE), and add them as resources with action ADD_IF_ABSENT and recalculated source/target URLs. It SHALL recalculate every resource's target URL from the publication's folder id (per-segment URL-encoded, `__`-versioned), send the rebuilt publication to Core, and then persist each versioned-type resource body **directly to DIAL Core** (`PUT /v1/{type}/{path}`, via the shared asset client). The per-resource persist for versioned types SHALL NOT call the admin BE.

#### Scenario: Update uploads added files to the staging folder
- **WHEN** a publication is updated with newly attached files
- **THEN** each file is uploaded under `{bucket}/publications_updates/` and added as an ADD_IF_ABSENT resource with source/target URLs derived from the bucket and folder id

#### Scenario: Resource bodies persisted to Core
- **WHEN** a publication update persists a versioned-type resource body
- **THEN** it is written via `PUT /v1/{type}/{path}` to DIAL Core, not through the admin BE

## ADDED Requirements

### Requirement: Core-native resource content and metadata mapping for enrichment
The system SHALL build each enriched publication resource for a versioned type by merging the Core content response (`GET /v1/{type}/{path}`) with the Core metadata response (`GET /v1/metadata/{type}/{path}`) via the shared asset client, parsing the prefix-stripped, URL-decoded, `__`-versioned path, and producing the same FE resource model the admin BE produced for that type (e.g. prompt content/description plus path/name/version/folderId/author/updatedAt). No field that the BE mapper populated SHALL be dropped.

#### Scenario: Prompt resource mapped from content + metadata
- **WHEN** a prompt resource is enriched
- **THEN** its model carries content and description from the content response and path, name, version, folderId, author and updatedAt from the metadata response, matching the BE output

#### Scenario: Field parity with the BE path
- **WHEN** the same publication is enriched via Core and (historically) via the BE on identical fixtures
- **THEN** the resulting enriched `Publication` is field-for-field equivalent
