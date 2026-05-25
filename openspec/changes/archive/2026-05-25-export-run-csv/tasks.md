## 1. Foundation — i18n, models, API layer

- [x] 1.1 Add `Export` and `ExportCsv` keys to `ButtonsI18nKey` in `src/constants/i18n.ts` and corresponding strings in `src/locales/en.ts`
- [x] 1.2 Add new `ExportRunI18nKey` enum to `src/constants/i18n.ts` with keys: `ExportRunTitle`, `ColumnsAccordionLabel`, `PreviewAccordionLabel`, `ExportError`; add strings to `src/locales/en.ts`
- [x] 1.3 Add `EvalSummaryExportRequestDto` and `EvalSummaryPreviewResponse` type definitions to `src/models/evaluation/` (request body shape: `{ runId, computation, columns, delimiter }`; preview response: `unknown[][]`)
- [x] 1.4 Add `exportPreview(runId: string, token: Token)` method to `AnalyticsApi` in `src/server/eval/analytics-api.ts` — GET `${ANALYTICS_RESULTS_URL}/export/preview?runId=&computation=latest`, returns `unknown[][] | null`
- [x] 1.5 Add `exportCsv(dto: EvalSummaryExportRequestDto, token: Token)` method to `AnalyticsApi` — direct `fetch` POST to `${ANALYTICS_RESULTS_URL}/export.csv`, returns `{ blob: Blob; fileName: string } | null` (reads filename from `Content-Disposition` header, falls back to `run-export.csv`)
- [x] 1.6 Add `exportRunPreview(runId: string)` server action to `src/app/[lang]/runs/actions.ts`
- [x] 1.7 Create Next.js API route `src/app/api/eval/export-csv/route.ts` — POST handler that gets token, calls `analyticsApi.exportCsv`, and pipes the CSV response (with correct headers) back to the client

## 2. Action menu — Export operation

- [x] 2.1 Add `getExportOperation<T>` factory function to `src/constants/grid-columns/actions.tsx` following the same pattern as `getDeleteOperation`
- [x] 2.2 Update `src/components/TestSuites/Runs/Runs.tsx`: add `selectedExportRun` / `isExportModalOpen` state, `onOpenExportModal` / `onCloseExportModal` callbacks, and insert `getExportOperation(onOpenExportModal)` between `getOpenInNewTabOperation` and `getDeleteOperation` in `columnDefs`
- [x] 2.3 Update the global runs list (`src/app/[lang]/runs/page.tsx` or its grid component) with the same Export action column entry as 2.2

## 3. Column grouping utility

- [x] 3.1 Create `src/components/Runs/Export/utils/group-columns.ts` — pure function `groupColumns(columns: string[]): ColumnGroup[]` that maps column names to groups (Identification, Data, Response, Metrics, Body) using prefix rules from design.md; within Metrics, sub-groups by metric name
- [x] 3.2 Write unit tests for `group-columns.ts` in `src/components/Runs/Export/tests/group-columns.spec.ts` covering: data prefix, response prefix, metric sub-grouping, metricInfo/metricError, body columns, identification fallback, default checked state

## 4. Export Run popup components

- [x] 4.1 Create `src/components/Runs/Export/models.ts` with `ColumnGroup`, `ColumnItem`, `ExportRunModalProps` interfaces
- [x] 4.2 Create `src/components/Runs/Export/ColumnsAccordion.tsx` — renders grouped checkboxes in a 4-column grid using `DialCheckbox`, group header checkbox (checked/indeterminate/unchecked), accordion label with selected count; accepts `groups: ColumnGroup[]`, `checkedColumns: Set<string>`, `onToggleColumn`, `onToggleGroup` props
- [x] 4.3 Create `src/components/Runs/Export/PreviewAccordion.tsx` — renders AG Grid (`AgGridWrapper`/`AgGridReact`) with `clientSideRowModel`, derives `columnDefs` and `rowData` from `previewData` filtered by `checkedColumns`; fixed container height (e.g. `h-64`); shows loading spinner while `isLoading`, error message on `error`
- [x] 4.4 Create `src/components/Runs/Export/ExportRunModal.tsx` — `DialPopup` with `PopupSize.Lg`; on mount fetches preview via `exportRunPreview(runId)`; manages `checkedColumns` state (default all checked except body); renders `ColumnsAccordion` + `PreviewAccordion` inside two `Accordion` wrappers; footer has Cancel (`DialButton`) and Export CSV (`DialButton`, disabled while `isExporting`); on Export CSV click calls `POST /api/eval/export-csv` with checked columns, calls `downloadFile(blob, fileName)`, shows success or error notification via `useNotification`

## 5. Run detail view — button reorder and Export entry point

- [x] 5.1 Update `src/components/Runs/View/View.tsx`: add `isExportModalOpen` state and `onOpenExportModal` / `onCloseExportModal` callbacks; pass `[<DialButton Export />, <div divider />, <DialLinkButton Grafana />]` as children to `SimpleEntityHeader` (replacing the current Grafana-only child); render `ExportRunModal` via `createPortal` when open

## 6. Tests

- [x] 6.1 Write unit tests for `ColumnsAccordion.tsx` in `src/components/Runs/Export/tests/ColumnsAccordion.spec.tsx` — group rendering, group checkbox indeterminate state, individual toggle, count label update
- [x] 6.2 Write unit tests for `ExportRunModal.tsx` in `src/components/Runs/Export/tests/ExportRunModal.spec.tsx` — preview fetch on mount, column toggle updates preview grid columns, Export CSV button disabled during export, success notification shown, error notification on fetch failure

## 7. Quality checks

- [x] 7.1 Run `npm run lint` from the repo root and fix any reported issues
- [x] 7.2 Run `npm run format:write` from the repo root
- [x] 7.3 Run `npm run test` from `apps/ai-dial-admin/` and ensure all tests pass
