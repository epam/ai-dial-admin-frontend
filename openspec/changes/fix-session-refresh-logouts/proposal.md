## Why

Since Keycloak's access-token lifespan was reduced from 24 hours to 30 minutes, users are signed out
after 20–30 minutes of work, most visibly when they work in several tabs. The earlier change
`restore-oidc-refresh-clients` removed the `No client for appropriate provider set` failures, but the
logouts continue, and nothing is logged for them. With a 24-hour token a refresh almost never happened
during a working session, so the defects below stayed hidden. At 30 minutes every session depends on
refresh working.

The problems this change solves:

1. **Server renders sign users out on a stale cookie, while the refresh result is thrown away (main
   cause, silent).** Both root layouts (`app/layout.tsx`, `app/[lang]/layout.tsx`) call
   `getIsInvalidSession`. It treats the session as invalid when `accessTokenExpires` on the token
   decoded from the cookie (`getToken`) is in the past, and redirects to `/api/auth/signin`.
   `getServerSession` in the same check does refresh the token through the `jwt` callback. But
   next-auth v4 on the App Router passes a no-op `setCookie`, so the refreshed token is never saved and
   never looked at. A page load, reload, new tab, hard navigation or `router.refresh()` (called in about
   70 places, e.g. after a save) therefore redirects the user to the sign-in page as soon as the
   cookie's access token is older than its lifespan, even though the refresh token is valid.
2. **Server-side token reads never refresh.** `getUserToken` / `getFullToken`, used by every page,
   layout and server action, return the access token from the cookie as-is. After expiry the backend
   receives an expired bearer token. The request then either fails (e.g. `getUserInfo` in the root
   layout shows the 403 page) or depends on `useProtectedRequest` retrying after a 401.
3. **Nothing refreshes the cookie ahead of time.** `SessionProvider` has no `refetchInterval`, so the
   browser refreshes the session cookie only when a tab gains focus or after a 401. An open tab can
   reach expiry without ever renewing the cookie, which makes problem 1 likely rather than
   occasional.
4. **The per-user refresh lock only works for the first refresh, and a failure leaves it stuck.** In
   `refreshAccessToken`, the lock entry saved after a successful refresh has `isRefreshing: false` and
   is written back unchanged at the next expiry. From the second refresh on, parallel requests (several
   tabs, parallel server actions) all call the IdP. The `catch` block also never releases the entry,
   so after one failed refresh every later refresh for that user on that process waits 5 s and fails
   (`Waiting more than 5 seconds for refreshing token`). Not observed in production yet, but fixing
   problem 2 makes parallel server-side refreshes routine, so the lock has to be correct.
5. **A refresh error outlives a successful refresh.** The refreshed token is built as
   `{ ...token, … }`, which copies an earlier `error: 'RefreshAccessTokenError'` forward, so one
   transient failure keeps the session invalid.
6. **One user's sign-out wipes everyone's refresh state.** The NextAuth `signOut` event calls
   `NextClient.clearAllRefreshTokens()`, clearing the in-process refresh state of every user on that
   process, not only the user who signed out.

## What Changes

- Server-side token reads refresh an expired access token before returning it (single-flight per
  refresh token, with the result reused until it expires). Pages, layouts, route handlers and server
  actions receive a valid access token even when the cookie holds an expired one.
- Session validity in the layouts is decided by the refresh outcome (`error` on the token or
  session), not by the expiry time stored in the cookie. A refreshable session no longer triggers a
  sign-in redirect; a failed refresh still does.
- The client `SessionProvider` refetches the session on a fixed interval shorter than the access-token
  lifespan, so the session cookie is renewed while any tab is open. Refetching when a tab gains focus
  stays as it is.
- The flag-and-poll refresh lock is replaced by a single-flight promise keyed by the refresh token. It
  is always released, failures are not cached, and callers that present a refresh token that was
  already exchanged reuse that result instead of calling the IdP again.
- A successful refresh clears any earlier `error` on the token.
- Signing out clears only the signing-out user's refresh state.
- An access token is treated as expired a short safety margin before its actual expiry, so it does not
  expire while a backend request is in flight.

## Non-goals

- Coordinating refreshes across replicas (shared store / distributed lock). Keycloak refresh-token
  rotation (`revokeRefreshToken`) is off for this deployment, so parallel refreshes on different
  processes all succeed.
- Writing refreshed tokens back to the cookie from server renders or server actions. The browser-side
  refetch and `/api/auth/session` remain the only paths that persist the cookie.
- Changing IdP configuration, token lifespans, scopes, sign-in pages, or the behavior when the IdP
  session itself has ended (`ssoSessionIdleTimeout` / `ssoSessionMaxLifespan`): an expired or revoked
  refresh token still leads to sign-in.
- OIDC client reconstruction, which `oidc-refresh-client-recovery` already covers.

## Capabilities

### New Capabilities
- `session-token-refresh`: how an authenticated session keeps a valid access token across its
  lifetime — server-side refresh on expiry, validity decided by the refresh outcome, client-side
  cookie renewal, concurrent-refresh coordination within a process, and refresh-state cleanup on
  sign-out.

### Modified Capabilities
_None._ `oidc-refresh-client-recovery` covers obtaining the OIDC client and is unchanged.

## Impact

- `apps/ai-dial-admin/src/utils/auth/`: `auth-callbacks.ts` (`refreshAccessToken`, `jwt` callback),
  `nextauth-client.ts` (refresh coordination), `token.ts` / `auth-request.ts` (server-side token
  read), `is-valid-session.ts` (layout validity check), `auth-options.ts` (`signOut` event).
- `apps/ai-dial-admin/src/context/NextAuthProvider.tsx` (`SessionProvider` refetch interval).
- Every server action, page and layout that calls `getUserToken`, and `app/api/files/preview/route.ts`
  (`getFullToken`), now receives a refreshed token on expiry. No call-site changes are needed.
- IdP load: at most one refresh per refresh token per process while its result is valid, plus one
  `/api/auth/session` call per open tab per refetch interval.
- No new dependencies and no environment-variable changes.
