## ADDED Requirements

### Requirement: Schema field type SKILL
The schema field Type dropdown, the schema table Type column and the template `|type` hint SHALL support `SKILL`
(hint spelling `skill`) alongside the existing types, including `FILE`. All existing types SHALL behave as before.

#### Scenario: Type options include SKILL
- **WHEN** the user opens the Type dropdown of a schema field
- **THEN** SKILL SHALL be offered together with the existing types

#### Scenario: Template type hint
- **WHEN** a request template variable is written with the hint `skill`
- **THEN** the derived schema/binding type SHALL be `SKILL`

### Requirement: SKILL values are edited with the skill picker
The system SHALL edit a `SKILL`-typed field's value with `SkillSelectInput` wherever a `FILE`-typed field is edited
with the file picker: the test-suite input-binding cell, the template-variable cell and the dynamic-configuration
variable row.

#### Scenario: Input binding cell
- **WHEN** an input binding's field type is `SKILL`
- **THEN** its value cell SHALL render the skill picker

#### Scenario: Variable row
- **WHEN** a dynamic-configuration variable has type `SKILL`
- **THEN** the row SHALL render the skill picker, and FILE variables SHALL still render the file picker

### Requirement: Changing a field's type drops a stale reference
A file reference SHALL NOT be shown in a SKILL cell, and a skill reference SHALL NOT be shown in a FILE cell.

#### Scenario: Skill value in a FILE column
- **WHEN** a FILE-typed cell holds `skills/public/my-skill`
- **THEN** the file picker SHALL display as empty

#### Scenario: File value in a SKILL column
- **WHEN** a SKILL-typed cell holds `files/public/report.pdf`
- **THEN** the skill picker SHALL display as empty
