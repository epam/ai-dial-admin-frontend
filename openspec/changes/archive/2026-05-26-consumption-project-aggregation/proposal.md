## Why

Token / cost totals on the Dashboard need a project-level breakdown without doubling the number of analytics queries we issue. Today the Dashboard fires two independent aggregation queries:

- `ENTITY_CONSUMPTION_TREE_QUERY` — `groupBy: ['deployment', 'parent_deployment', 'execution_path']` — feeds the Entities Consumption tree.
- `PROJECT_CONSUMPTION_QUERY` — `groupBy: ['project_id']` — feeds the Projects Consumption grid.

We want a finer-grained single source that includes `project_id` as a fourth grouping dimension, then fold the same response two ways on the frontend:

```
                  Backend (one query)
   groupBy[deployment, parent_deployment, execution_path, project_id]
                          │
                  raw fine-grained rows
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
  collapse project_id           collapse d+parent+ep
  (1 row per d+parent+ep)       (1 row per project_id)
            │                           │
            ▼                           ▼
   Entities Consumption        Projects Consumption
      tree (unchanged           grid (unchanged
      column shape)              column shape)
```

This gives us the project axis with no extra round trips, keeps the two grids' column shapes byte-identical, and lets the per-project numbers stay consistent with the per-deployment tree below (they're folds of the same source rows).

## What Changes

- **Query shape**: `ENTITY_CONSUMPTION_TREE_QUERY` adds `'project_id'` to both `expressions` and `groupBy`. `PROJECT_CONSUMPTION_QUERY` is deleted — the project grid now reads from the same source.
- **Two pure aggregators** in a new util (`utils/consumption-aggregation.ts`):
  - `aggregateByDeployment(rawRows)` — collapses rows sharing `(deployment, parent_deployment, execution_path)`, summing `count` / `money` / `aggregated_money` / `tokens_p` / `tokens_c`. Emits rows with `name = deployment` so they match the existing `EntityRow` shape consumed by `buildEntitiesConsumptionTree`.
  - `aggregateByProject(rawRows)` — groups rows by `project_id` and sums the same numeric fields, but **only over rows that qualify as a project root**. A row is a project root when its `parent_deployment` is empty / `'undefined'`, **or** when the parent's expected `execution_path` (`stripDeploymentSuffix(execution_path, deployment)`) is not present among the project's own rows — i.e., the declared parent has no data, so the row is the highest-level record for that chain. This avoids the orchestrator → child double-counting that would otherwise inflate per-project totals while still attributing tokens for chains whose orchestrator row is missing. Emits rows with `name = project_id` so they match the existing `PROJECT_GRID_COLUMNS` shape.
- **New proxy component** `ConsumptionDashboard` owns the single fetch, refresh, and loading state for both grids. It runs the aggregators once per fetch and passes pre-aggregated rows to the two presentational grids as props.
- **Children become dumb**: `EntitiesConsumptionTree` and the project-side `TelemetryGrid` each accept an optional `rows` (or `data`) prop. When provided, they skip their internal `useEffect`-fetch and just render. Their existing default behavior is preserved so other call sites of `TelemetryGrid` are unaffected.
- **Field-mapping collision fix**: today `TELEMETRY_GRID_HEADERS_MAP` maps both `deployment → name` and `project_id → name`. Once both columns arrive in the same response, the shared map clobbers itself. The aggregators consume the raw `TelemetryData` directly (bypassing `getGridData` for this query) and emit normalized rows themselves.
- **Total Tokens tile**: `getTotalTokensFromTree` (`utils/telemetry.ts:64`) runs `aggregateByDeployment` before `buildEntitiesConsumptionTree` so the same `(d, parent, ep)` doesn't appear N times and inflate the total.
- **Dead-code cleanup**: delete `PROJECT_CONSUMPTION_QUERY` and the already-unused `ENTITY_CONSUMPTION_QUERY` from `constants/telemetry.tsx`.

## Non-goals

- No backend changes. The new query reuses the existing analytics expressions and grouping mechanics, just adds `project_id`.
- No new columns on either grid. Column defs (`name`, `requests`, `cost`, `deployment_cost`, `prompts`, `completions`) are unchanged.
- No new user-facing toggles or filters. This is a structural refactor with no visible behavior change beyond the per-project breakdown the projects grid already showed.
- No changes to MCP / Routes / Conversations dashboards. They keep their own queries.
- `TelemetryGrid`'s default fetch behavior stays as-is for callers other than the projects grid.

## Capabilities

### New Capabilities

- `consumption-project-aggregation`: the single-source query + frontend fold strategy, the `ConsumptionDashboard` proxy, and the two aggregator helpers.

### Modified Capabilities

- `entities-consumption-tree`: the tree-mode query shape gains `project_id`; the tree builder's input is now defined as the output of `aggregateByDeployment` rather than the raw server rows.
- `dashboard-total-tokens-chart`: the Total Tokens reducer runs `aggregateByDeployment` before building the tree.

## Impact

- **Components**:
  - New: `Telemetry/Dashboards/ConsumptionDashboard.tsx` (proxy).
  - Modified: `Telemetry/EntitiesConsumptionTree.tsx` (accept optional `rows`, skip fetch when provided).
  - Modified: `Telemetry/TelemetryGrid.tsx` (accept optional `data`, skip fetch when provided — additive, default behavior unchanged).
  - Modified: `Telemetry/Dashboards/View/SimpleDashboard.tsx` (render the proxy in place of the two independent grids).
- **Utils**:
  - New: `utils/consumption-aggregation.ts` (`aggregateByDeployment`, `aggregateByProject`).
  - Modified: `utils/telemetry.ts` (`getTotalTokensFromTree` pre-aggregates).
- **Constants**: `constants/telemetry.tsx` — `ENTITY_CONSUMPTION_TREE_QUERY` extended; `PROJECT_CONSUMPTION_QUERY` and `ENTITY_CONSUMPTION_QUERY` removed.
- **Models**: `models/telemetry.ts` — new `RawConsumptionRow` type capturing the fine-grained response shape; existing `EntityRow` keeps its meaning (post-aggregation deployment row).
- **Tests**: new `utils/tests/consumption-aggregation.spec.ts`; updates to `utils/tests/telemetry.spec.tsx` (`getTotalTokensFromTree` multi-project fixture), `components/Telemetry/tests/EntitiesConsumptionTree.spec.tsx` (props-driven mode), and a new `ConsumptionDashboard.spec.tsx`.
- **No user-visible behavior change** on the Entities Consumption tree or the Projects grid columns; the projects grid's numbers now match the sum-across-deployments of the same source rows by construction.
