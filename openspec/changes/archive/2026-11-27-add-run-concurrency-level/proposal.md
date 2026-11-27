## Why

Operators starting a test suite run could only set how many times each case runs, not how many
cases run in parallel. The eval service already accepts `runConfig.execution.concurrencyLevel` and
exposes the live ceiling via `GET /api/v1/test-suite-runs/config`; the Admin UI never sent or
bounded that value.

## What Changes

- Extend the Run Test Cases popup with a "Number of parallel test cases" stepper under Number of
  runs (same minus / number / plus controls).
- Load `maxConcurrencyLevel` from `GET /api/v1/test-suite-runs/config` when the popup opens and use
  it as the client-side maximum for that field.
- Send both values on start: `runConfig.numberOfRuns` and `runConfig.execution.concurrencyLevel`.
- Thread the new argument through the suite detail view and the evaluation list Run callers.

## Capabilities

### New Capabilities

- `test-suite-run-popup`: starting a test suite run from the Run Test Cases popup — selected-case
  summary, number of runs, parallel concurrency, and the run request payload.

### Modified Capabilities

_None._ No existing consolidated spec documents the Run Test Cases popup.

## Impact

- `apps/ai-dial-admin/src/components/TestSuites/Runs/RunModal.tsx` — concurrency stepper + config
  load.
- `apps/ai-dial-admin/src/server/eval/test-suites-api.ts` — `getTestSuiteRunConfig`, extended
  `runTestSuite` body.
- `apps/ai-dial-admin/src/app/[lang]/test-suites/actions.ts` — server actions for both.
- `apps/ai-dial-admin/src/models/evaluation/run.ts` — `TestSuiteRunConfig`, `RunTestSuiteParams`.
- `apps/ai-dial-admin/src/components/TestSuites/View/View.tsx` and
  `apps/ai-dial-admin/src/components/ListView/Evaluation/List.tsx` — `onRun` passes both values.
- i18n keys for the new field label and stepper button names.

## Non-goals

- No admin-frontend env var for the concurrency ceiling (the eval service owns
  `TEST_SUITE_RUN_EXECUTION_MAX_CONCURRENCY_LEVEL`).
- No change to how number-of-runs is capped client-side (still minimum 1 only; the service still
  enforces `max-number-of-runs`).
- No display of concurrency on run list/detail after the run starts.
