## 1. Container events SSE handler

- [x] 1.1 In `apps/ai-dial-admin/src/components/Containers/View/ContainerView.tsx`, refactor the events `useEffect` (currently lines 139-181):
  - Add a `let firstOpen = true;` inside the effect.
  - In `handleOpen`, gate `setEvents([])` behind `if (firstOpen) { ...; firstOpen = false; }`.
  - In `handleError`, branch on `typeof messageEvent.data === 'string'`. If true and the JSON parses with a `message` field: show notification with that message, call `eventSource.close()`, return. Otherwise fall through.
  - For the fall-through (native error), only show the generic `DeploymentsI18nKey.EventsError` notification when `eventSource.readyState === EventSource.CLOSED`. Do not call `eventSource.close()` on the native-error path.
  - Keep the existing tab `invalid` flag logic in `handleEvent`.
  - Keep the cleanup `return` (remove listeners + `eventSource.close()`) unchanged.

## 2. Container pod logs SSE handler

- [x] 2.1 In `apps/ai-dial-admin/src/components/Containers/View/ExecutionLog/PodView.tsx`, refactor the logs `useEffect` (currently lines 35-66) using the same pattern:
  - Add `let firstOpen = true;` inside the effect; gate `setLogs('')` in `handleOpen` behind it.
  - Apply the two-path `handleError` (server-sent named error → toast + close; native error → readyState gate, generic toast only on `CLOSED`, do not close on `CONNECTING`).
  - Use `DeploymentsI18nKey.LogsError` for the generic terminal toast.
  - Keep cleanup (`removeEventListener` + `eventSource.close()`) unchanged. The trailing `setLogs('')` in cleanup may be removed since `firstOpen` will reset on next mount; verify no test depends on the cleanup-time clear before removing.

## 3. Tests

- [x] 3.1 Extend `apps/ai-dial-admin/src/components/Containers/View/ExecutionLog/tests/PodView.spec.tsx` (existing `MockEventSource` is already in place):
  - Add a test: native `error` with `readyState === EventSource.CONNECTING` does NOT call `showNotification` and does NOT call `eventSource.close()`.
  - Add a test: native `error` with `readyState === EventSource.CLOSED` DOES call `showNotification` with the `LogsError` key.
  - Add a test: server-sent named `error` with JSON `{message: '...'}` calls `showNotification` with the supplied message and closes the source.
  - Add a test: a second `open` event after the first does NOT clear the existing logs (buffer preservation across reconnects).
  - Reuse the existing `vi.stubGlobal('EventSource', MockEventSource)` setup. Do not introduce new mocks.
- [x] 3.2 Create `apps/ai-dial-admin/src/components/Containers/View/tests/ContainerView.spec.tsx` (or extend an existing ContainerView test if one exists) with the equivalent four tests against the events stream:
  - CONNECTING: silent, no close.
  - CLOSED: generic toast with `EventsError`.
  - Server-sent error: backend message + close.
  - Reconnect: events accumulated across two `open` events.
  - Pattern the `MockEventSource` after the one in `PodView.spec.tsx` (extract to a shared test helper only if it already exists; otherwise inline duplication is acceptable per design Decision 4).

## 4. Quality gates

- [x] 4.1 Run `npm run lint` from the repo root; fix any reported issues.
- [x] 4.2 Run `npm run format:write` from the repo root.
- [x] 4.3 Run `npm run test` from the repo root; ensure all suites pass.
