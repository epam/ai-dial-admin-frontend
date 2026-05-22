## MODIFIED Requirements

### Requirement: Continuous SSE log streaming on the Installation log tab

The Installation log tab for an image build SHALL stream build logs from the backend SSE endpoint `/api/sse?entity=image&id={imageBuildId}` and SHALL NOT close the SSE connection from the client in response to backend `status` notifications. The backend MUST own stream termination; the client SHALL only close the connection on transport errors, on component unmount, or when the dependent inputs to the subscription effect change. The client SHALL differentiate browser-native `error` events (no payload, fired when the backend completes the stream or the transport drops) from explicit backend error events (payload present, emitted by the backend to signal a user-relevant failure). A notification SHALL be shown only for the latter.

#### Scenario: Logs continue streaming for the duration of a build

- **WHEN** a user opens the Installation log tab for an in-progress image build
- **THEN** every `logs` event delivered by the backend SSE stream is appended to the displayed log buffer
- **AND** the SSE connection remains open until the backend closes it, the user navigates away, or a transport `error` event occurs

#### Scenario: Backend status notifications do not interrupt the stream

- **WHEN** the backend emits a `status` event on the SSE stream while the build is still producing log output
- **THEN** the client does not close the EventSource
- **AND** subsequent `logs` events continue to be appended to the displayed log buffer

#### Scenario: Stream closes silently on backend completion or transport drop

- **WHEN** an `error` event is delivered on the SSE stream with no `data` payload (browser-native error fired after `emitter.complete()` or a transport drop)
- **THEN** the client closes the EventSource
- **AND** no notification is shown to the user

#### Scenario: Stream closes and notifies on explicit backend error with JSON payload

- **WHEN** an `error` event is delivered on the SSE stream with a `data` payload that parses as JSON `{ message: string }`
- **THEN** the client closes the EventSource
- **AND** an error notification is shown with the backend-provided `message` as the body text

#### Scenario: Stream closes and falls back to generic notification on non-JSON error payload

- **WHEN** an `error` event is delivered on the SSE stream with a non-null `data` payload that fails to parse as JSON
- **THEN** the client closes the EventSource
- **AND** an error notification is shown using the localized `DeploymentsI18nKey.LogsError` ("Error getting Logs") as the body text

#### Scenario: Stream closes on unmount

- **WHEN** the Installation log tab is unmounted (e.g., the user switches to another tab)
- **THEN** the client closes the EventSource and removes its event listeners
