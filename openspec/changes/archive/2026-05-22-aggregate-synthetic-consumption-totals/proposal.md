## Why

Synthetic placeholder rows in the Entities Consumption tree currently display `0` in every numeric column, leaving large gaps in the grid (e.g. the `Ocr` synthetic root with three active children shows zero requests, zero tokens, zero money). Admins reading the dashboard cannot tell at a glance which orchestrators are driving traffic.

The naive fix — summing all descendants — double-counts, because the backend column `price` (rendered as "Total money") is already a per-row subtree rollup, and orchestrator/model layers can record the same prompt tokens at multiple depths. We need a rollup rule that's correct under both kinds of duplication.

## What Changes

- Populate synthetic rows in the entities-consumption tree with totals derived from their **direct children only** (`requests`, `prompts`, `completions`, `deployment_cost`).
- Leave `cost` ("Money" column) at `0` on synthetic rows — synthetic rows represent missing measurements, not work done by the placeholder itself.
- Real (non-synthetic) rows continue to display backend values verbatim — no recomputation.
- Apply the rollup post-order so nested synthetic rows resolve correctly (a synthetic above another synthetic reads its child's already-computed totals).
- When a row's `parent_deployment` is the literal string `'undefined'` (or empty) yet its `execution_path` still carries a real parent chain, derive the synthetic ancestor's name from the last segment of the parent path instead of literally calling the row `'undefined'`. Apply the same derivation in `getParentId` so parent-child linkage stays consistent.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `entities-consumption-tree`: Replaces the "synthetic rows display zero" rule with a "synthetic rows aggregate from direct children, cost stays zero" rule; updates the synthetic-insertion requirement so descendant metrics are populated via direct-children rollup (resolving the existing internal contradiction between the insertion clause and the display clause).

## Impact

- **Code**: `apps/ai-dial-admin/src/utils/entities-consumption-tree.ts` — add a post-order pass after `buildEntitiesConsumptionTree` that fills synthetic rows' numeric fields from direct children.
- **Tests**: `apps/ai-dial-admin/src/components/Telemetry/tests/EntitiesConsumptionTree.spec.tsx` — existing fixtures assert synthetic rows show `0`; those expectations need to update. Add new cases covering the duplication scenarios (orchestrator-with-model token repetition, multi-level synthetic ancestors).
- **No backend changes**: query shape (`ENTITY_CONSUMPTION_TREE_QUERY`) is unchanged.
- **No UI/route changes**: only the numbers inside synthetic rows differ; column definitions, formatters, and the italic styling for synthetic rows stay as-is.
- **Behavior visible to users**: synthetic rows in the Dashboard's Entities Consumption tree (when "Group by parent deployment" is on) will show meaningful totals instead of zeros.

## Non-goals

- Recomputing or overriding numbers on real (non-synthetic) rows — the backend remains the source of truth for those.
- Adding a separate "Subtree total" column or tooltip — the existing "Money" / "Total money" columns are sufficient.
- Changing the SQL query, the underlying analytics table, or the meaning of `deployment_price` vs `price` at the backend.
