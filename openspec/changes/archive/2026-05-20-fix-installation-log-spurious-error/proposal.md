## Why

GitHub Issue [#3331](https://github.com/epam/ai-dial-admin-frontend/issues/3331): An "Error getting Logs" toast appears after an image installation fails, and sometimes for already-installed images. This is a false positive — the SSE stream simply closed normally when the build reached a terminal status, and the frontend's error handler misinterprets the browser-native close-as-error event as a real failure.

The bug lives in `apps/ai-dial-admin/src/components/Images/View/InstallationLog/InstallationLog.tsx`. The `error` handler treats every error event identically: try `JSON.parse(event.data)`, show a notification either way. But the browser dispatches the `error` event in two distinct shapes:

1. Backend explicitly emits `event: error\ndata: {...}` → `MessageEvent` with `event.data` populated.
2. Stream closed by server / connection dropped → plain `Event` with `event.data === undefined`.

Backend code review (`ai-dial-admin-deployment-manager-backend`) confirms `ImageBuildLogsService` only emits `logs`, `status`, and `heartbeat` events on the image-build SSE endpoint. It never writes a named `error` event — case 2 is the only path that ever fires for this endpoint today, and it always produces the spurious toast.

## What Changes

- Gate the notification on `event.data` presence in `InstallationLog.tsx`. When `event.data == null` (native browser close), close the EventSource silently. When `event.data` is present, preserve the existing JSON parse → backend message → notification path.
- Update the two existing tests in `InstallationLog.spec.tsx` that codified the buggy behavior.
- Add a new test covering the silent-close case.

## Non-goals

- No backend changes. The backend already behaves correctly — the FE just misreads its signal.
- No removal of the JSON parsing / notification path. It is preserved defensively for forward compatibility (future backend changes, future container-log viewer reusing the same handler shape).
- No refactor to switch between static `getImageLogs` fetch and SSE stream based on `buildStatus`. Cleaner, but out of scope for a bug fix.
- No change to the `DeploymentsI18nKey.LogsError` translation. It stays in place for the defensive non-JSON-payload branch.
- No changes to other SSE consumers (`useRunStatusStream` already handles close-as-error correctly).

## Capabilities

### Modified Capabilities

- **Image installation log viewer**: stop showing a spurious error toast when the SSE stream closes after the build reaches a terminal state.

## Impact

- **Components**: `apps/ai-dial-admin/src/components/Images/View/InstallationLog/InstallationLog.tsx` — single error-handler change.
- **Tests**: `apps/ai-dial-admin/src/components/Images/View/InstallationLog/tests/InstallationLog.spec.tsx` — two updated assertions, one new test.
- **No new files, no API changes, no schema changes, no translation changes.**
