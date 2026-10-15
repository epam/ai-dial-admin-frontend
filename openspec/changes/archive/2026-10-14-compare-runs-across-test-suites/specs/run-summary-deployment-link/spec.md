## MODIFIED Requirements

### Requirement: Compare Summary reuses the same link behavior

Compare Summary SHALL use the same deployment external-link behavior as single-run Summary for each
run’s suite context (primary and compared). When the two runs belong to different test suites, a
run's suite context SHALL come from that run's own suite, never from the other run's.

#### Scenario: Compare renders two independent links

- **WHEN** Compare Summary shows Application names for both primary and compared runs
- **THEN** each run’s Application postfix SHALL resolve its external link independently using the
  same rules as single-run Summary (by-id only when that run’s `deploymentRef.type` is missing)

#### Scenario: Runs of different suites resolve links against their own suite

- **WHEN** Compare Summary shows two runs of different test suites and a run's stored suite snapshot
  lacks the deployment information needed for the link
- **THEN** that run's link SHALL be resolved from its own test suite
- **AND** SHALL NOT be resolved from the other run's test suite

## ADDED Requirements

### Requirement: Compare Summary shows the test suite of each run

Compare Summary SHALL show a single Test Suite field when both runs belong to the same test suite, and
SHALL show the test suite of each run, labelled by run, when they belong to different test suites.
Each shown suite SHALL link to that suite, and SHALL read as the suite's id while its name is
unavailable.

#### Scenario: Both runs belong to one suite

- **WHEN** Compare Summary shows two runs of the same test suite
- **THEN** it shows one Test Suite field with that suite's name and a link to the suite

#### Scenario: Runs belong to different suites

- **WHEN** Compare Summary shows two runs of different test suites
- **THEN** the Test Suite field lists each run's name beside the name of its own suite
- **AND** each entry has a link that opens that suite

#### Scenario: Suite name not yet loaded

- **WHEN** a run's suite name has not loaded
- **THEN** that run's Test Suite entry shows the suite's id
