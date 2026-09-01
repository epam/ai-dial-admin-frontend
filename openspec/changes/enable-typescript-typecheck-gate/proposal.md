## Why

`tsc` runs nowhere in this repo. There is no nx `typecheck` target, `.husky/pre-push` runs only
`npm run test`, and `.github/workflows/pr.yml` runs only the agent-doc validators. vitest does not
typecheck, so a type error reaches `development` unless a human notices it.

This is not hypothetical. `add-hop-request-response-inspector` shipped a test that read
`HopEventType.Error` after that member was deleted; the comparison became `undefined === undefined` and
the test **passed vacuously**, leaving that change's central behaviour — a failed call keeping its own
kind — without real coverage. `tsc` reports it as `TS2339`. Nothing in CI could have caught it.

Parked out of that change deliberately: the gate cannot simply be switched on, and the work to clear it is
its own PR.

## What Changes

- An nx `typecheck` target for `ai-dial-admin`, wired into pre-push and the PR workflow.
- The app project cleared first, then the spec project.

Measurements taken 2026-08-30, so this does not start from zero:

- **App project: 57 errors.** 42 are stale `dist/apps/ai-dial-admin/.next/types/**` artifacts, whose route
  types go out of date the moment a route moves — exclude the build output rather than fixing them. The
  **15 real errors are all in `ExportAssets/ExportGrid.tsx`** (`bulkSelectedData` missing from
  `AssetsFolderContext`).
- **Spec project: 3 922 errors**, 2 625 of them phantom `toBeInTheDocument`. Adding
  `@testing-library/jest-dom/vitest` to `types` drops it to **702**. Use the `/vitest` subpath, not the bare
  name: the bare name resolves to `jest.d.ts`, which augments `namespace jest` and carries
  `/// <reference types="jest" />` while `@types/jest` is not installed.
- **0 errors in the conversations-trace inspector area.**

Both tsconfigs are at HEAD; the earlier experiment that changed them was reverted on purpose, so this change
starts from a clean baseline.

## Impact

`tsconfig.app.json`, `tsconfig.spec.json`, `project.json`, `.husky/pre-push`, `.github/workflows/pr.yml`,
and `ExportAssets/ExportGrid.tsx` plus whatever `AssetsFolderContext` needs to satisfy it.

Open question for whoever picks this up: whether the gate lands on pre-push, on CI, or both. Pre-push alone
is bypassable with `--no-verify`; CI alone lets a broken push sit until the run finishes.
