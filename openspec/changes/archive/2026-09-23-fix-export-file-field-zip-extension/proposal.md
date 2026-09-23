## Why

Exporting a dataset (or test suite) whose schema contains a `FILE`-type field with at least one
attached file downloads a file named `dataset_<id>_export.csv` / `test_suite_<id>_export.csv`, but
its content is actually a ZIP archive (binary, starts with the `PK` signature) — the backend bundles
the CSV with the attached files into a ZIP whenever a `FILE`-type field is present. Re-importing that
downloaded file via "Import from PC storage" fails with a "Malformed CSV" error or shows binary
garbage in the preview.

Root cause: `streamRequest` (`apps/ai-dial-admin/src/utils/api/create-stream-request.ts`) fetches the
backend's export response but discards its headers entirely, building a brand-new `Response` whose
`Content-Type`/`Content-Disposition` are derived only from the filename its caller hardcodes —
`dataset_${datasetId}_export.csv` in `DatasetsApi.exportTestCasesCsv`
(`apps/ai-dial-admin/src/server/eval/datasets-api.ts:114`) and
`test_suite_${testSuiteId}_export.csv` in `TestSuitesApi.exportTestCasesCsv`
(`apps/ai-dial-admin/src/server/eval/test-suites-api.ts:123`). The actual backend response's
`Content-Disposition` (which names the real `.zip` extension when applicable) is never inspected.
The download itself is a full browser navigation (`window.open(ApiRoute.DatasetsExport?id=...)` in
`TestCasesList.tsx`), so whatever headers `streamRequest` emits are exactly what the browser uses to
name and type the saved file.

This codebase already has the correct pattern elsewhere: `AnalyticsApi.exportCsv`
(`apps/ai-dial-admin/src/server/eval/analytics-api.ts`) reads the real `Content-Disposition` from the
backend response and uses that filename, falling back to a default only when it's absent. The
dataset/test-suite export path never adopted that pattern.

## What Changes

- `streamRequest` prefers the backend's actual `Content-Disposition` filename (and `Content-Type`)
  when the backend sends them, falling back to the caller-supplied filename/derived content type
  only when the backend response doesn't include them. This fixes both `DatasetsApi.exportTestCasesCsv`
  and `TestSuitesApi.exportTestCasesCsv` (which share this helper) without changing their call sites.
- Add `.zip` → `application/zip` to the `contentTypes` map in `apps/ai-dial-admin/src/constants/file.ts`
  so a ZIP fallback still gets the right `Content-Type` if the backend ever omits one.
- Update the `dataset-test-cases` spec's export requirement to describe the ZIP case.

## Non-goals

- No change to the `window.open`-based download mechanism, the `ApiRoute.DatasetsExport`/
  `TestSuitesExport` routes, or the import flow — the import side already accepts whatever file
  content it's given; it fails today only because the downloaded file is mislabeled.
- No change to `AnalyticsApi.exportCsv`/`ExportRunModal.tsx` (run CSV export) — already correct, used
  here only as the reference pattern.
- No attempt to detect a ZIP by sniffing content (magic bytes) — the backend already tells us via
  `Content-Disposition`/`Content-Type`; trust those headers rather than inspecting the stream.

## Capabilities

### Modified Capabilities

- `dataset-test-cases`: the "Export test cases to CSV" requirement gains the ZIP-with-attached-files
  case.

## Impact

- `apps/ai-dial-admin/src/utils/api/create-stream-request.ts` — the fix itself (`streamRequest`).
- `apps/ai-dial-admin/src/constants/file.ts` — add `.zip` content type.
- `apps/ai-dial-admin/src/utils/api/tests/create-stream-request.spec.ts` — new/updated coverage.
- No changes needed to `datasets-api.ts` / `test-suites-api.ts` — their hardcoded filenames remain
  correct fallbacks for the plain-CSV case; `streamRequest` now overrides them only when the backend
  says otherwise.
