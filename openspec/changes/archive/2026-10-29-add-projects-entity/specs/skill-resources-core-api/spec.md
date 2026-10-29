## ADDED Requirements

### Requirement: Skill Core calls are issued through the shared client
The system SHALL implement the Skill Core API methods as a thin subclass of the shared complex-resource client
bound to the `skills` group and the `SKILL.md` manifest, with every method keeping its name, signature, request
shape, and error mapping.

#### Scenario: Skill methods keep their contracts
- **WHEN** any existing Skill Core API method is called
- **THEN** it sends the same request to the same `v2/skills` or `v2/metadata/skills` route and returns the same
  shape as before the extraction
