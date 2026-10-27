## MODIFIED Requirements

### Requirement: Update with file staging and target recalculation

The system SHALL update a publication via `POST /v1/ops/publication/update`. When new files are attached it SHALL fetch the user bucket (`GET /v1/bucket`), upload each file to `{bucket}/publications_updates/` (`PUT /v1/files/{path}`, OVERRIDE), and add them as resources with action ADD_IF_ABSENT and recalculated source/target URLs. It SHALL recalculate every resource's target URL from the publication's folder id (per-segment URL-encoded — additionally `__`-versioned for application and toolset resources, plain for prompt and conversation resources), send the rebuilt publication to Core, and then persist each content-addressed resource body **directly to DIAL Core** (`PUT /v1/{type}/{path}`, via the shared `core-asset-client`). For application and toolset resources, the version in the target URL SHALL come from the enriched resource's `_metadata.version`, and the content-write path SHALL be the resource's `_metadata.path` with its last segment replaced by `{name}__{version}` (the review copy's location after Core moves it). Their submitted content `display_version` SHALL be synchronized to the submitted Version, including when the Version input was left unchanged. Prompt and conversation bodies SHALL be persisted with their FE-identity fields `path` and `version` stripped (Core's DTOs are `id/folderId/name/content` and ignore unknown fields). The per-resource persist SHALL NOT call the admin BE.

#### Scenario: Update uploads added files to the staging folder
- **WHEN** a publication is updated with newly attached files
- **THEN** each file is uploaded under `{bucket}/publications_updates/` and added as an ADD_IF_ABSENT resource with source/target URLs derived from the bucket and folder id

#### Scenario: Targets recalculated from the folder id
- **WHEN** a publication is updated after its folder id changed
- **THEN** every resource's target URL is rebuilt from the folder id with per-segment encoding before the Core update call — with a `__`-versioned name for application and toolset resources and a plain name for prompt and conversation resources

#### Scenario: Version edit changes the target URL
- **WHEN** an admin changes the Version of a pending Application or Toolset publication and saves
- **THEN** the resource's target URL sent to Core ends with the encoded `{name}__{newVersion}` and submitted content `display_version` equals `newVersion`

#### Scenario: Version field shows the published version
- **WHEN** an admin opens the Properties tab of a pending Application or Toolset publication
- **THEN** the editable Version field shows the version from the resource's `_metadata.version` and no separate Display version input appears

#### Scenario: Application and Toolset bodies use the post-move review path
- **WHEN** an edited pending Application or Toolset publication resource is persisted after its publication update succeeds
- **THEN** its content is written to the Core resource URL derived from `_metadata.path` with the last segment replaced by `{name}__{version}`, and the update succeeds without an internal server error

#### Scenario: Resource bodies persisted to Core
- **WHEN** a publication update persists a content-addressed resource body
- **THEN** it is written via `PUT /v1/{type}/{path}` to DIAL Core, not through the admin BE

#### Scenario: Prompt and conversation bodies carry no version
- **WHEN** a publication update persists a prompt or conversation resource body
- **THEN** the body sent to Core contains no `version` and no `path` field, and its `name` (including any `__`) is sent verbatim

#### Scenario: Submission synchronizes an unchanged publication version
- **WHEN** an Application or Toolset publication with path Version `stable` is saved without editing Version
- **THEN** its submitted content `display_version` is `stable`, independently of any previous content display-version value

## ADDED Requirements

### Requirement: Publication versions remain editable text with target-aware validation

Pending Application and Toolset publication properties SHALL retain an editable Version field even though ordinary existing-asset details are read-only. Version edits SHALL update `_metadata.version` and `display_version` together, with no independent Display version control. Newly entered versions SHALL follow `public-asset-versions` text/delimiter/path validation. Collision checks and already-published issues SHALL address the complete publication target folder/name/version, not the temporary review-copy path, and SHALL retain existing publication action semantics for intentional replacement/deletion. Invalid input SHALL show localized field feedback and block save; Core failures and successful saves SHALL retain existing notification behavior.

#### Scenario: Publication review accepts a text version
- **WHEN** an admin edits a pending Application or Toolset publication Version to `release candidate` for a valid target
- **THEN** the editable field accepts the non-semver value and both identity Version and content display version become `release candidate`

#### Scenario: Delimiter or malformed path blocks publication save
- **WHEN** the admin enters a Version containing `__` or violating Core-compatible destination-path constraints
- **THEN** localized field validation blocks save rather than submitting an ambiguous or invalid target

#### Scenario: Collision checks use the publication target
- **WHEN** an edited Version changes a pending publication's destination
- **THEN** existing already-published/conflict handling checks the resulting complete target path while retaining the selected publication action's semantics

#### Scenario: Publication failures remain visible
- **WHEN** Core rejects a validly entered publication update or subsequent content write
- **THEN** the existing error notification is shown and the failure is not reported as a successful save
