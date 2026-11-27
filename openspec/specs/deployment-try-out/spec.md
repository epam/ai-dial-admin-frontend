# deployment-try-out Specification

## Purpose

Lets an admin send a real test request to a model or application from its details page, over chat completions, Responses, Messages or embeddings, and read the reply, without leaving the admin panel. Access is decided by Core for the signed-in admin; the panel adds no permissions of its own.

## Requirements

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
When the panel opens it SHALL read, with the admin's own token, the interfaces Core reports for the deployment, and SHALL offer those among chat completions, Responses, Messages and embeddings that Core reports as served, selecting the first. An embeddings model SHALL be offered embeddings only, a chat model never embeddings. An interface Core did not report SHALL NOT be offered, even when the read fails. While reading, the panel SHALL show a loader.

#### Scenario: Subset of interfaces
- **WHEN** Core reports a deployment serving only chat completions and Messages
- **THEN** the interface selector offers exactly those two

#### Scenario: Embeddings model
- **WHEN** Core reports a deployment as an embeddings model
- **THEN** the interface selector offers only embeddings

#### Scenario: Chat model never offered embeddings
- **WHEN** Core reports a deployment as a chat model
- **THEN** embeddings is not among the offered interfaces

#### Scenario: Loader while interfaces are read
- **WHEN** the panel opens and the deployment's interfaces have not been read yet
- **THEN** it shows a loader, with neither the form nor a message, and Send is disabled
- **AND** once they are read it shows the form, or the reason when none can be called

#### Scenario: No supported interface
- **WHEN** Core reports none of the four interfaces for a deployment
- **THEN** the panel shows the reason from "The panel explains why Try out cannot be used" and no Send control

#### Scenario: No "could not be read" note
- **WHEN** an admin opens the panel for any model or application
- **THEN** no note about interfaces that could not be read is shown

### Requirement: Simple mode sends a message
In Simple mode, the default, the admin SHALL choose an interface, type a message and send it, and the panel SHALL show the reply. The request SHALL name the deployment, and for chat completions, Responses and Messages SHALL request a streamed reply. For embeddings the message SHALL be sent as the input to embed and the reply SHALL be shown as returned, without streaming. Sending SHALL be disabled while the message is empty or a request is in progress.

#### Scenario: Successful reply
- **WHEN** an admin types a message and sends it
- **THEN** the reply is shown in the Response section

#### Scenario: Embeddings reply
- **WHEN** an admin sends a message with the embeddings interface
- **THEN** the embeddings response is shown in the Response section and no events section is shown

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
Every Try out request SHALL be made to Core with the signed-in admin's own token and no other credential. Any authorization header supplied in Advanced mode SHALL be ignored. Try out SHALL be able to reach only the Core interfaces listed above (chat completions, Responses, Messages and embeddings) and no other address.

#### Scenario: Supplied authorization ignored
- **WHEN** an admin adds an `Authorization` header in Advanced mode and sends
- **THEN** Core receives the admin's own token, not the supplied value

#### Scenario: Unsupported target refused
- **WHEN** a request names an interface other than the four supported
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

### Requirement: Entities are called by the id Core knows them by
The deployment named in a Try out request, in its path and in the request body, SHALL be the id Core resolves for that entity: the short name for a platform model and a platform application, and `applications/<bucket>/<path>` for an application stored in another bucket. A platform entity SHALL NOT be called by its `models/platform/` or `applications/platform/` resource id. The interface lookup SHALL use the same id.

#### Scenario: Platform model
- **WHEN** an admin tries out the platform model `gpt-5-copy`
- **THEN** the request names the deployment `gpt-5-copy`, and the interface lookup uses the same id

#### Scenario: Platform application
- **WHEN** an admin tries out a platform application named `my-app`
- **THEN** the request names the deployment `my-app`

#### Scenario: Application in another bucket
- **WHEN** an admin tries out an application stored in the public bucket
- **THEN** the request names the deployment by its `applications/<bucket>/<path>` id

### Requirement: The panel explains why Try out cannot be used
The "Try out" button SHALL be shown whether or not the deployment can be called. When the panel cannot offer an interface it SHALL say why, in place of the form, and SHALL NOT offer to send. The message SHALL distinguish a deployment that serves nothing Try out can call (MCP, custom UI, or no callable interface) from interfaces that could not be read (no access, not found, or Core failing or unreachable). The status Core answered with SHALL be shown where there is one.

#### Scenario: MCP-only application
- **WHEN** Core reports an application serving only MCP
- **THEN** the panel says the application serves only MCP and its tools are tried out on the Tools tab, and no Send control is shown

#### Scenario: UI-only application
- **WHEN** Core reports a deployment serving only a custom UI
- **THEN** the panel says it serves only a custom UI, and no Send control is shown

#### Scenario: No callable interface
- **WHEN** Core reports no interface at all
- **THEN** the panel says the deployment serves no interface Try out can call

#### Scenario: Lookup forbidden
- **WHEN** Core answers 403 to the interface lookup
- **THEN** the panel says the admin has no access to this deployment

#### Scenario: Lookup not found
- **WHEN** Core answers 404 to the interface lookup
- **THEN** the panel says the deployment was not found

#### Scenario: Lookup failed
- **WHEN** the interface lookup fails with a server error or cannot reach Core
- **THEN** the panel says Core could not be reached or failed, with a Retry control
- **AND** choosing Retry reads the interfaces again

#### Scenario: Button always shown
- **WHEN** Core refuses the lookup or reports no callable interface
- **THEN** the "Try out" button on the details page was still shown
