## Why

A query builder result can only be read on screen today: there is no way to take the rows to a spreadsheet
or hand them to someone else. ADAS now exposes CSV twins of both execution endpoints
(`POST /v1/queries/execute-csv`, `POST /v1/queries/execute-sql-csv`) that run the same body through the
same pipeline, so the admin can offer the download without computing anything of its own.

## What Changes

- An **Export CSV** action in the result header of the query builder, next to the stat tiles, shown in
  both the Table and the Chart view.
- The export re-executes **the request that produced the shown result** — not the editor's current
  content — against the CSV twin of the endpoint that ran it: a Form/JSON run goes to `execute-csv`, a SQL
  run (including an AI-message run that ran SQL) goes to `execute-sql-csv`.
- A structured export asks for the **first 1000 rows** — the service's per-request maximum — whatever page
  the grid showed: the run's filter, columns and sort are kept, its page is replaced by the first page of
  1000. A SQL export sends the statement unchanged, so its own `LIMIT` (or the service default) applies.
- When the file may not hold every matching row — the service reported a larger total, or the file reached
  1000 rows — the user is told the file is partial.
- A new route handler `/api/analytics/query/export-csv`, the CSV sibling of `/api/analytics/query`: same
  auth check, same body contract, cancellable through the client's signal, returning the bytes on success
  and the usual error envelope on failure.
- A failed export shows the service's message through the error notification and leaves the result alone.
- The file is the API's bytes as returned: no BOM, no rewriting of formula-like cells.

## Non-goals

- Bulk export past 1000 rows. The CSV endpoints keep the JSON twin's limits (maximum 1000, a larger limit is
  a 400) and are not a bulk path; looping pages from the browser would put that load on ADAS. Exporting
  everything needs a backend endpoint first.
- Rewriting SQL text to raise its limit: the statement is the user's, and string-editing it is unsafe.
- Exporting the live editor content, or the rows already held in the browser (that would bypass the
  service's column governance and drift from its CSV format).
- Excel conveniences — a UTF-8 BOM, formula-injection escaping. Both change the bytes; raise them with
  product/security before adding.
- A success toast: the browser's own download UI is the feedback.
- Exports elsewhere (dashboards, saved-query lists, session trace).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/query-viewer`: a new requirement — Export CSV of the shown result: when it is offered, which
  request it sends (and how its page is widened to 1000), which endpoint, the partial-file notice, and how a
  failure surfaces.

## Impact

- `src/server/analytics/analytics-data-api.ts` — two CSV methods over the existing
  `BaseApi.postDownloadAction`, which gains an optional `AbortSignal` (the catalog export, its only other
  caller, passes none). The download path also exposes the `X-Total-Count` header.
- `src/app/api/analytics/query/export-csv/route.ts` (new), `src/constants/api-routes.ts`.
- `src/components/Analytics/Common/use-analytics-query.ts` — an `exportCsv` runner beside the existing one,
  sharing its abort-on-unmount bookkeeping and envelope mapping.
- `src/components/Analytics/QueryBuilder/utils/` — a pure helper that widens a structured query's page to
  the export maximum, and a CSV record counter for the partial-file notice.
- `src/components/Analytics/QueryBuilder/QueryBuilder.tsx` (remember the last successful request),
  `Result/ResultArea.tsx` (the button), `src/constants/i18n.ts`, `src/locales/en.ts`.
- Requires an ADAS build with the CSV endpoints; against an older one the export fails with a 404 surfaced
  as the error notification, and Run is unaffected.
