## Context

PR #2747 fixed the core logout flow by adding three layers of cleanup:
1. JWT token cleanup in the `jwt` callback (returns `{}` on signOut trigger)
2. Explicit redirect configuration (`pages: { signOut: '/' }`)
3. Refresh token cache cleanup (`NextClient.clearAllRefreshTokens()`)

However, this does not address requests that have already called `getUserToken()` and are executing a `fetch()` call. These requests carry tokens that were valid when issued, and they will complete normally even after the session is cleared.

The risk window is small (typically milliseconds to seconds) but can affect:
- Long-running requests (exports, large data fetches)
- Batch operations (multiple requests in parallel)
- SSE/streaming endpoints (container logs, test run status)

The established patterns in the codebase:
- All API requests flow through `BaseApi` class methods (`sendRequest`, `sendActionRequest`)
- Server actions call `getUserToken()` at the start and pass tokens to API methods
- No global request tracking currently exists

## Goals / Non-Goals

**Goals:**
- Cancel all in-flight fetch requests when logout is triggered
- Ensure cancellation happens synchronously before JWT cleanup
- Track requests at the lowest possible level (`BaseApi`) to catch all API calls
- Handle both regular requests and SSE/stream endpoints
- Add minimal overhead to request flow (no blocking operations)

**Non-Goals:**
- Cancelling requests that have already completed (they're done, no issue)
- Backend changes (token validation already handles expired tokens)
- Client-side cache invalidation (React Query/SWR not in use, no persistent cache)
- Retry logic changes (existing retry behavior in `useProtectedRequest` is fine)

## Decisions

### Decision 1: Centralized RequestRegistry singleton

Create a `RequestRegistry` class that maintains a `Map<string, AbortController>` of active requests. Each request gets a unique ID and registers its AbortController on start, removes it on completion.

**Alternative considered**: Track controllers in React Context
**Rejected because**: Server-side requests (server actions) don't have access to React Context. A singleton ensures both client and server requests are tracked.

**Chosen**: A lightweight singleton class that can be imported anywhere:

```typescript
class RequestRegistry {
  private controllers = new Map<string, AbortController>();

  register(id: string): AbortController {
    const controller = new AbortController();
    this.controllers.set(id, controller);
    return controller;
  }

  unregister(id: string): void {
    this.controllers.delete(id);
  }

  cancelAll(): void {
    this.controllers.forEach(c => c.abort());
    this.controllers.clear();
  }
}

export const requestRegistry = new RequestRegistry();
```

### Decision 2: Register in BaseApi.sendRequest

Update `sendRequest` (used by GET/POST/PUT/DELETE) to:
1. Generate a unique request ID (`crypto.randomUUID()`)
2. Register an AbortController
3. Pass `signal: controller.signal` to fetch
4. Unregister on completion (success or error)

This catches all API requests at the lowest level without changing every call site.

### Decision 3: Call cancelAll before NextAuth signOut

Update `use-logout.ts` to call `requestRegistry.cancelAll()` synchronously before `signOut()`:

```typescript
export const useLogout = () => {
  const { data: session } = useSession();
  const handleLogout = useCallback(() => {
    if (session) {
      requestRegistry.cancelAll(); // ← Cancel requests first
      signOut({ redirect: true, callbackUrl: '/' });
    } else {
      signIn('azure-ad', { redirect: true });
    }
  }, [session]);

  return { session, handleLogout };
};
```

This ensures requests are cancelled before JWT cleanup and redirect.

### Decision 4: Also cancel in auth-options signOut event

Add cancellation to the `signOut` event handler in `auth-options.ts` as a defensive layer:

```typescript
events: {
  signOut: async () => {
    requestRegistry.cancelAll(); // ← Belt and suspenders
    NextClient.clearAllRefreshTokens();
  },
}
```

This catches cases where `signOut()` is called directly (bypassing the hook).

### Decision 5: Handle AbortError gracefully

Fetch throws `AbortError` when cancelled. The existing error handling in `BaseApi.handleResponse` should treat `AbortError` as a non-error (not logged, not retried):

```typescript
catch (error) {
  if (error.name === 'AbortError') {
    // Request cancelled, this is expected during logout
    return null; // or appropriate empty response
  }
  // ... existing error handling
}
```

## Risks / Trade-offs

- **Aborted requests log errors in console**: Browser logs "AbortError" when fetch is cancelled. This is expected behavior and not harmful, but may confuse developers. We can add a comment in the error handler explaining this is intentional.

- **Race between cancellation and completion**: If a request completes milliseconds before cancellation, it won't be cancelled. This is fine — the goal is to cancel *in-flight* requests, not completed ones.

- **SSE/Streaming endpoints**: AbortController works with SSE streams, but server-side cleanup depends on backend implementation. The frontend will cleanly close the connection, but backend may continue processing briefly. This is acceptable.

- **Request ID generation overhead**: `crypto.randomUUID()` is fast (microseconds) but adds a small overhead to every request. This is negligible compared to network latency.

- **Memory leak if unregister fails**: If a request throws and doesn't reach the unregister call, the controller stays in the Map. Mitigation: wrap unregister in `finally` block to ensure it always runs.
