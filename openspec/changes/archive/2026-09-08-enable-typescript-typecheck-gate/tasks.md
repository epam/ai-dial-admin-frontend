No verification task: this change has no spec delta (`skip_specs: true`) and no scenario with a UI
observable — it adds a build-tooling target and deletes unimported files. Nothing it does is reachable in
the browser.

No unit-test task either: the change adds no runtime code. `tsc` exiting non-zero on a known bad file is
the check, and task 4.3 exercises it.

## 1. Scope the typecheck configs

- [x] 1.1 In `apps/ai-dial-admin/tsconfig.app.json`, drop the `.next/types` entries from `include`, add
      `**/*.spec.tsx`, `**/*.test.tsx` and `test-setup.tsx` to `exclude`, and narrow `types` to `["node"]`.
- [x] 1.2 In `apps/ai-dial-admin/tsconfig.spec.json`, add `@testing-library/jest-dom/vitest` to `types`
      (the `/vitest` subpath — see design.md).

## 2. Delete the dead files the app project is failing on

- [x] 2.1 Delete `apps/ai-dial-admin/src/components/Assets/ExportAssets/ExportGrid.tsx` (13 errors);
      keep `export.ts` and its tests.
- [x] 2.2 Delete `apps/ai-dial-admin/src/components/EntityListView/Components/BulkButtons.tsx` (1 error).
- [x] 2.3 Delete `apps/ai-dial-admin/src/components/SchemeRenderer/` including `tests/utils.spec.ts`
      (1 error).

## 3. Add the target and wire the gate

- [x] 3.1 Add a `typecheck` target to `apps/ai-dial-admin/project.json`
      (`nx:run-commands`, `tsc -p tsconfig.app.json --noEmit`, `cwd` the app root).
- [x] 3.2 Add `"typecheck": "nx run ai-dial-admin:typecheck"` to the root `package.json` scripts.
- [x] 3.3 Put `npm run typecheck` ahead of `npm run test` in `.husky/pre-push`.
- [x] 3.4 Add the command to the Commands list in `openspec/config.yaml` and a gotcha to `AGENTS.md`
      saying the gate covers app source only.

## 4. Verify

- [x] 4.1 `npm run typecheck` exits 0.
- [x] 4.2 `cd apps/ai-dial-admin && npx tsc -p tsconfig.spec.json --noEmit` reports 725 errors in 154
      files — the baseline the follow-up change works down.
- [x] 4.3 Introduce a deliberate type error in a source file, confirm `npm run typecheck` fails on it,
      then revert.

## 5. Quality checks

- [x] 5.1 `npm run lint`, `npm run format`, and `npm run test` (full suite with coverage — the deleted
      `SchemeRenderer` tests must not drop coverage below the 40/40/50/50 thresholds).
