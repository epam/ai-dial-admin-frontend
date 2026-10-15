## ADDED Requirements

### Requirement: Schema is read-only for a PUBLIC dataset bound to a test suite
When the dataset is PUBLIC and at least one test suite is bound to it, the Schema tab SHALL be read-only: the name, type, required and scope controls of every field, the "Add field" button and the remove action SHALL be disabled, and the field values SHALL remain visible. A warning SHALL be shown above the schema grid explaining that the schema cannot be modified because test suites use this dataset and that changing fields could break test cases in those suites. The warning SHALL NOT offer a link to the test suites, and its text SHALL NOT say "more than one" — it applies from a single bound suite.

A dataset that is PRIVATE (created inside a test suite) SHALL keep an editable schema, and so SHALL a PUBLIC dataset with no bound test suite. The decision is made when the dataset page loads; a binding created afterwards in another session is picked up on the next page load, and the backend's 409 `DATASET_FIELD_RENAME_FORBIDDEN` handling in "Rename schema field preserves test case values" remains the fallback.

#### Scenario: PUBLIC dataset with a bound test suite
- **WHEN** the user opens the Schema tab of a PUBLIC dataset bound to one or more test suites
- **THEN** the field inputs, the type, required and scope controls and the "Add field" button are disabled
- **AND** no remove action is available on any field row
- **AND** a warning above the grid states that the schema cannot be modified because test suites use this dataset

#### Scenario: PUBLIC dataset with no bound test suite
- **WHEN** the user opens the Schema tab of a PUBLIC dataset that no test suite uses
- **THEN** the schema is editable and no read-only warning is shown

#### Scenario: Exactly one bound test suite
- **WHEN** a PUBLIC dataset is bound to exactly one test suite
- **THEN** the Schema tab is read-only and the warning is shown

#### Scenario: PRIVATE dataset bound to its own suite
- **WHEN** the user opens the Schema tab of a PRIVATE dataset created inside a test suite
- **THEN** the schema is editable and no read-only warning is shown

#### Scenario: Read-only schema does not dirty the dataset
- **WHEN** the schema is read-only and the user visits the Schema tab
- **THEN** the Save and Discard buttons do not appear because of that visit

#### Scenario: Test suite schema modal is unaffected
- **WHEN** the user opens the "Test case schema" modal of a test suite whose dataset is private
- **THEN** its fields remain editable
