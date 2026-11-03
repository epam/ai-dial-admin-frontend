# request-template-form-data-parts Specification

## Purpose

The part types of the Request Template form-data grid (`text`, `file`): which value editor each type uses, and that switching a part's type clears its value.

## Requirements

### Requirement: Form-data part types
The Request Template form-data grid SHALL offer two part types in its Type dropdown: `text` and `file`. There is no `skill` part type.
A new part SHALL default to `text`.

#### Scenario: Type dropdown options
- **WHEN** the user opens the Type dropdown of a form-data part
- **THEN** the options SHALL be Text and File

#### Scenario: Default type
- **WHEN** the user adds a part
- **THEN** its type SHALL be `text`

### Requirement: Value editor follows the part type
For a part of type `file`, the Value cell SHALL render the file picker; for `text` it SHALL render a plain text editor.

#### Scenario: File and text parts
- **WHEN** a part has type `file` or `text`
- **THEN** the Value cell SHALL render the file picker or the text input respectively

### Requirement: Switching part type clears the value
Changing a part's type SHALL clear its value.

#### Scenario: File to text
- **WHEN** a part of type `file` with a non-empty value is switched to `text`
- **THEN** its value SHALL be empty
