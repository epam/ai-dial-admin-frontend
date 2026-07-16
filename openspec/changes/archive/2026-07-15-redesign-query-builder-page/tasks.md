# Tasks — Query Builder page redesign

> Delivery plan — the change ships as four stacked PRs, each landing green with transitional design allowed:
> **PR 1** layout swap + toolbar + time-in-query + complex-entity removal (sections 3, 4.1 partially, 7.1–7.2a subset) ·
> **PR 2** rail content redesign — tiles/palette/sections/mode/filter-depth/warning icons (sections 1–2, 4.2, 5) ·
> **PR 3** results content — stat tiles, Table⇄Chart, ECharts, implicit count (section 6) ·
> **PR 4** written-mode behaviors — SQL generation/seeding, discard guard, diverged JSON (sections 4.3–4.5).

> Browser verification task: intentionally omitted — the user was asked and opted out; coverage relies on the unit/component tests below.

## 1. Models, constants, i18n

- [x] 1.1 Extend `src/models/analytics/query-builder.ts`: add enums `QueryResultView` (`Table`, `Chart`) and `ChartType` (`Bar`, `Line`, `Area`); add types `ChartConfig` (`type`, `xField`, `yField`) and `ExecutedQueryMeta` (kind, mode, dimension columns, aggregate columns — the snapshot the chart availability logic reads). No inline anonymous object types.
- [x] 1.2 Extend `src/constants/analytics/query-builder.ts`: chart-type options, result-view options, rail width/localStorage key for the collapsed state, default `ChartConfig`.
- [x] 1.3 Add i18n keys (`src/constants/i18n.ts` analytics enum + `src/locales/en.ts`): toolbar labels, rail title/collapse/restore, mode switcher labels, discard-SQL popup header/description/confirm, unsupported-in-builder JSON message, results empty state, stat tile labels (Rows, Fields, Total), chart controls (Chart, Table, chart types, X, Y), chart-unavailable hint.

## 2. Reusable rail tiles

- [x] 2.1 Create `src/components/Analytics/QueryBuilder/Common/SectionBlock.tsx` — bordered section block: labeled uppercase header with colored marker, header-right action slot, children body. Tailwind theme tokens only.
- [x] 2.2 Create `src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown.tsx` — searchable dropdown over `AnalyticsEntityField[]`, options grouped by tag/category (untagged under a default group), sticky search input filtering name + category, keyboard/outside-click close. Build on ui-kit dropdown primitives where possible.
- [x] 2.3 Create `src/components/Analytics/QueryBuilder/Common/ChipRow.tsx` (+ `FieldChip`) — compact removable chip for plain fields and a collapsible row variant (summary text collapsed ⇄ expanded editor children) for parameterized items.
- [x] 2.4 Unit/component tests for the three tiles — grouping and search filtering in the dropdown, empty-search state, chip remove callback, collapse/expand summary rendering; files under `src/components/Analytics/QueryBuilder/Common/tests/`.

## 3. Toolbar and time-range injection

- [x] 3.1 Create `src/components/Analytics/QueryBuilder/Toolbar/QueryBuilderToolbar.tsx` — source `DialSelectField` (entities from context; no schema-preview affordance), `TimeFilter` (`Common/TimeFilter` + `useTimeFilter` with `timePeriodOptionsConfig`), Run `DialPrimaryButton` right-aligned (disabled only when: fields not loaded, JSON view with unparseable JSON, or SQL view with empty buffer — builder-unrepresentable JSON never disables Run).
- [x] 3.2 Create `src/components/Analytics/QueryBuilder/utils/time.ts` — `findTimestampField(fields)` (first temporal-typed field, same type predicate used for table partition columns), `timeRangePredicates(field, range)` (`ge`/`le` predicate pair), and `liftTimeRange(filter, field)` (extract a matching root-level pair → `{ range, restFilter }`).
- [x] 3.3 Make the time range part of the query: add `timeRange`/preset to `QueryBuilderState`; `buildQuery(state)` serializes the predicate pair into `query.filter` (presets resolved via `getCurrentTimeRange()` at serialization time); `parseQuery` lifts a matching pair back into the toolbar control (custom range) and keeps other time conditions as ordinary filter conditions; the visual Filters tree never renders the lifted pair; JSON runs execute the editor's query as written; SQL text untouched.
- [x] 3.4 Unit tests for `utils/time.ts` (field detection incl. no-temporal-field case; predicate building; lift with matching pair / partial pair / other-field predicates) plus serialize/deserialize round-trip tests (time pair in `buildQuery` output, lift on parse), and toolbar component tests (composition, Run disabled states); files: `src/components/Analytics/QueryBuilder/utils/tests/time.spec.ts`, existing serialize/deserialize specs extended, `src/components/Analytics/QueryBuilder/tests/QueryBuilderToolbar.spec.tsx`.

## 4. Builder rail shell, view switching, guards

- [x] 4.1 Create `src/components/Analytics/QueryBuilder/Rail/BuilderRail.tsx` — fixed-width right rail (`border-l`, ~420px): header with collapse control + the existing `QueryBuilderView` `DialSegmentedControl` (hidden until fields load), scrollable body hosting the active view. Collapse state persisted to localStorage (SSR-safe read), restore button rendered by the results header when collapsed.
- [x] 4.2 Replace `Mode/ModeSelector.tsx` with a `QueryMode` `DialSegmentedControl` at the top of the Builder view; delete `ModeSelector.tsx`; remove the query-level DISTINCT switch and the per-aggregate DISTINCT checkbox from `Aggregate/Aggregates.tsx` (keep `distinct` in models/serializer for JSON-authored queries).
- [x] 4.3 Create `src/components/Analytics/QueryBuilder/Modals/DiscardQueryPopup.tsx` — `DialConfirmationPopup` Danger-variant wrapper (pattern: `EntityView/Modals/Discard/Discard.tsx`, portal to body) warning that switching drops the current query and resets the builder to its starting point. Wire into view switching in `QueryBuilder.tsx`: switching to the Builder view prompts when the written query can't be shown there (SQL: non-empty buffer; JSON: diverged flag from 4.4); confirm discards the written query (clear `sqlText` / drop JSON edits), resets builder state to `createInitialState` defaults for the selected entity, and switches; cancel stays in the written mode. Empty SQL buffer and representable JSON switch silently; SQL ⇄ JSON switches are unguarded.
- [x] 4.4 Add `isBuilderRepresentable(query)` to `src/components/Analytics/QueryBuilder/utils/deserialize.ts` (sole rule: filter root group + at most one nested group level, nested groups hold only conditions) and wire it into `onChangeJson`: representable JSON syncs into builder state as today; unrepresentable JSON sets a `jsonDiverged` flag → non-blocking informational message ("can't be shown in the visual builder"), builder state untouched, Run stays enabled and executes the parsed JSON query as written. Invalid (unparseable) JSON keeps today's flag + Run disabled.
- [x] 4.5 Unit/component tests — rail collapse/restore + persistence, mode segmented control patches mode, no DISTINCT controls rendered, guard flow (prompt on SQL-with-text → Builder and on diverged-JSON → Builder; confirm discards + resets builder to defaults + switches; cancel stays; silent switch on empty SQL / representable JSON; SQL ⇄ JSON unguarded), `isBuilderRepresentable` (2-level ok, 3-level rejected), diverged JSON keeps Run enabled and runs the JSON as written; files under `src/components/Analytics/QueryBuilder/tests/` and `utils/tests/deserialize.spec.ts` (extend existing).

## 5. Builder sections restyle and filter depth

- [x] 5.1 Restyle Group by, Time buckets, Aggregates (`Aggregate/*`), Select (`Select/SelectProjection.tsx`), Having, Sort (`Sort/SortKeys.tsx`), Page (`Page/PageSection.tsx`) into `SectionBlock`s in the rail's vertical flow; field pickers switch to `CategorizedFieldDropdown`; plain-field selections (group-by, select) render as `FieldChip`s; parameterized rows (aggregates, having, sort) use the collapsible `ChipRow`. Row-mode Select drops the tag-filter checkbox row and `Fields/FieldCheckboxGrid.tsx`-based grid in favor of the add-dropdown + chips (serialization order preserved).
- [x] 5.2 Constrain filter depth in `Filter/FilterGroup.tsx`: add `depth` prop; "Add group" only at `depth === 0`; nested groups offer add-condition/remove only; conditions use `CategorizedFieldDropdown`; restyle group/condition rows to the block/chip concept.
- [x] 5.3 Update/extend section component tests for the new interaction (add via dropdown, chip remove, collapse summaries, depth-1 group has no add-group action) while keeping all existing serialization tests green; files: existing specs under `src/components/Analytics/QueryBuilder/tests/` extended.

## 6. Results area

- [x] 6.1 Create `src/components/Analytics/QueryBuilder/Result/ResultArea.tsx` — owns the shown result (`StructuredQueryResult` + `ExecutedQueryMeta`), stat-tile row (`StatChip`: Rows, Fields, Total when present), Table ⇄ Chart `DialSegmentedControl`, rail-restore button when collapsed, pre-run empty state, empty-result state, and the existing failed-run behavior (previous result kept).
- [x] 6.2 Table view: reuse `GridView` + `utils/result.ts` column derivation (move rendering from the deleted sidebar).
- [x] 6.3 Create `src/components/Analytics/QueryBuilder/Result/chart-options.ts` — `buildBarChartOptions`, `buildLineChartOptions`, `buildAreaChartOptions(rows, xField, yField, t)` using `CHART_COLOR` tokens (`Common/MetricCard/constants.ts`); model line/area on `Telemetry/Dashboards/LineChart/constants.ts`.
- [x] 6.4 Create `src/components/Analytics/QueryBuilder/Result/ResultChart.tsx` — `ReactECharts` with chart-type segmented control, X select (dimension columns from `ExecutedQueryMeta`), Y select (aggregate columns incl. count), defaults first-dimension/first-aggregate; availability rule (aggregate structured run with ≥1 dimension) with hint state otherwise; SQL results table-only.
- [x] 6.5 Unit/component tests — chart-options builders (axes, series type, color tokens), ResultChart availability + axis defaults + type switching, ResultArea stat tiles (with/without total), empty states, view switching; files under `src/components/Analytics/QueryBuilder/Result/tests/`.

## 7. Integration and cleanup

- [x] 7.1 Rework `QueryBuilder.tsx` into the new composition: page title → `QueryBuilderToolbar` → flex row of `ResultArea` + `BuilderRail`; `onRun()` stores the result + `ExecutedQueryMeta` in state instead of opening the sidebar.
- [x] 7.2 Delete `Result/QueryResultSidebar.tsx`, the dock-position persistence (constants + localStorage usage), `Source/SourceSection.tsx`, `Source/SchemaPreviewPopup.tsx`, `Mode/ModeSelector.tsx`, and now-unused i18n keys; keep `Result/StatChip.tsx`.
- [x] 7.2a Remove complex-entity support: `complex`/`schemaIdField` from `src/models/analytics/entity.ts`, the `getDetailedEntitySchema` server action (`app/[lang]/query-builder/actions.ts`), the detailed-schema method/URL in `src/server/analytics/analytics-data-api.ts`, all related UI/state in `QueryBuilder.tsx`, and their tests.
- [x] 7.3 Update all existing QueryBuilder tests affected by the removed components/new layout; verify serialization/deserialization suites remain green unchanged (except the depth addition).

## 8. Quality checks

- [x] 8.1 Run lint (`npm run lint`), format check (`npm run format`), and the full test suite (`npm run test` from `apps/ai-dial-admin/`); fix any failures.

## 9. Feedback round (post-merge refinements)

- [x] 9.1 Unify Group by: replace `groupBy: string[]` + `buckets: BucketRow[]` with `GroupByRow[]` (plain column or scalar-function entry); add `QueryScalarFn` enum mirroring the service allowlist (`date_bin`, `lower`, `upper`, `length`, `trim`, `abs`); update serialize/deserialize/warnings/having-options; delete the Time bucket section (`Aggregate/TimeBuckets.tsx`).
- [x] 9.2 `CategorizedFieldDropdown`: collapsible category headers with option counts, accordion (one category open at a time, selection's group opens first, search overrides), a Functions group with per-function hints, "Columns" divider, full-palette color cycle for category headers, compact boxed search input (replaces `DialSearch`), no fixed overlay height (70vh guard).
- [x] 9.3 `GroupBySection`: add-dropdown offers columns + functions; column picks render as chips, function picks as parameterized rows (`date_bin`: amount/unit/field/alias; others: field/alias).
- [x] 9.4 Sort: "Nulls:" prefix on the nulls `CompactSelect` (new `prefix` prop), narrower direction select so the nulls text fits.
- [x] 9.5 Chart: order points along X when all values are numeric/date-like (`sortRowsByX`); truncate long X-axis labels to a fixed width (full value stays in the tooltip).
- [x] 9.6 ChipRow collapsed chips tinted with the owning section's palette color (Sort yellow, Aggregate blue, Group by teal, Filter purple, Having red) via a `color` prop threaded through `FilterGroup`/`FilterCondition`.
- [x] 9.7 Page section controls on one line (Include total joins the strategy/offset/limit row); results empty state shows the "Press Run…" text only; builder rail widened to `w-[480px]`.
- [x] 9.8 Tests updated/added for all of the above; lint + QueryBuilder suite green.

## 10. Follow-up: chart type set — pie and scatter replace area

> Ships as its own follow-up PR. Sorting behavior is intentionally untouched (`sortRowsByX` heuristic stays as-is for bar/line; revisit only on user feedback). `ChartConfig { type, xField, yField }` keeps its shape — only per-type slot metadata is added.

- [x] 10.1 Models/constants: change `ChartType` to `Bar | Line | Pie | Scatter` (drop `Area`); regenerate `CHART_TYPE_OPTIONS`; add the per-type slot descriptor constant (allowed-column source, slot label keys, tooltip trigger per type); new i18n keys — Category/Value slot labels, "Other" slice label.
- [x] 10.2 Chart transform utils (pure, in or beside `Result/chart-options.ts`): `getNumericColumns(rows, columns)` — columns whose every value passes the existing `comparableKey` test; `bucketTopSlices(rows, category, value, n = 10)` — top-N by value plus a merged "Other" slice.
- [x] 10.3 Option builders: `buildPieChartOptions` (item tooltip, top-10 + Other, slice color cycle from `constants/analytics/query-builder-palette.ts`) and `buildScatterChartOptions` (numeric X/Y, one point per row, item tooltip listing the row's dimension values, no row re-ordering); remove `buildAreaChartOptions` and the `Area` branch.
- [x] 10.4 `Result/ResultChart.tsx`: drive the two `DialSelect`s from the active type's slot descriptor (options + label prefix); scatter option hidden from the type control when the result has fewer than two numeric columns; on type switch keep picks valid for the new slot, otherwise fall back to the slot's first valid default.
- [x] 10.5 Tests: transform utils (numeric-column detection incl. date-like and mixed columns; top-N bucketing incl. ≤N categories → no Other), option builders (pie slices/colors, scatter points/tooltip data, Area gone), `ResultChart` (per-type labels and option lists, scatter hidden path, pick continuity on type switch); update existing chart specs for the removed Area type.
- [x] 10.6 Lint + QueryBuilder suite green (`npm run lint`, `npm run test` from `apps/ai-dial-admin/`).
- [x] 10.7 Display names in the chart: add `columnLabels` to `ExecutedQueryMeta` (group-by column → schema `display_name`, built in `buildExecutedMeta` from the executed entity's fields); selector options, axis titles, and the scatter tooltip label columns via the map (aggregate/scalar-fn aliases display as themselves); fixtures/tests updated.
