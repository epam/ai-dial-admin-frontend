## Context

The backend has added two endpoints under `/api/v1/analytics/eval-summaries/`:
- `GET /export/preview?runId=&computation=latest` — returns up to 10 rows as `List<List<Object>>` (first element is the header row of column names).
- `POST /export.csv` — accepts `{ runId, computation, columns[], delimiter }` and streams a `text/csv` response.

Column names use a prefix scheme: `data:*`, `response:*`, `metric:*` / `metricInfo:*` / `metricError:*`, `requestBody` / `responseBody` / `extractionWarnings` (body), and unprefixed flat columns (identification). The response carries no explicit group metadata; groups are inferred client-side from prefixes.

The frontend currently has no export surface for evaluation runs. The existing download utility (`utils/download.ts` → `downloadFile(blob, name)`) and notification system (`NotificationContext`) are reused directly.

## Goals / Non-Goals

**Goals:**
- Export button in run detail view header (Delete → Export → divider → Grafana).
- Export menu item in runs list action menus (global list + test suite Runs tab).
- Export popup with Columns accordion (grouped checkboxes, 4-column grid) and Preview accordion (AG Grid, client-side filtered, up to 10 rows).
- CSV download via POST with selected columns; success/error notification.

**Non-Goals:**
- Custom delimiter selection (always `,`).
- Choosing computation — always `latest`.
- Pagination or full dataset preview.
- Export of anything other than eval run CSV.
- Changes to `SimpleButtonsWrapper` or `SimpleEntityHeader`.

## Decisions

### D1: Button placement via children, no new props on SimpleButtonsWrapper

`SimpleButtonsWrapper` renders `{children}` after the Delete button. `View.tsx` passes `[<ExportButton />, <divider />, <GrafanaLink />]` as children to `SimpleEntityHeader`. This gives the required order (Delete → Export → divider → Grafana) without modifying any shared header component.

*Alternative considered*: restructure `View.tsx` to bypass `SimpleEntityHeader` entirely and own the full header layout. Rejected — more invasive and loses the shared entity header behaviour for free (readonly ID, tab rendering).

### D2: Column grouping inferred from prefix, hardcoded mapping

Groups are determined client-side by prefix pattern. Render order: Identification → Data → Response → Metrics → Body.

| Prefix pattern | Group |
|---|---|
| `data:*` | Data |
| `response:*` | Response |
| `metric:*`, `metricInfo:*`, `metricError:*` | Metrics |
| `requestBody`, `responseBody`, `extractionWarnings` | Body |
| everything else | Identification |

Within Metrics, columns are further sub-grouped by metric name (second segment of `metric:Name:field`). Body columns default to unchecked; all others default to checked.

*Alternative considered*: add a BE endpoint returning group metadata. Rejected — the prefix scheme is stable and well-defined; a separate endpoint adds round-trip latency and BE work.

### D3: Preview is entirely client-side

Preview data is fetched once when the modal opens (GET `/export/preview`). Column toggling re-derives AG Grid `columnDefs` and `rowData` client-side from the cached payload — no re-fetch per checkbox change. AG Grid client-side row model (not infinite) is used since the dataset is capped at 10 rows.

### D4: CSV download via a new Next.js API route

The export endpoint requires a Bearer token (only available server-side) and returns `text/csv` (not `application/octet-stream`, so `BaseApi.sendRequest` would not short-circuit to the raw `Response`). A new Next.js API route `POST /api/eval/export-csv` proxies the request with auth and pipes the response back to the client. The client then receives a blob, calls `downloadFile(blob, fileName)`, and shows a notification.

`fileName` is read from the `Content-Disposition: attachment; filename="..."` header returned by the backend.

*Alternative considered*: add `text/csv` to `BaseApi.sendRequest`'s content-type check. Rejected — too broad a change to a core utility for a single use case.

### D5: AG Grid for preview, not `<table>`

Consistent with the rest of the app. Uses the same `AgGridWrapper`/`AgGridReact` stack with `clientSideRowModel`, no `storageKey` (ephemeral — column state should not persist for a preview), auto-size columns.

### D6: Export modal state scoped locally, not in context

The modal is opened from two surfaces (header button, list action menu) but there is no shared state needed — each open is independent and scoped to one `runId`. `useState` in the triggering components suffices.

## Risks / Trade-offs

- **Column name display**: BE sends raw column names (`data:prompt`, `metric:Accuracy:score`). The UI strips the prefix for the checkbox label and formats metric columns as `Accuracy / score`. If BE adds new prefix patterns, the grouping logic needs updating.
- **Large column lists**: A run with many metrics could produce hundreds of columns. The 4-column checkbox grid scrolls within the accordion — no pagination. Max 512 columns per BE validation.
- **AG Grid in a popup**: AG Grid requires an explicit height on its container. Preview accordion must set a fixed height (e.g. `h-64`) when expanded to avoid a zero-height grid.
- **Filename fallback**: If `Content-Disposition` header is absent or malformed, fall back to `run-export.csv`.
