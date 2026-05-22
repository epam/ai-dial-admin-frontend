## Context

`InstallationLog.tsx` opens an `EventSource` to `/api/sse?entity=image&id=<buildId>`, which is proxied through `apps/ai-dial-admin/src/app/api/sse/route.ts` to the backend `GET /api/v1/images/builds/{id}/logs` SSE endpoint.

Current error handler (lines 29–38):

```ts
const handleError = (event: Event) => {
  const messageEvent = event as MessageEvent;
  try {
    const { message } = JSON.parse(messageEvent.data);
    showNotification(getErrorNotification(t(ErrorI18nKey.Error), message));
  } catch {
    showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(DeploymentsI18nKey.LogsError)));
  }
  eventSource.close();
};
```

The browser dispatches the `error` event in two distinct shapes:

| Origin | Event object | `event.data` |
|---|---|---|
| Backend explicit `event: error\ndata: {...}` | `MessageEvent` | data string |
| Stream closed by server / connection drop | plain `Event` | `undefined` |

The current handler treats both identically. For close-as-error, `JSON.parse(undefined)` throws → catch shows the generic "Error getting Logs" toast. That toast is the bug.

### Backend behavior — verified

`ai-dial-admin-deployment-manager-backend` — `ImageBuildLogsService.streamLogs(imageDefinitionId)`:

- Emits named events: `logs` (per log line), `status` (per status change), `heartbeat` (keepalive).
- Calls `emitter.complete()` once `buildStatus.isFinal()` returns true (BUILD_SUCCESSFUL, BUILD_FAILED, BUILD_STOPPED). Clean close, no event written.
- Calls `emitter.completeWithError(e)` on internal exception. Spring tears down the response with an error condition; no SSE event line is written to the stream.

Grep for `.name("error")` across the backend confirms the only explicit error emission lives in `SseEmitterFactory.createErrorEmitter` (`event: error`, JSON `{message}` payload). The only caller is `DeploymentLogsService` (container/pod logs). The image-build path can't reach it today.

So every `error` event the FE receives on the image-build endpoint is browser-native, with `data === undefined`. The "sometimes for Installed images" in the issue title is the timing race: the close fires while the user is still viewing the tab.

### Sibling pattern in the repo

`apps/ai-dial-admin/src/components/TestSuites/Runs/useRunStatusStream.ts:37-41` already handles this correctly:

```ts
eventSource.addEventListener('error', () => {
  if (eventSource.readyState === EventSource.CLOSED) {
    eventSource.close();
  }
});
```

No notification. Just closes. This is the reference pattern.

## Goals / Non-Goals

**Goals:**

- Stop the false-positive toast for finished image builds (issue #3331's main complaint).
- Stay forward-compatible: keep the explicit-error path so the same handler shape works for future backend changes and for the container-log viewer (whose backend already emits explicit error events).

**Non-Goals:**

- Refactor SSE consumption to switch between static `getImageLogs` fetch and stream based on `buildStatus`. Cleaner architecturally, but out of scope for a bug fix.
- Surface server-side `completeWithError(e)` failures as toasts. Backend writes no payload in that case, so the FE cannot distinguish it from a clean close. If this is wanted, the proper fix is backend-side (emit an explicit error event before completing).

## Decisions

### 1. Gate notification on `event.data` presence

```ts
const handleError = (event: Event) => {
  const messageEvent = event as MessageEvent;

  if (messageEvent.data == null) {
    eventSource.close();
    return;
  }

  try {
    const { message } = JSON.parse(messageEvent.data);
    showNotification(getErrorNotification(t(ErrorI18nKey.Error), message));
  } catch {
    showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(DeploymentsI18nKey.LogsError)));
  }
  eventSource.close();
};
```

**Why over alternatives:**

- *Drop the error handler entirely.* Works today (the image-build backend never emits `event: error`) but loses the explicit-error path. A future backend change — auth expiry mid-stream, definition deleted while streaming, etc. — would go unnoticed. The same handler shape will also serve the container-log viewer when it's built, since `DeploymentLogsService` already emits explicit JSON error events.
- *Check `eventSource.readyState === CLOSED`.* Works for the bug case but is a weaker signal. `readyState` transitions to `CLOSED` for both close-as-error AND after an explicit error event followed by close. The `event.data` check is more precise about *why* the handler fired.

### 2. Preserve `DeploymentsI18nKey.LogsError`

The non-JSON-payload defensive branch still uses it. Don't delete the translation — it's the safety net if the backend's explicit-error contract ever changes shape.

## Risks / Trade-offs

- **Silent on server-side blowup.** When backend hits `emitter.completeWithError(e)` (e.g., DB hiccup), no SSE event is written, so the FE closes silently. The user won't see a toast. Mitigation: the `StatusIndicator` on the image header surfaces the actual build state; the user can reopen the tab to restart the stream. If this is unacceptable, fix it backend-side — emit an explicit error event before completing — separate scope.
- **Forward-compat assumption.** We assume any future explicit error from the image-build endpoint will use the `SseEmitterFactory.createErrorEmitter` shape: JSON `{message: string}`. Non-JSON payloads fall back to the generic "Error getting Logs" toast — same as current behavior, no regression.
