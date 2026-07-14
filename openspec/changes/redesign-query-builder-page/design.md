# Design — Query Builder page redesign

Reference prototype: results-first workbench layout ("report" variant) from the design handoff. Only the layout and component logic are taken from the prototype; all colors, spacing, and typography come from the project's Tailwind theme tokens and the DIAL UI Kit.

## 1. Page layout

```
┌──────────────────────────────────────────────────────────────┐
│ Toolbar: [Source ▾] [TimeFilter ▾]                     [Run] │
├──────────────────────────────────────────┬───────────────────┤
│ RESULTS (main)                           │ BUILDER RAIL      │
│ ┌─ stat tiles: Rows · Fields · (Total) ─┐│ ┌ header ────────┐│
│ │                                       ││ │ « | Builder/   ││
│ ├─ [Table | Chart]  ······· (« rail) ───┤│ │   SQL/JSON     ││
│ │                                       ││ ├────────────────┤│
│ │  GridView  /  ECharts view            ││ │ [Aggregate|Rows]│
│ │                                       ││ │ section blocks ││
│ └───────────────────────────────────────┘│ └────────────────┘│
└──────────────────────────────────────────┴───────────────────┘
```

- `QueryBuilder.tsx` stays the layout hub and state owner (`QueryBuilderState` via `QueryBuilderContext`), restructured to: toolbar row, then a flex row of `ResultArea` (flex-1) and `BuilderRail` (fixed width ~`w-[480px]`, `border-l border-primary`).
- Rail collapse: local state + persisted flag in `localStorage` (SSR-safe read on client, pattern from the removed dock-position persistence). Collapsed rail renders nothing (width 0); the results header shows a "Query builder" restore button.
- The page `<h1>` title remains above the toolbar per current page conventions.

## 2. Toolbar

- **Source**: `DialSelectField` fed by `state.entities` (same wiring as today's `Source/SourceSection.tsx`, minus the schema-preview affordance and field-count status). `SchemaPreviewPopup` is deleted with `SourceSection`. Complex-entity support (`complex`/`schemaIdField` flags, `getDetailedEntitySchema` action + API method, instance-id input) is removed entirely — the backend has no detailed-schema endpoint.
- **TimeFilter**: reuse `Common/TimeFilter/TimeFilter.tsx` driven by `useTimeFilter` (`hooks/use-time-filter.ts`), preset options from `constants/global-time-filter.ts`. The hook lives in `QueryBuilder.tsx`; the resolved `TimeRange` is read at run time via `getCurrentTimeRange()`.
- **Run**: existing `DialPrimaryButton` behavior (disabled until fields loaded, while the JSON view holds unparseable JSON, or while the SQL view has an empty buffer). Builder-unrepresentable JSON does NOT disable Run.

## 3. Time range as part of the query

- The time filter is query state owned by `useTimeFilter` in `QueryBuilder.tsx` and edited by the toolbar `TimeFilter` control — a query section whose control lives in the toolbar instead of the rail. (Implementation note: rather than duplicating the range into `QueryBuilderState`, `buildQuery(state, timeBound?)` takes an optional `QueryTimeBound` — avoids two sources of truth.)
- New util `utils/time.ts`:
  - `findTimestampField(fields: AnalyticsEntityField[]): string | null` — first temporal-typed field (same type predicate the Tables feature uses for partition columns).
  - `timeRangePredicates(field, range)` — the `ge(field, startISO)` / `le(field, endISO)` predicate pair (`value_type` per the backend contract for timestamps).
  - `liftTimeRange(filter, field)` — finds a matching root-level `ge` + `le` pair on `field`, returns `{ range, restFilter }` for deserialization.
- `buildQuery(state)` serializes the predicates into `query.filter` (presets resolve to concrete timestamps via `getCurrentTimeRange()` at serialization time). The JSON view, Copy, and Run therefore all carry the same visible time bound — nothing is added at execution time.
- `parseQuery` uses `liftTimeRange`: a matching pair populates the toolbar control (as a custom range — concrete dates won't map back to a relative preset); non-matching time conditions stay ordinary filter conditions in the tree. The visual Filters section never renders the lifted pair.
- JSON runs execute the editor's query as written — deleting the predicates in JSON yields an unbounded run.
- No timestamp field detected → no predicates serialized, query runs unbounded. SQL text is never modified.

## 4. Builder rail

- **Rail header**: collapse chevron (left) + `DialSegmentedControl` with `QueryBuilderView.Form | Sql | Json` (existing enum; existing visibility rule — hidden until fields load).
- **Mode switcher**: `DialSegmentedControl` over `QueryMode.Aggregate | Row` at the top of the Form view. `Mode/ModeSelector.tsx` (radio group + DISTINCT switch) is deleted. `state.distinct` stays in the model/serializer (JSON-authored queries keep working) but has no UI; the per-aggregate DISTINCT checkbox in `Aggregate/Aggregates.tsx` is removed too.
- **Section blocks**: every section (Group by, Time buckets, Aggregates / Select, Filters, Having, Sort, Page) renders inside a shared `SectionBlock` tile: bordered block (`border-primary`, `bg-layer-2`-family token), uppercase section header with a small colored square marker (accent color per section from the Tailwind palette), and a header-right action slot (e.g. "+ Add").
- **Categorized field dropdown**: shared `CategorizedFieldDropdown` tile — a dropdown with a sticky search input and fields grouped by their schema tag/category (headers styled like the design's colored group labels; untagged fields under a default group). Search filters across name and category. Used by Group by, Aggregates, Select, Filter conditions, Sort. Built on ui-kit dropdown primitives (`DialDropdown`/`DialSelect` as fits); custom only where the kit has no grouped-with-search option.
- **Chip / collapsible rows**: shared `ChipRow` tiles — added items render compact (chip with remove ×; e.g. group-by fields, selected columns) or as collapsible rows that expand into their editor (aggregates, filter conditions, having rows), matching the prototype's collapse/expand affordance.
- Component placement: all new tiles are feature-local under `Analytics/QueryBuilder/Common/` (they encode analytics-specific schema semantics); follow `.claude/rules/components.md` for naming, styling, and state conventions.

## 5. Filter depth constraint

- `Filter/FilterGroup.tsx` receives a `depth` prop: the "Add group" action renders only at `depth === 0`; nested groups render conditions only. Existing AND/OR/NOT operators are unchanged.
- `utils/deserialize.ts` gains `isBuilderRepresentable(query): boolean`. The one and only representability rule: the filter tree may have the root group (always present) plus at most one nested group level, and nested groups contain only conditions — any group nested inside a nested group makes the query unrepresentable. Everything else in the DSL round-trips. Used by the JSON guard below.

## 6. View-switch guard (written mode → Builder)

- SQL and JSON are "written" modes. A query that is valid for the backend but not displayable in the visual builder (any SQL text; JSON whose filter nests deeper than two levels) stays fully editable **and runnable** in its written mode — Run is never disabled because of builder-representability.
- `onChangeJson` runs `JSON.parse` → `isBuilderRepresentable` → `parseQuery`. Representable JSON syncs into builder state as today. Unrepresentable JSON sets a `jsonDiverged` flag: a non-blocking informational message ("This query can't be shown in the visual builder"), builder state untouched, and Run executes the parsed JSON query directly. Invalid (unparseable) JSON keeps today's behavior: flagged, Run disabled.
- Switching to the **Builder** view is the only guarded transition, and only when the written query can't be shown there (SQL: non-empty buffer; JSON: `jsonDiverged`). A `DiscardQueryPopup` (thin wrapper over `DialConfirmationPopup`, Danger variant, portal to body — pattern: `EntityView/Modals/Discard/Discard.tsx`) warns that switching drops the current query and resets the builder to its starting point. Confirm → discard the written query (clear `sqlText` / drop the JSON edits), reset builder state to `createInitialState` defaults for the selected entity, switch. Cancel → stay in the written mode, query intact.
- SQL ⇄ JSON switches are unguarded and leave both buffers intact. (Implementation note: entering the JSON view re-seeds the editor from builder state only when the buffer is NOT diverged — a diverged JSON query survives a round trip through the SQL view instead of being silently dropped by the reseed.)

## 7. Results area

- **State**: `QueryBuilderState` (or local `QueryBuilder.tsx` state) gains `result: StructuredQueryResult | null`, `resultKind: QueryRequestKind | null`, `resultView: QueryResultView`, `chartConfig: { type: ChartType; xField: string | null; yField: string | null }`. New enums `QueryResultView { Table, Chart }` and `ChartType { Bar, Line, Area }` in `models/analytics/query-builder.ts`; option lists/defaults in `constants/analytics/query-builder.ts`.
- **Stat tiles**: row of `StatChip`s (existing component, moved out of the deleted sidebar): Rows returned (`rows.length`), Fields (`columns.length`), Total (only when `totalCount` present — structured runs with `include_total`).
- **Table view**: existing `GridView` + `utils/result.ts` column derivation, unchanged.
- **Chart view** (`Result/ResultChart.tsx`): `ReactECharts` (`echarts-for-react`, already used in `Telemetry/Dashboards/LineChart`). Option builders in `Result/chart-options.ts` using `CHART_COLOR` tokens from `Common/MetricCard/constants.ts` (no hardcoded hex outside those tokens):
  - `buildBarChartOptions(rows, x, y)` — new.
  - Line/area options modeled on `lineChartDefaultOptions` from `Telemetry/Dashboards/LineChart/constants.ts` (area = line + `areaStyle`).
  - Controls: chart type `DialSegmentedControl` (Bar/Line/Area), X `DialSelect` over the run's group-by/bucket columns, Y `DialSelect` over the run's aggregate columns (including the implicit count column when present). Defaults: first dimension X, first aggregate Y.
- **Chart availability**: derived from the *executed* query snapshot (kept alongside the result): structured aggregate run with ≥1 group-by/bucket column → chart enabled; otherwise the Chart tab shows the hint ("Charts are available for aggregate results with at least one group-by"). SQL results are table-only.
- **Empty state**: before any run, the results area shows a centered empty state (icon + "Run the query to see results" copy via i18n). Failed runs keep the previous result (existing behavior).

## 8. Deletions & cleanup

- Delete `Result/QueryResultSidebar.tsx`, the dock-position localStorage persistence, and the sidebar-opening code path in `onRun()` (results now render in-page). `StatChip.tsx` survives (used by stat tiles).
- Delete `Mode/ModeSelector.tsx`, `Source/SourceSection.tsx`, `Source/SchemaPreviewPopup.tsx`, `LabeledField.tsx`, `Fields/TaggedFieldPicker.tsx`, `Fields/FieldCheckboxGrid.tsx` (all superseded by the SectionBlock/dropdown/chip tiles).
- Remove obsolete i18n keys; add new keys (toolbar, rail, chart controls, empty states, popup copy) under the analytics i18n enum in `constants/i18n.ts` + `locales/en.ts`.

## 9. Testing approach

Per `.claude/rules/testing.md`: unit tests for utils (`time.ts`, `isBuilderRepresentable`, `chart-options.ts`), component tests for the new tiles (dropdown grouping/search, chip collapse), the guards (SQL discard popup flow, JSON unsupported flag), rail collapse/restore, results view switching, and chart availability logic. Existing serialization/deserialization tests remain valid and are extended for the depth check.
