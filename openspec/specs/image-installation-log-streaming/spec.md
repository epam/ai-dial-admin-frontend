# image-installation-log-streaming Specification

## Purpose
TBD - created by archiving change fix-installation-log-sse-cutoff. Update Purpose after archive.
## Requirements
### Requirement: Continuous SSE log streaming on the Installation log tab

The Installation log tab for an image build SHALL stream build logs from the backend SSE endpoint `/api/sse?entity=image&id={imageBuildId}` and SHALL NOT close the SSE connection from the client in response to backend `status` notifications. The backend MUST own stream termination; the client SHALL only close the connection on transport errors, on component unmount, or when the dependent inputs to the subscription effect change.

#### Scenario: Logs continue streaming for the duration of a build

- **WHEN** a user opens the Installation log tab for an in-progress image build
- **THEN** every `logs` event delivered by the backend SSE stream is appended to the displayed log buffer
- **AND** the SSE connection remains open until the backend closes it, the user navigates away, or a transport `error` event occurs

#### Scenario: Backend status notifications do not interrupt the stream

- **WHEN** the backend emits a `status` event on the SSE stream while the build is still producing log output
- **THEN** the client does not close the EventSource
- **AND** subsequent `logs` events continue to be appended to the displayed log buffer

#### Scenario: Stream closes on transport error

- **WHEN** an `error` event is delivered on the SSE stream
- **THEN** the client closes the EventSource
- **AND** an error notification is shown using the existing notification mechanism

#### Scenario: Stream closes on unmount

- **WHEN** the Installation log tab is unmounted (e.g., the user switches to another tab)
- **THEN** the client closes the EventSource and removes its event listeners
