## 1. Create RequestRegistry class

- [x] 1.1 Create `apps/ai-dial-admin/src/utils/api/request-registry.ts` with `RequestRegistry` class
  - `private controllers: Map<string, AbortController>`
  - `register(id: string): AbortController` — creates controller, adds to map, returns it
  - `unregister(id: string): void` — removes controller from map
  - `cancelAll(): void` — calls `abort()` on all controllers, clears map
- [x] 1.2 Export singleton instance: `export const requestRegistry = new RequestRegistry()`

## 2. Unit tests for RequestRegistry

- [x] 2.1 Create `apps/ai-dial-admin/src/utils/api/tests/request-registry.spec.ts` with tests:
  - `register` creates and returns a new AbortController
  - `register` adds controller to internal map
  - `unregister` removes controller from map
  - `cancelAll` aborts all controllers
  - `cancelAll` clears the map
  - `cancelAll` is idempotent (calling twice is safe)

## 3. Update BaseApi to track requests

- [x] 3.1 Import `requestRegistry` in `apps/ai-dial-admin/src/server/base-api.ts`
- [x] 3.2 Update `sendRequest` method to:
  - Generate unique ID with `crypto.randomUUID()`
  - Call `requestRegistry.register(id)` to get controller
  - Add `signal: controller.signal` to fetch options
  - Wrap fetch in try/finally, call `requestRegistry.unregister(id)` in finally block
- [x] 3.3 Handle `AbortError` in catch block:
  - Check `if (error.name === 'AbortError')` return null (don't log, don't retry)
  - Add comment: `// Request cancelled during logout, this is expected`

## 4. Update BaseApi.sendActionRequest

- [x] 4.1 Apply same pattern as step 3.2 to `sendActionRequest` method:
  - Generate ID, register controller, pass signal, unregister in finally
  - Handle AbortError gracefully

## 5. Update use-logout hook

- [x] 5.1 Import `requestRegistry` in `apps/ai-dial-admin/src/hooks/use-logout.ts`
- [x] 5.2 In `handleLogout`, add `requestRegistry.cancelAll()` call before `signOut({ redirect: true, callbackUrl: '/' })`

## 6. Update auth-options signOut event

- [x] 6.1 Import `requestRegistry` in `apps/ai-dial-admin/src/utils/auth/auth-options.ts`
- [x] 6.2 Update `signOut` event handler to call `requestRegistry.cancelAll()` before `NextClient.clearAllRefreshTokens()`

## 7. Integration tests for logout cancellation

- [x] 7.1 Update `apps/ai-dial-admin/src/hooks/tests/use-logout.spec.ts`:
  - Mock `requestRegistry.cancelAll`
  - Trigger logout
  - Verify `cancelAll` was called before `signOut`
- [x] 7.2 Add test in `apps/ai-dial-admin/src/server/tests/base-api.spec.ts`:
  - Start a request with mocked delayed fetch
  - Call `requestRegistry.cancelAll()`
  - Verify AbortError was thrown
  - Verify request was unregistered

## 8. Handle SSE/streaming endpoints

- [x] 8.1 Update `apps/ai-dial-admin/src/app/api/sse/route.ts`:
  - Import `requestRegistry`
  - Register AbortController before fetch
  - Pass signal to fetch options
  - Unregister in finally block
- [x] 8.2 Apply same pattern to `apps/ai-dial-admin/src/app/api/events/route.ts`
- [x] 8.3 Apply same pattern to `apps/ai-dial-admin/src/app/api/runs/status-stream/route.ts`

## 9. Quality checks

- [x] 9.1 Run `npm run lint` from repo root and fix any issues
- [x] 9.2 Run `npx vitest run src/utils/api/tests/request-registry.spec.ts` from `apps/ai-dial-admin/` and confirm all tests pass
- [x] 9.3 Run `npx vitest run src/hooks/tests/use-logout.spec.ts` from `apps/ai-dial-admin/` and confirm all tests pass
- [x] 9.4 Run full test suite `npm run test` and confirm no regressions
