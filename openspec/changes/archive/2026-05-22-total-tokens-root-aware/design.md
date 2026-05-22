## Context

`SingleValueChart` (`apps/ai-dial-admin/src/components/Telemetry/Dashboards/Values/SingleValueChart.tsx`) is a generic "fetch query → reduce to one number → render big number" component. It powers four cards on `ChartsDashboard.tsx`: Unique Users, Request Count, Total Tokens, Money. Today every card reduces with the same hardcoded `getSingleValueChartData` (sums one row of cells).

For Total Tokens that reducer is wrong because the underlying analytics rows double-count tokens across orchestration layers — an orchestrator's row carries the same prompt tokens its child model call carries, plus its own. The consumption tree below the chart already solves this for itself via `buildEntitiesConsumptionTree` and `aggregateSyntheticRows` (see `utils/entities-consumption-tree.ts:64-82`); the headline chart doesn't.

## Goals / Non-Goals

**Goals:**

- Total Tokens chart matches the math of the consumption tree below it.
- Synthetic roots — children whose declared `parent_deployment` has no row of its own — contribute to the total via the tree's existing direct-children rollup.
- `SingleValueChart` stays a generic primitive; the special case lives at the call site (a prop), not the component.
- Use `Big` for the top-level sum, matching `getSingleValueChartData`.

**Non-goals:**

- Fix the analogous double-counting in Request Count and Money cards (separate proposal).
- Backend-side aggregate that exposes root-only totals.
- Hoisting the fetch into `SimpleDashboard` to share with `EntitiesConsumptionTree`. Per user direction the two stay independent.

## Decisions

### 1. Reducer injection, not a wrapper component

**Decision:** Add an optional `getValue?: (data: TelemetryData) => number` prop to `SingleValueChart`. When provided, it replaces `getSingleValueChartData` at the call site. When omitted, the default is preserved so the three unchanged cards stay byte-identical at the call site.

**Alternative considered:** A `TotalTokensChart` wrapper that duplicated the JSX shell of `SingleValueChart`. The prop approach adds zero components, no JSX duplication, and keeps the generic primitive — exactly what the team already does with the `query` prop.

### 2. Helper placement: `utils/telemetry.ts`

**Decision:** `getTotalTokensFromTree(data: TelemetryData): number` lives in `utils/telemetry.ts`, alongside `getSingleValueChartData`.

**Alternative considered:** Placing it next to `buildEntitiesConsumptionTree` in `utils/entities-consumption-tree.ts`. Telemetry-side helpers cluster better with their siblings (`getGridData`, `getListingData`, `getSingleValueChartData`). The tree import going *into* the telemetry helper is fine; the tree util doesn't need to know about charts.

### 3. Use `Big` for the top-level sum

**Decision:** Reduce with `Big`, return `.toNumber()` at the end.

**Why:** `getSingleValueChartData` (line 57 of `utils/telemetry.ts`) does the same. `aggregateSyntheticRows` uses plain `Number`, but that's only a handful of direct children at a time. The top-level chart sums every root across the dataset — the one place where JS float precision could realistically drift on a busy installation.

### 4. Reuse `ENTITY_CONSUMPTION_TREE_QUERY` as-is

**Decision:** The Total Tokens chart issues the same query the consumption tree issues. The query already returns `deployment`, `parent_deployment`, `execution_path`, and the per-row aggregates needed.

**Why:** The same shape is required so we can run rows through `buildEntitiesConsumptionTree` directly. The payload is heavier than the old `sum()` query, but the cost is acceptable for one of four cards. A shared fetch with the tree below would halve the request count, but per user direction we keep them independent.

### 5. `TOTAL_TOKENS_QUERY` is deleted

After the switch, `constants/telemetry.tsx`'s `TOTAL_TOKENS_QUERY` has no remaining importers. Delete it rather than leave dead code (the old shape is incorrect for the headline total and shouldn't be reintroduced by accident).

## Risks

- **Payload size:** The tree query returns per-row aggregates instead of two scalars. For dense traffic the response is larger. Mitigation: the same query already fires for the tree below, so the user is already paying that cost on the same view.
- **Edge case alignment:** Rows without `execution_path` are filtered out by `buildEntitiesConsumptionTree` (line 89). That means rows that the old query would have summed may no longer contribute. Acceptable: matches the tree's display, and current backend rows are expected to carry `execution_path`.
- **Two parallel requests:** Same query, two HTTP requests (chart + tree). HTTP caching at the analytics layer should largely hide this; if not, a shared fetch is a clean follow-up.
