## MODIFIED Requirements

### Requirement: Run status presentation
The system SHALL present a run's status with a visual indicator wherever a run status appears, and SHALL
make the status label available alongside it — visibly on a run's own detail surfaces, and on hover and
keyboard focus in a dense list row where the indicator stands alone in a column sized for it. A run in a
transitional status SHALL be indicated as in-progress in the same manner as a `RUNNING` run, so that a
user can tell an unsettled run from a settled one at a glance.

The label SHALL always be part of the status's accessible name, in every presentation. An indicator whose
meaning is carried only by colour or shape is not a status presentation: colour alone fails the contrast
and non-text-content requirements in `.claude/rules/a11y.md`, and a tooltip is not an accessible name.

#### Scenario: Run is pending
- **WHEN** a run with status `PENDING` is displayed
- **THEN** a settled-style indicator is shown (no in-progress animation) with the label for `PENDING`
  available the same way
- **THEN** it is not presented as in-progress — a run that has not yet started is not a run that is
  actively doing something

#### Scenario: Run is running
- **WHEN** a run with status `RUNNING` is displayed
- **THEN** an in-progress indicator is shown
- **AND** the label for `RUNNING` is available: shown as text on a detail surface, and on hover and
  keyboard focus in a list row

#### Scenario: Run is cancelling
- **WHEN** a run with status `CANCELLING` is displayed
- **THEN** an in-progress indicator is shown with the label for `CANCELLING` available the same way
- **THEN** it is not presented as a settled status

#### Scenario: Run is in a settled status
- **WHEN** a run with status `COMPLETED`, `FAILED`, or `CANCELLED` is displayed
- **THEN** a settled-status indicator is shown with the label for that status available the same way

#### Scenario: Status in a list row is readable without a mouse
- **WHEN** a run status is presented as an indicator alone in a list row
- **THEN** the status label is part of the cell's accessible name
- **AND** the label is reachable by keyboard, not only on hover
