## 1. Fix Error Handler

- [x] 1.1 In `apps/ai-dial-admin/src/components/Images/View/InstallationLog/InstallationLog.tsx`, update `handleError` to early-return when `(event as MessageEvent).data == null` — call `eventSource.close()` and return without showing a notification.
- [x] 1.2 Preserve the existing JSON parse branch for backend-sent explicit errors: when `event.data` is present, try `JSON.parse(messageEvent.data)`, on success show notification with `message` body, on parse failure show notification with `DeploymentsI18nKey.LogsError` body.
- [x] 1.3 Ensure `eventSource.close()` still runs in both notification paths (after the toast is shown), matching today's behavior.

## 2. Tests

- [x] 2.1 In `apps/ai-dial-admin/src/components/Images/View/InstallationLog/tests/InstallationLog.spec.tsx`, keep the existing test `error event closes the stream and shows a notification` (JSON `{message: 'boom'}` payload → notification shown) — assertions unchanged.
- [x] 2.2 Keep the existing test `error event with non-JSON payload still closes the stream and shows a notification` (string `'not-json'` payload → generic notification shown) — assertions unchanged.
- [x] 2.3 Add new test `error event with no data closes the stream silently (no notification)` — dispatch `error` via the mock with `data === undefined`, assert `source.close` was called once and `showNotificationSpy` was never called.
- [x] 2.4 Reuse the existing `MockEventSource`, `showNotificationSpy`, `stableT`, and `LogViewer` mocks already in the spec — do not introduce new mocks.

## 3. Quality Checks

- [x] 3.1 Run `npm run lint` and fix any issues.
- [x] 3.2 Run `npm run format` and fix any issues.
- [x] 3.3 Run `npm run test` to ensure no regressions.
