## 1. Fix

- [x] 1.1 Grep all call sites of `updateToolset` and `updatePlatformToolset` in `apps/ai-dial-admin/src/app/[lang]/assets-toolsets/actions.ts` and the components that call them, to confirm `name`, `version`, and `folderId` are always populated on the object passed in (per design.md's "Risks" section).
- [x] 1.2 In `updateToolset` (`assets-toolsets/actions.ts`), recompute the write path from `folderId` + `getVersionedName(name, version)` — mirroring `createToolset` in the same file and `updateApp` in `assets-applications/actions.ts` — instead of trusting `toolset.path` verbatim.

## 2. Tests

- [x] 2.1 Add/update unit tests for `updateToolset` covering: a public-bucket toolset (path recomputed from `folderId` + versioned name, unchanged outcome from today) and a platform-bucket toolset (`folderId: 'platform/'` produces a `platform/{name}` write path, no `__version` suffix).
- [x] 2.2 Add/update a unit test for `updatePlatformToolset` confirming it delegates through `updateToolset` and the resulting write path is `platform/{name}`, reproducing the fix for issue #4419.

## 3. Quality gate

- [x] 3.1 Run lint, format check, and the full test suite (`npm run test`) from the repo root.
