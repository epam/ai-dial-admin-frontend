## ADDED Requirements

### Requirement: Single source query feeds both consumption grids and the Total Tokens card

The Dashboard SHALL fetch consumption data via a single backend query whose `expressions` include `deployment`, `parent_deployment`, `execution_path`, `project_id`, `count()`, `sum(deployment_price) as money`, `sum(price) as aggregated_money`, `sum(prompt_tokens) as tokens_p`, `sum(completion_tokens) as tokens_c`, and whose `groupBy` is `['deployment', 'parent_deployment', 'execution_path', 'project_id']`. Both the Entities Consumption tree and the Projects Consumption grid SHALL be rendered from the same response. The Total Tokens headline card SHALL also reduce from a response with this shape.

`PROJECT_CONSUMPTION_QUERY` and the legacy `ENTITY_CONSUMPTION_QUERY` SHALL be removed from `constants/telemetry.tsx`.

#### Scenario: Single fetch covers both grids on the Dashboard route

- **GIVEN** the user opens the Dashboard route
- **WHEN** the Consumption section mounts
- **THEN** exactly one analytics request SHALL be issued for consumption data (no separate project-only query)
- **AND** the request's `query.groupBy` SHALL equal `['deployment', 'parent_deployment', 'execution_path', 'project_id']`

#### Scenario: Removed query constants do not exist

- **WHEN** any file attempts `import { PROJECT_CONSUMPTION_QUERY } from '@/src/constants/telemetry'` or `import { ENTITY_CONSUMPTION_QUERY } from '@/src/constants/telemetry'`
- **THEN** TypeScript SHALL report a missing-export error

### Requirement: ConsumptionDashboard proxy owns fetch and aggregation

A `ConsumptionDashboard` component SHALL be the sole owner of the consumption fetch on the Dashboard route. It SHALL:

- Issue the extended consumption query (per the requirement above) on mount and on each `refreshTime` interval defined by `refreshOptionsConfig`.
- Run `aggregateByDeployment` and `aggregateByProject` on each successful response.
- Pass the resulting `deploymentRows` to the Entities Consumption tree child and `projectRows` to the Projects Consumption grid child as props.
- Render the Entities Consumption tree only when `route === ApplicationRoute.Dashboard`; the Projects Consumption grid SHALL render on every route that mounts the proxy.
- Set both `deploymentRows` and `projectRows` to `null` when the server response's `success` is `false`.

The child grids SHALL NOT issue their own fetches when rendered by the proxy.

#### Scenario: Successful fetch fans out to both children

- **GIVEN** a multi-project analytics response containing two `(deployment, parent_deployment, execution_path)` triplets, each present under three distinct `project_id` values
- **WHEN** `ConsumptionDashboard` resolves the fetch
- **THEN** the Entities Consumption tree child SHALL receive 2 rows (one per triplet, project axis collapsed)
- **AND** the Projects Consumption grid child SHALL receive 3 rows (one per project, triplet axis collapsed)

#### Scenario: Failed fetch propagates to both children

- **GIVEN** the analytics request returns a response with `success: false`
- **WHEN** `ConsumptionDashboard` handles the rejection
- **THEN** both children SHALL render the "no data" placeholder

#### Scenario: Non-Dashboard route hides the tree but keeps the projects grid

- **GIVEN** `ConsumptionDashboard` is mounted with `route !== ApplicationRoute.Dashboard` (e.g. Applications, Toolsets)
- **WHEN** the fetch resolves
- **THEN** the Entities Consumption tree SHALL NOT be rendered
- **AND** the Projects Consumption grid SHALL render with `projectRows` as today

#### Scenario: Auto-refresh updates both children simultaneously

- **GIVEN** `ConsumptionDashboard` is mounted with a `refreshTime` whose `refreshOptionsConfig` entry defines a non-null `timeout`
- **WHEN** the refresh interval fires
- **THEN** the proxy SHALL re-issue the consumption query exactly once
- **AND** the tree and projects grid SHALL receive their refreshed rows from the same response

### Requirement: aggregateByDeployment collapses the project axis

`aggregateByDeployment(data: TelemetryData)` SHALL group rows from the raw consumption response by `(deployment, parent_deployment, execution_path)` and emit one `EntityRow` per group with:

- `name` set from the `deployment` column verbatim.
- `parent_deployment` and `execution_path` carried through verbatim.
- `requests` (= `sum(count)`), `cost` (= `sum(money)`), `deployment_cost` (= `sum(aggregated_money)`), `prompts` (= `sum(tokens_p)`), `completions` (= `sum(tokens_c)`) computed as a sum across the collapsed `project_id` axis, using `Big` arithmetic and serialized as strings.

The helper SHALL read column indexes off `data.headers` directly; it SHALL NOT use `TELEMETRY_GRID_HEADERS_MAP`. Rows with empty `execution_path` SHALL pass through unchanged in shape (the tree builder filters them downstream).

#### Scenario: Three projects collapse into one deployment row

- **GIVEN** the response contains three rows for `(d_1, p_1, p_1/d_1)`, one each under `project_id` `p_1`, `p_2`, `p_3`, with `tokens_p` `0`, `100`, `200` and matching `tokens_c` `0`, `0`, `0`
- **WHEN** `aggregateByDeployment` runs
- **THEN** the output SHALL contain one row with `name = 'd_1'`, `parent_deployment = 'p_1'`, `execution_path = 'p_1/d_1'`, `prompts = '300'`, `completions = '0'`

#### Scenario: Single project leaves the row unchanged

- **GIVEN** the response contains one row for `(d_2, p_2, p_2/d_2)` under `project_id` `p_x` with `prompts: '50'`
- **WHEN** `aggregateByDeployment` runs
- **THEN** the output SHALL contain one row with `prompts: '50'` (no math performed beyond the single-element sum)

#### Scenario: Big-number precision is preserved

- **GIVEN** the response contains two rows for the same triplet with `tokens_p` equal to `'9007199254740991'` (Number.MAX_SAFE_INTEGER) and `'1'`
- **WHEN** `aggregateByDeployment` runs
- **THEN** the output row's `prompts` SHALL equal `'9007199254740992'` (sum without float drift)

### Requirement: aggregateByProject sums project-root tokens only

`aggregateByProject(data: TelemetryData)` SHALL group rows from the raw consumption response by `project_id` and emit one row per project. To avoid orchestrator → child double-counting at the project level (the orchestrator's row and its downstream children describe the same logical traffic), only rows that qualify as a **project root** SHALL contribute to the per-project sums.

A row SHALL qualify as a project root when **either** of the following holds:

- **Real root** — its `parent_deployment` value, after trimming, is the empty string or the literal `'undefined'`.
- **Synthetic / orphan root** — its `parent_deployment` is some other value, but no row in the **same project** carries an `execution_path` equal to the parent's expected path (computed via `stripDeploymentSuffix(execution_path, deployment)` from `[[entities-consumption-tree]]`, so it respects backslash-escaped `\/` segment separators). In other words, the declared parent has no data of its own to attribute the tokens to, so the row is the highest-level record we have for that chain.

For every qualifying row, the helper SHALL add the row's numeric columns into the project's running sums using `Big` arithmetic. Output rows SHALL have:

- `name` set from the `project_id` column verbatim.
- `requests` (= `sum(count)`), `cost` (= `sum(money)`), `deployment_cost` (= `sum(aggregated_money)`), `prompts` (= `sum(tokens_p)`), `completions` (= `sum(tokens_c)`), each serialized as a string.

The helper SHALL read column indexes off `data.headers` directly; it SHALL NOT use `TELEMETRY_GRID_HEADERS_MAP`. The parent-presence check SHALL be scoped per `project_id` — a deployment of the same name living in a different project SHALL NOT satisfy "parent present" for this project's child.

The output row shape SHALL match `PROJECT_GRID_COLUMNS` (`name`, `requests`, `cost`, `deployment_cost`, `prompts`, `completions`).

#### Scenario: Three root deployments under one project collapse into one project row

- **GIVEN** the response contains three rows under `project_id = 'p_x'`, each with `parent_deployment = ''`, for three distinct root deployments with `prompts` `10`, `20`, `30`
- **WHEN** `aggregateByProject` runs
- **THEN** the output SHALL contain one row with `name = 'p_x'`, `prompts = '60'`

#### Scenario: Distinct projects produce distinct rows

- **GIVEN** the response contains three rows for the same root deployment (`parent_deployment = ''`) under `project_id` `p_1`, `p_2`, `p_3` with `prompts` `0`, `100`, `200`
- **WHEN** `aggregateByProject` runs
- **THEN** the output SHALL contain three rows: `(name: 'p_1', prompts: '0')`, `(name: 'p_2', prompts: '100')`, `(name: 'p_3', prompts: '200')`

#### Scenario: Child of a present orchestrator is excluded

- **GIVEN** the response contains
  `{ deployment: 'orchestrator', parent_deployment: '', execution_path: 'orchestrator', project_id: 'p_x', tokens_p: '333' }`,
  `{ deployment: 'child', parent_deployment: 'orchestrator', execution_path: 'orchestrator/child', project_id: 'p_x', tokens_p: '111' }`
- **WHEN** `aggregateByProject` runs
- **THEN** the output SHALL contain one row with `name = 'p_x'`, `prompts = '333'`
- **AND** the child's `111` tokens SHALL NOT be added (orchestrator already records the canonical project tokens)

#### Scenario: Orphan child whose parent has no row counts as a synthetic root

- **GIVEN** the response contains a single row
  `{ deployment: 'd_2', parent_deployment: 'p_2', execution_path: 'p_2/d_2', project_id: 'pr_2', tokens_p: '555' }`
  with no row whose `execution_path` is `'p_2'` in the same project
- **WHEN** `aggregateByProject` runs
- **THEN** the output SHALL contain one row with `name = 'pr_2'`, `prompts = '555'`
- **AND** the row SHALL be treated as a synthetic root because its declared parent has no data in this project

#### Scenario: Mixed projects — one real-root + one synthetic-root

- **GIVEN** the response contains
  `{ deployment: 'd_1', parent_deployment: 'p_1', execution_path: 'p_1/d_1', project_id: 'pr_1', tokens_p: '111' }`,
  `{ deployment: 'p_1', parent_deployment: '', execution_path: 'p_1', project_id: 'pr_1', tokens_p: '333' }`,
  `{ deployment: 'd_2', parent_deployment: 'p_2', execution_path: 'p_2/d_2', project_id: 'pr_2', tokens_p: '555' }`
- **WHEN** `aggregateByProject` runs
- **THEN** `pr_1` SHALL emit `prompts: '333'` — the child `d_1`'s `111` is skipped because `p_1` is present
- **AND** `pr_2` SHALL emit `prompts: '555'` — the orphan `d_2` is counted as a synthetic root because `p_2` has no row in `pr_2`

#### Scenario: Parent-presence is scoped per project

- **GIVEN** the response contains
  `{ deployment: 'orchestrator', parent_deployment: '', execution_path: 'orchestrator', project_id: 'pr_other', tokens_p: '999' }`,
  `{ deployment: 'child', parent_deployment: 'orchestrator', execution_path: 'orchestrator/child', project_id: 'pr_x', tokens_p: '50' }`
- **WHEN** `aggregateByProject` runs
- **THEN** `pr_other` SHALL emit `prompts: '999'`
- **AND** `pr_x` SHALL emit `prompts: '50'` — `orchestrator` existing in `pr_other` SHALL NOT satisfy the parent-present check for `pr_x`'s child

#### Scenario: Deep chain with present parents counts only the real root

- **GIVEN** the response contains
  `{ deployment: 'app-A', parent_deployment: '', execution_path: 'app-A', project_id: 'p_x', tokens_p: '10' }`,
  `{ deployment: 'mid', parent_deployment: 'app-A', execution_path: 'app-A/mid', project_id: 'p_x', tokens_p: '20' }`,
  `{ deployment: 'leaf', parent_deployment: 'mid', execution_path: 'app-A/mid/leaf', project_id: 'p_x', tokens_p: '40' }`
- **WHEN** `aggregateByProject` runs
- **THEN** the output SHALL contain one row with `name = 'p_x'`, `prompts = '10'`
- **AND** `mid`'s and `leaf`'s tokens SHALL NOT contribute (each has its declared parent present in the same project)

#### Scenario: parent_deployment === 'undefined' sentinel is a real root

- **GIVEN** the response contains a single row
  `{ deployment: 'd_1', parent_deployment: 'undefined', execution_path: 'd_1', project_id: 'p_x', tokens_p: '42' }`
- **WHEN** `aggregateByProject` runs
- **THEN** the output SHALL contain one row with `name = 'p_x'`, `prompts = '42'`

#### Scenario: Root rows with missing project_id aggregate under the empty bucket

- **GIVEN** the response contains rows whose `project_id` is the empty string or missing AND whose `parent_deployment` is empty (real roots)
- **WHEN** `aggregateByProject` runs
- **THEN** those rows SHALL aggregate together under a single output row with `name = ''`
- **AND** SHALL NOT be silently dropped

### Requirement: Child grids accept pre-aggregated rows and skip their own fetch

`EntitiesConsumptionTree` SHALL accept optional `rows?: EntityRow[] | null` and `loading?: boolean` props. When `rows` is provided (i.e. `rows !== undefined`), the component SHALL NOT issue `getData(ENTITY_CONSUMPTION_TREE_QUERY)`, SHALL NOT set up a refresh interval, SHALL build its tree via `buildEntitiesConsumptionTree(rows ?? [])`, and SHALL display the supplied `loading` flag.

`TelemetryGrid` SHALL accept optional `data?: Record<string, string>[] | null` and `loading?: boolean` props. When `data` is provided, the component SHALL NOT issue `getData(query)`, SHALL NOT set up a refresh interval, and SHALL render the supplied rows directly.

When the new props are omitted on either component, default behavior SHALL be preserved byte-for-byte so existing call sites are unaffected.

#### Scenario: EntitiesConsumptionTree with rows skips fetch

- **GIVEN** `EntitiesConsumptionTree` is rendered with `rows={[...]}` and `loading={false}`
- **WHEN** the component mounts
- **THEN** `getData` SHALL NOT be invoked
- **AND** the tree grid SHALL render rows derived from the supplied `rows`

#### Scenario: EntitiesConsumptionTree without rows fetches as before

- **GIVEN** `EntitiesConsumptionTree` is rendered without a `rows` prop (legacy call site)
- **WHEN** the component mounts
- **THEN** it SHALL invoke `getData(ENTITY_CONSUMPTION_TREE_QUERY)` on mount
- **AND** it SHALL set up the refresh interval according to `refreshTime`

#### Scenario: TelemetryGrid with data skips fetch

- **GIVEN** `TelemetryGrid` is rendered with `data={[...]}` (no `query`, or `query` is ignored)
- **WHEN** the component mounts
- **THEN** `getData` SHALL NOT be invoked
- **AND** the grid SHALL render the supplied rows

#### Scenario: TelemetryGrid without data fetches via query

- **GIVEN** `TelemetryGrid` is rendered with a `query` and no `data` prop (existing MCP / Routes call sites)
- **WHEN** the component mounts
- **THEN** the legacy `useEffect` / `getData` path SHALL execute as before
