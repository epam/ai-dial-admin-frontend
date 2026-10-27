## ADDED Requirements

### Requirement: Test-case grid supports SKILL columns
When the schema contains a `SKILL` field, the test-case grid (shared by Test Suites and Datasets) SHALL render that
column's cells with the skill picker and SHALL store the chosen `skills/<bucket>/<path>` reference as the cell value.
Columns of other types, including `FILE`, SHALL be unchanged.

#### Scenario: Editing a skill cell
- **WHEN** the user selects a skill in a SKILL column cell
- **THEN** the cell value SHALL be the selected `skills/<bucket>/<path>` reference

#### Scenario: Reload keeps the reference
- **WHEN** a test case with a skill reference is saved and the page is reloaded
- **THEN** the cell SHALL show the same reference

#### Scenario: FILE column unchanged
- **WHEN** the schema has both a FILE and a SKILL column
- **THEN** the FILE column SHALL use the file picker and the SKILL column the skill picker
