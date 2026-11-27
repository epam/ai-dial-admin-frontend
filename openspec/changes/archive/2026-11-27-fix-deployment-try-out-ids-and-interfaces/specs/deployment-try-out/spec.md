## MODIFIED Requirements

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

### Requirement: Requests are made with the signed-in admin's own credentials
Every Try out request SHALL be made to Core with the signed-in admin's own token and no other credential. Any authorization header supplied in Advanced mode SHALL be ignored. Try out SHALL be able to reach only the Core interfaces listed above (chat completions, Responses, Messages and embeddings) and no other address.

#### Scenario: Supplied authorization ignored
- **WHEN** an admin adds an `Authorization` header in Advanced mode and sends
- **THEN** Core receives the admin's own token, not the supplied value

#### Scenario: Unsupported target refused
- **WHEN** a request names an interface other than the four supported
- **THEN** it is rejected without a request being made to Core

## ADDED Requirements

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
