## ADDED Requirements

### Requirement: Application asset Features tab exposes skills_supported
The platform application Features tab SHALL render a `skills_supported` switch in the tools group, which
SHALL be labelled to cover tools, functions and skills. The value SHALL be stored in snake_case under
`features`.

#### Scenario: Skills switch is present in the tools group
- **WHEN** a user opens a platform application's Features tab
- **THEN** the tools group shows `tools_supported`, `parallel_tool_calls_supported` and
  `skills_supported` switches

#### Scenario: Toggling persists the flag
- **WHEN** a user turns `skills_supported` on and saves
- **THEN** the payload carries `features.skills_supported: true`
