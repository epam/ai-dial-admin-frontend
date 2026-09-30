## Context

See proposal.md, "Why", for the six problems. Current shape of the code under
`apps/ai-dial-admin/src/utils/auth/`:

- The session is a NextAuth v4 JWT held in an encrypted, `httpOnly` cookie. It carries `access_token`,
  `refreshToken`, `idToken`, `accessTokenExpires`, `providerId` and `userId`.
- The `jwt` callback (`auth-callbacks.ts`) refreshes through `refreshAccessToken` once
  `accessTokenExpires` has passed. `NextClient.getOrCreateClient` (`nextauth-client.ts`, from
  `restore-oidc-refresh-clients`) supplies the OIDC client.
- The refresh lock lives in the process-wide `NextClient._refreshTokenMap`, keyed by `userId`, as
  `{ isRefreshing, token }` plus 50 ms polling with a 5 s timeout.
- Server-side reads go through `getUserToken` (`auth-request.ts`) → `getFullToken` (`token.ts`) →
  `getToken`, which only decodes the cookie.
- `getIsInvalidSession` (`is-valid-session.ts`) combines `getServerSession` (refreshes, but on the App
  Router its `setCookie` is a no-op, so the result is dropped) with `accessTokenExpires` read from the
  cookie token.
- Only `/api/auth/session` (a route handler) can write the refreshed cookie. The browser calls it via
  `SessionProvider` (`context/NextAuthProvider.tsx`, no `refetchInterval`) on focus and via
  `useProtectedRequest` → `update()` after a 401.

Constraints: Keycloak refresh-token rotation is off, and the deployment runs several replicas without
shared storage.

## Goals / Non-Goals

**Goals:**

- One code path that answers "give me a usable token for this request", shared by the `jwt` callback
  and server-side reads.
- Refresh coordination that is correct for every refresh, always released, and scoped to one sign-in.

**Non-Goals:**

- Persisting refreshed tokens from server components or server actions into the cookie.
- Cross-replica coordination (see proposal Non-goals).

## Decisions

### D1. Refresh on expiry inside the server-side token read

`getFullToken` decodes the cookie as it does now. If the token is expired (D5) and the provider is
not `credentials`, it passes the token through the same coordinated `refreshAccessToken` the `jwt`
callback uses, then derives the bearer value (`access_token` or `idToken` per
`AUTH_IDTOKEN_PROVIDERS`) from the result. Doing this in `getFullToken` rather than `getUserToken`
also covers `app/api/files/preview/route.ts`, which calls `getFullToken` directly, and no server
action changes.

*Alternative:* write the refreshed JWT back with `cookies().set(...)` where allowed (server actions,
route handlers). Rejected for now: it isn't possible in server components (the layouts, which are
where the redirect happens), so it would add a second persistence path without removing the need for
D1. D3 persists the cookie from the browser instead.

*Alternative:* refresh in the middleware. Rejected: `withAuth` runs on the edge runtime, where
`openid-client` is unavailable, and refreshing there would still have to persist the cookie.

### D2. Session validity comes from the refresh outcome only

`getIsInvalidSession(isEnableAuth, token)` returns `true` when auth is enabled and the (fresh) token
is missing or carries `error`. It no longer calls `getServerSession` and no longer compares
`accessTokenExpires`. After D1 the token passed in has already been through refresh, so
`getServerSession` would only repeat the same refresh and drop its result. Its signature and both
layout call sites stay unchanged.

### D3. Proactive cookie renewal from the browser

`SessionProvider` gets `refetchInterval={SESSION_REFETCH_INTERVAL_SEC}` (new constant in
`constants/auth.ts`, 5 min), and `refetchOnWindowFocus` stays at its default (on). Each refetch hits
`/api/auth/session`. When the access token is within the margin (D5), the `jwt` callback refreshes it
and next-auth writes the new cookie, and all tabs share that cookie. 5 min stays well below the
current 30 min lifespan, and at the default 5 min Keycloak lifespan (300 s) the D5 margin still
triggers a refresh before expiry.

*Alternative:* derive the interval from `accessTokenExpires` on the client. Rejected: the session
object exposed to the browser deliberately omits token data, and a fixed interval is simpler with the
same effect.

### D4. Single-flight refresh keyed by sign-in, newest token wins

The flag-and-poll map is replaced by per-session state in `NextClient`:

```
sessionKey → { latest: NextAuthToken; inFlight?: Promise<NextAuthToken> }
```

- **Session key.** On sign-in (the `jwt` callback with `account`), the token gets a random
  `sessionKey` (`crypto.randomUUID()`). Tokens issued before this change have no `sessionKey` and use
  their `refreshToken` as the key, so they keep working until their next sign-in. Keying by sign-in
  rather than `userId` keeps two browsers of the same user apart (spec: "Separate sign-ins stay
  separate").
- **Pick the base.** Of the presented token and `latest`, the one with the later `accessTokenExpires`
  is the base. If the base is still valid (D5), return it with no IdP call. This covers a cookie that
  is older than a refresh this process already did.
- **Join or start.** If `inFlight` exists, await it. Otherwise start `client.refresh(base.refreshToken)`,
  store the promise, and remove it in `finally`, so it is released on success and on failure. The
  5 s polling loop and `Waiting more than 5 seconds…` go away.
- **Success** updates `latest` with the refreshed token, with `error` removed (D6).
  **Failure** returns the presented token with `error: 'RefreshAccessTokenError'` (same logging and
  redaction as now) and does not touch `latest`, so the next request tries again.
- **Eviction.** On each write, entries whose `latest.accessTokenExpires` is more than 24 h in the past
  are removed. This bounds memory for abandoned sessions. 24 h exceeds any configured Keycloak session
  limit, so a live session never loses its entry to eviction.

*Alternative:* key by `userId` (as today). Rejected: it mixes separate sign-ins of the same user, and
a new login could pick up an older session's tokens.
*Alternative:* key by the presented `refreshToken`. Rejected: after the first refresh, requests come
in with either the old or the new refresh token, so one session splits across several keys and loses
single-flight.
*Alternative:* a shared store (Redis). Out of scope (proposal Non-goals); `NextClient` stays the only
place that knows about this state, so a later swap is local.

### D5. One expiry predicate with a safety margin

`isAccessTokenExpired(token, now)` returns `true` when `accessTokenExpires` is missing or
`now >= accessTokenExpires - ACCESS_TOKEN_EXPIRY_MARGIN_MS` (60 s, in `constants/auth.ts`). The `jwt`
callback, `getFullToken` and D4 all use it. It is a pure function in `utils/auth/`.

### D6. Drop stale error on success

The refreshed token is built from the base with `error` removed, so a previous
`RefreshAccessTokenError` cannot outlive a successful refresh.

### D7. Sign-out clears only its own session

The `signOut` event in `auth-options.ts` receives the signing-out JWT (`message.token`). It calls
`NextClient.clearRefreshState(token)`, which removes the entry for that token's session key.
`clearAllRefreshTokens` is removed. `requestRegistry.cancelAll()` stays as it is.

## Risks / Trade-offs

- [Server renders after expiry each need a fresh token, and the cookie is not persisted from there] →
  D4 serves them from `latest` without an IdP call until that token expires; D3 renews the cookie.
  Worst case is one IdP refresh per session per process per access-token lifespan.
- [Several replicas each refresh the same session once] → Acceptable without rotation: every refresh
  succeeds. It becomes a problem if rotation is enabled later; documented in proposal Non-goals.
- [Very short access-token lifespans (≤ 60 s) would refresh on every request] → The 60 s margin is a
  constant; Keycloak's minimum practical lifespan (the 300 s default) is well above it.
- [Background tabs throttle timers, so `refetchInterval` may fire late] → Focus refetch covers the
  tab being used, and D1 covers any server-side request regardless.
- [Sessions issued before deploy have no `sessionKey`] → Fallback key by `refreshToken`; they get a
  `sessionKey` at their next sign-in. No forced logout at deploy.

## Migration Plan

1. Deploy normally. Existing cookies stay valid; no environment or IdP changes are required.
2. Rollback: revert the change. Behavior returns to the current (logout-prone) state; no data to
   migrate.
