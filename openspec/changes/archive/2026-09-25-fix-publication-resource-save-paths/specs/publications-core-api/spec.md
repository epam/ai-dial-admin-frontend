## MODIFIED Requirements

### Requirement: Update with file staging and target recalculation
The system SHALL update a publication via `POST /v1/ops/publication/update`. When new files are attached it SHALL fetch the user bucket (`GET /v1/bucket`), upload each file to `{bucket}/publications_updates/` (`PUT /v1/files/{path}`, OVERRIDE), and add them as resources with action ADD_IF_ABSENT and recalculated source/target URLs. It SHALL recalculate every resource's target URL from the publication's folder id (per-segment URL-encoded — additionally `__`-versioned for application and toolset resources, plain for prompt and conversation resources), send the rebuilt publication to Core, and then persist each content-addressed resource body **directly to DIAL Core** (`PUT /v1/{type}/{path}`, via the shared `core-asset-client`). For Application and Toolset resources, the content-write path SHALL be resolved from the enriched resource's `_metadata.path` identity field. Prompt and conversation bodies SHALL be persisted with their FE-identity fields `path` and `version` stripped (Core's DTOs are `id/folderId/name/content` and ignore unknown fields). The per-resource persist SHALL NOT call the admin BE.

#### Scenario: Update uploads added files to the staging folder
- **WHEN** a publication is updated with newly attached files
- **THEN** each file is uploaded under `{bucket}/publications_updates/` and added as an ADD_IF_ABSENT resource with source/target URLs derived from the bucket and folder id

#### Scenario: Targets recalculated from the folder id
- **WHEN** a publication is updated after its folder id changed
- **THEN** every resource's target URL is rebuilt from the folder id with per-segment encoding before the Core update call — with a `__`-versioned name for application and toolset resources and a plain name for prompt and conversation resources

#### Scenario: Application and Toolset bodies use metadata resource paths
- **WHEN** an edited pending Application or Toolset publication resource is persisted after its publication update succeeds
- **THEN** its content is written to the Core resource URL derived from the enriched resource's `_metadata.path`, and the update succeeds without an internal server error

#### Scenario: Resource bodies persisted to Core
- **WHEN** a publication update persists a content-addressed resource body
- **THEN** it is written via `PUT /v1/{type}/{path}` to DIAL Core, not through the admin BE

#### Scenario: Prompt and conversation bodies carry no version
- **WHEN** a publication update persists a prompt or conversation resource body
- **THEN** the body sent to Core contains no `version` and no `path` field, and its `name` (including any `__`) is sent verbatim
