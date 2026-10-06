## MODIFIED Requirements

### Requirement: Multi-turn Try Out Request shows Dynamic configuration per turn

When a test-case Try Out Request preview is opened for a case with `multiTurnData` of length greater than 1, the preview SHALL show one Dynamic configuration section per turn in order, each labeled as that turn, with template-variable values resolved for that turn (shared fields from `data`, per-turn fields from that turn's `multiTurnData` entry, using the input bindings of the request the section belongs to).

When the case is single-turn (`multiTurnData` absent or length ≤ 1), the Request preview SHALL keep a single Dynamic configuration section.

When the suite is a chain, the per-turn sections SHALL be shown within the selected request, so a chained multi-turn case shows that request's turns only. A request is treated as multi-turn when its own bindings reference a per-turn field.

#### Scenario: Multi-turn Request shows one Dynamic configuration per turn

- **WHEN** Try Out is opened for a three-turn test case
- **THEN** the Request preview shows Turn 1, Turn 2, and Turn 3 Dynamic configuration sections with that turn's resolved values

#### Scenario: Single-turn Request keeps one Dynamic configuration

- **WHEN** Try Out is opened for a single-turn test case
- **THEN** the Request preview shows one Dynamic configuration section and no turn labels

#### Scenario: A chained multi-turn case shows turns within the selected request

- **WHEN** Try Out is opened for a three-turn test case on a suite whose second request binds a per-turn field while request `#0` does not
- **THEN** selecting request `#0` shows one Dynamic configuration section with no turn labels
- **AND** selecting the second request shows Turn 1, Turn 2, and Turn 3 sections resolved from its own bindings
