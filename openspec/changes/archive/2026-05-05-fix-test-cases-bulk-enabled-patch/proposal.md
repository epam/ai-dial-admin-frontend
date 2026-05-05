## Why

Saving a test suite with 800+ test cases fails silently when any `enabled` toggles are included — the existing `PUT /test-cases` endpoint has a hard 256-item cap, and large payloads of full test-case objects exceed it. After the first failure the page becomes blocked until refresh because the ETag is stale (the suite itself was already updated). The backend has shipped a new `PATCH /test-cases:bulk` endpoint specifically designed for scalable bulk `enabled` changes.

## What Changes

- **New**: `PATCH /api/v1/test-suites/{id}/test-cases:bulk` is called for `enabled`-only changes instead of the existing `PUT /test-cases`.
- **Split save path**: dirty test cases are split into two groups:
  - Rows where non-`enabled` fields changed → existing `PUT /test-cases` (full objects, unchanged).
  - Rows where **only** `enabled` changed → new `PATCH /test-cases:bulk` with `bulkOperations` (IDs + desired value).
- **New tracking ref**: `dirtyEnabledRef` added to `TestCasesList` to track per-row `enabled` changes separately from other field changes.
- **ETag stale-state bug fixed**: `router.refresh()` is now called on any save failure, so a failed `updateTestCases` no longer blocks subsequent saves.

## Capabilities

### New Capabilities
- `test-cases-bulk-enabled-patch`: Client-side capability to update the `enabled` flag for an arbitrary number of test cases in one atomic bulk PATCH request, bypassing the 256-item per-request cap of the existing batch PUT endpoint.

### Modified Capabilities
<!-- none — no existing spec-level behavior changes -->

## Impact

- `apps/ai-dial-admin/src/models/evaluation/test-suite.ts` — add `TestCaseBulkPatchRequest` and related types.
- `apps/ai-dial-admin/src/server/eval/test-suites-api.ts` — add `TEST_CASES_BULK_URL` constant and `bulkPatchTestCases()` method.
- `apps/ai-dial-admin/src/app/[lang]/test-suites/actions.ts` — add `bulkPatchTestCases` server action.
- `apps/ai-dial-admin/src/components/TestSuites/TestCases/TestCasesList.tsx` — add `dirtyEnabledRef`, adjust `onCellValueChanged`, expose `getEnabledOnlyChanges` on the actions ref.
- `apps/ai-dial-admin/src/components/TestSuites/View/View.tsx` — two-phase save (PUT then bulk PATCH), fix ETag bug.
- No new dependencies. No breaking changes to existing API contracts.
