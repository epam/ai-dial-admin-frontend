## ADDED Requirements

### Requirement: A skill's SKILL.md content can be read as raw text
The system SHALL provide a Skill Core API method that reads `SKILL.md`'s raw content
(`GET /v2/skills/{bucket}/{path}/files/SKILL.md`), returned as text rather than Core's JSON-wrapped
metadata shapes, for use by the Skill tab (see `assets-skills` and `skill-publications`). This method
SHALL be used instead of adding a per-file "content" field to the existing folder-metadata or
files-listing methods, which carry no file content today.

#### Scenario: The manifest's raw content is returned as text
- **WHEN** the method is called for a skill's path
- **THEN** it returns `SKILL.md`'s full raw text content, unparsed

#### Scenario: A missing skill or manifest is reported, not thrown as an unhandled error
- **WHEN** the method is called for a path that no longer resolves to a skill resource, or whose
  bundle has no `SKILL.md`
- **THEN** the call reports a not-found result rather than throwing an unhandled exception
