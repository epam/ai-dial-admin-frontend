## 1. Direct route composition

- [x] 1.1 Update `apps/ai-dial-admin/src/app/[lang]/assets-applications/page.tsx` to import and render `AssetAppsList` directly, preserving its `runners` prop, then delete `apps/ai-dial-admin/src/components/Assets/Apps/PageList.tsx`.
- [x] 1.2 Update `apps/ai-dial-admin/src/app/[lang]/assets-toolsets/page.tsx` and `apps/ai-dial-admin/src/app/[lang]/platform-{app-runners,interceptors,models,roles,routes}/page.tsx` to import their existing list components directly, then delete the corresponding `PageList.tsx` wrappers under `apps/ai-dial-admin/src/components/Assets/`.

## 2. Automated tests

- [x] 2.1 Update `apps/ai-dial-admin/src/app/[lang]/assets-applications/tests/runner-sources.spec.tsx` and `admin-api-gating.spec.tsx` to mock `@/components/Assets/Apps/List` and retain the existing route assertions.
- [x] 2.2 Run the affected assets-applications route tests from `apps/ai-dial-admin/` and confirm the direct list mock continues to isolate page behavior.

No browser-verification task is included: the user chose to skip it for this internal route-composition cleanup.

## 3. Quality checks

- [x] 3.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, and `npm run typecheck:specs` from `apps/ai-dial-admin/`.
- [x] 3.2 Run the relevant Vitest tests and verify no `PageList` references remain in application source or tests.
