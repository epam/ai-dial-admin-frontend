# Spec Delta

## Purpose

Lets an admin send a real test request to a model or application from its details page, over chat completions, Responses or Messages, and read the reply, without leaving the admin panel. Access is decided by Core for the signed-in admin; the panel adds no permissions of its own.

## ADDED Requirements

### Requirement: Try out button on deployment details pages
The details pages of platform models, platform applications and asset applications SHALL show a "Try out" button in the header actions, after Delete and after the Grafana traces dropdown where the page has one. The button SHALL always be shown in the places where those header actions are shown; it SHALL NOT depend on whether the admin may call the deployment.

#### Scenario: Button shown after Delete
- **WHEN** an admin opens a platform model details page with no unsaved changes
- **THEN** the header shows a "Try out" button after the Delete button

#### Scenario: Button shown after Grafana dropdown
- **WHEN** Grafana is configured and an admin opens an asset application
- **THEN** the "Try out" button appears after the "Traces in Grafana" button

#### Scenario: Config-file entities have no button
- **WHEN** an admin opens a config-file model or application details page
- **THEN** no "Try out" button is shown

#### Scenario: Header actions hidden
- **WHEN** the page has unsaved changes or its JSON editor is open
- **THEN** the "Try out" button is not shown, as the other header actions are not

### Requirement: Try out opens in the shared right sidebar
Choosing "Try out" SHALL open the Try out panel in the right sidebar used by the Toolset and Eval Try outs. Closing the panel SHALL close the sidebar and restore the main menu state it had before opening.

#### Scenario: Open and close
- **WHEN** an admin selects "Try out" and then closes the panel
- **THEN** the sidebar opens with the Try out panel and then closes, and the main menu is as it was before

### Requirement: Only the interfaces the deployment declares are offered
The panel SHALL list, as selectable interfaces, those among chat completions, Responses and Messages that the deployment declares as served. The first listed interface SHALL be selected initially. When the deployment declares none of the three, the panel SHALL say Try out is unavailable for it and SHALL NOT offer to send.

#### Scenario: Subset of interfaces
- **WHEN** a deployment declares only chat completions and Messages
- **THEN** the interface selector offers exactly those two

#### Scenario: Loader while interfaces are read
- **WHEN** the panel opens and the deployment's interfaces have not been read yet
- **THEN** it shows a loader, with neither the form nor the unavailable message, and Send is disabled
- **AND** once they are read it shows the form, or the unavailable message when none is served

#### Scenario: No supported interface
- **WHEN** a deployment declares none of the three interfaces
- **THEN** the panel shows an unavailable message and no Send control

### Requirement: Simple mode sends a message
In Simple mode, the default, the admin SHALL choose an interface, type a message and send it, and the panel SHALL show the reply. The request SHALL name the deployment and request a streamed reply. Sending SHALL be disabled while the message is empty or a request is in progress.

#### Scenario: Successful reply
- **WHEN** an admin types a message and sends it
- **THEN** the reply is shown in the Response section

#### Scenario: Empty message
- **WHEN** the message is empty
- **THEN** Send is disabled

### Requirement: Streamed replies are shown as they arrive
When the reply is an event stream, the panel SHALL show events as they arrive, and SHALL show the assembled response when the stream ends. The admin SHALL be able to stop an in-progress request, which SHALL end it without showing an error.

#### Scenario: Stream shown incrementally
- **WHEN** the deployment streams its reply
- **THEN** events appear in the events section before the stream has finished

#### Scenario: Stop
- **WHEN** an admin stops an in-progress request
- **THEN** the request ends and no error is shown

### Requirement: Advanced mode edits the full request
An admin SHALL be able to switch to Advanced mode to edit request headers, query parameters and the request body as raw JSON. Both modes SHALL share one request: what Simple mode built SHALL be shown in Advanced mode, and switching modes SHALL NOT discard edits. Changing the interface, changing the message or choosing Reset SHALL rebuild the request from Simple mode's message.

#### Scenario: Shared state
- **WHEN** an admin types a message in Simple mode and switches to Advanced mode
- **THEN** the body contains that message

#### Scenario: Edits survive switching
- **WHEN** an admin edits the body in Advanced mode, switches to Simple mode and back
- **THEN** the edited body is still shown

#### Scenario: Changing the message rebuilds the body
- **WHEN** an admin has edited the body in Advanced mode and then changes the message in Simple mode
- **THEN** the body is rebuilt from the new message

#### Scenario: Invalid JSON
- **WHEN** the Advanced body is not valid JSON
- **THEN** Send is disabled and the problem is indicated

### Requirement: Requests are made with the signed-in admin's own credentials
Every Try out request SHALL be made to Core with the signed-in admin's own token and no other credential. Any authorization header supplied in Advanced mode SHALL be ignored. Try out SHALL be able to reach only the Core interfaces listed above and no other address.

#### Scenario: Supplied authorization ignored
- **WHEN** an admin adds an `Authorization` header in Advanced mode and sends
- **THEN** Core receives the admin's own token, not the supplied value

#### Scenario: Unsupported target refused
- **WHEN** a request names an interface other than the three supported
- **THEN** it is rejected without a request being made to Core

### Requirement: Access problems are reported clearly
When Core answers 403 or 404, the panel SHALL say the admin has no access to this deployment (or that it does not exist). Other failures SHALL be reported distinctly: Core's error message for other 4xx, a generic failure for 5xx and for network errors. Core's response body SHALL remain visible in each case.

#### Scenario: Forbidden
- **WHEN** Core answers 403
- **THEN** the panel shows a no-access message

#### Scenario: Not found
- **WHEN** Core answers 404
- **THEN** the panel shows a message saying the deployment is not accessible or does not exist

#### Scenario: Server error
- **WHEN** Core answers 500
- **THEN** the panel shows a generic failure message, not a no-access message

#### Scenario: Network error
- **WHEN** the request cannot reach Core
- **THEN** the panel shows a generic failure message

### Requirement: Try out panel is accessible
The panel's controls SHALL be reachable by role and accessible name. The mode and interface controls SHALL expose their selected state programmatically, and request status (sending, finished, failed) SHALL be announced through a live region.

#### Scenario: Status announced
- **WHEN** a request finishes or fails
- **THEN** a polite live region announces the outcome

### Requirement: Shared Try out building blocks
Components, utilities and constants usable by more than one Try out SHALL live in a shared Try out location, and the Eval, Toolset and Deployment Try outs SHALL use them. Moving them SHALL NOT change what the Eval and Toolset Try outs do.

#### Scenario: Existing Try outs unchanged
- **WHEN** an admin uses the Eval or Toolset Try out after the move
- **THEN** it looks and behaves as before
