## MODIFIED Requirements

### Requirement: List public publications filtered by resource type
The system SHALL list publications via `POST /v1/ops/publication/list` with the request path fixed to `publications/public/`, then return only publications whose resolved resource type matches the requested type (application, conversation, prompt, tool_set, file, skill), using the priority order APPLICATION → CONVERSATION → PROMPT → TOOL_SET → FILE → SKILL.

#### Scenario: Prompt list returns only prompt publications
- **WHEN** the prompt-publications list is requested
- **THEN** Core is queried with path `publications/public/` and only publications resolving to the PROMPT type are returned

#### Scenario: Skill list returns only skill publications
- **WHEN** the skill-publications list is requested
- **THEN** Core is queried with path `publications/public/` and only publications resolving to the SKILL type are returned

## ADDED Requirements

### Requirement: Skill resources enriched by metadata-only lookup
For a `SKILL`-typed publication resource, the system SHALL enrich it by fetching its folder metadata directly from DIAL Core (`GET /v2/metadata/skills/{bucket}/{path}/`) rather than fetching or merging a JSON content body, mirroring the existing metadata-only treatment used for `FILE` resources. The enriched resource SHALL carry the skill's name, description, version, etag, and its contained files' names and sizes. The system SHALL NOT fetch or expose a skill's file contents (e.g. `SKILL.md` text) through this enrichment.

#### Scenario: Skill resource enriched from folder metadata
- **WHEN** a pending publication's `SKILL`-typed resource is enriched
- **THEN** its model carries name, description, version, etag, and a list of contained files (name and size) sourced from the Core folder-metadata response, with no file content fetched

#### Scenario: Missing skill resource becomes an issue, not a failure
- **WHEN** a `SKILL`-typed resource cannot be found via the folder-metadata lookup
- **THEN** a corresponding entry is added to `resourceIssues` and the rest of the publication still resolves

### Requirement: Skill approve, reject, delete, and update use the existing generic Core endpoints
The system SHALL approve, reject, delete, and update `SKILL`-typed publications through the same `POST /v1/ops/publication/{approve,reject,delete,update}` endpoints, request shapes, and comment-sanitization behavior used for every other publication type, introducing no Skill-specific publication endpoint.

#### Scenario: Skill publication approved through the generic endpoint
- **WHEN** a `SKILL`-typed publication is approved
- **THEN** `POST /v1/ops/publication/approve` is called with the `publications/`-prefixed path, identically to any other publication type
