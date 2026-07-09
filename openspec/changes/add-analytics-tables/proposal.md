## Why

The Analytics feature has graduated from scaffold to a working implementation, but the consolidated master spec (`openspec/specs/analytics/spec.md`) still describes the scaffold state — "Query Builder and Tables pages render no content" — and predates two things now true in the code:

1. **Tables management** — a full catalog page (list source/enrichment tables, create, delete) and a detail page (column grid with in-place schema patching and row writes).
2. **The finalized data-loading model** for both pages — each page is a server component that fetches its initial data server-side and hands it to a client view that then owns interactive state (schema re-loads, edits, refresh-after-mutation). This replaced the earlier client-only "fetch on mount" approach.

This story documents the Tables capability and the finalized Query Builder data-loading and state model so the spec matches the shipped behavior.

Note: the server transport was renamed from `AnalyticsV2Api` / `analyticsV2Api` (file `analytics-v2-api.ts`) to `AnalyticsDataApi` / `analyticsDataApi` (file `server/analytics/analytics-data-api.ts`), and `execute` was replaced by `executeAction` (returning a `ServerActionResponse` so the UI can surface error headers). The broader "2.0" identifier rename (feature flag, env var, menu label) is tracked separately and is out of scope here.

## What Changes

- **Server-side initial data load (both pages):** `query-builder/page.tsx` and `tables/page.tsx` (and `tables/[id]/page.tsx`) are `async` server components (`export const dynamic = 'force-dynamic'`) that fetch initial data via server actions delegating to `analyticsDataApi` and pass it to the client view as props. Missing single-entity data resolves to `notFound()`.
- **Query Builder final loading + state:** the page prefetches the entities list and — when the first entity is simple — that entity's schema, passing `initialEntities`, `initialEntityName`, and `initialFields` as props. The client seeds `QueryBuilderState` from those props; switching entity or loading a complex entity's detailed schema happens client-side. The builder serializes to `StructuredQuery`, offers a two-way form/JSON view toggle, and runs queries in a result sidebar.
- **Tables catalog page:** lists tables in a grid (name, type, description, column count) with row navigation to the detail page and a per-row delete (red confirmation). Header actions create a source or enrichment table.
- **Create table popup:** a single form popup that is **mounted only while open** — closing unmounts it, so its state is discarded without a manual reset; the whole form is one `TableForm` object seeded on mount. Source tables collect columns (via a repeatable row editor), an ordering key, and an optional temporal partition (column + granularity); enrichment tables collect a source table and a grain key derived from that source's ordering key.
- **Table detail page:** shows the table's columns in a grid; supports column schema patches — add columns, drop, inline rename, and retag — plus writing rows from a JSON array. Each successful patch refreshes the table client-side.

## Capabilities

### Modified Capabilities
- `analytics`: the Tables page graduates from an empty render to a full catalog + detail experience; the Query Builder gains a defined server-side data-loading and state model; the data-access client is documented under its final name (`AnalyticsDataApi` / `analyticsDataApi`) with `executeAction` and the `{ tables }` list unwrap.

## Impact

- **New code:**
  - `components/Analytics/Tables/` — `TablesView` (catalog), `TableDetailView`, `CreateTablePopup`, `ColumnRowsEditor`, and `utils.ts` (`createColumnRow`, `toTableColumns`, `createTableForm`).
  - `app/[lang]/tables/actions.ts` — `getTables`, `getTable`, `createTable`, `deleteTable`, `updateTableSchema`, `addRows`.
  - `models/analytics/tables-ui.ts` — `ColumnRow`, `TableForm`; `models/analytics/table.ts` — `PartitionGranularity` enum.
- **Modified code:**
  - `app/[lang]/tables/page.tsx`, `app/[lang]/tables/[id]/page.tsx`, `app/[lang]/query-builder/page.tsx` — server-side fetch + props.
  - `components/Analytics/QueryBuilder/QueryBuilder.tsx` — seed state from props; drop the mount-time fetch.
  - `constants/i18n.ts` + `locales/en.ts` — Tables labels.

## Non-goals

- No rename of the "2.0" feature-flag / env-var / menu-label identifiers in this spec (separate follow-up).
- No saving, sharing, or history of queries or tables.
- No charts/visualization — grids only.
- No bulk row import beyond pasting a JSON array; no CSV upload.
