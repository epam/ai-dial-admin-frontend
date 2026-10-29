## ADDED Requirements

### Requirement: Skill publications are shown in a dedicated publication view
The system SHALL render Skill publications in a dedicated complex-resource publication view, separate from the
generic publication view used by the other publication types. The Skill publication tabs (`Properties`, `Skill`,
`Permissions`), staging, save, and discard behaviour defined in this capability SHALL be unchanged, and the
generic publication view SHALL carry no Skill-specific handling.

#### Scenario: Skill publication behaviour is preserved
- **WHEN** a reviewer opens a pending Skill publication
- **THEN** the tabs, file staging, manifest editing, save, and discard behave as specified above

#### Scenario: Other publication types use the generic view
- **WHEN** a reviewer opens an Application, Toolset, Prompt, Conversation, or File publication
- **THEN** the generic publication view is rendered and behaves as before
