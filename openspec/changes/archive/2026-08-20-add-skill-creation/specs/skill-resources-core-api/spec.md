## ADDED Requirements

### Requirement: A skill can be created from a name and description, create-only
The system SHALL provide a Skill Core API method that creates a brand-new skill via a whole-bundle
multipart request (`PUT /v2/skills/{bucket}/{path}`) containing a single `SKILL.md` part built from a
given name and description, and SHALL send no `If-Match` header, so Core rejects the request if a
resource already exists at that path rather than overwriting it.

#### Scenario: Creating a skill sends a single SKILL.md part
- **WHEN** the create method is called with a path, name, and description
- **THEN** the request is a multipart `PUT` to the whole-bundle route containing exactly one part,
  the generated `SKILL.md`

#### Scenario: An existing resource at the target path is not overwritten
- **WHEN** the create method is called for a path that already resolves to an existing resource
- **THEN** no `If-Match` header is sent, and Core's rejection of the conflicting create is surfaced to
  the caller as a failed result rather than retried or silently ignored

### Requirement: A Skills grouping folder can be created
The system SHALL provide a Skill Core API method that creates an empty grouping folder
(`PUT /v2/skills/{bucket}/{path}/` — trailing slash, no body), distinct from the whole-skill create
route (no trailing slash), matching the existing trailing-slash convention already used for
`deleteSkillFolder`.

#### Scenario: The folder-create route is distinct from the skill-create route
- **WHEN** a grouping folder is created
- **THEN** the request targets the trailing-slash folder route, not the whole-skill-create route
