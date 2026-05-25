# entities-consumption-tree Specification

## Purpose

Add a "Group by parent deployment" mode to the Dashboard's Entities Consumption section so admins can see which parent deployments (orchestrators, applications, agents) are driving traffic into downstream deployments. Tree mode is opt-in, persisted per browser, and Dashboard-route-only — entity-scoped dashboards (Applications, Toolsets) continue to show the flat view. Tree rendering reuses the `tree-grid` primitive; this capability owns the toggle, the query shape, the row transform (including synthetic-parent insertion), display rules, and expanded-state continuity across auto-refresh.
## Requirements
### Requirement: Entities Consumption grid offers a "Group by parent deployment" toggle

The Dashboard's Entities Consumption section SHALL render a toggle inline with the section title labelled "Group by parent deployment" (i18n key `TelemetryI18nKey.GroupByParent`). The toggle SHALL be off by default on first load. The toggle's value SHALL be persisted across page reloads under the localStorage key `dashboard:entities-consumption:groupByParent` with values `'true'` / `'false'`; absence of the key SHALL be interpreted as `'false'`. The toggle SHALL be available only when the current route is `ApplicationRoute.Dashboard` — entity-scoped dashboards (Applications, Toolsets) SHALL NOT render the toggle and SHALL continue to use the flat view.

#### Scenario: Default state on first ever load is flat

- **GIVEN** a user with no value for `dashboard:entities-consumption:groupByParent` in localStorage
- **WHEN** the user opens the Dashboard route
- **THEN** the Entities Consumption section SHALL render in flat mode, identical to the current production behavior
- **AND** the toggle SHALL render in the off position

#### Scenario: Toggle on switches to tree mode and persists

- **GIVEN** the user is viewing Entities Consumption in flat mode
- **WHEN** the user activates the "Group by parent deployment" toggle
- **THEN** the grid SHALL re-fetch using `ENTITY_CONSUMPTION_TREE_QUERY` (with `parent_deployment` in groupBy)
- **AND** localStorage SHALL contain `dashboard:entities-consumption:groupByParent = 'true'`
- **AND** the grid SHALL render as a tree with expand/collapse on parent rows

#### Scenario: Toggle off returns to flat mode and persists

- **GIVEN** the user is viewing Entities Consumption in tree mode
- **WHEN** the user deactivates the toggle
- **THEN** the grid SHALL re-fetch using `ENTITY_CONSUMPTION_QUERY` (groupBy `['deployment']` only)
- **AND** localStorage SHALL contain `dashboard:entities-consumption:groupByParent = 'false'`
- **AND** the grid SHALL render flat, identical to the default

#### Scenario: Toggle preference applies on next visit

- **GIVEN** the user previously enabled tree mode (localStorage value is `'true'`)
- **WHEN** the user reloads the page or returns to the Dashboard route from another route
- **THEN** the toggle SHALL render in the on position
- **AND** the grid SHALL fetch using `ENTITY_CONSUMPTION_TREE_QUERY` on first load

### Requirement: Tree-mode query groups by parent_deployment in addition to deployment

When the toggle is on, the Entities Consumption section SHALL issue `ENTITY_CONSUMPTION_TREE_QUERY` to `getDashboardData`. The query SHALL be identical to `ENTITY_CONSUMPTION_QUERY` except that `expressions` SHALL additionally include `'parent_deployment'` and `groupBy` SHALL be `['deployment', 'parent_deployment']`. Numeric aggregates (`count()`, `sum(deployment_price) as money`, `sum(price) as aggregated_money`, `sum(prompt_tokens) as tokens_p`, `sum(completion_tokens) as tokens_c`) SHALL be unchanged. The `from` clause SHALL remain `ANALYTICS_TABLE_NAME`.

#### Scenario: Tree query shape

- **WHEN** tree mode is active
- **THEN** the request payload to `getDashboardData` SHALL contain `query.expressions` including `'parent_deployment'` alongside the existing aggregates
- **AND** `query.groupBy` SHALL equal `['deployment', 'parent_deployment']`

#### Scenario: Flat query shape unchanged

- **WHEN** flat mode is active
- **THEN** the request payload SHALL match the existing `ENTITY_CONSUMPTION_QUERY` byte-for-byte (no `parent_deployment` in `expressions` or `groupBy`)

### Requirement: Tree-mode rows are built from parent_deployment pointers and grouped per (deployment, caller) tuple

When tree mode is active, the response rows from the server (one per (deployment, parent_deployment) tuple) SHALL be transformed into a tree by `buildTreeFromParentPointer` using `getId: r => r.deployment`, `getParentId: r => r.parent_deployment ?? null`, and `sumFields: ['count', 'money', 'aggregated_money', 'tokens_p', 'tokens_c']`. Empty-string `parent_deployment` values SHALL be normalized to `null` before tree construction (the backend may return either depending on the column NULL semantics). When a `parent_deployment` value references a deployment that has no row of its own in the response, a synthetic parent row SHALL be inserted as a placeholder with `synthetic: true` and every numeric field initialized to `'0'`; the synthetic row's displayed totals are computed by the rollup pass defined in "Synthetic rows display direct-child rollup totals" below.

#### Scenario: Flat response with parent pointers becomes a two-level tree

- **GIVEN** the server returns rows:
    `{ deployment: 'chat-orch', parent_deployment: null, count: 50 }`,
    `{ deployment: 'gpt-4-router', parent_deployment: 'chat-orch', count: 320 }`,
    `{ deployment: 'claude-fb', parent_deployment: 'chat-orch', count: 180 }`,
    `{ deployment: 'embed-pipe', parent_deployment: null, count: 90 }`
- **WHEN** the tree is built
- **THEN** the output SHALL contain two roots: `chat-orch` (depth 0, count 50, children: [`gpt-4-router`, `claude-fb`]) and `embed-pipe` (depth 0, count 90, no children)

#### Scenario: Missing intermediate deployment is synthesized as a parent

- **GIVEN** the server returns rows:
    `{ deployment: 'gpt-4-router', parent_deployment: 'chat-orch', count: 320 }`,
    `{ deployment: 'claude-fb', parent_deployment: 'chat-orch', count: 180 }`,
    (no row for `chat-orch` itself)
- **WHEN** the tree is built
- **THEN** the output SHALL contain one synthetic root `chat-orch` with `synthetic: true`
- **AND** `gpt-4-router` and `claude-fb` SHALL be children of that synthetic root
- **AND** the synthetic row's displayed totals SHALL be derived per the "Synthetic rows display direct-child rollup totals" requirement (not stored as backend data)

#### Scenario: Empty parent_deployment value normalizes to null

- **GIVEN** a server row `{ deployment: 'a', parent_deployment: '', count: 10 }`
- **WHEN** the tree is built
- **THEN** the row SHALL be treated as a root (parent normalized to `null`)
- **AND** SHALL NOT be confused with a child whose parent id is the empty string

#### Scenario: Same deployment called by multiple parents appears in multiple branches

- **GIVEN** the server returns:
    `{ deployment: 'gpt-4', parent_deployment: 'app-A', count: 100 }`,
    `{ deployment: 'gpt-4', parent_deployment: 'app-B', count: 200 }`,
    `{ deployment: 'app-A', parent_deployment: null, count: 0 }`,
    `{ deployment: 'app-B', parent_deployment: null, count: 0 }`
- **WHEN** the tree is built
- **THEN** `gpt-4` SHALL appear once under `app-A` (count 100) and once under `app-B` (count 200)
- **AND** the two appearances SHALL have distinct `id` values in the tree representation (composite of deployment + parent) so AG Grid's row identity is unique

### Requirement: Rows display backend values as-is

Each numeric column on every real (non-synthetic) row SHALL display the value returned by the backend for that (deployment, parent) tuple verbatim — the frontend SHALL NOT compute subtree sums for real rows and SHALL NOT substitute backend values with descendant aggregates. Synthetic rows are an exception: their `requests`, `prompts`, `completions`, and `deployment_cost` fields SHALL be populated via the rollup defined in "Synthetic rows display direct-child rollup totals" below, while their `cost` field SHALL remain `'0'`. The Name column SHALL display the deployment name followed by a `(+N)` suffix where N is the immediate child count, when N ≥ 1.

#### Scenario: Direct-call parent shows direct backend count

- **GIVEN** a row `chat-orch` with `count: 50` and two children with counts 320 and 180
- **WHEN** the row renders
- **THEN** the count column SHALL display `50` (the backend value, unchanged)
- **AND** the Name column SHALL display `chat-orch (+2)`

#### Scenario: Synthetic parent shows rolled-up totals from direct children

- **GIVEN** a synthetic `chat-orch` row (placeholder for missing backend row) with two children whose `requests` are 320 and 180, `prompts` are 1000 and 500, `completions` are 2000 and 1000, `deployment_cost` are 5 and 3
- **WHEN** the row renders
- **THEN** the count column SHALL display `500` (320 + 180)
- **AND** the Prompt Tokens column SHALL display `1500` (1000 + 500)
- **AND** the Completion Tokens column SHALL display `3000` (2000 + 1000)
- **AND** the Total money column SHALL display `$8.00` (5 + 3)
- **AND** the Money column SHALL display `$0.00` (synthetic rows do no own work)
- **AND** the Name column SHALL display `chat-orch (+2)` in italic typography

#### Scenario: Leaf row shows direct aggregate with no suffix

- **GIVEN** a row `gpt-4-router` at depth 1 with `count: 320` and no children
- **WHEN** the row renders
- **THEN** the count column SHALL display `320`
- **AND** the Name column SHALL display `gpt-4-router` (no `(+N)` suffix, no italic)
- **AND** numeric columns SHALL NOT carry the subtree-total or synthetic-parent tooltip

### Requirement: Expanded state survives auto-refresh

When `refreshTime` triggers an automatic refetch of the tree-mode query, the new response SHALL replace the previous tree, but rows whose `id` matches a previously-expanded row SHALL retain `expanded: true` after the rebuild. This SHALL hold even if intermediate rows have appeared or disappeared between refreshes. Rows present before but absent in the new response SHALL be dropped from the expanded-state map.

#### Scenario: Refresh keeps previously expanded nodes open

- **GIVEN** the user has expanded `chat-orch` in tree mode
- **WHEN** the auto-refresh fires and the new response still contains a `chat-orch` row
- **THEN** the rebuilt tree SHALL render with `chat-orch` already expanded
- **AND** the user SHALL see no visible collapse-then-re-expand flicker

#### Scenario: Refresh drops vanished rows from the expanded-state map

- **GIVEN** the user previously expanded `chat-orch`, and the new response no longer contains any row with `deployment === 'chat-orch'`
- **WHEN** the rebuild completes
- **THEN** the expanded-state map SHALL no longer carry `chat-orch`
- **AND** if `chat-orch` later reappears in a future refresh, it SHALL start collapsed (not silently restored)

### Requirement: Synthetic ancestor name derived from execution_path when parent_deployment is "undefined"

When `withSyntheticAncestors` creates a synthetic parent row, and the triggering child row's `parent_deployment` is either the literal string `'undefined'`, empty after trimming, or `null`/`undefined`, the synthetic row's `name` SHALL be derived from the last segment of the parent execution path (using `lastSegmentOfPath`, which respects backslash-escaped `\/` segment separators emitted by the backend). The same derivation SHALL also be applied inside `getParentId` when building the tree, so that the synthetic's id and each child's parent-id reference the same value — preserving the parent-child linkage in `buildTreeFromParentPointer`.

When the trimmed `parent_deployment` is a non-empty value other than `'undefined'`, that value SHALL be used verbatim — the fallback applies only to the `'undefined'`/empty/`null` cases.

#### Scenario: parent_deployment="undefined" with a real parent path → name from path

- **GIVEN** a row `{ name: 'leaf', parent_deployment: 'undefined', execution_path: 'mystery-parent/leaf' }`
- **WHEN** the tree is built
- **THEN** a synthetic row with `name: 'mystery-parent'` (NOT `'undefined'`) SHALL be created at `execution_path: 'mystery-parent'`
- **AND** `leaf` SHALL be attached as the synthetic's direct child

#### Scenario: Escaped `\/` in the parent path is preserved in the synthetic name

- **GIVEN** a row `{ name: 'grandchild', parent_deployment: 'undefined', execution_path: 'x/a\\/b/grandchild' }`
- **WHEN** the tree is built
- **THEN** the synthetic's `name` SHALL be `'a/b'` (the escape is undone for the displayed name)
- **AND** `grandchild` SHALL still attach to that synthetic

#### Scenario: Root row with parent_deployment="undefined" remains a root (no synthetic)

- **GIVEN** a row whose `execution_path` equals its `name` (e.g. `{ name: 'world-economy-v2-hybrid', parent_deployment: 'undefined', execution_path: 'world-economy-v2-hybrid' }`)
- **WHEN** the tree is built
- **THEN** `stripDeploymentSuffix` SHALL return `null` (no parent path)
- **AND** NO synthetic row SHALL be created for this row
- **AND** the row SHALL render as a normal root

#### Scenario: Normal parent_deployment values are unaffected

- **GIVEN** a row `{ name: 'layout-detector', parent_deployment: 'Ocr', execution_path: 'Ocr/layout-detector' }`
- **WHEN** the tree is built
- **THEN** the synthetic's `name` SHALL be `'Ocr'` (the explicit parent_deployment value)
- **AND** the derivation fallback SHALL NOT be invoked

### Requirement: Synthetic rows display direct-child rollup totals

After tree construction by `buildTreeFromParentPointer`, the entities-consumption tree utility SHALL perform a post-order pass that, for each row where `synthetic === true`, sets the row's numeric fields from the **sum of its direct children's values** (not all descendants). The fields covered SHALL be `requests`, `prompts`, `completions`, and `deployment_cost`. The `cost` field SHALL remain `'0'` on synthetic rows. The pass SHALL operate bottom-up so that a synthetic row whose direct child is itself synthetic reads the child's already-computed totals.

The rule applies only to rows with `synthetic === true`. Real (non-synthetic) rows SHALL retain the exact values the backend returned, untouched by this pass.

#### Scenario: Single-level synthetic root sums its direct children

- **GIVEN** a synthetic root `Ocr` with three real direct children whose `requests` are `'34'`, `'11'`, `'8'` and whose `deployment_cost` are `'2'`, `'1'`, `'0.5'`
- **WHEN** the rollup pass runs
- **THEN** `Ocr.requests` SHALL equal `'53'`
- **AND** `Ocr.deployment_cost` SHALL equal `'3.5'`
- **AND** `Ocr.cost` SHALL equal `'0'`

#### Scenario: Direct-children rule avoids double-counting deployment_cost

- **GIVEN** a synthetic root `A` whose only direct child `B` is a real row with `deployment_cost: '60'` (already includes B's downstream `C` at `deployment_cost: '20'`)
- **WHEN** the rollup pass runs
- **THEN** `A.deployment_cost` SHALL equal `'60'` (not `'80'`)
- **AND** the grandchild `C`'s `deployment_cost` SHALL NOT be re-added at `A`

#### Scenario: Direct-children rule avoids double-counting tokens at orchestrator/model layers

- **GIVEN** a synthetic root `A` whose direct child `orchestrator` (real) has `prompts: '100'` and a grandchild `model` (real) also has `prompts: '100'` (the same logical tokens recorded at each layer)
- **WHEN** the rollup pass runs
- **THEN** `A.prompts` SHALL equal `'100'` (not `'200'`)

#### Scenario: Nested synthetic ancestor reads child synthetic's already-computed totals

- **GIVEN** a synthetic root `Outer` whose only direct child is a synthetic `Inner`, and `Inner` has two real children with `requests: '5'` and `'7'`
- **WHEN** the rollup pass runs
- **THEN** `Inner.requests` SHALL equal `'12'` (computed first, bottom-up)
- **AND** `Outer.requests` SHALL equal `'12'` (reads `Inner`'s computed value, not the grandchildren directly)

#### Scenario: Real rows are not modified

- **GIVEN** a real row `chat-orch` (`synthetic` is false/undefined) with `requests: '50'`, `cost: '2'`, `deployment_cost: '7'`, and two children with `requests: '320'` and `'180'`
- **WHEN** the rollup pass runs
- **THEN** `chat-orch.requests` SHALL remain `'50'`
- **AND** `chat-orch.cost` SHALL remain `'2'`
- **AND** `chat-orch.deployment_cost` SHALL remain `'7'`

#### Scenario: Synthetic row with no children stays at zero

- **GIVEN** a synthetic row inserted by `withSyntheticAncestors` that ends up with an empty `children` array (edge case — should not occur in practice but the algorithm must be defensive)
- **WHEN** the rollup pass runs
- **THEN** every numeric field on the row SHALL remain `'0'`

