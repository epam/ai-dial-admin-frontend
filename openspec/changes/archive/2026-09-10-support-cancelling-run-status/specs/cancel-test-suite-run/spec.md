## MODIFIED Requirements

### Requirement: Stop action on the run detail page
The run detail page SHALL show a "Stop" action in its header when the run's status is `RUNNING`, and
SHALL NOT show it for any other status, including the transitional `CANCELLING` status. Visibility SHALL
be determined by the run's current status alone, so that a run whose cancellation does not take effect and
returns to `RUNNING` offers the action again.

#### Scenario: Run is running
- **WHEN** a user opens the detail page for a run whose status is `RUNNING`
- **THEN** a "Stop" action is visible in the page header

#### Scenario: Run is in a terminal state
- **WHEN** a user opens the detail page for a run whose status is `COMPLETED`, `FAILED`, or `CANCELLED`
- **THEN** no "Stop" action is visible in the page header

#### Scenario: Run is cancelling
- **WHEN** a user opens the detail page for a run whose status is `CANCELLING`
- **THEN** no "Stop" action is visible in the page header

#### Scenario: Cancellation does not take effect
- **WHEN** a run being viewed on its detail page moves from `CANCELLING` back to `RUNNING`
- **THEN** the "Stop" action is visible in the page header again

### Requirement: Stop action in the Runs list row menu
Every list surface that shows run rows with a context menu — the main Runs list and the per-test-suite
Runs tab — SHALL show a "Stop" action in a row's context menu when that row's status is `RUNNING`, and
SHALL NOT show it for any other status, including the transitional `CANCELLING` status. Visibility SHALL
be determined by the row's current status alone, so that a row whose cancellation does not take effect and
returns to `RUNNING` offers the action again.

#### Scenario: Row is running
- **WHEN** a user opens the context menu for a run row whose status is `RUNNING`
- **THEN** a "Stop" action is visible in that row's menu

#### Scenario: Row is in a terminal state
- **WHEN** a user opens the context menu for a run row whose status is `COMPLETED`, `FAILED`, or
  `CANCELLED`
- **THEN** no "Stop" action is visible in that row's menu

#### Scenario: Row is cancelling
- **WHEN** a user opens the context menu for a run row whose status is `CANCELLING`
- **THEN** no "Stop" action is visible in that row's menu

#### Scenario: Cancellation does not take effect
- **WHEN** a run row moves from `CANCELLING` back to `RUNNING`
- **THEN** the "Stop" action is available in that row's menu again

### Requirement: Cancellation request and status update
Once a user confirms, the system SHALL send a cancellation request for that run to the backend, and SHALL
update the acting surface's displayed status to `CANCELLING` once the request succeeds. The system SHALL
NOT display a run as `CANCELLED` before the backend reports that status, because an accepted cancellation
request does not guarantee the run stops.

#### Scenario: Successful cancellation from the detail page
- **WHEN** a user confirms cancelling a `RUNNING` run from its detail page
- **THEN** a cancellation request for that run is sent to the backend
- **THEN** on success, the detail page displays the run as `CANCELLING` and the "Stop" action is no longer
  shown
- **THEN** a success notification confirming the request was accepted is shown

#### Scenario: Successful cancellation from the list
- **WHEN** a user confirms cancelling a `RUNNING` row from the Runs list's row menu
- **THEN** a cancellation request for that run is sent to the backend
- **THEN** on success, that row displays the run as `CANCELLING` and the "Stop" action is no longer shown
  for it
- **THEN** a success notification confirming the request was accepted is shown

#### Scenario: Cancellation request fails
- **WHEN** the backend rejects or fails a cancellation request (for example, the run has already reached
  a terminal state by the time the request arrives)
- **THEN** an error notification is shown
- **THEN** the run's displayed status is not changed to `CANCELLING` or `CANCELLED` on the acting surface

## ADDED Requirements

### Requirement: Status polling while a run is cancelling
While any run displayed on the current surface has status `CANCELLING`, the system SHALL re-check that
run's status every 5 seconds and update its displayed status, and SHALL stop re-checking that run once its
status is no longer `CANCELLING`. Polling SHALL be driven by the `CANCELLING` status itself rather than by
the user's cancellation action, so that a run already in `CANCELLING` when a surface loads — for example
one cancelled by another user, or by this user before a reload — is polled identically to one just
cancelled here. When no displayed run is `CANCELLING`, the system SHALL NOT issue status requests.

#### Scenario: Run settles after a confirmed cancellation
- **WHEN** a user has cancelled a run and its status is displayed as `CANCELLING`
- **THEN** the displayed status updates to `CANCELLED` once the backend reports it, without the user
  reloading or navigating

#### Scenario: Run is already cancelling when the surface loads
- **WHEN** a user opens a surface showing a run whose status is already `CANCELLING`
- **THEN** that run's status is polled
- **THEN** the displayed status updates once the backend reports a different status

#### Scenario: Run reaches a terminal state other than cancelled
- **WHEN** a run displayed as `CANCELLING` is reported by the backend as `COMPLETED` or `FAILED`
- **THEN** the displayed status updates to that status
- **THEN** that run is no longer polled

#### Scenario: No run is cancelling
- **WHEN** no run displayed on the surface has status `CANCELLING`
- **THEN** no run status requests are issued

#### Scenario: User leaves the surface
- **WHEN** a user navigates away from a surface that was polling a `CANCELLING` run
- **THEN** polling stops

### Requirement: Notification when a cancellation does not take effect
When a run's status returns from `CANCELLING` to `RUNNING`, the system SHALL show an error notification
telling the user the run was not stopped. Without it the user has been told only that the cancellation
request was accepted, which in this case misreports the outcome. A cancellation that does settle SHALL NOT
produce a second notification, since the request-accepted notification and the displayed status already
convey it.

#### Scenario: Cancellation is not applied and the run resumes
- **WHEN** a run displayed as `CANCELLING` is reported by the backend as `RUNNING` again
- **THEN** an error notification stating the run was not stopped is shown
- **THEN** the displayed status is `RUNNING`
- **THEN** the "Stop" action is available for that run again

#### Scenario: Cancellation settles as cancelled
- **WHEN** a run displayed as `CANCELLING` is reported by the backend as `CANCELLED`
- **THEN** the displayed status is `CANCELLED`
- **THEN** no additional notification beyond the earlier request-accepted notification is shown
