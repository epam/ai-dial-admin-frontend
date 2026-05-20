## Why

The Dashboard's **Entities Consumption** grid (`SimpleDashboard.tsx` → `TelemetryGrid` with `ENTITY_CONSUMPTION_QUERY` + `TELEMETRY_GRID_COLUMNS`) shows one flat row per deployment with aggregated call counts, money, and tokens. It tells the user *how much* each deployment was used, but not *who called whom*. In real DIAL deployments, deployments invoke other deployments — an application calls a model, a router calls multiple downstream models, an agent calls tool deployments. Today that call structure is invisible on the dashboard; users have to drop into the Usage Log and read raw traces to reconstruct it.

The telemetry rows already carry `parent_deployment` (immediate caller) and `execution_path` (the full chain), and both fields are even already declared as hidden columns in the `USAGE_LOG_TRACES_COLUMNS` set — they just aren't aggregated or visualized anywhere. Two other parts of the codebase already implement expandable hierarchical rows on AG Grid (the audit list flattens parent→children one level deep via `parentActivityId`; `SchemaGrid` flattens N levels deep via `children[]` + `depth` + `expanded`), but each ships its own copy of the flatten/expand machinery.

This change turns Entities Consumption into a tree grid grouped by `parent_deployment → deployment`, and extracts a single shared `TreeGrid` primitive that both this new view and (later) the audit list and `SchemaGrid` can consume.

## What Changes

- **Extract a generic `TreeGrid<T>` primitive under `src/components/Common/TreeGrid/`.** A thin wrapper over `GridView` that owns expand/collapse UI state, indented row rendering, and the flatten-with-children algorithm. Generic over the row type. No knowledge of deployments, schemas, or activities. The primitive SHALL expose: a `TreeRow<T>` shape (`T & { id, parentId, depth, expanded, children: TreeRow<T>[] }`), a `buildTreeFromParentPointer` builder, a `flattenTree` flattener that honors per-node `expanded` state, an `ExpanderCell` cellRenderer that draws the indent + caret, and a `useTreeRows` hook that owns expanded-state mutation and pushes flattened rows into the AG Grid api.

- **Extend `ENTITY_CONSUMPTION_QUERY` to group by `(deployment, parent_deployment)`.** Add `parent_deployment` to `expressions` and to `groupBy`. The backend already understands these columns (they're declared in `TRACES_QUERY` / `CONVERSATIONS_QUERY`). Each row in the response now represents one (deployment, caller) pair with its own aggregated metrics. Top-level rows (deployments called directly with no parent) come back with `parent_deployment = null` or `''`; both SHALL be normalized to `null` at the boundary.

- **Add a new component `Telemetry/EntitiesConsumptionTree.tsx` that replaces the flat `TelemetryGrid` for this slot.** It owns the data fetch (reuses the existing `getDashboardData` request shape via `getData`), builds the tree from the response via `buildTreeFromParentPointer`, feeds the resulting `TreeRow<EntityRow>[]` into `TreeGrid<EntityRow>`, and exposes the same `query` / `getData` / `refreshTime` / `title` props the current `TelemetryGrid` consumes so the wiring in `SimpleDashboard.tsx` is a one-line swap.

- **Add synthetic parent nodes when a `parent_deployment` value is not itself present in the result set.** If row R cites `parent_deployment = "foo"` but no row has `deployment = "foo"`, a synthetic parent row SHALL be inserted as a root with metrics computed as the sum of its descendant rows' metrics. Synthetic rows SHALL carry a flag so the cell renderer can mark them visually (italic name, no link) and the user understands the aggregate-only nature.

- **Show direct-call metrics + descendant rollup on parent rows.** A row whose deployment also has children represents (a) the rows where that deployment was called directly with no parent in the response set, and (b) the implicit total across its subtree. The Name column SHALL display the deployment name with a subtle suffix when descendants exist (e.g. `chat-orch (+3)` where 3 is the count of children); the numeric columns SHALL display the *direct* aggregate (what the backend returned for that row), and a tooltip on parent numeric cells SHALL show the subtree sum. This keeps the visible numbers reconcile-able with System Usage above, while making the tree structure useful.

- **Add a "Group by parent" toggle above the grid.** The same `TelemetryGrid` slot can render in two modes: flat (legacy behavior — `groupBy: ['deployment']` only) and tree (this change — `groupBy: ['deployment', 'parent_deployment']`). Default is **flat** on first ever load (no regression), with the user's choice persisted in localStorage under `dashboard:entities-consumption:groupByParent`. This is the smallest gate that protects users who don't care about call structure and reviewers who don't want a visual diff on production dashboards.

- **Drop cycles in tree construction with a bounded depth limit (8).** Defensive guard against dirty data where `parent_deployment` forms a cycle (a→b→a). Cycles SHALL be detected during build and the back-edge SHALL be dropped; a single `console.warn` SHALL be emitted naming the offending deployment IDs. Tree depth SHALL be capped at 8; rows beyond that limit are rendered as flat siblings at depth 8 (no further nesting).

## Capabilities

### New Capabilities

- `tree-grid`: A generic, capability-agnostic tree-grid primitive (component + hook + utilities) that turns flat rows with parent pointers into an AG Grid view with indented expandable rows. Owns expand/collapse state, the flatten algorithm, the expander cell renderer, and cycle/depth safety. Consumed by feature capabilities — owns no domain logic.

- `entities-consumption-tree`: The Dashboard's Entities Consumption grid SHALL support a tree view grouped by `parent_deployment → deployment`, derived from a single ClickHouse aggregation over the analytics table. Includes the synthetic-parent rule, the direct-vs-rollup metric display, and the flat/tree toggle.

### Modified Capabilities

<!-- None today. The audit list (`ActivityAudit/List/List.tsx`) and `SchemaGrid` (`Common/SchemaGrid/SchemaGrid.tsx`) each maintain their own tree-flatten logic. Migrating them to the new `tree-grid` primitive is **explicitly out of scope** for this change — see Non-Goals in design.md. A follow-up change can adopt the primitive once it has shipped and stabilized in one consumer. -->

## Impact

- **Affected files:**
  - `apps/ai-dial-admin/src/components/Common/TreeGrid/TreeGrid.tsx` *(new)*
  - `apps/ai-dial-admin/src/components/Common/TreeGrid/use-tree-rows.ts` *(new)*
  - `apps/ai-dial-admin/src/components/Common/TreeGrid/ExpanderCell.tsx` *(new)*
  - `apps/ai-dial-admin/src/components/Common/TreeGrid/utils.ts` *(new — `buildTreeFromParentPointer`, `flattenTree`, `updateRowInTree`, `findRowInTree`)*
  - `apps/ai-dial-admin/src/components/Common/TreeGrid/types.ts` *(new — `TreeRow<T>` and synthetic-row flag)*
  - `apps/ai-dial-admin/src/components/Common/TreeGrid/tests/utils.spec.ts` *(new)*
  - `apps/ai-dial-admin/src/components/Common/TreeGrid/tests/TreeGrid.spec.tsx` *(new)*
  - `apps/ai-dial-admin/src/components/Telemetry/EntitiesConsumptionTree.tsx` *(new)*
  - `apps/ai-dial-admin/src/components/Telemetry/tests/EntitiesConsumptionTree.spec.tsx` *(new)*
  - `apps/ai-dial-admin/src/components/Telemetry/Dashboards/View/SimpleDashboard.tsx` — swap `<TelemetryGrid>` for the new component in the Entities Consumption slot
  - `apps/ai-dial-admin/src/constants/telemetry.tsx` — modify `ENTITY_CONSUMPTION_QUERY` expressions + groupBy
  - `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` — extend `TELEMETRY_GRID_COLUMNS` with the indent-aware Name cell renderer when used in tree mode (or define a sibling column set `TELEMETRY_TREE_GRID_COLUMNS`)
  - No i18n changes required. Synthetic placeholder rows show backend `0` values verbatim; the `(+N)` suffix on the Name column is locale-neutral.

- **No backend changes.** `parent_deployment` and `execution_path` are existing columns in the analytics table (verified via `TRACES_QUERY` expressions). The new `groupBy` is supported by the existing query shape.

- **No new dependencies.** Reuses AG Grid, the existing `GridView` wrapper, and the existing telemetry `getDashboardData` action.

- **No data migration.** The flat/tree toggle defaults to flat on first load; existing dashboard users see no change unless they opt in. The toggle preference is persisted under a new localStorage key; absence equals flat.

- **Cross-feature risk:** the query change adds a column and a groupBy clause. Any consumer that depends on the *current* `ENTITY_CONSUMPTION_QUERY` shape (one row per deployment) needs to either keep using the old shape via a flat variant constant, or be updated. A search confirms only `SimpleDashboard.tsx` imports this query — the migration is local. The flat-mode toggle delivers the legacy shape unchanged when active.

- **Performance:** the new groupBy expands result row count from `O(deployments)` to `O(deployments × distinct callers)`. For typical DIAL installations this is a constant-factor increase (~2-5x). The tree build is `O(rows)` with a hashmap lookup; flatten is `O(visible rows)`. No infinite scrolling — Entities Consumption is already client-paginated in `TelemetryGrid` over a bounded aggregation result.

- **No breaking changes** to existing dashboards or stored grid state. The flat-mode toggle defaults to flat for existing users; the column set is the same in flat mode; the new tree-mode column adds the indent in the Name column only.
