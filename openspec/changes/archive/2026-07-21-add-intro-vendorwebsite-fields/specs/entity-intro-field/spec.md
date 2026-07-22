## ADDED Requirements

### Requirement: `intro` field on Model, Application, Interceptor, and Toolset
The system SHALL expose an optional `intro` text field on Model, Application, Interceptor, and Toolset entities (regular and asset variants), editable from each entity's properties view, mirroring the existing `description` field's control pattern (component structure, validation-error display, and save wiring).

#### Scenario: Intro is editable on a Model
- **WHEN** a user opens a Model's properties view
- **THEN** an Intro field is shown alongside Description, and editing it updates the entity's `intro` value the same way editing Description updates `description`

#### Scenario: Intro is editable on an Application
- **WHEN** a user opens a regular Application's properties view
- **THEN** an Intro field is shown and editable

#### Scenario: Intro is editable on an Interceptor
- **WHEN** a user opens an Interceptor's properties view
- **THEN** an Intro field is shown and editable

#### Scenario: Intro is editable on a Toolset
- **WHEN** a user opens a regular Toolset's properties view
- **THEN** an Intro field is shown and editable

#### Scenario: Intro is editable on Asset Application and Asset Toolset
- **WHEN** a user opens an Asset Application's or Asset Toolset's properties view
- **THEN** an Intro field is shown and editable, and saving routes through the same Core-direct path (`AssetApi`) already used for that entity's other fields — no admin-BE call is made for this field

#### Scenario: Intro persists across save and reload
- **WHEN** a user sets a non-empty Intro value and saves
- **THEN** reloading the entity shows the same Intro value

#### Scenario: Empty intro is valid
- **WHEN** the Intro field is left blank
- **THEN** the entity saves successfully with `intro` absent or empty, matching how an empty Description behaves today

### Requirement: `intro` length validation mirrors backend constraints
The system SHALL validate the `intro` field's length client-side using the same approach as `description` (`getErrorForDescription`/`MAX_DESCRIPTION_SYMBOLS`), with a maximum length matching whatever constraint the backend enforces for `intro`.

#### Scenario: Over-limit intro is rejected before save
- **WHEN** a user enters an `intro` value longer than the allowed maximum
- **THEN** a validation error is shown and the Save action for that entity is disabled, matching the existing Description over-limit behavior
