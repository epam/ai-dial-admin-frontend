## Capability: Request Cancellation on Logout

### Summary

Automatically cancels all in-flight API requests when the user logs out, preventing them from completing with stale authentication tokens.

### User-Facing Behavior

**When user clicks logout:**

1. All pending API requests are immediately cancelled
2. No API responses are processed after logout is triggered
3. User is redirected to login page (`/`) without delay
4. No error notifications are shown for cancelled requests

**Example scenario:**

```
User on /models page → clicks "Export All" (long-running request)
→ immediately clicks "Log Out" (before export completes)
→ Export request is cancelled
→ User redirected to login page
→ No export data is downloaded or processed
```

### Technical Behavior

**Request lifecycle with tracking:**

```
1. API method called (e.g., modelsApi.getModelsList(token))
   ↓
2. BaseApi.sendRequest registers AbortController
   ↓
3. fetch() called with signal: controller.signal
   ↓
4. Request completes OR user logs out
   ↓
5a. On completion: unregister controller, return response
5b. On logout: cancelAll() aborts signal, fetch throws AbortError
   ↓
6. AbortError caught and handled gracefully (no logs, no retry)
```

**Cancellation trigger points:**

1. **Primary**: `use-logout.ts` hook calls `requestRegistry.cancelAll()` before `signOut()`
2. **Defensive**: `auth-options.ts` signOut event also calls `cancelAll()`

### Acceptance Criteria

- [ ] All fetch requests made via BaseApi are tracked with AbortControllers
- [ ] Logging out cancels all tracked requests synchronously
- [ ] Cancelled requests do not trigger error notifications or retries
- [ ] Request registry cleans up completed requests (no memory leak)
- [ ] SSE/streaming endpoints are cleanly closed on logout
- [ ] Unit tests verify RequestRegistry register/unregister/cancelAll behavior
- [ ] Integration test verifies in-flight request is cancelled on logout

### Edge Cases

**Multiple simultaneous logouts:**
If `signOut()` is called multiple times rapidly, `cancelAll()` is idempotent (safe to call multiple times).

**Request completes during cancellation:**
If a request completes milliseconds before cancellation reaches it, the controller is already unregistered. No error thrown.

**AbortController not supported:**
Modern browsers support AbortController (Chrome 66+, Firefox 57+, Safari 12.1+). No fallback needed (admin tool targets modern browsers).

### Dependencies

- Requires `BaseApi` to wrap all fetch calls
- Requires `use-logout.ts` to trigger cancellation before signOut
- Requires `auth-options.ts` signOut event as fallback trigger

### Testing Strategy

**Unit tests** (`request-registry.spec.ts`):
- Register creates controller and returns it
- Unregister removes controller from map
- CancelAll aborts all controllers and clears map
- CancelAll is idempotent (safe to call twice)

**Integration test** (`use-logout.spec.ts`):
- Mock fetch to return delayed promise
- Trigger logout while request in flight
- Verify fetch was aborted (AbortError thrown)
- Verify no response handler was called
