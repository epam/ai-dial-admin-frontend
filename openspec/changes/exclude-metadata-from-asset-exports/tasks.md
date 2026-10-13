## 1. Export document shaping

- [x] 1.1 Update `apps/ai-dial-admin/src/server/assets/exim.ts` so `buildAssetsExport` removes the frontend-only `_metadata` object from every exported entity while preserving the prefixed import `id` and resource content.

## 2. Regression coverage

- [x] 2.1 Update `apps/ai-dial-admin/src/server/assets/tests/exim.spec.ts` to assert shared export output omits `_metadata` and retains content and import identity; retain legacy-import sanitization coverage.
- [x] 2.2 Update the prompts, asset applications, and asset toolsets export tests in `src/server/prompts/tests/exim.spec.ts`, `src/server/applications/tests/exim.spec.ts`, and `src/server/toolsets/tests/exim.spec.ts` to match the sanitized export contract.
- [x] 2.3 No browser-verification task is required because the delta scenarios assert server-side export document contents rather than browser UI state.

## 3. Quality checks

- [x] 3.1 Run the focused export test files from `apps/ai-dial-admin/`, then run formatting, linting, and both application and spec typecheck gates.
