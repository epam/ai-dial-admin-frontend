# cancel-test-suite-run Specification

## Purpose

Lets a user stop a pending or running test suite run from the Admin UI instead of only being able to
wait for it to finish, fail, or be cancelled some other way.

## Requirements

### Requirement: Stop action on the run detail page
The run detail page SHALL show a "Stop" action in its header when the run's status is `RUNNING`, and
SHALL NOT show it for any other status.

#### Scenario: Run is running
- **WHEN** a user opens the detail page for a run whose status is `RUNNING`
- **THEN** a "Stop" action is visible in the page header

#### Scenario: Run is in a terminal state
- **WHEN** a user opens the detail page for a run whose status is `COMPLETED`, `FAILED`, or `CANCELLED`
- **THEN** no "Stop" action is visible in the page header

### Requirement: Stop action in the Runs list row menu
Every list surface that shows run rows with a context menu — the main Runs list and the per-test-suite
Runs tab — SHALL show a "Stop" action in a row's context menu when that row's status is `RUNNING`, and
SHALL NOT show it for any other status.

#### Scenario: Row is running
- **WHEN** a user opens the context menu for a run row whose status is `RUNNING`
- **THEN** a "Stop" action is visible in that row's menu

#### Scenario: Row is in a terminal state
- **WHEN** a user opens the context menu for a run row whose status is `COMPLETED`, `FAILED`, or
  `CANCELLED`
- **THEN** no "Stop" action is visible in that row's menu

### Requirement: Confirmation before cancelling
The system SHALL require explicit confirmation before sending a cancellation request, from either the
detail page's "Stop" action or the list's "Stop" action.

#### Scenario: User triggers Stop
- **WHEN** a user clicks the "Stop" action on the detail page, or the "Stop" action in a list row
  menu
- **THEN** a confirmation dialog is shown before any request is sent to the backend

#### Scenario: User dismisses the confirmation
- **WHEN** a user closes or dismisses the confirmation dialog without confirming
- **THEN** no cancellation request is sent and the run's status is unchanged

### Requirement: Cancellation request and status update
Once a user confirms, the system SHALL send a cancellation request for that run to the backend, and
SHALL update the acting surface's displayed status once the request succeeds.

#### Scenario: Successful cancellation from the detail page
- **WHEN** a user confirms cancelling a `RUNNING` run from its detail page
- **THEN** a cancellation request for that run is sent to the backend
- **THEN** on success, the detail page reflects the run's updated status and the "Stop" action is no
  longer shown
- **THEN** a success notification is shown

#### Scenario: Successful cancellation from the list
- **WHEN** a user confirms cancelling a `RUNNING` row from the Runs list's row menu
- **THEN** a cancellation request for that run is sent to the backend
- **THEN** on success, that row's displayed status updates and the "Stop" action is no longer shown
  for it
- **THEN** a success notification is shown

#### Scenario: Cancellation request fails
- **WHEN** the backend rejects or fails a cancellation request (for example, the run has already reached
  a terminal state by the time the request arrives)
- **THEN** an error notification is shown
- **THEN** the run's displayed status is not changed to `CANCELLED` on the acting surface
