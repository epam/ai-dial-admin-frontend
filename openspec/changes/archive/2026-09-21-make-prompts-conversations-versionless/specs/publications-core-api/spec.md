# publications-core-api

## MODIFIED Requirements

### Requirement: Get a pending publication with enriched resources and issues
The system SHALL fetch a single publication via `POST /v1/ops/publication/get` (path prefixed with `publications/`). It SHALL treat a publication whose status is APPROVED or REJECTED as not found. For each resource it SHALL resolve the effective URL by action and status (ADD/ADD_IF_ABSENT → reviewUrl when PENDING, targetUrl when APPROVED, sourceUrl when REJECTED; DELETE → targetUrl), enrich the resource with its body **fetched directly from DIAL Core** (`GET /v1/{type}/{path}` merged with `GET /v1/metadata/{type}/{path}`, via the shared `core-asset-client`), and collect "not found" / "target already exists" problems into `resourceIssues` instead of failing the whole request. Enrichment SHALL NOT call the admin BE, for any resource type. Prompt and conversation resources SHALL be enriched as versionless entities — their paths parsed without `__` version splitting and their enriched models carrying no `version` field.

#### Scenario: Approved publication treated as not found
- **WHEN** `get` is called for a publication whose Core status is APPROVED or REJECTED
- **THEN** the system reports it as not found

#### Scenario: Pending publication enriched from Core
- **WHEN** `get` is called for a PENDING publication with an application, conversation, prompt, or toolset resource
- **THEN** each resource is resolved to its review/target/source URL per its action and enriched with its body fetched from DIAL Core via the shared asset client, and the result carries the same enriched `Publication` shape consumers received from the admin BE path, except that prompt and conversation resources carry no `version`

#### Scenario: Missing underlying resource becomes an issue, not a failure
- **WHEN** an enriched resource cannot be found in Core (or its target already exists)
- **THEN** a corresponding entry is added to `resourceIssues` and the rest of the publication still resolves

### Requirement: Core-native resource content and metadata mapping for enrichment
The system SHALL build each enriched publication resource by merging the Core content response (`GET /v1/{type}/{path}`) with the Core metadata response (`GET /v1/metadata/{type}/{path}`) via the shared core-asset-client, parsing the prefix-stripped, URL-decoded path and producing the same FE resource model the admin BE produced for that type. For application and toolset resources the path SHALL be parsed as `__`-versioned and the model SHALL carry the parsed `version`. For prompt and conversation resources the path SHALL be parsed as a plain folder path (name = last segment, folderId = the rest) and the model SHALL carry no `version` — a `__` in the name stays part of the name. No field that the BE mapper populated SHALL be dropped, except `version` for prompt and conversation, which no longer exists.

#### Scenario: Prompt resource mapped from content + metadata
- **WHEN** a prompt resource is enriched
- **THEN** its model carries content and description from the content response and path, name, folderId, author and updatedAt from the metadata response, with no version field, matching the BE output except for the removed version

#### Scenario: Conversation resource mapped without version parsing
- **WHEN** a conversation resource is enriched and its name contains `__` (e.g. `foo__1.0`)
- **THEN** its model's name is exactly `foo__1.0`, with the `__` never split into name and version

#### Scenario: Application resource keeps versioned mapping
- **WHEN** an application resource is enriched
- **THEN** its path is parsed with the `__`-version split and its model carries the parsed `version`, unchanged from before

### Requirement: Update with file staging and target recalculation
The system SHALL update a publication via `POST /v1/ops/publication/update`. When new files are attached it SHALL fetch the user bucket (`GET /v1/bucket`), upload each file to `{bucket}/publications_updates/` (`PUT /v1/files/{path}`, OVERRIDE), and add them as resources with action ADD_IF_ABSENT and recalculated source/target URLs. It SHALL recalculate every resource's target URL from the publication's folder id (per-segment URL-encoded — additionally `__`-versioned for application and toolset resources, plain for prompt and conversation resources), send the rebuilt publication to Core, and then persist each content-addressed resource body **directly to DIAL Core** (`PUT /v1/{type}/{path}`, via the shared core-asset-client). Prompt and conversation bodies SHALL be persisted with their FE-identity fields `path` and `version` stripped (Core's DTOs are `id/folderId/name/content` and ignore unknown fields). The per-resource persist SHALL NOT call the admin BE.

#### Scenario: Update uploads added files to the staging folder
- **WHEN** a publication is updated with newly attached files
- **THEN** each file is uploaded under `{bucket}/publications_updates/` and added as an ADD_IF_ABSENT resource with source/target URLs derived from the bucket and folder id

#### Scenario: Targets recalculated from the folder id
- **WHEN** a publication is updated after its folder id changed
- **THEN** every resource's target URL is rebuilt from the folder id with per-segment encoding before the Core update call — with a `__`-versioned name for application and toolset resources and a plain name for prompt and conversation resources

#### Scenario: Resource bodies persisted to Core
- **WHEN** a publication update persists a content-addressed resource body
- **THEN** it is written via `PUT /v1/{type}/{path}` to DIAL Core, not through the admin BE

#### Scenario: Prompt and conversation bodies carry no version
- **WHEN** a publication update persists a prompt or conversation resource body
- **THEN** the body sent to Core contains no `version` and no `path` field, and its `name` (including any `__`) is sent verbatim
