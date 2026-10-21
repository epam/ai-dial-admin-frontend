## 1. Relabel the Source column

- [x] 1.1 In `apps/ai-dial-admin/src/locales/en.ts`, change the `SourceI18nKey.EntityRunner` value from
      `'Entity'` to `'Configuration file'` and `SourceI18nKey.AssetRunner` from `'Asset'` to `'API'` —
      matching `ConfigEntityOrigin`'s `ORIGIN_LABEL` wording in
      `src/utils/config-entities/source-column.ts`. `PICKER_RUNNER_COLUMNS`'s `valueFormatter` in
      `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` already renders these keys through
      `t()`, so no code change is needed there — the enum members, `AppRunnerOrigin`, and
      `buildAppRunnerOptions` are untouched.

## 2. Tests

- [x] 2.1 Confirm `apps/ai-dial-admin/src/components/SourceField/Application/tests/runner-options.spec.ts`
      still passes unchanged: its `'renders the Source cell per origin'` test asserts the i18n **keys**
      (`SourceI18nKey.AssetRunner`/`.EntityRunner`), which are not renamed, so it needs no edit — run it to
      verify rather than assuming.

## 3. Quality checks

- [x] 3.1 Run lint, format check, and the full test suite (`npm run lint`, `npm run format`,
      `npm run test` from `apps/ai-dial-admin/`) and fix any failures.

Note: no dedicated browser-verification task is included. The spec's "Both populations appear in the
picker" scenario is browser-observable (its THEN describes rendered text), so the user was asked
whether to add one; they declined, opting to rely on the existing `PICKER_RUNNER_COLUMNS` unit test
(asserting the origin→i18n-key mapping) plus the `en.ts` locale-value change, consistent with the same
choice made for `fix-duplicate-app-oauth-external-service`.

Note: the full-suite run (task 3.1) showed 38 failures across 11 unrelated files (Analytics/Pipelines,
QueryBuilder, Grid/Filter, Runs/Compare). Confirmed via `git stash` + isolated rerun of those exact
files both with and without this change's diff: all 113 tests in them pass cleanly either way. The
failures are full-suite flakiness (parallel-run contention/timeouts), not a regression from this
change or the other uncommitted work in the branch.
