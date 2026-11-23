## Context

See proposal.md — Why. The Run Test Cases popup (`TestSuites/Runs/RunModal.tsx`) already loads
valid/all test cases and the dataset schema to show the selected-case count, and posts
`{ runConfig: { numberOfRuns } }` through `testSuitesApi.runTestSuite`. Callers are the suite
detail view and the evaluation list Run modal.

The eval service owns the concurrency ceiling as
`test-suite-run.execution.max-concurrency-level` (env
`TEST_SUITE_RUN_EXECUTION_MAX_CONCURRENCY_LEVEL`, default 50) and rejects a higher
`concurrencyLevel` with HTTP 400. It now also serves
`GET /api/v1/test-suite-runs/config` → `{ maxConcurrencyLevel }`.

## Goals / Non-Goals

**Goals:**
- One source of truth for the client max: the eval config endpoint, not a duplicated admin env var.
- Same stepper UX as Number of runs; cap plus/minus and disable Run when the value is out of range.
- One `RunTestSuiteParams` shape shared by the modal, server action, and API method.

**Non-Goals:**
- No `NEXT_PUBLIC_*` or server-env mirror of the max on the admin deployment.
- No client-side max for number of runs (unchanged; service still enforces that separately).

## Decisions

**Read the max from the eval config endpoint, not an admin env var.**
The service already validates and can change the ceiling per deployment. Duplicating it on the admin
app would drift. Alternatives considered: admin env via `utils/env` + server action (rejected —
second copy); hard-code 50 (rejected — not the live value); parse the 400 message (rejected —
fragile).

**Extend `runConfig` with nested `execution.concurrencyLevel`, do not add a top-level field.**
Matches the eval OpenAPI / DTO shape (`ExecutionSettingsDto` under run config). Alternative: top-
level `execution` beside `runConfig` — rejected; the issue payload and service contract nest it under
`runConfig`.

**Load config in the same popup open effect as test cases; a failed config does not block Run.**
Keeps one spinner. If the GET fails or returns no usable max, the field still works with minimum 1
and no client ceiling; the service remains the hard cap. Alternative: block Run until config
succeeds — rejected; worse than today's number-of-runs path when the backend is briefly unavailable.

**Pass `{ numberOfRuns, concurrencyLevel }` as one params object** through `onRun` / `runTestSuite`,
instead of adding a second positional argument. Call sites stay readable as the payload grows.

## Risks / Trade-offs

- **[Config endpoint unavailable]** → popup still opens; user can submit a value the service may
  reject; existing error notification path surfaces the 400.
- **[Example swagger max differs from default 50]** → UI always uses the live response, never a
  hard-coded default, so the stepper matches the deployed service.
