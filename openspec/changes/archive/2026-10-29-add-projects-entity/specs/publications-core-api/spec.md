## MODIFIED Requirements

### Requirement: List public publications filtered by resource type
The system SHALL list publications via `POST /v1/ops/publication/list` with the request path fixed to `publications/public/`, then return only publications whose resolved resource type matches the requested type (application, conversation, prompt, tool_set, file, skill, project), using the priority order APPLICATION → CONVERSATION → PROMPT → TOOL_SET → FILE → SKILL → PROJECT.

#### Scenario: Prompt list returns only prompt publications
- **WHEN** the prompt-publications list is requested
- **THEN** Core is queried with path `publications/public/` and only publications resolving to the PROMPT type are returned

#### Scenario: Skill list returns only skill publications
- **WHEN** the skill-publications list is requested
- **THEN** Core is queried with path `publications/public/` and only publications resolving to the SKILL type are returned

#### Scenario: Project list returns only project publications
- **WHEN** the project-publications list is requested
- **THEN** Core is queried with path `publications/public/` and only publications resolving to the PROJECT type are returned

#### Scenario: A publication carrying both a skill and a project resolves to skill
- **WHEN** a publication lists resources of both the SKILL and PROJECT types
- **THEN** it resolves to SKILL, the earlier type in the priority order
