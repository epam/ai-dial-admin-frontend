# Tasks

Implementation for this change already landed in the working tree; checkboxes below record that
progress. Remaining work is browser verification and the final quality gate.

## 1. API & models

- [x] 1.1 Add `TestSuiteRunConfig` and `RunTestSuiteParams` in
      `apps/ai-dial-admin/src/models/evaluation/run.ts` and verify `npm run typecheck` accepts them
- [x] 1.2 Add `TEST_SUITE_RUNS_CONFIG_URL` and `getTestSuiteRunConfig` on
      `apps/ai-dial-admin/src/server/eval/test-suites-api.ts`, and extend `runTestSuite` to post
      `runConfig.execution.concurrencyLevel`; verify with unit tests in
      `apps/ai-dial-admin/src/server/eval/tests/test-suites-api.spec.ts`
- [x] 1.3 Expose `getTestSuiteRunConfig` and the updated `runTestSuite` params from
      `apps/ai-dial-admin/src/app/[lang]/test-suites/actions.ts`; verify with unit tests in
      `apps/ai-dial-admin/src/app/[lang]/test-suites/actions.spec.ts`

## 2. Run popup UI

- [x] 2.1 Add the parallel-test-cases stepper under Number of runs in
      `apps/ai-dial-admin/src/components/TestSuites/Runs/RunModal.tsx`, load
      `maxConcurrencyLevel` with the existing open effect, and disable Run when the value is out of
      range; verify with component tests in
      `apps/ai-dial-admin/src/components/TestSuites/Runs/tests/RunModal.spec.tsx`
- [x] 2.2 Add i18n keys for the field label and increase/decrease names in
      `apps/ai-dial-admin/src/constants/i18n.ts` and `apps/ai-dial-admin/src/locales/en.ts`; verify
      the keys resolve in the RunModal tests (mocked `t` returns the key)
- [x] 2.3 Thread `RunTestSuiteParams` through `onRun` in
      `apps/ai-dial-admin/src/components/TestSuites/View/View.tsx` and
      `apps/ai-dial-admin/src/components/ListView/Evaluation/List.tsx`; verify `npm run typecheck`

## 3. Browser verification

- [ ] 3.1 Run the `spec-browser-verify` skill for this change against the local app (auth disabled)
      and resolve any `fail` verdicts before considering the change complete

## 4. Quality checks

- [ ] 4.1 Run lint, format, `npm run typecheck`, `npm run typecheck:specs`, and the related vitest
      files; fix any failures
