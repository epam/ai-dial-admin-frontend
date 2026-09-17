## ADDED Requirements

### Requirement: Switching App Runner preserves already-set applicationProperties
The `Assets` resource source editor SHALL, when the user switches the selected App Runner on a
platform/asset Application, merge the new runner's default `applicationProperties` under the
entity's existing `applicationProperties` rather than replacing them outright. For any key present
in both the entity's current `applicationProperties` and the new runner's defaults, the entity's
existing value SHALL win. A key present only in the new runner's defaults SHALL be added; a key
present only in the entity's existing values and not in the new runner's schema SHALL be preserved
unchanged.

#### Scenario: Switching to a runner with the same schema preserves a set value
- **WHEN** the user has set a value for a parameter (e.g. `openapi`) on an Application, then switches
  the selected App Runner to a different runner that defines the same parameter
- **THEN** the parameter's value on the Application is unchanged after the switch

#### Scenario: Switching runner still applies defaults for parameters not already set
- **WHEN** the user switches the selected App Runner to one that defines a parameter the Application
  does not already have a value for
- **THEN** that parameter is added with the new runner's default value

