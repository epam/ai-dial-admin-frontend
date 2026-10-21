## 1. Publication resource write fix

- [x] 1.1 Update `apps/ai-dial-admin/src/app/api/api.ts` so the publication enrichment client's Application and Toolset resource writes pass the enriched `_metadata.path` to `AssetApi.put`, while preserving the existing metadata and identity-field stripping.

## 2. Regression coverage

- [x] 2.1 Extend `apps/ai-dial-admin/src/app/api/tests/publications-enrichment.spec.ts` with Application and Toolset publication-update cases that use `_metadata.path` and assert the resulting Core content PUT URL and sanitized request body.
- [x] 2.2 Run the targeted publication-enrichment API tests from `apps/ai-dial-admin/` with Vitest.

## 3. Quality checks

- [x] 3.1 Run formatting, linting, application typecheck, spec typecheck, and the full test suite; report any unrelated known flaky failures separately.

No browser-verification task is needed because the acceptance scenarios exercise server-side Core request construction and response behavior, not independently addressable browser UI state.
