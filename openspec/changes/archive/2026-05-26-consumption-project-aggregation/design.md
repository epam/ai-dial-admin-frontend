## Context

The Dashboard renders three things that all read from the analytics table:

1. **Entities Consumption tree** — `EntitiesConsumptionTree.tsx` fetches `ENTITY_CONSUMPTION_TREE_QUERY` (`groupBy: ['deployment','parent_deployment','execution_path']`) and feeds the response through `buildEntitiesConsumptionTree` for the tree-grid below the headline cards.
2. **Projects Consumption grid** — `SimpleDashboard.tsx:48` mounts `TelemetryGrid` with `PROJECT_CONSUMPTION_QUERY` (`groupBy: ['project_id']`) and `PROJECT_GRID_COLUMNS`.
3. **Total Tokens headline card** — `ChartsDashboard.tsx:30-34` reuses `ENTITY_CONSUMPTION_TREE_QUERY` and reduces via `getTotalTokensFromTree`, which already builds the tree and sums root tokens to dodge orchestrator→model double-counting.

Two independent fetches today; both reduce per-row aggregates from the same analytics table, just at different `groupBy` resolutions. Adding a project-level breakdown to the tree query (which is what the backend team wants) makes the response strictly finer-grained than either current query, so a single source plus two frontend folds is enough.

## Goals / Non-Goals

**Goals:**

- One backend query feeds both grids and the Total Tokens card.
- Both grids' column shapes stay unchanged (`name`, `requests`, `cost`, `deployment_cost`, `prompts`, `completions`).
- The tree builder receives rows that look identical (in shape and key uniqueness) to what it sees today, so synthetic-ancestor logic and the rollup pass are untouched.
- Aggregation logic is pure, testable, and lives outside any component.
- No breaking change to other `TelemetryGrid` callers.

**Non-goals:**

- Backend-side per-project rollup endpoints.
- A feature flag for the rollout — this is a refactor with no user-visible behavior change.
- Generalizing `TelemetryGrid` into a "container + view" split (deferred; one optional prop is enough here).
- Sharing the fetch with non-consumption charts (Unique Users, Request Count, Money) — they have different query shapes.

## Decisions

### 1. One proxy component owns the fetch

**Decision:** A new `ConsumptionDashboard` component sits where `SimpleDashboard.tsx` today renders `EntitiesConsumptionTree` (conditionally) and the projects `TelemetryGrid`. It:

- Holds the single `useEffect` that fires `ENTITY_CONSUMPTION_TREE_QUERY` (now with `project_id`).
- Runs `aggregateByDeployment` and `aggregateByProject` on the response.
- Owns refresh polling (per `refreshOptionsConfig`).
- Renders the existing tree and projects grid, passing pre-aggregated rows as props.

**Why a proxy and not "hoist into `SimpleDashboard`":** `SimpleDashboard.tsx` is route-shaped (it also hosts `LineChart`, `ChartsDashboard`, etc.); coupling the consumption-aggregation logic to it bloats an already busy file. A focused proxy stays testable in isolation.

**Why a proxy and not "share via Context":** there's exactly one consumer pair on this route. Context would be ceremony for no extension benefit.

### 2. Children accept optional `rows` / `data` props; default behavior unchanged

**Decision:**

- `EntitiesConsumptionTree`: add optional `rows?: EntityRow[] | null` and `loading?: boolean`. When `rows` is provided, skip the internal `getData` call and use them directly. When omitted, keep the current fetch path so existing tests / callers stay working.
- `TelemetryGrid`: add optional `data?: Record<string, string>[] | null`. When provided, render it; skip the fetch. When omitted, default to current `query`-driven fetch.

**Why additive props and not container/view split:** `TelemetryGrid` is used in many places (MCP dashboards, routes dashboards, etc.). A new optional prop is a zero-risk addition. Splitting would force a rename and touch every caller for marginal gain.

**Rejected alternative — make children fully presentational and rip out their fetch:** that would require updating every existing call site of `TelemetryGrid`, multiplying blast radius. We only want to change behavior for the two grids on the Dashboard route.

### 3. Aggregators are pure, consume raw `TelemetryData`, emit normalized rows themselves

**Decision:** `aggregateByDeployment(data: TelemetryData): EntityRow[]` and `aggregateByProject(data: TelemetryData): EntityRow[]` (or a dedicated `ProjectRow` type — see decision 5). They:

- Read column indexes off `data.headers` directly (no `TELEMETRY_GRID_HEADERS_MAP`).
- Group rows on the relevant key tuple.
- Sum numeric columns (`count`, `money`, `aggregated_money`, `tokens_p`, `tokens_c`) using `Big`, return strings to match the existing `EntityRow` string-typed numeric fields.
- Emit normalized rows where `name` is set from `deployment` (for `aggregateByDeployment`) or `project_id` (for `aggregateByProject`), matching the consumer column defs.

**Why bypass `getGridData` and `TELEMETRY_GRID_HEADERS_MAP` for this query:** the shared header map sends both `deployment → name` and `project_id → name`. With both columns in the same response, the map would clobber `name` row-by-row depending on column order. Cleanest fix: don't use the shared map for this query at all. The aggregators are the only consumer; they handle column → field mapping themselves.

**Why `Big` not `Number`:** matches the precision discipline already used in `getSingleValueChartData` and `getTotalTokensFromTree`. Sums across N projects × M deployments can spike past safe-int territory on busy installations.

**Why string outputs:** `EntityRow` already stores numerics as strings (the tree builder + AG Grid renderers expect that). Converting now would cascade.

### 4. Tree-builder inputs are unchanged in shape; only the *source* changes

**Decision:** `buildEntitiesConsumptionTree` is **not modified**. The proxy passes `aggregateByDeployment(data)` directly to it.

**Why this is safe** — the tree builder reads only `name`, `parent_deployment`, `execution_path`, `requests`, `prompts`, `completions`, `deployment_cost`, `cost`. None of those reference `project_id`. With Helper A collapsing project rows back to one row per `(d, parent, ep)`, the input is byte-for-byte equivalent to today's response. Synthetic-ancestor injection, `getId`/`getParentId`, and the post-order synthetic rollup all work unchanged.

**Aggregation math sanity:**

- `tokens_p` / `tokens_c`: existing comment in `entities-consumption-tree.ts:67` flags *vertical* double-counting (orchestrator→model). Across `project_id` within one `(d, parent, ep)`, the tokens are disjoint buckets — summing is correct.
- `aggregated_money` (= `sum(price)`, subtree-rolled-up per row): each per-project slice carries its own subtree contribution; summing projects gives the triplet's full subtree-rolled-up price. Same semantics as today.
- `count`, `money` (= `sum(deployment_price)`): trivially additive.

### 5. Row types: `RawConsumptionRow` for fine-grained, `EntityRow` for post-aggregation

**Decision:** Add `RawConsumptionRow` to `models/telemetry.ts`:

```ts
export interface RawConsumptionRow {
  deployment: string;
  parent_deployment: string;
  execution_path: string;
  project_id: string;
  count: string;
  money: string;            // sum(deployment_price)
  aggregated_money: string; // sum(price)
  tokens_p: string;
  tokens_c: string;
}
```

`EntityRow` (the post-`aggregateByDeployment` shape) keeps its meaning unchanged.

For the projects grid, the existing `Record<string, string>` shape consumed by `TelemetryGrid` is sufficient — column defs key on `name`, `requests`, `cost`, `deployment_cost`, `prompts`, `completions`. The aggregator emits exactly those fields.

**Why two distinct types:** if both shapes share `EntityRow`, every consumer has to pretend `project_id` doesn't matter, and TypeScript can't help us catch a "forgot to aggregate first" bug.

### 6. `getTotalTokensFromTree` runs `aggregateByDeployment` first

**Decision:** Inline the aggregation step inside `getTotalTokensFromTree`:

```ts
export const getTotalTokensFromTree = (data: TelemetryData): number => {
  const rows = aggregateByDeployment(data);
  const roots = buildEntitiesConsumptionTree(rows);
  return roots.reduce(
    (acc, r) => acc.plus(r.prompts || 0).plus(r.completions || 0),
    new Big(0),
  ).toNumber();
};
```

**Why fold the aggregation inside the helper, not surface it via the proxy:** `ChartsDashboard` is a sibling of `ConsumptionDashboard`, not a child. Plumbing pre-aggregated rows through a shared parent would re-introduce the prop-drilling we're trying to avoid for marginal gain. Keeping `getTotalTokensFromTree` self-sufficient — fetch a response, hand back a number — preserves its contract.

**Cost:** the aggregation runs twice per refresh (once in the proxy, once in the chart reducer). The response is small enough that this is invisible. A shared cache layer is an easy follow-up if it ever matters.

### 7. `aggregateByProject` sums project-root rows only (real + synthetic-root)

**Decision:** Don't sum every row per project. Sum only rows that qualify as a "project root": rows with empty / `'undefined'` `parent_deployment` **or** rows whose declared parent has no row in the same project's response.

The orphan-child check uses `stripDeploymentSuffix(execution_path, deployment)` (reused from [[entities-consumption-tree]] so segment-escape handling stays consistent) and is **scoped per `project_id`** — a deployment of the same name living in a different project does not count as "parent present" for this project's child.

**Why this matters:** when an orchestrator and its downstream child both have rows in the analytics table, summing both records doubles the project's reported tokens (the child re-records what flowed through the orchestrator). A naive `sum(tokens) GROUP BY project_id` inflates the per-project total versus what the Total Tokens card shows for the same data. With the project-root filter, the two are consistent for the typical orchestrator → child shape.

**Why also count orphan children:** when the backend drops the orchestrator row (the same scenario `withSyntheticAncestors` solves in the tree), the children would otherwise contribute zero to the project total — losing the chain entirely. Treating an orphan child as a synthetic root recovers its tokens without re-introducing the double-count: by definition only one row in that chain has no parent in the data, so only that row is counted.

**Rejected alternatives:**

- *Sum every row* (old `PROJECT_CONSUMPTION_QUERY` behavior): simple but inflates totals for any project containing an orchestrator chain.
- *Simple filter `parent_deployment ∈ {'', 'undefined'}` only*: cheap, correct when the backend always emits the orchestrator row, but silently drops orphan-child chains. The synthetic-ancestor logic already in the tree builder confirms orphan chains occur in real data.
- *Per-project tree + sum-of-roots*: most rigorous (mirrors `getTotalTokensFromTree` exactly), but pulls in `buildEntitiesConsumptionTree` and its synthetic-rollup pass per project. The orphan-child filter gives the same result for the common shapes at a fraction of the work.

### 8. Cleanup: delete `PROJECT_CONSUMPTION_QUERY` and `ENTITY_CONSUMPTION_QUERY`

After the switch:

- `PROJECT_CONSUMPTION_QUERY` has no remaining callers.
- `ENTITY_CONSUMPTION_QUERY` was already unused (confirmed via repo-wide grep) — fold its removal into this change since we're nearby.

Both deletions land in the same commit. No backwards-compat re-exports.

## Risks

- **Test coverage on aggregation:** the math is small but easy to get wrong (e.g. summing strings with `+` instead of `Big`). Mitigation: aggregator unit tests are mandatory in Stage A before any wiring, including big-number precision and empty-input cases.
- **Loading state desync:** today each grid shows its own spinner independently. After this change both show loading together. UX-wise that's a slight win (consistent), but worth a visual sanity check.
- **`getTotalTokensFromTree` regression:** if anyone forgets to update the reducer to pre-aggregate, the headline Total Tokens silently inflates. Mitigation: a unit fixture with the same `(d, parent, ep)` under three projects asserts the total = sum from one occurrence, not three.
- **`TelemetryGrid`'s dual-mode prop:** adding an optional `data` prop makes the component slightly less deterministic to reason about (sometimes it fetches, sometimes it renders provided data). Mitigation: documented in JSDoc on the prop; falls back to current behavior when unset.
- **Other consumers of `TELEMETRY_GRID_HEADERS_MAP`:** we keep the map intact (other queries still rely on it). The `project_id → name` and `deployment → name` mappings remain — they just don't collide because no other shared query has both columns. Pre-empt-test: search for any other query whose `expressions` include both `deployment` and `project_id`. Expectation: only `ENTITY_CONSUMPTION_TREE_QUERY` post-change, and that one bypasses the shared map.

## Rollout

Single change, but tasks are organized so each PR is independently reviewable:

1. **Aggregators + tests** (no wiring) — pure new utility, can land first and bake.
2. **Proxy + child prop wiring + query extension** — the actual switchover; one PR.
3. **`getTotalTokensFromTree` + test fixture** — small follow-on PR (or folded into #2 if reviewed together).
4. **Dead-code deletion** — pure removal, separate PR for clean diff.

No feature flag. Each step is reversible via revert.
