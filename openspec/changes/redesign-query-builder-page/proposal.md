# Redesign Query Builder page — results-first layout with builder rail

## Why

The Query Builder currently leads with the form: the builder sections fill the page and results open in a docked sidebar. For an analytics workbench the priority is inverted — users run a query once and then read, re-shape, and visualize the result. A design prototype for the page establishes a results-first concept: the result (table or chart, with summary stat tiles) is the main content, and the query definition lives in a compact collapsible rail. This change reworks the page to that concept while keeping the project's look and feel (Tailwind theme tokens, DIAL UI Kit components) and the existing query model, serialization, and server actions.

## What Changes

- **Layout inversion**: results become the main page area; the query builder moves into a collapsible right-side rail (~420px). The dockable result sidebar (`Result/QueryResultSidebar.tsx`, dock right/bottom + persisted position) is retired.
- **In-page toolbar**: source dropdown (plain `DialSelectField`, no schema-preview popup), the shared `TimeFilter` component (`Common/TimeFilter` + `useTimeFilter`, same as the Dashboard page), and the Run primary button.
- **Complex-entity support removed**: the `complex`/`schemaIdField` entity flags, the detailed-schema endpoint call (`getDetailedEntitySchema`), and the instance-id UI are deleted — the analytics backend has no detailed-schema endpoint, so this was a dead code path.
- **Time range as part of the query**: the toolbar time filter is a query control — its range serializes into the structured query's filter as `ge`/`le` predicates on the source's auto-detected timestamp field, visible in the JSON view and lifted back into the toolbar control on JSON round-trip (never shown in the visual Filters tree). SQL runs execute the SQL text as written.
- **Builder rail**: header with a collapse control and the Builder/SQL/JSON `DialSegmentedControl`. An Aggregate/Rows mode `DialSegmentedControl` sits at the top of the Builder view, replacing the `DialRadioGroup`-based `ModeSelector`. DISTINCT controls (query-level switch and per-aggregate checkbox) are no longer rendered. When the rail is collapsed, a restore button appears in the results header; the collapsed state persists in local storage.
- **Builder sections restyled to the design concept**: each section is a bordered block with a colored header; fields are added through searchable dropdowns grouped by field category (tag); added items render as compact removable chips/rows that expand for editing. Built from small reusable feature-local tile components; ui-kit components used wherever they fit.
- **Filter depth limited to two levels**: the visual builder allows root-level conditions plus one level of groups containing only conditions ("Add group" exists only at the root). Deeper nesting is expressible only in the SQL view.
- **Written-mode → Builder guard**: SQL and JSON are "written" modes that may hold queries the visual builder cannot display (any SQL; JSON with filter nesting deeper than two levels). Such queries stay fully editable and runnable in their written mode. Only switching to the Builder view is guarded: a `DialConfirmationPopup` (Danger variant) warns that switching drops the current query and resets the builder to its starting point; confirm discards the written query and resets, cancel keeps the user in the written mode. JSON that the builder *can* represent keeps today's silent round-trip.
- **Results area**: a stat-tile row on top (Rows returned, Fields, and Total when the response includes one), then a Table ⇄ Chart segmented switcher. Table reuses the ag-grid `GridView`. Chart is a new ECharts view (bar/line/area type toggle, X axis from group-by/bucket columns, Y axis from aggregate columns), available only for aggregate-mode structured results with at least one group-by dimension — a hint is shown otherwise. An empty state is shown before the first run.

## Non-goals

- No AI-assisted query authoring (present in the prototype, explicitly out of scope).
- No SQL→builder parsing; edited SQL never back-propagates into builder state. (Builder→SQL generation IS in scope: entering the SQL view compiles the current builder query into the editor.)
- No backend changes: existing `/v1/queries/execute` and `/v1/queries/execute-sql` contracts are used as-is (no server-reported query timing — no "query time" tile).
- No changes to the Tables catalog pages or the Dashboard page (the `TimeFilter` component is reused, not modified).
- No export menu (present in the prototype, not in scope).
- No pagination UX beyond the existing Page section (offset/cursor one-shot configuration).

## Capabilities

### Modified Capability

- `analytics` (master spec `openspec/specs/analytics/spec.md`): requirements for page layout, mode/DISTINCT, filter builder, JSON view, run/result rendering, and SQL view are modified; the schema-preview popup, tag-filtered projection grid, and the three dockable-result-sidebar requirements are removed; new requirements are added for the toolbar, time-range injection, builder rail, categorized field dropdowns with chip items, stat tiles, and the table/chart result views.

## Impact

- **Components affected**: everything under `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/` — `QueryBuilder.tsx` (layout hub), `Source/SourceSection.tsx` (folds into the toolbar), `Mode/ModeSelector.tsx` (replaced), `Filter/*`, `Select/*`, `Aggregate/*`, `Sort/*`, `Page/*` (restyled into rail blocks), `Sql/SqlEditor.tsx` (moves into the rail), `Result/QueryResultSidebar.tsx` (deleted), `Result/StatChip.tsx` (reused by the stat tiles).
- **New components**: toolbar, builder rail shell, reusable section-block / categorized-field-dropdown / chip-row tiles, result view (stat tiles + table/chart), ECharts chart view with option builders.
- **Reused shared pieces**: `Common/TimeFilter` + `useTimeFilter` + `constants/global-time-filter.ts`, `DialSegmentedControl`, `DialSelectField`, `DialConfirmationPopup` (pattern: `EntityView/Modals/Discard/Discard.tsx`), `GridView`, `Common/MetricCard/constants.ts` `CHART_COLOR`, `echarts-for-react` (already a dependency).
- **Models/constants**: additions to `models/analytics/query-builder.ts` (result view / chart enums and state types) and `constants/analytics/query-builder.ts`; new i18n keys.
- **Server actions**: `getEntities`, `getEntitySchema`, `executeQuery`, `executeSqlQuery` unchanged; `getDetailedEntitySchema` deleted along with its API method and the `complex`/`schemaIdField` model flags.
- **Behavioral break**: the docked result sidebar and its persisted dock position are removed; the persisted key is obsolete. The query-level DISTINCT flag and per-aggregate DISTINCT are no longer settable from the UI (serialization support remains for JSON-authored queries).
- **Other features**: no shared components are modified; `TimeFilter` and the sidebar context are consumed as-is, so the Dashboard and other consumers are unaffected.
