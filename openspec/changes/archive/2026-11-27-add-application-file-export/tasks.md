## 1. Eval download API

- [x] 1.1 Add `downloadTestSuiteFile(id, fileName, token)` to
      `apps/ai-dial-admin/src/server/eval/test-suites-api.ts` using `streamRequest` on
      `${TEST_SUITE_URL(id)}/files/${encodeURIComponent(fileName)}`, and cover the URL (including an
      encoded filename) in `apps/ai-dial-admin/src/server/eval/tests/test-suites-api.spec.ts`
- [x] 1.2 Add `downloadDatasetFile(id, fileName, token)` to
      `apps/ai-dial-admin/src/server/eval/datasets-api.ts` the same way, and cover it in
      `apps/ai-dial-admin/src/server/eval/tests/datasets-api.spec.ts`

## 2. Next.js download routes

- [x] 2.1 Add `GET` route `apps/ai-dial-admin/src/app/api/test-suites/files/download/route.ts`
      (query: `id`, `fileName`) that authenticates and delegates to `testSuitesApi.downloadTestSuiteFile`,
      following `apps/ai-dial-admin/src/app/api/test-suites/export/route.ts`
- [x] 2.2 Add `GET` route `apps/ai-dial-admin/src/app/api/datasets/files/download/route.ts` the same
      way for datasets
- [x] 2.3 Register `TestSuitesFilesDownload` and `DatasetsFilesDownload` on
      `apps/ai-dial-admin/src/constants/api-routes.ts`

## 3. Export hook and Application tab UI

- [x] 3.1 Add `useApplicationFileExport` in `apps/ai-dial-admin/src/hooks/use-application-file-export.ts`
      (mirrors `use-dataset-export.ts`: fetch by view, treat JSON / non-ok as failure with
      `Export.ErrorTitle` / `Export.ErrorDescription`, otherwise `downloadFile` with
      Content-Disposition name or the provided fallback filename), and cover success + error in
      `apps/ai-dial-admin/src/hooks/tests/use-application-file-export.spec.ts`
- [x] 3.2 In `ApplicationFileManager.tsx`, replace `ONE_ACTION_COLUMN(getRemoveOperation)` with
      `ACTION_COLUMN([getExportOperation(onExport), getDeleteOperation(onRemoveFile)])`, ignore
      `ACTIONS_COLUMN_CEL_ID` in `onCellClicked`, and ensure Export does not toggle loading or selection
- [x] 3.3 Add `apps/ai-dial-admin/src/components/Common/FileSelectInput/tests/ApplicationFileManager.spec.tsx`
      (mock `GridView`) asserting Export and Delete row actions and that a click on the actions column
      does not change the selected file path

## 4. Quality gate

- [x] 4.1 Run lint, format, typecheck, typecheck:specs, and the touched vitest files from
      `apps/ai-dial-admin/`; fix any failures

No browser-verification task: scenarios are browser-observable, but the task was omitted pending
confirmation (plan gate). Unit coverage above stands alone.
