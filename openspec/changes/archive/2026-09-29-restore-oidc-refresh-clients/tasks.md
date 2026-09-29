## 1. OIDC client reconstruction

- [x] 1.1 Update `apps/ai-dial-admin/src/utils/auth/nextauth-client.ts` so `NextClient.getOrCreateClient` resolves configured providers only after an uncached refresh request, avoiding the `auth-callbacks` → `nextauth-client` → `auth-providers` initialization cycle.
- [x] 1.2 Normalize the matching NextAuth provider and its nested options, then construct and cache an `openid-client` client through well-known discovery or verified explicit issuer/token endpoint metadata; retain the existing cached-client fast path.
- [x] 1.3 Verify the custom GitLab and Ping Identity provider definitions in `apps/ai-dial-admin/src/utils/auth/custom-gitlab.ts` and `apps/ai-dial-admin/src/utils/auth/ping-identity.ts`, adding only the metadata required for safe reconstruction and preserving a controlled unsupported-provider result where metadata is unavailable.

## 2. Refresh failure behavior

- [x] 2.1 Update `apps/ai-dial-admin/src/utils/auth/auth-callbacks.ts` only as needed to consume the lazy resolver and preserve the existing redacted `RefreshAccessTokenError` response when the provider client cannot be recovered.

## 3. Automated coverage

- [x] 3.1 Extend `apps/ai-dial-admin/src/utils/auth/tests/nextauth-client.spec.ts` with unit tests for cached-client reuse, lazy provider resolution, discovery-based reconstruction, explicit-endpoint reconstruction, and missing or insufficient provider metadata.
- [x] 3.2 Add focused refresh-callback coverage for the recovered-client path and controlled reconstruction failure without asserting or logging token values.
- [x] 3.3 No browser-verification task is needed because all acceptance scenarios concern server-side module initialization and token-refresh behavior, not browser-observable UI state.

## 4. Quality checks

- [x] 4.1 Run the focused auth tests from `apps/ai-dial-admin/`, then run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs`, `npm run format`, and the applicable test suite; report any unrelated existing failures separately.
