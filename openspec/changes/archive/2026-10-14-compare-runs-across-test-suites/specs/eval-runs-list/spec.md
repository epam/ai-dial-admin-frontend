## MODIFIED Requirements

### Requirement: The compare-run picker presents only identifying columns

The modal that selects a run to compare against SHALL present only the columns that identify a run —
the name of the test suite the run belongs to, its status, name and id, run and test-case counts, and
start and end times. It SHALL NOT present the Target, Metrics, Duration, Cost, or Overall score
columns. The Test Suite column SHALL show the suite's name, and the suite's id while the name is
unavailable.

#### Scenario: Picking a run to compare

- **WHEN** the operator opens the compare-run selection modal
- **THEN** the grid shows `Test Suite`, status, `Test suite run name`, `Runs`, `Test cases`, Start
  Date, and End Date
- **AND** it shows no Target, Metrics, Duration, Cost, or Overall score column

#### Scenario: Suite name is unavailable

- **WHEN** a listed run's suite name could not be resolved
- **THEN** the run's Test Suite cell shows the suite's id

## ADDED Requirements

### Requirement: The compare-run picker offers runs of suites on the same dataset

The modal that selects a run to compare against SHALL offer the completed runs of the opened run's
test suite and of every other test suite bound to the same dataset, each labelled with its suite. It
SHALL NOT offer runs that are not completed, runs of suites bound to a different dataset, or the run
being compared from. The same list SHALL be offered when a run is changed from inside the comparison
view. When the opened run's suite has no dataset, or the suites of its dataset cannot be loaded, the
modal SHALL offer only the completed runs of the opened run's own suite.

#### Scenario: Runs of another suite on the same dataset are offered

- **WHEN** the operator opens the compare-run modal for a run whose suite is bound to a dataset that
  another suite is also bound to
- **THEN** the grid lists the completed runs of both suites
- **AND** each row's Test Suite cell names the suite that run belongs to
- **AND** the opened run is not listed

#### Scenario: Runs of a different dataset are not offered

- **WHEN** a suite bound to a different dataset has completed runs
- **THEN** none of those runs are listed in the compare-run modal

#### Scenario: Runs that are not completed are not offered

- **WHEN** a suite on the same dataset has runs that are pending, running, failed, or cancelled
- **THEN** those runs are not listed in the compare-run modal

#### Scenario: Suite without a dataset

- **WHEN** the operator opens the compare-run modal for a run whose suite has no dataset
- **THEN** the grid lists only the completed runs of that suite, as before

#### Scenario: Dataset suites cannot be loaded

- **WHEN** the suites of the opened run's dataset fail to load
- **THEN** the grid lists only the completed runs of the opened run's own suite
- **AND** no error is shown

#### Scenario: Changing a run inside the comparison view

- **WHEN** the operator changes either run from the comparison view
- **THEN** the modal lists the same completed runs of the same-dataset suites, excluding the other
  compared run
