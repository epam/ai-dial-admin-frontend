## Why

Users need to export evaluation run results to CSV for offline analysis and reporting. The backend has added two new endpoints (`/api/v1/analytics/eval-summaries/export/preview` and `/api/v1/analytics/eval-summaries/export.csv`) but there is no UI surface to invoke them.

## What Changes

- **Run detail view header**: reorder buttons to Delete → Export → divider → Grafana traces link; add Export button that opens the export popup.
- **Runs list action menu** (both global runs list and test suite Runs tab): add Export item between "Open in new tab" and "Delete".
- **Export run popup**: new `PopupSize.Lg` dialog with two accordions — Columns (checkbox selection grouped by category with group-level toggle, displayed in a 4-column grid) and Preview (AG Grid showing up to 10 live-filtered rows); footer has Cancel and Export CSV buttons.
- **CSV download**: on confirm, POST to backend export endpoint with selected columns, download resulting CSV file client-side, show success/error notification.
- **New Next.js API route**: `POST /api/eval/export-csv` to proxy the authenticated export request server-side.
- **New API methods**: `exportCsv` and `exportPreview` on `AnalyticsApi`.
- **New server actions**: `exportRunPreview` and `exportRunCsv` in `app/[lang]/runs/actions.ts`.
- **New i18n keys**: Export and Export CSV in `ButtonsI18nKey`; popup-specific labels in a new `ExportRunI18nKey`.

## Capabilities

### New Capabilities

- `run-csv-export`: Export popup UI — column selection with grouping, live preview grid, CSV download flow.

### Modified Capabilities

<!-- No existing spec-level behavior changes -->

## Impact

- `components/Runs/View/View.tsx` — button reorder, export modal integration.
- `components/TestSuites/Runs/Runs.tsx` — add Export to action column.
- Global runs list page (app/[lang]/runs) — same action column change.
- `constants/grid-columns/actions.tsx` — add `getExportOperation`.
- `server/eval/analytics-api.ts` — add `exportCsv` and `exportPreview` methods.
- `app/[lang]/runs/actions.ts` — add `exportRunPreview` and `exportRunCsv` server actions.
- New Next.js API route: `app/api/eval/export-csv/route.ts`.
- `constants/i18n.ts` — new keys in `ButtonsI18nKey` and new `ExportRunI18nKey` enum.
- No changes to `SimpleButtonsWrapper`, `SimpleEntityHeader`, or `BaseApi`.
- No breaking changes to existing functionality.
