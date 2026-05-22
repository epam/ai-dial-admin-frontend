## Context

The entities-consumption tree-grid (Dashboard → Entities Consumption, "Group by parent deployment" on) renders one row per `(deployment, parent_deployment, execution_path)` tuple returned by `ENTITY_CONSUMPTION_TREE_QUERY`. When a `parent_deployment` references a deployment that has no row of its own, `withSyntheticAncestors` (`apps/ai-dial-admin/src/utils/entities-consumption-tree.ts:17`) inserts a placeholder row with `synthetic: true` and every numeric field set to `'0'`. The tree is then built by `buildTreeFromParentPointer`.

The current zero values make synthetic rows visually empty in the grid, even when their descendants account for hundreds of requests and meaningful spend. Two backend semantics make this non-trivial to fix correctly:

- **`deployment_cost` ("Total money" column)** comes from `sum(price)`. The underlying `price` column at the trace level already includes the cost of every downstream call — it's a per-row subtree rollup. Summing it across siblings double-counts every grandchild.
- **`prompts` / `completions`** come from `sum(prompt_tokens)` and `sum(completion_tokens)` per edge. When an orchestrator forwards a prompt to a model below it, both rows record the same logical tokens. Summing all descendants double-counts again.

The columns `cost` ("Money", `sum(deployment_price)`) and `requests` (`count()`) are edge-local and disjoint, so summing across descendants is mathematically safe — but applying a single uniform rule across all five fields is simpler than mixing two rules per field, and the math works because of the invariant: for any node, **`sum(direct_children.deployment_cost) == sum(all_descendants.cost)`** (each child's `deployment_cost` already contains its subtree's `cost`).

Existing spec `openspec/specs/entities-consumption-tree/spec.md` is internally contradictory: line 60 says synthetic rows are inserted "with the sum of its descendants' metrics", while lines 100–116 say synthetic rows display `0`. The current implementation matches the latter. This change picks a single rule and aligns both spec and code.

## Goals / Non-Goals

**Goals:**
- Synthetic rows show meaningful, non-zero totals for `requests`, `prompts`, `completions`, and `deployment_cost`.
- Aggregation rule is provably free of double-counting under both kinds of duplication (`deployment_cost` rollup and orchestrator/model token repetition).
- Real (non-synthetic) backend rows remain byte-for-byte unchanged.
- The fix lives in one pure utility function with unit-test coverage; no UI/component changes.

**Non-Goals:**
- Recomputing numbers on real rows.
- Adding a separate "subtree total" column, tooltip, or footer.
- Changing the backend query or the meaning of `deployment_price` / `price`.
- Repointing the tree at a different identifier strategy (`execution_path`-based id construction stays as-is).
- Anything outside tree-mode (flat mode has no synthetic rows by construction).

## Decisions

### Decision 1: Use a single rule — "sum of direct children only"— for every aggregated field on synthetic rows

For each synthetic row, set:
```
synthetic.requests        = Σ direct_child.requests
synthetic.prompts         = Σ direct_child.prompts
synthetic.completions     = Σ direct_child.completions
synthetic.deployment_cost = Σ direct_child.deployment_cost
synthetic.cost            = '0'   (unchanged)
```

**Why one rule, not two:**
- For `deployment_cost`: required, because each row is already pre-aggregated, so direct-children-only is the only safe rule.
- For `prompts` / `completions`: required, because tokens repeat across orchestrator/model layers (confirmed during exploration).
- For `requests` / `cost`: a uniform direct-children rule still gives a defensible number — "requests served by my direct children" — and avoids two implementations.
- Mathematical consistency: because each direct child's `deployment_cost` already includes its subtree, descending further would be redundant for any field that has a backend-rollup semantics. For edge-local fields, summing direct children at every level is equivalent to summing all descendants once you walk the whole tree post-order, because each level rolls up its own subtree.

**Alternatives considered:**
- *Mixed rule (disjoint sum for `cost`/`requests`, direct-children for tokens and `deployment_cost`)*: marginally more "accurate" for raw-event interpretation of `requests`/`cost`, but bloats the implementation and asks readers of the code to remember which field uses which rule. Rejected.
- *Sum-all-descendants uniformly*: simple but wrong for `deployment_cost` and tokens.
- *Leave at zero (status quo)*: ships nothing for users; the original motivation.

### Decision 2: `cost` ("Money" column) stays at `'0'` on synthetic rows

A synthetic row represents a placeholder for which the backend has no measurement. The "Money" column means "this deployment's own spend." Synthetic rows did no work themselves, so `0` is the truthful value. The "Total money" column already conveys the rolled-up subtree spend.

**Alternative considered:** populate `cost` with the same value as `deployment_cost` so the row "looks complete." Rejected — it blurs the semantic distinction between the two columns that real rows depend on, and a reader scanning the grid will misread synthetic rows as having real own-spend.

### Decision 3: Apply rollup only to rows where `synthetic === true`

Real backend rows already carry correct values. Recomputing them risks divergence if any consumer relies on the backend numbers being authoritative. The rollup pass reads from all children (real or synthetic) but writes only to synthetic rows.

### Decision 4: Implement as a post-order tree walk after `buildEntitiesConsumptionTree`

The aggregation is naturally bottom-up: a synthetic ancestor's value depends on its children's values, which may themselves be synthetic. Post-order DFS guarantees that by the time we compute a synthetic row's totals, every child (real or synthetic) already carries its final value.

The walk lives next to `buildEntitiesConsumptionTree` in `apps/ai-dial-admin/src/utils/entities-consumption-tree.ts` and is invoked from the same exported function — callers (`EntitiesConsumptionTree.tsx`) don't change.

```
buildEntitiesConsumptionTree(rows)
  → withSyntheticAncestors(rows)
  → buildTreeFromParentPointer(rows)
  → aggregateSyntheticRows(tree)        ← new step
  → return tree
```

`aggregateSyntheticRows` is a pure function operating on `TreeRow<EntityRow>[]` and can be unit-tested directly with hand-built trees.

### Decision 5: Numeric fields stay as strings on `EntityRow`

`EntityRow` types `requests`, `cost`, `deployment_cost`, `prompts`, `completions` as `string` (the backend returns stringified numerics). The aggregation function parses with `Number(value || '0')` (or equivalent), sums, and writes back `String(total)`. No type changes; AG Grid's existing `numericColumn` formatters keep working.

`'0'` parses to `0` cleanly and `String(0)` round-trips, so empty/zero handling is uniform.

## Risks / Trade-offs

- **Existing test fixtures assert synthetic rows show `0`** → Update those assertions as part of the change. The risk is missing one and shipping a flaky test; mitigated by running the full `EntitiesConsumptionTree.spec.tsx` suite locally and checking that every assertion against a synthetic row is intentional.
- **Backend data anomaly: a synthetic row's children disagree with what a future real row would report** → Acceptable; synthetic rows are explicit placeholders and the italic styling signals that. If the backend later returns a row for that deployment, it will replace the synthetic in `withSyntheticAncestors` (the path is keyed by `execution_path` in the lookup map), and the rollup pass simply won't run for it.
- **Performance** → Tree depth in production is bounded (`buildTreeFromParentPointer` enforces max depth 8). One additional post-order pass is O(N) in the row count; the existing tree build is already O(N). No measurable impact.
- **Spec contradiction with `analytics-deployment-price`** → That capability covers backend semantics, not the tree-row display rule, so there's no overlap. Verified by re-reading both spec files.
- **Spec drift** → The existing `entities-consumption-tree` spec references `parent_deployment`-only identifiers, but the live code uses `execution_path`-keyed ids. This change does NOT attempt to fix that drift — it only touches the synthetic-row display requirement. The drift is pre-existing and can be tackled separately.

## Migration Plan

No data migration. The change is a pure frontend behavior update behind the existing "Group by parent deployment" toggle. Rollback = revert the commit; the toggle and tree continue to function with the previous zero-value display.
