# skill-select-input Specification

## Purpose

The skill picker, implemented as the `Skill` entity type of the generic `EntitySelectInput`/`EntitySelectManager`/`EntitySelectCellRenderer` (per-type context lives in `ENTITY_SELECT_CONFIGS`), used wherever evaluation references a skill: browsing the Assets > Skills folder tree, selecting a skill but never a grouping folder or a file inside a bundle, the `skills/<bucket>/<path>` value it produces, and its disabled state and accessibility.

The input frame (`SelectInputPopup`) and the folder-tree browser (`EntitySelectManager`) are shared with the file picker: its Public tab renders `EntitySelectManager` with the `File` entity type, while its Application tab and tabs stay specific to `FileSelectInput`.

## Requirements

### Requirement: Skill picker selects a skill, not a folder or a bundle file
The system SHALL provide an `EntitySelectInput` (with entity type `Skill`) that lets the user choose one skill from the Skills folder tree
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
The value emitted by `EntitySelectInput` for the `Skill` entity type SHALL be the skill's canonical reference `skills/<bucket>/<path>`: the
skill resource path, with no trailing slash, not pointing at `SKILL.md`, at a file inside the bundle, or at a
folder. The input SHALL display the stored value. A value that is not a string starting with `skills/` SHALL be
treated as empty (stale value of another type) and SHALL NOT be displayed.

#### Scenario: Confirming a selection
- **WHEN** the user selects the skill `skills/public/my-skill` and confirms
- **THEN** the component SHALL call `onChangeValue` with `skills/public/my-skill`

#### Scenario: Stale file value
- **WHEN** the component receives the value `files/public/report.pdf` or an arbitrary non-path string
- **THEN** the input SHALL display as empty

### Requirement: Picker opens at the root when the current value cannot be resolved
When the popup opens with a current value, the system SHALL load the folder tree down to the value's folder and
show it expanded with the value selected. If the value's folder lists as empty because it does not exist (the
backend rejects an unknown bucket and the rejection surfaces as an empty listing), the system SHALL load the root of
the tree instead and show it exactly as it does for an empty value: root expanded, nothing selected, the confirm
button disabled until the user picks a skill. The popup SHALL NOT stay on its loading state. The stale value SHALL
stay displayed in the input until the user confirms a replacement, the fallback SHALL apply once per opening, and a
different value received while the popup is open SHALL be resolved afresh.

#### Scenario: Value points to a missing skill
- **WHEN** the popup opens with `skills/bucket1/missing-skill` and `bucket1` does not exist
- **THEN** the root of the Skills tree SHALL be loaded and shown
- **AND** the user SHALL be able to select a skill and confirm it as the replacement value

#### Scenario: Value's folder still holds skills
- **WHEN** the popup opens with a value whose skill is missing but whose folder lists other skills
- **THEN** the tree SHALL open expanded to that folder, as for any resolvable value

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
