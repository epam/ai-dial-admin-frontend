## 1. Server path

- [x] 1.1 `src/models/download.ts`: add optional `totalCount` to `DownloadedFile`; `src/server/base-api.ts`: give `postDownloadAction` an optional `signal` forwarded to `fetchRegistered` and fill `totalCount` from `X-Total-Count` through a shared `src/utils/api/get-total-count.ts`, which drops a missing or non-numeric header
- [x] 1.2 `src/server/analytics/analytics-data-api.ts`: add `QUERIES_EXECUTE_CSV_URL`, `QUERIES_EXECUTE_SQL_CSV_URL` and `executeCsvAction(query, token, signal?)` / `executeSqlCsvAction(sql, token, signal?)` over `postDownloadAction` (the `result.csv` fallback for an unnamed file lives in the route and the client runner)
- [x] 1.3 `src/constants/api-routes.ts`: add `AnalyticsQueryCsv = '/api/analytics/query/export-csv'`; create `src/app/api/analytics/query/export-csv/route.ts` mirroring `app/api/analytics/query/route.ts` (401 without a token when auth is on, 400 for neither `query` nor `sql`, `req.signal` passed on, thrown error → 500 envelope); success returns the bytes with `text/csv; charset=UTF-8`, `Content-Disposition` via `buildFilenameDisposition` (named `result.csv` when the service sent no name), and `X-Total-Count` when present; failure returns the envelope as JSON like the sibling

## 2. Client runner and helpers

- [x] 2.1 `src/components/Analytics/Common/use-analytics-query.ts`: factor the envelope-to-outcome mapping out of `post()`; add `CsvOutcome` and `exportCsv(request: QueryRunRequest)` on the same controller set — `text/csv` responses read as blob + file name (`getFileNameFromContentDisposition`) + `getTotalCount`, anything else mapped as an envelope; never rejects, abort → `isCancelled`
- [x] 2.2 `src/constants/analytics/query-builder.ts`: add `EXPORT_ROW_LIMIT = 1000`; `src/components/Analytics/QueryBuilder/utils/`: pure `toExportQuery(query)` (offset → offset 0 keeping `include_total`, cursor → `cursor: null`, absent → offset page without a total; limit `EXPORT_ROW_LIMIT`, everything else unchanged) pure `countCsvRecords(text)` (RFC 4180, quoted CRLF is not a record end, header excluded), and pure `getPartialExportNotice(count, totalCount?)` choosing the partial-file notice

## 3. Query builder UI

- [x] 3.1 `src/constants/i18n.ts` + `src/locales/en.ts` (`QueryBuilder` block): `ExportCsv`, `ExportCsvHint`, `ExportCsvSqlHint`, `ExportCsvFailed`, `ExportCsvDone`, `ExportCsvPartialOfTotal` (names file and total counts), `ExportCsvPartialAtLimit`
- [x] 3.2 `src/components/Analytics/QueryBuilder/QueryBuilder.tsx`: `lastRequest` state set beside `setResult(response)` on every successful run (`onRun`, `onRunAiMessage`), cleared in `clearResult`, untouched by a failed run; `isExporting` state; `onExportCsv` sends `toExportQuery(lastRequest.query)` for a structured request or the SQL as run, downloads with `downloadFile`, shows the partial-file notice via `getSuccessNotification` when `totalCount` exceeds the record count or the count equals `EXPORT_ROW_LIMIT`, and shows `getErrorNotification` on failure
- [x] 3.3 `src/components/Analytics/QueryBuilder/Result/ResultArea.tsx`: Export CSV 2.0 `GhostButton` (`IconDownload`, `aria-hidden`; a `DialLoader` and `aria-busy` while exporting) right-aligned in the header row, shown when `hasResult` in both views, disabled while running or exporting, with the hint (SQL variant for a SQL result) as its `tooltipProps` tooltip and, through an sr-only node, its `aria-describedby`; new props `onExportCsv`, `isExporting` (the hint variant reads `meta.kind`)

## 4. Tests

- [x] 4.1 `src/app/api/analytics/query/export-csv/route.spec.ts` (modelled on the sibling `route.spec.ts`): structured and SQL dispatch with `(body, token, req.signal)`, 401, 400, failure envelope passed through, thrown error → 500, success headers including `X-Total-Count` only when present
- [x] 4.2 `src/server/analytics/tests/analytics-data-api.spec.ts` and the `base-api` spec: CSV success with file name and total, file-name fallback, `ErrorView` 400/422 mapped to the envelope, signal forwarded; catalog export unchanged
- [x] 4.3 `use-analytics-query` spec: CSV success, JSON-envelope failure, non-JSON failure body, abort on unmount; unit specs for `toExportQuery` and `countCsvRecords` (quoted newlines, header-only file, trailing CRLF)
- [x] 4.4 `src/components/Analytics/QueryBuilder/tests/QueryBuilder.spec.tsx` / `ResultArea` spec: no button before a run; enabled after, in Table and Chart views and for zero rows; hint key in the tooltip and accessible description (SQL variant for SQL); export after an editor edit still sends the run's request with the widened page; failed run keeps the earlier request; success calls `downloadFile`; partial notices for total > count and count == 1000, none below; failure shows the error and leaves the grid

## 5. Browser verification

- [x] 5.1 Run the `spec-browser-verify` skill for this change against the local stack (auth disabled, an ADAS build with the CSV endpoints): it builds a VerificationRequest from the `analytics/query-viewer` delta's browser-observable scenarios (button absent before a run, shown in Table/Chart and for zero rows, ceiling tooltip on hover and focus, disabled while exporting, download, partial-file and failure notifications) and spawns `spec-verification-gate`; resolve every `fail` verdict before moving on

## 6. Quality gates

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; all pass
