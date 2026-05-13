## ADDED Requirements

### Requirement: Container events SSE stream survives transient connection drops

The container Events tab on a deployment view SHALL maintain its event stream across transient SSE connection drops (including the deployment-manager backend's periodic 10-minute rotation), without showing an error notification or losing accumulated events. The client SHALL rely on the browser's native `EventSource` auto-reconnect for transient failures and SHALL only surface an error notification when the connection cannot be re-established (`readyState === EventSource.CLOSED`) or when the backend sends a server-sent named `error` event. Because the backend's k8s watch (`WatchEventReader`) does NOT replay historical events on reconnect, the client SHALL preserve previously accumulated events across reconnects.

#### Scenario: Backend rotates the connection at the 10-minute timeout

- **WHEN** the deployment-manager backend completes the SSE response after `spring.mvc.async.request-timeout` (10 minutes)
- **THEN** no error notification is shown
- **AND** the browser auto-reconnects to the same endpoint
- **AND** the previously displayed events remain in the list
- **AND** events delivered after reconnect are appended to the same list

#### Scenario: Subscription input changes (different container)

- **WHEN** the subscription's container name changes (e.g., the user navigates to a different container)
- **THEN** the previously displayed events are cleared synchronously before the new EventSource is opened
- **AND** events from the new subscription populate the now-empty list as they arrive

#### Scenario: Server-sent named error terminates the stream

- **WHEN** the backend emits a named `error` event with a JSON `{"message": "<text>"}` payload (via `createErrorEmitter`)
- **THEN** an error notification is shown using the message from the payload
- **AND** the EventSource is closed and not auto-reconnected

#### Scenario: Browser exhausts auto-reconnect attempts

- **WHEN** an `error` event fires on the EventSource and `readyState === EventSource.CLOSED`
- **AND** the event has no parseable JSON payload
- **THEN** a generic error notification is shown using `DeploymentsI18nKey.EventsError`

#### Scenario: Browser is mid-reconnect

- **WHEN** an `error` event fires on the EventSource and `readyState === EventSource.CONNECTING`
- **AND** the event has no parseable JSON payload
- **THEN** no notification is shown
- **AND** the EventSource is not closed by the client

#### Scenario: Cleanup on unmount or subscription change

- **WHEN** the component unmounts, or the subscription's container name changes
- **THEN** the client closes the EventSource and removes its listeners

### Requirement: Container pod logs SSE stream survives transient connection drops

The Execution log tab on a deployment view SHALL apply the same transient-vs-terminal error handling to the pod logs SSE stream. Because the deployment-manager backend's `PodLogReader` invokes fabric8's `containerResource.watchLog()` without `tailLines` / `sinceSeconds` / `sinceTime` filters, the backend re-streams the **entire** pod log buffer from the start on every (re)connect. The client SHALL therefore clear the displayed log buffer on every `open` event so that the incoming re-stream does not produce visible duplication. Terminal failures SHALL surface a notification using `DeploymentsI18nKey.LogsError` for native errors and the backend-supplied message for server-sent named errors.

#### Scenario: Backend rotates the connection while a pod is alive

- **WHEN** the backend completes the SSE response at the 10-minute timeout while the pod is still running
- **THEN** no error notification is shown
- **AND** the browser auto-reconnects
- **AND** the displayed log buffer is cleared on the next `open` event
- **AND** the backend re-streams the full pod log into the now-empty buffer
- **AND** subsequent log lines tailed after the re-stream are appended

#### Scenario: Pod terminates and the backend rejects the reconnect

- **WHEN** the pod is no longer present in Kubernetes when the browser auto-reconnects
- **AND** the backend returns a `createErrorEmitter` response with a JSON `{"message": "<text>"}` payload
- **THEN** an error notification is shown using the message from the payload
- **AND** the EventSource is closed and not auto-reconnected

#### Scenario: Browser exhausts auto-reconnect attempts

- **WHEN** an `error` event fires on the EventSource and `readyState === EventSource.CLOSED`
- **AND** the event has no parseable JSON payload
- **THEN** a generic error notification is shown using `DeploymentsI18nKey.LogsError`

#### Scenario: Browser is mid-reconnect

- **WHEN** an `error` event fires on the EventSource and `readyState === EventSource.CONNECTING`
- **AND** the event has no parseable JSON payload
- **THEN** no notification is shown
- **AND** the EventSource is not closed by the client

#### Scenario: Every open clears the buffer to prevent duplication on full re-stream

- **WHEN** the EventSource fires an `open` event (whether the first connection, a browser-driven auto-reconnect, or a subscription change)
- **THEN** the displayed log buffer is cleared
- **AND** the next batch of `logs` events from the backend's re-stream populates the empty buffer

### Requirement: Server-sent named errors are distinguished from native transport errors

For long-lived deployment SSE streams (container events and container pod logs), the client SHALL detect a server-sent named `error` event by inspecting `event.data` (a string payload) rather than relying on `try/catch` around `JSON.parse(undefined)`. When `event.data` is a non-string or fails to parse as JSON, the client SHALL treat the event as a native EventSource transport error and apply the `readyState` gate.

#### Scenario: Server-sent named error event is recognised

- **WHEN** an `error` event fires with `typeof event.data === 'string'` and the data parses as JSON containing a `message` field
- **THEN** the client treats it as a server-sent terminal error
- **AND** shows the supplied message in an error notification
- **AND** closes the EventSource

#### Scenario: Native EventSource error event with no payload

- **WHEN** an `error` event fires with `event.data === undefined` (or a non-string value)
- **THEN** the client does NOT attempt to parse a message from it
- **AND** applies the `readyState` gate to decide whether to notify or stay silent

#### Scenario: Server-sent error with malformed JSON payload

- **WHEN** an `error` event fires with `typeof event.data === 'string'` but the data does not parse as valid JSON
- **THEN** the client falls through to the `readyState` gate
- **AND** does not show a notification derived from the unparseable string
