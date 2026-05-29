# dashboard-total-tokens-chart Specification

## Purpose

The Dashboard's "Total tokens" headline card displays an aggregate token total across the analytics table. Because token counts repeat across orchestrator → model layers (an orchestrator's row carries the same tokens its child rows carry), summing every row double-counts. This capability defines the corrected math: the chart SHALL sum `prompt_tokens + completion_tokens` from tree roots only, where roots are defined by the [[entities-consumption-tree]] capability — real roots (rows whose `parent_deployment` is empty / `'undefined'`) and synthetic roots (placeholders inserted when a declared parent has no row of its own). The capability also defines a small extension point on `SingleValueChart` that lets a chart instance inject its own reducer over the server response.

## Requirements

### Requirement: Total tokens chart sums root-row tokens only

The Total tokens single-value chart on the Dashboard's `ChartsDashboard` section SHALL compute its displayed value by fetching `ENTITY_CONSUMPTION_TREE_QUERY` (per the [[consumption-project-aggregation]] capability, which adds `project_id` to the query's `groupBy`), transforming the response rows via `aggregateByDeployment` to collapse the project axis, feeding those aggregated rows into `buildEntitiesConsumptionTree`, and summing `prompts + completions` across every top-level `TreeRow` returned. The chart SHALL NOT sum every row's tokens, SHALL NOT skip the aggregation step (which would re-introduce inflation now that `project_id` is in the response), and SHALL use `Big` arithmetic with a final `.toNumber()` for the display value.

#### Scenario: Multi-project rows for one deployment do not inflate the total

- **GIVEN** the response contains three rows for the same `(d_1, p_1, p_1/d_1)` triplet under `project_id` `p_1`, `p_2`, `p_3` with `prompts: '0' / '100' / '200'` and `completions: '0'` each
- **WHEN** the chart renders
- **THEN** `aggregateByDeployment` SHALL collapse the rows to one `(d_1, p_1, p_1/d_1)` row with `prompts: '300'`
- **AND** the chart SHALL display `300` (the aggregated single root's tokens), not `900` (un-aggregated triple-count) and not `200` (single-project misread)

#### Scenario: Single root row contributes its own tokens

- **GIVEN** the response contains one row with `prompts: '100'`, `completions: '50'`, and a single `project_id` value
- **WHEN** the chart renders
- **THEN** `aggregateByDeployment` SHALL emit one row identical in numerics to the input
- **AND** the chart SHALL display `150`

#### Scenario: Orchestrator + child chain still counts root only

- **GIVEN** the response contains:
  `{ deployment: 'A', parent_deployment: '', execution_path: 'A', project_id: 'p_x', tokens_p: '100', tokens_c: '50' }`,
  `{ deployment: 'B', parent_deployment: 'A', execution_path: 'A/B', project_id: 'p_x', tokens_p: '80', tokens_c: '40' }`
- **WHEN** the chart renders
- **THEN** it SHALL display `150` (sum of A's tokens only)
- **AND** B's tokens SHALL NOT be added a second time

#### Scenario: Synthetic root contributes its rolled-up tokens

- **GIVEN** the response contains
  `{ deployment: 'B', parent_deployment: 'A', execution_path: 'A/B', project_id: 'p_x', tokens_p: '80', tokens_c: '40' }`
  with no row whose `execution_path` is `'A'`
- **WHEN** the chart renders
- **THEN** `aggregateByDeployment` SHALL emit one row for `(B, A, A/B)`
- **AND** `buildEntitiesConsumptionTree` SHALL inject a synthetic root `A` whose `prompts` and `completions` equal `B`'s (direct-children rollup as defined by [[entities-consumption-tree]])
- **AND** the chart SHALL display `120`

#### Scenario: Multiple real roots are summed

- **GIVEN** the response contains two real roots
  `{ deployment: 'A', parent_deployment: '', execution_path: 'A', project_id: 'p_x', tokens_p: '100', tokens_c: '50' }`,
  `{ deployment: 'X', parent_deployment: '', execution_path: 'X', project_id: 'p_x', tokens_p: '30', tokens_c: '20' }`,
  plus a child of A `{ deployment: 'B', parent_deployment: 'A', execution_path: 'A/B', project_id: 'p_x', tokens_p: '999', tokens_c: '999' }`
- **WHEN** the chart renders
- **THEN** it SHALL display `200` (100+50+30+20), excluding B

#### Scenario: Empty response renders zero

- **GIVEN** the server responds successfully with no rows
- **WHEN** the chart renders
- **THEN** `aggregateByDeployment` SHALL return `[]`
- **AND** the chart SHALL display `0`

#### Scenario: Large token totals retain precision

- **GIVEN** the sum of root tokens approaches or exceeds `Number.MAX_SAFE_INTEGER`
- **WHEN** the chart renders
- **THEN** both the aggregator and the root-sum reducer SHALL accumulate via `Big` and return a `number` representing the precise sum (within JS `Number` range), without intermediate float drift

### Requirement: SingleValueChart supports an injected reducer

`SingleValueChart` SHALL accept an optional prop `getValue?: (data: TelemetryData) => number`. When omitted, the component SHALL continue to reduce via `getSingleValueChartData` exactly as before. When provided, the component SHALL pass the server response (`response.response` as `TelemetryData`) to `getValue` and render the returned number using the existing presentation (loader during fetch, "no data" placeholder when the server reported failure, big-number formatting via `formatNumberWithExponent`).

#### Scenario: Default reducer is used when getValue is omitted

- **GIVEN** a `SingleValueChart` rendered without a `getValue` prop
- **WHEN** the server response succeeds
- **THEN** the displayed value SHALL equal `getSingleValueChartData(response.response)`

#### Scenario: Custom reducer is used when getValue is supplied

- **GIVEN** a `SingleValueChart` rendered with `getValue={getTotalTokensFromTree}`
- **WHEN** the server response succeeds
- **THEN** the displayed value SHALL equal `getTotalTokensFromTree(response.response)`
- **AND** `getSingleValueChartData` SHALL NOT be invoked for that chart instance

#### Scenario: Server failure path is unaffected by the new prop

- **GIVEN** a `SingleValueChart` (with or without `getValue`)
- **WHEN** the server response's `success` is `false`
- **THEN** the chart SHALL render the "no data" placeholder
- **AND** SHALL NOT invoke either reducer

### Requirement: Legacy TOTAL_TOKENS_QUERY constant is removed

After this change, `apps/ai-dial-admin/src/constants/telemetry.tsx` SHALL NOT export `TOTAL_TOKENS_QUERY`. The constant's previous shape (`sum(prompt_tokens), sum(completion_tokens)` over the whole analytics table without any parent-deployment filter) is incorrect for the headline total and SHALL NOT remain available for re-introduction by accident.

#### Scenario: Importing TOTAL_TOKENS_QUERY fails compilation

- **WHEN** any file attempts `import { TOTAL_TOKENS_QUERY } from '@/src/constants/telemetry'`
- **THEN** TypeScript SHALL report a missing-export error
