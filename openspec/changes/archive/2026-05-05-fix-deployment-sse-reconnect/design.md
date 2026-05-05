## Context

Two long-lived deployment SSE streams (`/api/events?id=<container>` and `/api/sse?entity=container&id=...&podName=...`) proxy to `ai-dial-admin-deployment-manager-backend`, which uses Spring `SseEmitter` via `SseEmitterFactory`. The factory:
- Sends a named `heartbeat` event every 10 s (`app.sse.heartbeat.interval: 10000`) — keeps the TCP connection warm under proxies, ignored by the browser since no listener is attached.
- Surfaces pre-flight failures via `createErrorEmitter` as a server-sent named `error` event whose `data` is a JSON `{message}` string.
- Inherits `spring.mvc.async.request-timeout: 600000` (10 min) — every emitter is forcibly completed at 10 minutes regardless of activity.

The browser's `EventSource` has no notion of a graceful server close: any end of the response body — including Spring's deliberate 10-min rotation — fires a native `error` event with `readyState === CONNECTING`, after which the browser auto-reconnects (default `retry: 3000`). A truly fatal failure (network gone, non-200 reconnect) ends with `readyState === CLOSED`.

Current client handlers in `ContainerView.tsx:139-181` and `ExecutionLog/PodView.tsx:35-66` conflate both into a single failure path:

```ts
const handleError = (event: Event) => {
  const messageEvent = event as MessageEvent;
  try {
    const { message } = JSON.parse(messageEvent.data);
    showNotification(getErrorNotification(t(ErrorI18nKey.Error), message));
  } catch {
    showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(...)));
  }
  eventSource.close();   // kills native auto-reconnect
};
```

For the native error path, `event.data` is `undefined`, the `try` throws, the `catch` toasts a generic message, and `close()` prevents reconnect. Result: every 10 minutes the user sees a confusing toast and the stream goes silent until reload.

A correct reference pattern already exists in the codebase: `useRunStatusStream.ts:37-41` (test-suite runs status SSE) only acts on `readyState === EventSource.CLOSED` and emits no toast at all. This change generalises that approach for the two deployment streams while preserving the server-sent named-error path.

## Goals / Non-Goals

**Goals:**
- Make the 10-min connection rotation invisible to users by letting the browser's native auto-reconnect run.
- Distinguish three error states cleanly: server-sent named error (terminal, with message), native error mid-reconnect (transient, silent), native error after retries exhausted (terminal, generic toast).
- Preserve accumulated events / log lines across reconnects — only reset on first open per subscription.
- Keep the unmount/dependency-change cleanup path that closes the connection deterministically.
- Apply identical handling to container events SSE and container pod logs SSE.

**Non-Goals:**
- Backend changes. The deployment-manager already heartbeats and uses named errors correctly.
- Image-build logs (`InstallationLog.tsx`). Different terminal semantics; out of scope.
- Gap-free reconnect (resume from `Last-Event-ID` / `sinceTime`). BE doesn't tag events with `id:`; would require BE work.
- Refactoring SSE into a shared hook. The two call sites have small differences (event names, i18n keys, `firstOpen` reset target) — duplication is cheap, abstraction would obscure the readyState logic. Could be revisited later.

## Decisions

### Decision 1: Use `EventSource.readyState` to distinguish transient vs terminal native errors

A single `error` listener that branches on `eventSource.readyState`:
- `CONNECTING`: browser is reconnecting; do nothing.
- `CLOSED`: browser has given up; surface a generic toast.

**Why over alternatives:**
- *Manual reconnect with `eventSource.close()` + setTimeout new EventSource*: re-implements native behavior, has to track backoff state, and would duplicate what the browser already does correctly. Rejected.
- *Suppress all toasts*: matches `useRunStatusStream`, but loses the ability to surface real fatal failures. Rejected; we want a generic toast for `CLOSED`.
- *Counting consecutive errors before toasting*: more complex state, harder to test, no clear win over the readyState gate.

### Decision 2: Detect server-sent named `error` event by `typeof event.data === 'string'`, not by JSON.parse-and-catch

Server-sent named errors arrive on the same `error` listener as native errors. They are distinguished by having a populated `event.data` (a JSON string). Native errors have `event.data === undefined`.

**Why over alternatives:**
- *Try `JSON.parse(undefined)` and use `try/catch` for control flow* (current code): conflates "no data" with "data that fails to parse." Rejected; control flow via exceptions is also harder to read and to test.
- *Listen for a separate event name*: backend uses the `error` name (per `createErrorEmitter`), can't change without BE coordination.

The new structure: check `typeof event.data === 'string'` first; if true, attempt to parse + show + close (the legitimate terminal path); if false (or parse fails), fall through to the readyState gate.

### Decision 3: Buffer reset behavior diverges between events and pod logs based on backend re-streaming semantics

**Container events (`ContainerView.tsx`):** clear synchronously at the top of the `useEffect` (subscription change), do NOT subscribe to `open`.
- The backend's `WatchEventReader` uses fabric8 `source.watch(...)` with no resourceVersion / sinceTime, which delivers events from the watch start point forward only — no historical replay on reconnect.
- Therefore reconnects must preserve the accumulated buffer; otherwise events emitted before the rotation are lost permanently.
- The clear at effect start handles the only case that needs resetting: the user navigating from container A to container B, where stale events from A would otherwise leak into B's view.

**Container pod logs (`PodView.tsx`):** clear on every `open` event.
- The backend's `PodLogReader.readLogs()` invokes fabric8 `containerResource.watchLog()` without `tailLines` / `sinceSeconds` / `sinceTime` filters (the controller does not pass them and the FE does not either). This streams the **full pod log** from the container's log retention start, then tails forward. The behavior is the same on initial connect, every browser-driven auto-reconnect, and every subscription change.
- If we preserve the buffer across reconnects, every 10-minute rotation produces visible duplication of the entire log history.
- Clearing on each `open` ensures the incoming re-stream lands in an empty buffer; the user sees the same content they had before, not a doubled version of it.

**Why over alternatives considered:**
- *Closure-scoped `firstOpen` flag* (the previous draft of this design): correct for events, wrong for pod logs because it preserves the buffer across reconnects and the BE re-streams. Rejected after BE verification.
- *Always clear on `open` for both* (the original code's shape): correct for pod logs, wrong for events — would lose accumulated events on every rotation. Rejected.
- *Pass `sinceTime` / `Last-Event-ID` on reconnect to deduplicate*: would let pod logs preserve the buffer cleanly, but requires BE param wiring on the FE side and the controller already accepts these. Out of scope for #2656; tracked as a possible follow-up to gain gap-free events too.

### Decision 4: Don't extract a shared hook yet

The two streams are similar but not identical:
- Different event names: `event` vs `logs`.
- Different reset targets: `setEvents([])` (a sorted array) vs `setLogs('')` (a string).
- Different terminal-toast i18n keys: `EventsError` vs `LogsError`.
- One stream sets a tab `invalid` flag on warnings; the other doesn't.

A shared hook would need to take 4-5 parameters and a generic state shape. The duplication is ~30 lines across two files; the abstraction would be larger. Defer until a third caller appears.

### Decision 5: No backend changes in this proposal

The 10-min `spring.mvc.async.request-timeout` could be lifted (`new SseEmitter(Long.MAX_VALUE)` in `SseEmitterFactory.createEmitter`) to eliminate rotations entirely. This is a refinement, not a fix — the FE change handles the rotation invisibly anyway, and lifting the BE timeout doesn't help with real network errors that the FE still has to handle. Tracked as a possible follow-up; not blocking #2656.

## Risks / Trade-offs

- **Risk: a real fatal error during the brief CONNECTING window goes silent.** → Mitigation: the browser's auto-reconnect will progress to CLOSED if reconnects fail (e.g., 4xx response, DNS gone) — the CLOSED branch will then toast. Net effect: a few seconds of delay before a real-failure toast, never a missed one.
- **Risk: mute toast during transient blip masks a slow degradation pattern (frequent reconnects, never CLOSED).** → Mitigation: out of scope for #2656; could add reconnect-rate telemetry later if observability becomes a concern.
- **Risk: reconnects re-deliver no events on the events stream, but the small ~3 s gap can drop k8s events emitted during that window.** → Mitigation: documented Non-Goal; BE doesn't support resume today.
- **Risk: pod logs reconnect loop if the pod is gone.** → Mitigation: BE's `getContainerResourceForLogs` throws on dead pods, which routes through `createErrorEmitter` to a server-sent named `error` event. The new path 1 (typeof string) closes the connection on first reconnect attempt, so at most one toast appears within ~3 s of pod death. Verified against `DeploymentLogsService.streamLogs` in `ai-dial-admin-deployment-manager-backend`.
- **Trade-off: duplicated handler across two files.** Accepted (Decision 4). Worth ~30 lines to keep each call site readable.
