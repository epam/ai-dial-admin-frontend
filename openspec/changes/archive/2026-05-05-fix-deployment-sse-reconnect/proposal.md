## Why

Issue #2656: after ~10 minutes on a Deployment view, a toast "Error getting Events" appears and the Events stream silently dies until the user reloads the page. The same anti-pattern exists for the pod logs stream (Execution log tab).

The deployment-manager backend already does the right thing: it sends a `heartbeat` event every 10 s, surfaces real failures via a server-sent named `error` event, and rotates idle SSE connections every 10 minutes (`spring.mvc.async.request-timeout: 600000`). The browser treats that rotation as a normal end-of-stream and would auto-reconnect — but the client error handler unconditionally calls `eventSource.close()` and shows a toast on every native `error` event, conflating benign rotations with real failures and defeating native auto-reconnect.

## What Changes

- **Container events SSE** (`ContainerView.tsx`): split the error handler into two paths. Path 1 — server-sent named `error` event with a JSON message: surface the message, close. Path 2 — native EventSource `error`: only treat `readyState === CLOSED` as terminal (toast + close); ignore `readyState === CONNECTING` so the browser's auto-reconnect runs transparently.
- **Container pod logs SSE** (`ExecutionLog/PodView.tsx`): apply the same two-path handler, using the existing `LogsError` i18n key for the terminal-state toast.
- **Open behavior**: gate the `setEvents([])` / `setLogs('')` reset to the **first** open per subscription. Reconnects must not wipe the accumulated buffer.

## Capabilities

### New Capabilities
- `deployment-sse-stream-resilience`: error-handling and reconnect semantics for long-lived deployment SSE streams (container events, pod logs). Defines how the client distinguishes transient transport errors (browser-managed reconnect) from terminal failures (server-sent named errors, gave-up reconnect), and how the displayed buffer behaves across reconnects.

### Modified Capabilities
None.

## Non-goals

- **Backend changes.** The deployment-manager backend's heartbeat + 10-min rotation is correct. Lifting `spring.mvc.async.request-timeout` is a possible future polish; not in scope here.
- **Image build logs.** `InstallationLog.tsx` has different terminal semantics (build finishes, BE always completes the stream) and re-sends all logs on reconnect, so the readyState gate alone would create a reconnect loop with duplicated logs. Already covered by `image-installation-log-streaming` spec, which deliberately specifies "close on any transport error." Out of scope.
- **Gap-free reconnect resume.** A small (~3 s) gap between EOF and the next reconnect can drop k8s events emitted in that window. Acceptable for #2656; would require BE `Last-Event-ID` / `sinceTime` support.
- **`ExecutionLog.tsx` activeTab reset bug** (resets to first pod on every 60 s pods poll). Pre-existing UX issue, separate ticket.

## Impact

- **FE files changed**:
  - `apps/ai-dial-admin/src/components/Containers/View/ContainerView.tsx`
  - `apps/ai-dial-admin/src/components/Containers/View/ExecutionLog/PodView.tsx`
- **FE tests**: `apps/ai-dial-admin/src/components/Containers/View/ExecutionLog/tests/PodView.spec.tsx` already has a `MockEventSource`. Mirror that for `ContainerView` (no test exists today) and extend assertions to cover the CONNECTING-vs-CLOSED branch on both.
- **i18n**: no new keys; reuses `DeploymentsI18nKey.EventsError` and `DeploymentsI18nKey.LogsError`.
- **Backend**: none. Deployment-manager already emits heartbeats + named error events.
- **Risk**: behavioral change — toasts that previously appeared every ~10 min will stop appearing for benign rotations. Real terminal failures (auth expiry, deployment deletion, network gone) still toast. Reference pattern already exists in `useRunStatusStream.ts:37-41` (test-suite runs status SSE), which validates the readyState-gated approach.
