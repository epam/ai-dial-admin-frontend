# request-template-form-data-parts Specification

## Purpose

The part types of the Request Template form-data grid (`text`, `file`, `skill`): which value editor each type uses, that a `skill` part is chosen with the skill picker, and that switching a part's type clears its value.

## Requirements

### Requirement: Form-data part types include skill
The Request Template form-data grid SHALL offer three part types in its Type dropdown: `text`, `file` and `skill`.
A new part SHALL default to `text`. The stored `FormDataPart.type` for a skill part SHALL be `skill`.

#### Scenario: Type dropdown options
- **WHEN** the user opens the Type dropdown of a form-data part
- **THEN** the options SHALL be Text, File and Skill

#### Scenario: Default type
- **WHEN** the user adds a part
- **THEN** its type SHALL be `text`

### Requirement: Skill part value is chosen with the skill picker
For a part whose type is `skill`, the Value cell SHALL render `EntitySelectInput` (entity type `Skill`) (not the file picker and not a
plain text editor), and the stored value SHALL be the `skills/<bucket>/<path>` reference it emits. Parts of type
`text` and `file` SHALL render as before.

#### Scenario: Skill part renders the skill picker
- **WHEN** a part has type `skill`
- **THEN** its Value cell SHALL render the skill picker

#### Scenario: File and text parts unchanged
- **WHEN** a part has type `file` or `text`
- **THEN** the Value cell SHALL render the file picker or the text input respectively, as before

#### Scenario: Persistence
- **WHEN** the user selects a skill for a part, saves the template and reloads the page
- **THEN** the part SHALL still have type `skill` and the same skill reference

### Requirement: Switching part type clears the value
Changing a part's type SHALL clear its value, for every pair of types including `skill`.

#### Scenario: Skill to file
- **WHEN** a part of type `skill` with value `skills/public/my-skill` is switched to `file`
- **THEN** its value SHALL be empty

#### Scenario: Text to skill
- **WHEN** a part of type `text` with a non-empty value is switched to `skill`
- **THEN** its value SHALL be empty
