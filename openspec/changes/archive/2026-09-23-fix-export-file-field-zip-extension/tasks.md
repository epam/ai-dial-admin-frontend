## 1. Fix streamRequest to honor the backend's actual response headers

- [x] 1.1 In `apps/ai-dial-admin/src/utils/api/create-stream-request.ts`, add a small helper that
      extracts a filename from a `Content-Disposition` header value (reusing the same
      `filename[^;=\n]*=(['"]?)([^'";\n]+)\1` pattern already used in
      `apps/ai-dial-admin/src/server/eval/analytics-api.ts` and
      `apps/ai-dial-admin/src/components/Runs/Export/ExportRunModal.tsx`).
- [x] 1.2 In `streamRequest`, resolve the filename to use as: the backend response's
      `Content-Disposition` filename if present, otherwise the caller-supplied `fileName` argument
      (unchanged fallback behavior).
- [x] 1.3 Resolve the `Content-Type` header to use as: the backend response's own `Content-Type` if
      present, otherwise `getContentType(resolvedFileName)` as today.
- [x] 1.4 Build the outgoing `Content-Disposition` header from the resolved filename via the existing
      `buildFilenameDisposition`, keeping the `isPreview` → `inline` branch unchanged.

## 2. Add ZIP content type

- [x] 2.1 In `apps/ai-dial-admin/src/constants/file.ts`, add `.zip: 'application/zip'` to
      `contentTypes`.

## 3. Regression tests

- [x] 3.1 In `apps/ai-dial-admin/src/utils/api/tests/create-stream-request.spec.ts`, add a case: when
      the backend response includes a `Content-Disposition` header naming a `.zip` file, the returned
      `Response`'s `Content-Disposition` uses that filename (not the caller-supplied `.csv` fallback).
- [x] 3.2 Add a case: when the backend response includes its own `Content-Type` header, that value is
      forwarded as-is on the returned `Response`.
- [x] 3.3 Confirm the existing tests (no `Content-Disposition`/`Content-Type` on the backend response)
      still pass unchanged — the caller-supplied filename and extension-derived content type remain
      the fallback.

## 4. Spec update

- [x] 4.1 Update the "Export test cases to CSV" requirement in
      `openspec/specs/dataset-test-cases/spec.md` to describe the ZIP-with-attached-files case.

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and
      `npm run test` from `apps/ai-dial-admin/` and fix any failures. Lint (0 errors, pre-existing
      `no-explicit-any` warnings only), format, and both typecheck gates pass clean. Full suite:
      12852 passed, 1 pre-existing failure unrelated to this change
      (`MethodTabContent.spec.tsx > renders TryOutButton only for the first request`, a stale test
      contradicting the already-merged "show try out button for every selected request" commit on
      this branch — reproduces identically with this change's edits stashed out).

## Note on browser verification

No dedicated browser-verification task is included: the only observable scenario (a downloaded file's
name/extension) is not something Playwright/the `spec-verification-gate` agent can assert on — a
browser-triggered file download isn't inspectable via accessible-role/text queries. This is covered by
the unit tests in section 3 instead, which assert the actual `Content-Disposition`/`Content-Type`
headers the fix produces.
