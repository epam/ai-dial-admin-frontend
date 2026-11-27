## Why

Files uploaded on the Application tab of the Select document modal can only be deleted. The grid
shows Display Name, Size, and a trash icon. If another user uploaded a file, there is no way to get
its content back from Admin. The Public tab already exposes Export in a row actions menu. The
Evaluation Framework already serves `GET .../files/{filename}` for both test suites and datasets;
Admin never calls it.

Tracked as [#4765](https://github.com/epam/ai-dial-admin-frontend/issues/4765).

## What Changes

- On the Application tab of the Select document modal, replace the single delete icon with a row
  actions menu (⋮) containing Export and Delete, matching the Public tab's action order.
- Export downloads the file with its original name and unchanged content via the Evaluation Framework
  download endpoints (suite-scoped and dataset-scoped).
- Delete keeps its current remove behaviour (same API call and notifications); its visible label
  becomes Delete instead of Remove.
- Export does not change the selected file or the modal state.

## Capabilities

### New Capabilities

- `select-document-application-files`: Application-tab file list in the Select document modal —
  row actions menu with Export and Delete for suite-owned and private-dataset-owned files.

### Modified Capabilities

_None._ No existing spec documents the Select document modal or Application-tab file actions.

## Impact

- [`ApplicationFileManager.tsx`](apps/ai-dial-admin/src/components/Common/FileSelectInput/ApplicationFileManager.tsx)
  — row menu (Export + Delete) instead of a single trash icon.
- Eval API clients ([`test-suites-api.ts`](apps/ai-dial-admin/src/server/eval/test-suites-api.ts),
  [`datasets-api.ts`](apps/ai-dial-admin/src/server/eval/datasets-api.ts)) — streaming download methods.
- Next.js API routes under `/api/test-suites/files/download` and `/api/datasets/files/download`.
- New `useApplicationFileExport` hook (mirrors `useDatasetExport` for CSV).
- Unit tests for API methods, the hook, and the Application tab grid actions.
- Covers both issue entry points through the shared modal: Test Suite Method multipart File fields,
  and private-dataset File columns on Test Cases / Datasets. Template-variable File fields that already
  pass `view`/`id` pick up the same menu.

## Non-goals

- Rename and Move to on Application files.
- Wiring Export/Delete handlers on the Public tab of this modal (`PublicFileManager`).
- Success toast on download (the browser save is the feedback).
- Docs under `docs/` (none describe this modal today).
