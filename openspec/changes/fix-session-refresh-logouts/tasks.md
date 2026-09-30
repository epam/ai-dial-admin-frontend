## 1. Expiry predicate and constants

- [x] 1.1 Add `ACCESS_TOKEN_EXPIRY_MARGIN_MS` (60 s) and `SESSION_REFETCH_INTERVAL_SEC` (5 min) to `apps/ai-dial-admin/src/constants/auth.ts`, and add a pure `isAccessTokenExpired(token, now)` in `apps/ai-dial-admin/src/utils/auth/` (design D5); verify with a unit spec covering missing expiry, inside margin, and valid beyond margin

## 2. Refresh coordination (design D4, D6, D7)

- [x] 2.1 Replace the `userId` flag-and-poll map in `apps/ai-dial-admin/src/utils/auth/nextauth-client.ts` with per-session state `{ latest, inFlight }` keyed by `sessionKey` (falling back to `refreshToken`), with join-or-start single-flight released in `finally`, base selection by later `accessTokenExpires`, and 24 h eviction on write; remove `delay`, `getRefreshToken`, `setIsRefreshTokenStart`, `clearAllRefreshTokens`, and add `clearRefreshState(token)`; verify with `nextauth-client.spec.ts` cases: parallel calls → one refresh, second expiry still single-flight, release after failure, newer `latest` reused without an IdP call, two session keys of the same user kept apart, eviction
- [x] 2.2 Rewrite `refreshAccessToken` in `apps/ai-dial-admin/src/utils/auth/auth-callbacks.ts` on top of 2.1: refresh with the base's refresh token, strip `error` from the refreshed token, keep the `RefreshAccessTokenError` result and redacted logging on failure, and never cache failures; in the `jwt` callback, assign `sessionKey` (`crypto.randomUUID()`) on sign-in and use `isAccessTokenExpired`; verify with `auth-callbacks.spec.ts` cases: stale error cleared on success, failure then success, new sign-in after failure refreshes normally, `sessionKey` set on sign-in, refresh triggered inside the margin
- [x] 2.3 In `apps/ai-dial-admin/src/utils/auth/auth-options.ts`, make the `signOut` event call `NextClient.clearRefreshState(message.token)` instead of `clearAllRefreshTokens()`; verify with a unit spec that another session's state survives a sign-out

## 3. Server-side fresh token and validity (design D1, D2)

- [x] 3.1 Make `getFullToken` in `apps/ai-dial-admin/src/utils/auth/token.ts` refresh an expired non-`credentials` token through `refreshAccessToken` before deriving the bearer value (`access_token` or `idToken` per `AUTH_IDTOKEN_PROVIDERS`); verify with a new `token.spec.ts`: expired → refreshed bearer, valid → no refresh, refresh failure → token carries `error`, `credentials` provider untouched
- [x] 3.2 Change `getIsInvalidSession` in `apps/ai-dial-admin/src/utils/auth/is-valid-session.ts` to return invalid only for a missing token or a token with `error` (no `getServerSession`, no `accessTokenExpires` comparison), with call sites in `app/layout.tsx` and `app/[lang]/layout.tsx` unchanged; verify by updating `is-valid-session.spec.ts`: expired-but-refreshed token is valid, errored token invalid, missing token invalid, auth disabled valid

## 4. Client-side cookie renewal (design D3)

- [x] 4.1 Pass `refetchInterval={SESSION_REFETCH_INTERVAL_SEC}` to `SessionProvider` in `apps/ai-dial-admin/src/context/NextAuthProvider.tsx`, keeping focus refetch on; verify with a component spec asserting the prop reaches the mocked `SessionProvider`

## 5. Unit test gate

- [x] 5.1 Confirm every new and updated module above has unit coverage per `.claude/rules/testing.md`, including a regression test that reproduces problem 1 (a cookie token past `accessTokenExpires` with a refreshable session is not treated as invalid); verify with `npx vitest run src/utils/auth src/context` from `apps/ai-dial-admin/`

## 6. Browser verification

- [ ] 6.1 Run the `spec-browser-verify` skill for this change against the local app signed in to the dev Keycloak, with the admin client's `access.token.lifespan` set short (e.g. `120`) so expiry happens during the run, and scope it to the "Session validity is decided by the refresh outcome" and "Browser keeps the session cookie renewed" scenarios (reload, new tab, save-triggered refresh, idle tab, several tabs); resolve every `fail` verdict before the change is complete

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test` and verify all pass with zero errors
