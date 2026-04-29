## 1. Code change

- [x] 1.1 In `apps/ai-dial-admin/src/components/Images/View/InstallationLog/InstallationLog.tsx`, remove the `handleStatus` declaration inside the `useEffect`.
- [x] 1.2 In the same file, remove the `eventSource.addEventListener('status', handleStatus)` registration.
- [x] 1.3 In the same file's cleanup function, remove the matching `eventSource.removeEventListener('status', handleStatus)` call.
- [x] 1.4 Verify the cleanup still calls `eventSource.close()` and removes the remaining `'logs'` and `'error'` listeners.

## 2. Tests

- [x] 2.1 Add or update a Vitest component test for `InstallationLog` colocated under `apps/ai-dial-admin/src/components/Images/View/InstallationLog/tests/` covering: a `'status'` event arriving on the mocked EventSource MUST NOT close the stream and subsequent `'logs'` events MUST still be appended to the rendered log buffer.
- [x] 2.2 Add a test that an `'error'` event closes the EventSource and triggers an error notification via the existing notification mock from `test-setup.tsx`.
- [x] 2.3 Add a test that unmounting the component closes the EventSource and removes its listeners.
- [x] 2.4 Reuse existing mocks from `apps/ai-dial-admin/test-setup.tsx` (i18n, NotificationContext) and stub `EventSource` locally; do not introduce new global mocks.

## 3. Quality gates

- [x] 3.1 Run `npm run lint` from the repo root and fix any new findings.
- [x] 3.2 Run `npm run format` and apply with `npm run format:write` if needed.
- [x] 3.3 Run `npm run test` and confirm the new and existing tests pass.
