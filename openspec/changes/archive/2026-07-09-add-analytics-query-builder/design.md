# Design — Analytics 2.0 Query Builder

## Reference behavior

The mechanics below define the builder; they are described inline so this change is self-contained. In outline:

- **Load:** fetch the queryable entities, select the first, and load its schema; the builder is unusable until a schema is present.
- **State:** the builder holds a filter tree (nested groups of AND/OR/NOT with leaf predicates), a set of projected fields, a set of group-by fields, a list of time buckets, a list of aggregate metrics, a having tree (same shape as the filter tree), a sort list, and page settings.
- **Live serialization:** every control change re-serializes the whole state into a `StructuredQuery` and re-renders the read-only JSON on the right.
- **Run:** POST the serialized query to `/v1/queries/execute` and render the returned rows in a grid.

The sections below record how each piece maps onto admin-app components and where the admin app deviates (server actions, notifications, grid).

## Layout

Two side-by-side sections. Left = builder form (scrollable). Right = JSON preview + result (sticky). Compose from existing patterns — no new generic split-shell exists:
- Simple `flex`/`grid-cols-2` split (`components/Routes/View/Properties/RouteProperties.tsx` is a precedent), or `re-resizable` if a draggable divider is wanted (`components/TestSuites/Methods/Methods.tsx`).
- Page is a client component under `components/AnalyticsV2/QueryBuilder/`; the App Router `page.tsx` renders it. Follow the entity View/TabsContent convention loosely — this is a single-purpose page, not an entity CRUD view.

## Component mapping (DIAL UI Kit + existing app components)

| Builder piece | Reuse |
| --- | --- |
| Buttons (Run, Schema preview, + condition/group/sort/agg) | `DialPrimaryButton`, `DialNeutralButton`, `DialGhostButton`, `DialGhostIconButton` (`ButtonAppearance`) from `@epam/ai-dial-ui-kit` |
| **Copy (JSON)** | **REUSE** `components/Common/CopyButton/CopyButton.tsx` — do not hand-roll `navigator.clipboard`; pass both `value` and `valueLabel` (it no-ops without `valueLabel`) |
| Entity select, operator/value-type/dir/nulls/agg-fn/bucket-unit/page-strategy dropdowns | `DialSelectField` (+ `SelectOption`) — see `components/Telemetry/TelemetryControls/Filters/CreateFilter.tsx` |
| Text/number value inputs, instance id, aliases | `DialInput`, `DialNumberInput` |
| DISTINCT / include_total / include page / is-null / projection tag-filter chips | `DialCheckbox` |
| **Projection & Group-by field grids** | multi-column responsive `DialCheckbox` grid (e.g. Tailwind `grid` with auto-fill columns) — matches the multi-column field layout; a plain checkbox grid, not `CheckboxList` |
| Mode (row/aggregate) | `DialRadioGroup` |
| Section grouping (Source/Mode/Filter/Select/Sort/Page) | `components/Common/Accordion/Accordion.tsx`, or plain labeled section blocks (each section a titled block, not a collapsible accordion) |
| Schema preview popup | `DialFormPopup`/`DialPopup` from ui-kit; JSON-view toggle reuses `CodeViewer` (or `JsonEditor` readonly) |
| **JSON preview (right)** | **REUSE** `components/Common/CodeViewer/CodeViewer.tsx` (`title`, `content`) — collapsible read-only Monaco JSON that already bundles Copy (`CopyButton`) + fullscreen. The right panel is `CodeViewer` + a Run button + a warning banner, not a bespoke editor |
| Result grid | `GridView` → `AgGridWrapper` (`components/Grid/`). **REUSE the dynamic-column technique** from `components/Runs/View/ExtractionResult.tsx` + `getAnalyticsColumns` (`Runs/View/utils.ts`) — write an equivalent `Object.keys`-based `ColDef[]` builder for the result shape |
| Filter/HAVING condition rows | model on `CreateFilter.tsx` (field select + operator select + value control + remove), but this builder is **recursive** (nested groups), which the telemetry filter is not — build a dedicated recursive tree |
| Run action + response pattern | mirror `components/Tools/Tool/TryOut.tsx` (state: request/response, button awaits a server action, sets response or error) |
| Repeatable rows (sort keys / metrics / time buckets) | no generic control exists; the visual pattern is `MetricArrayControl.tsx`'s `ArrayEditorFrame`/`ArrayItemRow` (not exported). Build small inline row lists (each is a flex row + `DialGhostIconButton` ✕ + a "+ add" `DialGhostButton`) |

## Server actions & transport

Admin-app convention is server actions delegating to the API client — the page must not call the service directly with client-side `fetch`. Add `app/[lang]/query-builder/actions.ts` (`'use server'`), each authenticating via `getUserToken()` and returning the standard `{ success, data?, errorHeader?, errorMessage? }` shape:
- `getEntities()` → `analyticsV2Api.getEntities`
- `getEntitySchema(name)` → `analyticsV2Api.getEntitySchema` (base)
- `getDetailedEntitySchema(name, idField, id)` → **new** client method
- `executeQuery(query: StructuredQuery)` → `analyticsV2Api.execute`

**Transport gap:** `AnalyticsV2Api` lacks the detailed-schema endpoint. Add:
```
getDetailedEntitySchema(name, idField, id, token) →
  GET /v1/queries/entities/schema/{encoded name}/detailed?{encoded idField}={encoded id}
```
All segments/params URL-encoded, consistent with existing helpers.

## Serialization

Implement serialization as a pure util (e.g. `components/AnalyticsV2/QueryBuilder/utils/serialize.ts`), unit-testable per `.claude/rules/utils.md`, with two functions — one mapping the whole builder state to a `StructuredQuery`, and one recursively serializing a filter/having node. Rules:
- Empty groups serialize to nothing; `not` wraps its single child (or an `and` of children).
- `in` splits the value on commas, trims, drops empties → `QueryArrayExpr` of `QueryValueExpr`.
- `is null` → `{ type: value, value_type: 'null', value: null }`.
- Aggregate `select` = group-by field exprs + `date_bin` fn entries (aliased) + aggregate fn entries (aliased); `group_by` = checked group-by fields + active bucket aliases.
- Only emit `distinct`, `filter`, `select`, `group_by`, `having`, `sort`, `page` when non-empty.

The builder's working state is UI-local (nested nodes with client ids, bucket/aggregate rows) and is **not** the same shape as `StructuredQuery`; it reuses the `Query*` enums from `models/analytics/query.ts` for value sets. See placement below.

## Models & constants placement

Following the project convention (domain types in `src/models/`, const values in `src/constants/`, with per-area subfolders like `telemetry/`, `deployments/`), the query builder's shared types and constants live in the global folders under a new `analytics` area rather than co-located in the component:

- **Models** → `src/models/analytics/query-builder.ts` — UI-local builder-state types (filter/having tree nodes with client ids, bucket rows, aggregate rows, sort rows, page settings). Sits alongside the existing `models/analytics/query.ts`, `entity.ts`, `table.ts`; reuses the `Query*` enums rather than redeclaring value sets.
- **Constants** → `src/constants/analytics/query-builder.ts` (new `constants/analytics/` folder) — fixed option lists and defaults (operator/value-type/nulls option arrays, default page limit, etc.).

Per code-standards, keep the two files split (no const values in the models file, no types in the constants file).

## Result grid — dynamic columns

The dynamic-column technique already exists — `components/Runs/View/ExtractionResult.tsx` builds runtime `ColDef[]` via `getAnalyticsColumns` (`Runs/View/utils.ts`, `Object.keys` over result rows) and drives `GridView`. Reuse that technique (the function itself is bound to `AnalyticsResult`, so write an equivalent for this result shape): prefer `result.columns` when present, else the union of keys across `result.rows`. Object/array cell values are stringified (`JSON.stringify`) for display. Row-count meta line shows `N row(s)` and total when returned.

## Open item — result total field

The model names the total-row-count field `StructuredQueryResult.total`, but the running service returns it as `totalCount` on the execute response. Confirm the real field against the live `/v1/queries/execute` response and align the model + the meta line. Until confirmed, read defensively (accept either key).

## Projection field picker with tag filter

The row-mode `SELECT` projection grid gets a tag filter above the field checkboxes: a checkbox per distinct `tag` present on the loaded schema's fields (deduped, in first-seen order; fields with no tag group under an "untagged" chip). Selecting one or more tags narrows the field list below to only fields whose `tag` is in the selection (OR semantics across selected tags); selecting no tag shows all fields. The tag filter only affects which field checkboxes are *visible* — it never changes which fields are *selected*, so a field already checked stays in the query even while filtered out of view. On schema change the tag selection resets.

Below the tag chips is a multi-column responsive `DialCheckbox` grid of the tag-filtered fields. This is scoped to the projection picker only; the aggregate `GROUP BY` grid is the same multi-column `DialCheckbox` grid without the tag chips. Tag extraction is a pure util (distinct tags from `AnalyticsEntityField[]`), unit-testable.

## Family column (schema preview)

`Family` is **not** a schema field — it is derived from the field name: the substring before the first `:`, or `"column"` when there is no `:`. Compute it in a util; do not add a model field.

## Validation

Live warnings (non-blocking banner), aggregate mode only:
- every aggregate needs an `as` alias;
- every time bucket needs a timestamp field and an alias;
- aggregate mode with no group-by, buckets, or aggregates is likely incomplete.

Run failures surface via the app's notification/toast convention (server action returns `errorHeader`/`errorMessage`).
