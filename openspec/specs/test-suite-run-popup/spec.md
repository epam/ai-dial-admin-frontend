# test-suite-run-popup Specification

## Purpose
Lets an operator start a test suite run from the Run Test Cases popup with the selected-case
summary, how many times each case runs, and how many cases may run in parallel, using the
concurrency ceiling the eval service currently enforces.
## Requirements
### Requirement: Run popup shows selected test cases and number of runs
The Run Test Cases popup SHALL show how many test cases are selected for the run and SHALL offer a
numeric control for the number of runs, with a minimum of 1.

#### Scenario: Popup opens for a suite with selected cases
- **WHEN** an operator opens the Run Test Cases popup for a test suite that has at least one
  included valid test case
- **THEN** the popup shows the selected-case count
- **THEN** the number-of-runs control is present and defaults to 1

### Requirement: Parallel test cases control under number of runs
The Run Test Cases popup SHALL show a "Number of parallel test cases" numeric control directly
under the number-of-runs control, with the same stepper pattern (decrease, value, increase) and a
minimum of 1.

#### Scenario: Popup shows the concurrency stepper
- **WHEN** the Run Test Cases popup has finished loading
- **THEN** a "Number of parallel test cases" control is visible under Number of runs
- **THEN** that control defaults to 1

#### Scenario: Decrease stops at one
- **WHEN** the parallel-test-cases value is 1 and the operator activates Decrease
- **THEN** the value remains 1

### Requirement: Concurrency capped by eval run config
When the popup opens, the system SHALL read the eval service run configuration
(`GET /api/v1/test-suite-runs/config`) and, when `maxConcurrencyLevel` is a positive integer, SHALL
use it as the maximum for the parallel-test-cases control.

#### Scenario: Config returns a max
- **WHEN** the config response includes `maxConcurrencyLevel` of N (N ≥ 1)
- **THEN** Increase on the parallel-test-cases control does not raise the value above N
- **THEN** Run is disabled while the entered value is greater than N

#### Scenario: Config is unavailable
- **WHEN** the config request fails or returns no usable `maxConcurrencyLevel`
- **THEN** the popup still finishes loading
- **THEN** the parallel-test-cases control remains usable with a minimum of 1 and no client-side
  maximum

### Requirement: Run request includes number of runs and concurrency
Confirming Run SHALL send both the number of runs and the parallel concurrency on the create-run
request as `runConfig.numberOfRuns` and `runConfig.execution.concurrencyLevel`.

#### Scenario: Successful start with both values
- **WHEN** the operator confirms Run with number of runs R and parallel test cases C
- **THEN** the create-run request body includes `runConfig.numberOfRuns` equal to R and
  `runConfig.execution.concurrencyLevel` equal to C

#### Scenario: Service rejects the run
- **WHEN** the create-run request fails
- **THEN** an error notification is shown
- **THEN** the popup remains open so the operator can adjust values or cancel

