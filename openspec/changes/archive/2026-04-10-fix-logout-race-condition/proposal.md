## Why

When a user logs out, any API requests that are currently in flight can complete successfully with their cached tokens, even after the session has been cleared. This race condition has minimal security impact (backend validates tokens) but can cause:

1. **Wasted backend resources** — requests complete unnecessarily
2. **Inconsistent state** — responses might trigger state updates after logout
3. **Confusing UX** — users might see notifications or updates after clicking logout

The fix in PR #2747 addressed the core logout flow (JWT cleanup, refresh token cache, redirect), but did not handle in-flight requests. Adding request cancellation ensures clean, immediate logout.

## What Changes

- Create a `RequestRegistry` class to track active AbortControllers for in-flight requests
- Update `BaseApi.sendRequest` and `BaseApi.sendActionRequest` to register AbortControllers before making fetch calls
- Hook into the `signOut` event in `auth-options.ts` to cancel all tracked requests
- Update `use-logout.ts` hook to call the cancellation before triggering signOut
- Add unit tests for RequestRegistry
- Add integration tests for logout cancellation behavior

## Capabilities

### New Capabilities

- `request-cancellation-on-logout`: Automatically cancels all in-flight API requests when the user logs out, preventing them from completing with stale tokens.

### Modified Capabilities

<!-- Enhances existing logout flow without changing its external behavior -->

## Impact

- `utils/api/request-registry.ts` — new class to track and cancel requests
- `server/base-api.ts` — updated to register AbortControllers for all requests
- `utils/auth/auth-options.ts` — updated signOut event handler to cancel requests
- `hooks/use-logout.ts` — updated to cancel requests before signOut
- Test files for the above
