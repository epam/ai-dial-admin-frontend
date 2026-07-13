## ADDED Requirements

### Requirement: Direct Core client with user-JWT auth
The system SHALL provide a server-side client that calls DIAL Core directly at `DIAL_CORE_API_URL`, forwarding the logged-in user's JWT as an `Authorization: Bearer` header (matching the BE's `core.auth.method=token`). It SHALL reuse the existing request/error-handling pipeline so responses map to the same `ServerActionResponse` shape consumers already expect.

#### Scenario: Publication request reaches Core with the user token
- **WHEN** a flag-on publication operation runs for an authenticated user
- **THEN** the request is sent to `DIAL_CORE_API_URL` with that user's `Bearer` token, not to `DIAL_ADMIN_API_URL`

#### Scenario: No service credential introduced
- **WHEN** any publication operation executes
- **THEN** it authenticates with the user's JWT only and does not require an API key or service token

### Requirement: Publications served directly by DIAL Core
The system SHALL route all publication operations to DIAL Core unconditionally — there is no admin-BE fallback and no feature flag, and the BE-backed publication client is removed. The cutover SHALL NOT change the publication UI, routes, server-action signatures, or the FE-facing `Publication` model.

#### Scenario: Publication operations call Core
- **WHEN** any publication operation runs
- **THEN** it calls DIAL Core, and the value returned to components is shape-identical to what the admin BE returned previously

#### Scenario: Contract unchanged
- **WHEN** the publication views, routes, and server actions invoke publication operations
- **THEN** their signatures and the `Publication` shape are unchanged from before the cutover

### Requirement: List public publications filtered by resource type
The system SHALL list publications via `POST /v1/ops/publication/list` with the request path fixed to `publications/public/`, then return only publications whose resolved resource type matches the requested type (application, conversation, prompt, tool_set, file), using the priority order APPLICATION → CONVERSATION → PROMPT → TOOL_SET → FILE.

#### Scenario: Prompt list returns only prompt publications
- **WHEN** the prompt-publications list is requested
- **THEN** Core is queried with path `publications/public/` and only publications resolving to the PROMPT type are returned

### Requirement: Get a pending publication with enriched resources and issues
The system SHALL fetch a single publication via `POST /v1/ops/publication/get` (path prefixed with `publications/`). It SHALL treat a publication whose status is APPROVED or REJECTED as not found. For each resource it SHALL resolve the effective URL by action and status (ADD/ADD_IF_ABSENT → reviewUrl when PENDING, targetUrl when APPROVED, sourceUrl when REJECTED; DELETE → targetUrl), enrich the resource with its body, and collect "not found" / "target already exists" problems into `resourceIssues` instead of failing the whole request.

#### Scenario: Approved publication treated as not found
- **WHEN** `get` is called for a publication whose Core status is APPROVED or REJECTED
- **THEN** the system reports it as not found

#### Scenario: Pending publication is enriched
- **WHEN** `get` is called for a PENDING publication
- **THEN** each resource is resolved to its review/target/source URL per its action and enriched with the resource body, and the result carries the same enriched `Publication` shape as the BE path

#### Scenario: Missing underlying resource becomes an issue, not a failure
- **WHEN** an enriched resource cannot be found (or its target already exists)
- **THEN** a corresponding entry is added to `resourceIssues` and the rest of the publication still resolves

### Requirement: Target-already-published check
For a PENDING publication resource whose action is not DELETE, the system SHALL check whether the resource already exists at its target path and SHALL record a "target already exists" issue when it does, matching the BE's per-type validation.

#### Scenario: Pending add over an existing target
- **WHEN** a PENDING, non-DELETE resource targets a path that already exists
- **THEN** a "target already exists" issue is recorded for that resource

### Requirement: Approve, reject, and delete via Core
The system SHALL approve via `POST /v1/ops/publication/approve`, reject via `POST /v1/ops/publication/reject`, and delete via `POST /v1/ops/publication/delete`, each with the path prefixed `publications/`. On reject, the system SHALL strip all HTML from the comment (plain text only) before sending it, matching the BE's sanitization.

#### Scenario: Reject strips HTML from the comment
- **WHEN** a publication is rejected with a comment containing HTML tags
- **THEN** the comment sent to Core contains only the plain text, with all tags removed

#### Scenario: Approve and delete reach Core
- **WHEN** a publication is approved or deleted
- **THEN** the matching Core endpoint is called with the `publications/`-prefixed path

### Requirement: Update with file staging and target recalculation
The system SHALL update a publication via `POST /v1/ops/publication/update`. When new files are attached it SHALL fetch the user bucket (`GET /v1/bucket`), upload each file to `{bucket}/publications_updates/` (`PUT /v1/files/{path}`, OVERRIDE), and add them as resources with action ADD_IF_ABSENT and recalculated source/target URLs. It SHALL recalculate every resource's target URL from the publication's folder id (per-segment URL-encoded, `__`-versioned), send the rebuilt publication to Core, and then persist each resource body.

#### Scenario: Update uploads added files to the staging folder
- **WHEN** a publication is updated with newly attached files
- **THEN** each file is uploaded under `{bucket}/publications_updates/` and added as an ADD_IF_ABSENT resource with source/target URLs derived from the bucket and folder id

#### Scenario: Targets recalculated from the folder id
- **WHEN** a publication is updated after its folder id changed
- **THEN** every resource's target URL is rebuilt from the folder id with per-segment encoding before the Core update call
