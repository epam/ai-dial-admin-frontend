## Context

The Select document modal ([`FileSelectInput`](apps/ai-dial-admin/src/components/Common/FileSelectInput/FileSelectInput.tsx))
hosts Public and Application tabs when `view` and `id` are set. Application files are listed by
[`ApplicationFileManager`](apps/ai-dial-admin/src/components/Common/FileSelectInput/ApplicationFileManager.tsx),
which today uses `ONE_ACTION_COLUMN(getRemoveOperation(...))` — a single trash button labelled Remove.

Entity ownership is already resolved by callers:

- Test Suite multipart / template variables → `ApplicationRoute.TestSuites` + suite id
- Private dataset File columns → `ApplicationRoute.Datasets` + dataset id
  ([`getTestCaseColumns`](apps/ai-dial-admin/src/components/TestSuites/utils/columns.tsx) `fileContext`)

[`getEntityFileActions`](apps/ai-dial-admin/src/components/Common/FileSelectInput/constants.ts) already
maps `view` to list / upload / remove server actions. Download is missing.

The Evaluation Framework contract
([`dial-file-storage`](https://github.com/epam/ai-dial-admin-evaluation-framework-backend/blob/development/openspec/specs/dial-file-storage/spec.md)):

| Method | Path |
|--------|------|
| GET | `/api/v1/test-suites/{suiteId}/files/{filename}` |
| GET | `/api/v1/datasets/{datasetId}/files/{filename}` |

Both stream the file with `Content-Disposition: attachment; filename="{filename}"`. Delete already
targets the same path with DELETE.

CSV export of test cases already uses `streamRequest` + a Next.js GET API route + client
`fetch` + `downloadFile` ([`use-dataset-export.ts`](apps/ai-dial-admin/src/hooks/use-dataset-export.ts)).
That pattern is the right one for binary downloads: a server action cannot stream the body, and a
failed eval response can be JSON.

## Goals / Non-Goals

**Goals:**

- Row ⋮ menu with Export then Delete on every Application-tab file row.
- Export saves the original filename and bytes for both suite-owned and dataset-owned files.
- Delete behaviour unchanged aside from the Delete label.
- Export leaves selection and modal open state alone.

**Non-Goals:**

- Public-tab Export/Delete wiring in this modal.
- Rename / Move to.
- Success notification on download.

## Decisions

**Stream through Next.js API routes, not server actions.**
Same reason as dataset CSV export: `streamRequest` returns a `Response` the browser must consume.
Routes: `/api/test-suites/files/download?id=&fileName=` and `/api/datasets/files/download?id=&fileName=`.
API paths are outside the auth middleware matcher (existing `/api/*` exclusion).

**Reuse `streamRequest` on the same path as delete.**
`downloadTestSuiteFile` / `downloadDatasetFile` call
`this.streamRequest(\`${...}/files/${encodeURIComponent(fileName)}\`, fileName, token)`. Encoding
matches remove. The fallback filename passed into `streamRequest` is the original (decoded) name so
the attachment header stays correct when Content-Disposition is absent.

**`useApplicationFileExport(view)` picks the route from `ApplicationRoute`.**
Mirrors `useDatasetExport`: detect JSON / non-ok as failure, toast with existing
`Export.ErrorTitle` / `Export.ErrorDescription`, otherwise `downloadFile(blob, resolvedName)` where
`resolvedName` prefers Content-Disposition then the row `displayName`.

**`ACTION_COLUMN([getExportOperation, getDeleteOperation])` replaces `ONE_ACTION_COLUMN(getRemoveOperation)`.**
Export before Delete matches the Public tab's `download` then `delete` label order in
[`allActionLabels`](apps/ai-dial-admin/src/components/Assets/constants.ts). Delete keeps the same
`removeFile` call and Import success/error toasts; only the i18n label changes (Delete vs Remove).

**Ignore `ACTIONS_COLUMN_CEL_ID` in `onCellClicked`.**
Today the grid ignores `action-remove` so the trash click does not select the row. After the menu
change, ignore the shared actions column id so Export/Delete do not flip selection.

**No new i18n keys.** Export, Delete, and Export error strings already exist.

## Risks / Trade-offs

- **[Risk] Filename encoding mismatches between list `filename` and download path.** → Mitigation:
  delete already uses `displayName` (decoded) with `encodeURIComponent` on the wire; Export uses the
  same `displayName` for both the query param and the save fallback.
- **[Risk] Large files buffer in the browser via `res.blob()`.** → Acceptable: EF already caps upload
  size (default 50MB); same pattern as CSV export and Skills download via `window.open` for smaller
  files. Streaming to disk without buffering is out of scope.
