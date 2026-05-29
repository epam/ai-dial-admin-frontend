## MODIFIED Requirements

### Requirement: Tree-mode query groups by parent_deployment in addition to deployment

When tree mode is active, the Entities Consumption section SHALL issue `ENTITY_CONSUMPTION_TREE_QUERY` to `getDashboardData`. The query's `expressions` SHALL include `'deployment'`, `'parent_deployment'`, `'execution_path'`, `'project_id'`, `'count()'`, `'sum(deployment_price) as money'`, `'sum(price) as aggregated_money'`, `'sum(prompt_tokens) as tokens_p'`, `'sum(completion_tokens) as tokens_c'`. Its `groupBy` SHALL equal `['deployment', 'parent_deployment', 'execution_path', 'project_id']`. The `from` clause SHALL remain `ANALYTICS_TABLE_NAME`.

The `project_id` dimension was added so the same response can feed both the Entities Consumption tree and the Projects Consumption grid via the [[consumption-project-aggregation]] capability. The response is therefore one row per `(deployment, parent_deployment, execution_path, project_id)` tuple, and the tree builder consumes the response *after* `aggregateByDeployment` has collapsed the project axis.

#### Scenario: Tree query shape

- **WHEN** the consumption fetch fires
- **THEN** the request payload's `query.expressions` SHALL include `'project_id'` alongside the existing `'deployment'`, `'parent_deployment'`, `'execution_path'`, and aggregate columns
- **AND** `query.groupBy` SHALL equal `['deployment', 'parent_deployment', 'execution_path', 'project_id']`

### Requirement: Tree-mode rows are built from parent_deployment pointers and grouped per (deployment, caller) tuple

The Entities Consumption tree SHALL be constructed by `buildEntitiesConsumptionTree`. Its input SHALL be the output of `aggregateByDeployment` applied to the raw consumption response, NOT the raw response itself. After aggregation each row SHALL carry one unique `(deployment, parent_deployment, execution_path)` triplet with summed numeric fields across the collapsed `project_id` axis. Tree construction itself proceeds unchanged: `buildTreeFromParentPointer` keys by `execution_path|name`, synthesizes ancestors via `withSyntheticAncestors` when a referenced parent path is missing, and runs the post-order direct-children rollup pass for synthetic rows (per "Synthetic rows display direct-child rollup totals").

#### Scenario: Tree input is the aggregator output, not the raw response

- **GIVEN** the raw response contains three rows for the same `(d_1, p_1, p_1/d_1)` triplet under three distinct `project_id` values with token sums `0`, `100`, `200`
- **WHEN** the tree is built
- **THEN** `buildEntitiesConsumptionTree` SHALL receive exactly one row for that triplet with `prompts: '300'`
- **AND** the tree SHALL contain exactly one node for `(d_1, p_1, p_1/d_1)` (no triplicate nodes from un-aggregated input)

#### Scenario: Single-project response behaves identically to legacy behavior

- **GIVEN** the raw response contains rows where each `(deployment, parent_deployment, execution_path)` appears under exactly one `project_id`
- **WHEN** the tree is built
- **THEN** the rows fed into `buildEntitiesConsumptionTree` SHALL be byte-for-byte equivalent to what the legacy (pre-`project_id`) query would have returned
- **AND** the resulting tree structure and numbers SHALL match legacy behavior exactly

#### Scenario: Synthetic-ancestor injection still operates on aggregated rows

- **GIVEN** the raw response contains rows for `(B, A, A/B, p_x)` and `(B, A, A/B, p_y)` but no row whose `execution_path` is `'A'`
- **WHEN** the tree is built
- **THEN** `aggregateByDeployment` SHALL emit one row for `(B, A, A/B)` with summed numerics
- **AND** `withSyntheticAncestors` SHALL inject a synthetic root for `'A'` whose `requests` / `prompts` / `completions` / `deployment_cost` come from the post-order direct-children rollup pass
