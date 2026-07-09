## Why

The Analytics 2.0 scaffold shipped the menu, routes, feature flag, and the `AnalyticsV2Api` transport, but `/query-builder` renders nothing. This story builds the actual Query Builder UI: an interactive view that lets an operator assemble a valid `StructuredQuery` envelope against a discovered entity schema, preview it as JSON, run it against `/v1/queries/execute`, and see the result as a grid.

The interaction model is: on load, list the queryable entities, auto-select the first, and load its field schema; then let the user assemble a query through form sections (mode, filter, projection or aggregation, sort, page) whose combined state is serialized live into the `StructuredQuery` JSON shown on the right; a Run action posts that JSON to `/v1/queries/execute` and renders the returned rows in a grid. The models already exist (`models/analytics/query.ts`, `entity.ts`) and `analyticsV2Api` already exposes `getEntities`, `getEntitySchema`, and `execute`, so this is predominantly UI plus a small transport gap (detailed schema for complex entities).

This is a follow-up story against the consolidated master spec at `openspec/specs/analytics/spec.md`.

## What Changes

- **Query Builder page** at `app/[lang]/query-builder/page.tsx` — a two-section view: the builder form (left) and the JSON preview + result (right).
- **Source + default load:** on mount, list entities, auto-select the first, and auto-load its schema (no manual "Load schema" step). A **Schema preview** button opens a popup rendering the schema as a grid (Field, Type, Family, Source, Tag) with a toggle to raw JSON. Complex entities require an instance id and load a detailed schema.
- **Builder sections** driving the `StructuredQuery` envelope:
  - **Mode:** `row` (projection) vs `aggregate` (group + metrics); `SELECT DISTINCT` toggle.
  - **Filter (WHERE):** recursive AND/OR/NOT groups with field/operator/value predicates, `is null` for `eq`/`ne`, `in` → value array.
  - **Row mode:** `SELECT` projection field grid.
  - **Aggregate mode:** `GROUP BY` grid, `date_bin` time buckets, aggregate metrics (fn/field/distinct/alias), and a `HAVING` builder over the aggregate output.
  - **Sort:** field + direction + nulls ordering.
  - **Page:** offset (offset/limit/include_total) or cursor (cursor/limit) strategy.
- **JSON preview (right):** live-serialized envelope, Copy, and Run; a validation banner surfaces aggregate mode warnings.
- **Result (right):** Run executes via a server action and renders rows in a grid with dynamically derived columns and a row-count meta line; empty and error states handled.
- **Transport gap:** add a detailed-schema method to `AnalyticsV2Api` (`GET /v1/queries/entities/schema/{name}/detailed?{idField}={id}`) and server actions for entities / schema / execute.

## Capabilities

### Modified Capabilities
- `analytics`: the Query Builder page graduates from an empty render to a full structured-query builder with JSON preview and result grid; the query server actions and a detailed-schema client method are added.

## Impact

- **New code:**
  - `components/AnalyticsV2/QueryBuilder/` — page shell, source/schema-preview, mode, filter tree, select, aggregate (group-by/buckets/aggregates/having), sort, page, JSON preview, result grid, plus co-located `models.ts`/`constants.ts` and a query-serialization util.
  - `app/[lang]/query-builder/actions.ts` — `getEntities`, `getEntitySchema` (base + detailed), `executeQuery`.
- **Modified code:**
  - `app/[lang]/query-builder/page.tsx` — render the builder.
  - `server/analytics/analytics-v2-api.ts` — add `getDetailedEntitySchema(name, idField, id)`.
  - `models/analytics/query.ts` — reconcile the result total field (see design) if the backend returns `totalCount`.
  - `constants/i18n.ts` + `locales/en.ts` — Query Builder labels.
- **Open item (must confirm against live backend):** the execute response's total-row-count field is modeled as `StructuredQueryResult.total`, but the running service returns it as `totalCount`; the UI must read whichever key the live `/v1/queries/execute` response actually carries.

## Non-goals

- No Tables UI (separate story).
- No saving / sharing / history of queries; the builder is stateless per page load.
- No editing the JSON preview by hand to drive the form; the preview is read-only and always derived from the form state.
- No new query capabilities beyond what the structured-query DSL already supports.
- No charts/visualization of results — grid only.
