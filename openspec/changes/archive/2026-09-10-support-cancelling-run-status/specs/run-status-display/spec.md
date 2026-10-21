## Purpose

Defines how a test suite run's status is presented wherever a run appears — list rows, the run detail
header, and any other surface showing a run — so that every status value the backend can report is
legible, including a status added to the backend after a UI release.

## ADDED Requirements

### Requirement: Run status presentation
The system SHALL present a run's status as a text label together with a visual indicator, consistently
wherever a run status appears. A run in a transitional status SHALL be indicated as in-progress in the
same manner as a `RUNNING` run, so that a user can tell an unsettled run from a settled one at a glance.

#### Scenario: Run is running
- **WHEN** a run with status `RUNNING` is displayed
- **THEN** an in-progress indicator and the label for `RUNNING` are shown

#### Scenario: Run is cancelling
- **WHEN** a run with status `CANCELLING` is displayed
- **THEN** an in-progress indicator and the label for `CANCELLING` are shown
- **THEN** it is not presented as a settled status

#### Scenario: Run is in a settled status
- **WHEN** a run with status `COMPLETED`, `FAILED`, or `CANCELLED` is displayed
- **THEN** a settled-status indicator and the label for that status are shown

### Requirement: Unrecognized status is still legible
When a run's status is a value the system does not recognize, it SHALL display that raw status value
rather than rendering an empty status. A status the UI has no label for MUST NOT result in a blank status
with no indicator and no text, because that is indistinguishable from a rendering failure.

#### Scenario: Backend reports a status the UI does not know
- **WHEN** a run is displayed whose status is a value the system has no label for
- **THEN** the raw status value is shown as its status text
- **THEN** the status is not blank

#### Scenario: Run has no status
- **WHEN** a run is displayed that has no status value at all
- **THEN** no status text is shown
- **THEN** no placeholder standing in for a missing value is shown
