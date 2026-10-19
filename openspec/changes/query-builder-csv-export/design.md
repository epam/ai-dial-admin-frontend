## Context

Run goes browser → `useAnalyticsQuery` → route handler `/api/analytics/query` → `AnalyticsDataApi.executeAction`
/ `executeSqlAction` → ADAS. The route exists because a server action carries no `AbortSignal`; it answers
every outcome with a `ServerActionResponse` envelope.

ADAS's CSV twins (`execute-csv`, `execute-sql-csv`) take the same bodies and return `text/csv` with
`Content-Disposition: attachment; filename="result.csv"` on success and `ErrorView` JSON on failure,
whatever `Accept` says.

`BaseApi.postDownloadAction` already does the server half of a file download — raw blob plus file name on
success, the shared envelope on failure — for the catalog export. It takes no `signal`.

`QueryBuilder` keeps `result` and `resultMeta`, but not the request that produced them; `ExecutedQueryMeta`
holds derived labels, not the body.

## Goals / Non-Goals

**Goals:** one cancellable path for the export that reuses the run's auth, cancellation and error mapping;
the file stays byte-identical to the API's.

**Non-Goals:** streaming (the body is at most 1000 rows); paging past 1000 rows (see proposal Non-goals).

## Decisions

### Reuse `postDownloadAction`, give it a signal and the total

The two API methods (`executeCsvAction`, `executeSqlCsvAction`) call `postDownloadAction` with a new
optional `signal` parameter that it forwards to `fetchRegistered`, the same way `postAction` does.
`DownloadedFile` gains an optional `totalCount`, read from `X-Total-Count` by a shared `getTotalCount`
(`utils/api/`) that drops a missing or non-numeric header, so a `NaN` never passes for a reported total. The
catalog export is unaffected (it passes no signal and its response carries no such header).

*Alternative:* a dedicated CSV fetch in `AnalyticsDataApi`, as the eval export does. Rejected: it would
re-implement the registry wiring and the `ErrorView` parsing that `handleResponse` owns, and the eval
export's "any failure → null" is exactly what this one cannot afford — a 400 naming an unknown column or a
422 budget error has to reach the user.

### A sibling route handler, not a server action

`/api/analytics/query/export-csv` mirrors `/api/analytics/query`: the same `isAuthRequired && !token` → 401
check (`/api` is outside the middleware matcher), the same `{ query?, sql? }` body and 400 for neither, the
same try/catch to an envelope, and `req.signal` passed on. On success it returns the bytes with
`text/csv; charset=UTF-8`, a `Content-Disposition` built by `buildFilenameDisposition`, and `X-Total-Count`
when the service sent one; on failure it
returns the envelope as JSON with HTTP 200, as the sibling does, so the client reads one shape.

*Alternative:* a server action, as the catalog export uses. It can return a `Blob`, but it cannot be
cancelled, which is why Run moved off actions; the export follows Run.

### The client tells a file from a failure by content type

`useAnalyticsQuery` gains `exportCsv(request: QueryRunRequest)`, built on the same controller set so an
unmount aborts it. A response whose `Content-Type` starts with `text/csv` is read as a blob, its file name
taken from `Content-Disposition` (`getFileNameFromContentDisposition`, falling back to `result.csv`) and
the total from `X-Total-Count`;
anything else goes through the envelope-to-outcome mapping `post()` uses today, factored out so both share
it. Like the run, it never rejects.

### Export the request that produced the result

`QueryBuilder` stores `lastRequest: QueryRunRequest | null`, set together with `result` on every
successful run (`onRun` and `onRunAiMessage`) and cleared together with it in `clearResult`. A failed run
does not touch it, which is what keeps it bound to the result still on screen. The handler downloads with
`downloadFile` (`utils/download.ts`) or shows `getErrorNotification` exactly as `onRun` does.

*Alternative:* derive the request from the editor at click time. Rejected: the user may have edited since
Run, and the file would not match the grid.

### Widen a structured page to the export maximum

A pure `toExportQuery(query)` in `components/Analytics/QueryBuilder/utils/` returns the query with its page
replaced by the first page of `EXPORT_ROW_LIMIT` (1000, beside `DEFAULT_PAGE_LIMIT`): offset → offset 0 with
the run's `include_total`; cursor → `cursor: null`; absent → an offset page without a total. The
structured branch of the export applies it; the SQL branch sends the statement as run.

*Alternatives:* export the run's own page (rejected by the user: a default run holds 25 rows); loop pages of
1000 from the browser to fetch everything (rejected: the CSV endpoints are not a bulk path, and the loop
would turn one click into an unbounded series of ClickHouse scans); raise a SQL statement's `LIMIT` by
editing its text (rejected: unsafe string surgery on user SQL — an explicit `LIMIT 5000` already comes back
as the service's 400).

### Tell the user when the file may be partial

After a successful export, a pure `countCsvRecords(text)` counts records with RFC 4180 quoting (a CRLF
inside a quoted field is not a record end) and subtracts the header. With a `totalCount` above that count,
the notice names both; otherwise a count equal to `EXPORT_ROW_LIMIT` says the maximum was reached. The
check reads the blob's text once; at 1000 rows that is cheap. `NotificationType` has no warning kind, and
adding one would touch the shared notification container for one caller, so the notice is a success
notification (`getSuccessNotification`) titled "CSV exported" whose description carries the partial-file
text — the download did succeed, and the container already announces it.

The ceiling is also stated up front: the button's `tooltipProps` give it the kit's 2.0 tooltip (hover and
focus), reading "Downloads up to 1,000 rows as CSV." — a SQL result adds "A lower LIMIT in your query
exports fewer." The kit links its tooltip to the button only while it is open, so the same text also sits
in an sr-only node wired as the button's `aria-describedby`, and a screen-reader user hears it without
opening the tooltip.

*Alternative:* request 1001 rows to detect overflow exactly. Not possible — the service rejects a limit
above 1000.

### Button placement

`ResultArea`'s header row, after the stat chips, right-aligned — a 2.0 `GhostButton` with `IconDownload`
(`aria-hidden`) and visible label text. It is a result action, so it does not belong in the toolbar, which
is shared by the authoring views and hidden for Run in the AI view. The 2.0 button has no loading state, so
while `isExporting` the icon slot holds a `DialLoader` (wrapped `aria-hidden`, so the name stays "Export
CSV") and the button carries `aria-busy`. New props: `onExportCsv`, `isExporting`; visibility follows `hasResult`, enablement `!isRunning && !isExporting`.

## Risks / Trade-offs

- [More than 1000 matching rows cannot be exported] → the partial-file notice says so; a full export needs a
  backend bulk endpoint.
- [Exactly 1000 matching rows with no total triggers a "may be partial" notice that is a false alarm] →
  accepted; the wording says "may".
- [A relative time range is re-evaluated at export time, so the file can differ from the grid by rows that
  arrived since Run] → stated in the spec; exact-rows fidelity would need absolute bounds in the body.
- [Formula-like cells are written as-is, so Excel may evaluate user-controlled text] → out of scope by
  decision; raise with security before shipping widely.
- [An ADAS build without the CSV endpoints answers 404] → surfaced through the error notification; Run is
  unaffected.

## Migration Plan

None: frontend-only, behind the existing `ANALYTICS_ENABLED` flag. Rollback is a revert.
