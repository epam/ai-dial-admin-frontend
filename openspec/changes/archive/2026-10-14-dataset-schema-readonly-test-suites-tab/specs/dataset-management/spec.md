## MODIFIED Requirements

### Requirement: Dataset tabs
The system SHALL display four tabs on the dataset detail view: Properties, Schema, Test Cases, and Test Suites.

#### Scenario: Default tab on open
- **WHEN** the user opens a dataset detail view
- **THEN** the Properties tab is active by default

#### Scenario: Tab navigation
- **WHEN** the user clicks a different tab
- **THEN** the corresponding tab content is displayed without losing unsaved changes in other tabs

#### Scenario: Test Suites tab present
- **WHEN** the user opens a dataset detail view
- **THEN** a Test Suites tab is shown after the Test Cases tab

## ADDED Requirements

### Requirement: JSON Editor is disabled while the schema is read-only
While the dataset's schema is read-only (a PUBLIC dataset bound to at least one test suite, see `dataset-schema`), the JSON Editor toggle in the dataset header SHALL be disabled on every tab, because the schema could otherwise be edited through the JSON. The toggle SHALL remain enabled for any other dataset.

#### Scenario: JSON Editor disabled on the Schema tab
- **WHEN** the user opens the Schema tab of a PUBLIC dataset bound to a test suite
- **THEN** the JSON Editor toggle is disabled

#### Scenario: JSON Editor disabled on other tabs
- **WHEN** the user is on the Properties tab of that same dataset
- **THEN** the JSON Editor toggle is disabled

#### Scenario: JSON Editor enabled for an unbound dataset
- **WHEN** the user opens a PUBLIC dataset that no test suite uses, or a PRIVATE dataset
- **THEN** the JSON Editor toggle is enabled
