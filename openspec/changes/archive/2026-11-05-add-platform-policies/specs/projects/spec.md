## MODIFIED Requirements

### Requirement: Artifacts > Projects menu entry
The system SHALL add a `Projects` item to the `Artifacts` menu group directly after `Skills`, linking to the
`/projects` route. The item SHALL be shown unconditionally, with no feature flag.

#### Scenario: Projects follows Skills in the Artifacts group
- **WHEN** the Artifacts group of the menu renders
- **THEN** `Projects` appears immediately after `Skills`

#### Scenario: Selecting Projects navigates to its list
- **WHEN** a user selects `Projects` from the Artifacts group
- **THEN** the app navigates to `/projects`
