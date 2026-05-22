## Why

The Dashboard's "Total tokens" headline chart (`ChartsDashboard.tsx`) currently sums `prompt_tokens` and `completion_tokens` across every row in the analytics table with no awareness of orchestration nesting. The codebase already knows this is wrong: `utils/entities-consumption-tree.ts:64-82` documents that "prompt/completion tokens repeat across orchestrator → model layers — so summing all descendants would double-count," and the consumption tree below the chart avoids the duplication by rolling up only from tree roots. The headline chart ignores that and shows an inflated total.

This change makes the Total tokens chart use the same root-aware aggregation the tree already uses: sum tokens only from rows that are tree roots — real roots (where `parent_deployment` is empty / `'undefined'`) plus synthetic roots created when a referenced parent has no row of its own.

## What Changes

- **Chart math**: Total tokens chart switches from `TOTAL_TOKENS_QUERY` (whole-table `sum(prompt_tokens)`, `sum(completion_tokens)`) to reading `ENTITY_CONSUMPTION_TREE_QUERY` rows, building the consumption tree, and summing `prompts + completions` from top-level `TreeRow`s only.
- **`SingleValueChart` flexibility**: add an optional `getValue?: (data: TelemetryData) => number` prop. Default behavior is unchanged (`getSingleValueChartData`). Total tokens passes the new tree-aware reducer.
- **New helper**: `getTotalTokensFromTree(data: TelemetryData): number` in `utils/telemetry.ts`, using `Big` for precision (matches `getSingleValueChartData`).
- **Remove dead constant**: `TOTAL_TOKENS_QUERY` in `constants/telemetry.tsx` has no other callers and is deleted.

## Non-goals

- Request Count and Money cards on the same dashboard exhibit the same double-counting (`count()` and `sum(deployment_price)` are also per-row). Fixing them is out of scope here and tracked as a follow-up.
- No changes to the consumption tree itself — `buildEntitiesConsumptionTree` and its synthetic-rollup pass are consumed as-is.
- No backend changes. The fix is a client-side reduction over the existing tree query.
- Total tokens chart and the Entities Consumption tree below it remain independent fetches (no shared request).

## Capabilities

### New Capabilities

- `dashboard-total-tokens-chart`: root-aware total tokens math on the Dashboard, plus the `getValue` extension point on `SingleValueChart`.

## Impact

- **Components**: `Telemetry/Dashboards/Values/SingleValueChart.tsx` (new optional prop), `Telemetry/Dashboards/View/ChartsDashboard.tsx` (Total tokens config row uses new query + reducer).
- **Utils**: `utils/telemetry.ts` (new `getTotalTokensFromTree` helper).
- **Constants**: `constants/telemetry.tsx` (`TOTAL_TOKENS_QUERY` removed).
- **Tests**: `utils/tests/telemetry.spec.tsx` (new reducer tests; fixtures mirror `entities-consumption-tree.spec.ts`).
- **No behavior change** for Unique Users, Request Count, Money cards.
