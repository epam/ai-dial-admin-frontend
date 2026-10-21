## Why

`tsc` runs nowhere in this repo. There is no nx `typecheck` target, `.husky/pre-push` runs only
`npm run test`, and `.github/workflows/pr.yml` runs only the agent-doc validators. vitest does not
typecheck, so a type error reaches `development` unless a human notices it.

Two holes follow from that, and they are different:

- **Test files are unchecked by anything.** vitest strips types through esbuild, and
  `eslint.config.mjs` puts `**/**.spec.ts` and `**/**.spec.tsx` in `ignores`.
- **Source files unreachable from a route are unchecked too.** `next build` does run
  "Linting and checking validity of types", but only over the graph reachable from the app's pages,
  so a component nobody imports can carry type errors and the build still exits 0.

This is not hypothetical. `add-hop-request-response-inspector` shipped a test that read
`HopEventType.Error` after that member was deleted; the comparison became `undefined === undefined` and
the test **passed vacuously**, leaving that change's central behaviour — a failed call keeping its own
kind — without real coverage. `tsc` reports it as `TS2339`. Nothing in CI could have caught it.

Parked out of that change deliberately: the gate cannot simply be switched on, and the work to clear it is
its own PR.

## What Changes

- An nx `typecheck` target for `ai-dial-admin`, wired into `.husky/pre-push`.
- The app project cleared first and gated; the spec project surfaced but not yet gated.

Measurements re-taken 2026-09-08 (2026-08-30 figures in brackets where they moved):

- **App project: 249 errors [57]**, of which:
  - **15 real source errors [15]**, all in three files that no file in the repository imports:
    `ExportAssets/ExportGrid.tsx` (13, `bulkSelectedData` / `setBulkSelectedData` gone from
    `AssetsFolderContext`), `SchemeRenderer/utils.ts` (1), `EntityListView/Components/BulkButtons.tsx` (1).
  - 40 from `dist/apps/ai-dial-admin/.next/types/**`, pulled in by `include`; stale route types that go out
    of date the moment a route moves — drop the build output instead of fixing them.
  - 186 from `*.spec.tsx` / `*.test.tsx`, which the current `exclude` misses (it lists only the `.ts` forms).
- **Spec project: 4 163 errors [3 922]**, 3 437 of them phantom matchers (`toBeInTheDocument` and friends).
  Adding `@testing-library/jest-dom/vitest` to `types` drops it to **726 [702]** across 155 files, and to
  **725 across 154** once this change deletes `SchemeRenderer`'s spec. Use the
  `/vitest` subpath, not the bare name: the bare name resolves to `jest.d.ts`, which augments
  `namespace jest` and carries `/// <reference types="jest" />` while `@types/jest` is not installed.
- Of those 725, the ones that can hide a bug rather than merely under-specify a fixture: 235 fixtures that
  no longer match the production type (`TS2741` / `TS2739` / `TS2740` / `TS2353` — missing required fields,
  deleted enum members such as `ActionType.REMOVE`), 45 untyped mocks (`mockReturnValue` on a bare
  `vi.fn()`), 76 implicit `any`.
- **0 errors in the conversations-trace inspector area.**

Both tsconfigs were at HEAD when this was written; the earlier experiment that changed them was reverted on
purpose, so this change starts from a clean baseline.

## Non-goals

- Clearing the 725 spec-project errors. That is 154 files and cannot be reviewed as one PR; it follows in
  its own change, and only then does the gate extend to `tsconfig.spec.json`.
- A CI job. Decided against on 2026-09-08 (see design.md — Decisions): the gate lands on pre-push only.
- Restoring `bulkSelectedData` to `AssetsFolderContext`. The only caller is dead code, which this change
  deletes.

## Impact

`tsconfig.app.json`, `tsconfig.spec.json`, `apps/ai-dial-admin/project.json`, root `package.json`,
`.husky/pre-push`, `openspec/config.yaml` (Commands), and the deletion of
`Assets/ExportAssets/ExportGrid.tsx`, `EntityListView/Components/BulkButtons.tsx` and
`src/components/SchemeRenderer/` with its tests.
