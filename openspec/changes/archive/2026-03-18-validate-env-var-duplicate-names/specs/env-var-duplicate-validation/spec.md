## ADDED Requirements

### Requirement: Duplicate env variable name detection
The system SHALL detect when two or more environment variables within the same container share the same name (case-sensitive) and display a validation error on ALL variables with the duplicate name.

#### Scenario: Two variables with the same name
- **WHEN** a user adds or renames an environment variable such that two or more variables share the same name
- **THEN** all variables with that duplicate name SHALL display a localized error message indicating the name must be unique

#### Scenario: Duplicate resolved by renaming
- **WHEN** a user renames a variable so that its name is no longer duplicated
- **THEN** the duplicate error SHALL be cleared from all variables that no longer have duplicates

#### Scenario: Duplicate resolved by removing
- **WHEN** a user removes a variable that was part of a duplicate set, leaving only one variable with that name
- **THEN** the remaining variable SHALL have its duplicate error cleared

#### Scenario: Empty names are not flagged as duplicates
- **WHEN** two or more variables have empty names
- **THEN** the system SHALL NOT flag them as duplicates (the existing "required" error is sufficient)

#### Scenario: Different mount types same name
- **WHEN** two variables have the same name but different mount types
- **THEN** the system SHALL flag both as duplicates (uniqueness is by name alone)

### Requirement: Duplicate error integrates with existing validation
The duplicate name error SHALL integrate with the existing `SaveValidationContext` error tracking so that the container variables section shows an error indicator when duplicates exist.

#### Scenario: Section error indicator with duplicates
- **WHEN** duplicate variable names exist
- **THEN** the container variables accordion section SHALL display its error indicator

#### Scenario: Duplicate error coexists with format error
- **WHEN** a variable has both an invalid name format and a duplicate name
- **THEN** the format error SHALL take priority for display on that variable

### Requirement: Localized error message
The system SHALL provide a localized error message for duplicate variable names using the project's i18n system (next-international).

#### Scenario: Error message content
- **WHEN** a duplicate name error is displayed
- **THEN** the message SHALL communicate that the variable name must be unique (e.g., "Variable name must be unique")
