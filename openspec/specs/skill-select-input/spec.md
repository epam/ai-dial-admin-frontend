# skill-select-input Specification

## Purpose

The reusable skill picker used wherever evaluation references a skill: browsing the Assets > Skills folder tree, selecting a skill but never a grouping folder or a file inside a bundle, the `skills/<bucket>/<path>` value it produces, and its disabled state and accessibility.

## Requirements

### Requirement: Skill picker selects a skill, not a folder or a bundle file
The system SHALL provide a `SkillSelectInput` that lets the user choose one skill from the Skills folder tree
(the same tree as Assets > Skills, served by `SkillFolderProvider`). The control SHALL render an editable-looking
input with an open button, and open a popup headed by `TestSuitesI18nKey.SelectSkill` that lists grouping folders
and skills. Only a skill row SHALL be selectable; a grouping folder row SHALL be browsable (expandable) but SHALL
NOT be selectable. The popup SHALL NOT let the user select a file inside a skill bundle, and SHALL NOT offer
`SKILL.md` as a choice.

#### Scenario: Selecting a skill
- **WHEN** the user opens the picker, expands a folder and clicks a skill row
- **THEN** that row SHALL be marked as selected and the confirm button SHALL be enabled

#### Scenario: Clicking a grouping folder
- **WHEN** the user clicks a grouping folder row
- **THEN** no row SHALL be selected and the confirm button SHALL be disabled
- **AND** the folder SHALL remain expandable so its children can be browsed

#### Scenario: Nothing selected yet
- **WHEN** the popup opens with no current value
- **THEN** the confirm button SHALL be disabled

### Requirement: Skill reference value format
The value emitted by `SkillSelectInput` SHALL be the skill's canonical reference `skills/<bucket>/<path>`: the
skill resource path, with no trailing slash, not pointing at `SKILL.md`, at a file inside the bundle, or at a
folder. The input SHALL display the stored value. A value that is not a string starting with `skills/` SHALL be
treated as empty (stale value of another type) and SHALL NOT be displayed.

#### Scenario: Confirming a selection
- **WHEN** the user selects the skill `skills/public/my-skill` and confirms
- **THEN** the component SHALL call `onChangeValue` with `skills/public/my-skill`

#### Scenario: Stale file value
- **WHEN** the component receives the value `files/public/report.pdf` or an arbitrary non-path string
- **THEN** the input SHALL display as empty

### Requirement: Skill picker states and accessibility
The picker SHALL support a disabled state in which the open button cannot be activated. The open button and the
tree rows SHALL be reachable by role and accessible name. A decorative icon inside a labeled control SHALL be
`aria-hidden`.

#### Scenario: Disabled picker
- **WHEN** the picker is rendered with `disabled`
- **THEN** the popup SHALL NOT be openable

#### Scenario: Locating controls by role
- **WHEN** a test queries the open button with `getByRole('button')` and the confirm button by its accessible name
- **THEN** both SHALL be found
