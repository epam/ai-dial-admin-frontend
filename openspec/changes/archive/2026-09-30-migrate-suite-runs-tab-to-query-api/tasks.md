## 1. Implementation

- [x] 1.1 In `apps/ai-dial-admin/src/components/TestSuites/Runs/Runs.tsx`, replace the import of
      `getRuns` from `@/src/app/[lang]/test-suites/actions` with `getRunsQuery` from
      `@/src/app/[lang]/runs/actions`, and update both call sites (the page-0 prefetch effect and the
      `gridDataSource.getRows` datasource) to call `getRunsQuery` in place of `getRuns`, keeping
      `RUN_FILTER(selectedTestSuite.id as string)` prepended to the filters array at each site exactly
      as it is today. Verify with `npm run typecheck` (zero errors) and a manual read confirming no
      other reference to `getRuns` remains in the file.

## 2. Tests

- [x] 2.1 In `apps/ai-dial-admin/src/components/TestSuites/Runs/tests/Runs.spec.tsx`, move the
      `getRuns` mock from `vi.mock('@/src/app/[lang]/test-suites/actions', ...)` into the existing
      `vi.mock('@/src/app/[lang]/runs/actions', ...)` block as `getRunsQuery`, update every import and
      assertion (`waitFor(() => expect(getRuns)...)`, `vi.mocked(getRuns).mockResolvedValue(...)`) to
      reference `getRunsQuery`, and remove the now-empty `test-suites/actions` mock. Verify with
      `npx vitest run src/components/TestSuites/Runs/tests/Runs.spec.tsx` (run from
      `apps/ai-dial-admin/`) passing.

## 3. Quality gate

- [x] 3.1 Run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test` (full
      coverage run) from the repo root and confirm all four pass with no regressions.
