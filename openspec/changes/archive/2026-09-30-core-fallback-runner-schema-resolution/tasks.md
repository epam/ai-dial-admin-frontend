## 1. Resolver selection

- [x] 1.1 Update `apps/ai-dial-admin/src/components/SourceField/Application/resolve-app-runner.ts` so the existing Platform-origin branch remains Core-only, while Config-origin and originless runners select `getResolvedApplicationScheme` when `DIAL_ADMIN_API_URL` is non-empty and `getResolvedRunnerSchema` otherwise; normalize their distinct response shapes and preserve the unresolved-runner fallback.

## 2. Focused tests

- [x] 2.1 Update `apps/ai-dial-admin/src/components/SourceField/Application/tests/resolve-app-runner.spec.ts` to verify Platform behavior is unaffected by Admin Backend availability, Config/originless runners use the Admin Backend when configured, Config/originless runners use Core when it is absent or empty, Core's direct response is used, and each selected resolver retains the fallback on failure.

## 3. Quality checks

- [x] 3.1 Run the focused resolver test file from `apps/ai-dial-admin/` with `npx vitest run src/components/SourceField/Application/tests/resolve-app-runner.spec.ts`.
- [x] 3.2 Run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs`, and the applicable test suite; report any unrelated existing failures separately.

Browser verification was offered and declined because the change is covered by focused resolver unit tests.
