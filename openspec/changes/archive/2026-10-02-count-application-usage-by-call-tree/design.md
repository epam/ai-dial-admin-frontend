## Context

See proposal.md — Why. The archived `add-entity-usage-dashboards` gave an application two scopes:
`own` (`deployment` = app) and `made` (`parent_deployment` = app). `resolveBlockRows` turns them into
`rows` and `madeRows`; the LLM block reads its `Models` tab, donut and token cards from `madeRows`
and sums `total_price` over `rows` for spend; the MCP block reads everything from `made`.

What the usage log holds, measured on dev over a week (shapes only):

| Question | Finding |
|---|---|
| Does `execution_path` hold the whole chain? | Yes: chains of three and four deployments are common, and `parent_deployment` is in the path on every row that has one |
| Rows whose own `deployment` is missing from their path | Global route calls (no deployment), plus ~130 rows a week on under a cent |
| Is money lost on calls without `total_price`? | No: those are failures, or calls that set off nothing priced, directly or deeper |
| `total_price` vs priced calls in the tree | Equal to the cent in traces where the app was called as a chat; the tree is larger where the app was invoked as an MCP server (MCP rows carry no `total_price`) — up to +65% on one app |
| Self-recursion through LLM calls | None among the busiest applications; the tree basis is immune to it either way |
| Direct vs tree, one orchestrator | ~2% of the tree's tokens are direct; zero direct tool calls against thousands in the tree |
| Tree query cost | 30 days, 6-hour buckets: about half a second |

DSL constraints that shape the expressions: a boolean call is a filter predicate only as a
comparison with `true`; there is no comparison in expression position; `array_slice` takes a literal
length.

## Goals / Non-Goals

**Goals:**

- Every money and token figure on an application rests on one set of rows.
- No figure on a card is drawn against a different basis beside it.

**Non-Goals:**

- No change for models, toolsets, routes or the standalone page.
- No backend artefact (column, pipeline).

## Decisions

### D1. The call tree is a filter, not a join

`array_has(execution_path, name) = true` in the filter, as the service's SQL translation renders a
boolean call. The priced subset adds `not_empty(to_string(deployment_price)) = true` — the same
presence test `pricedOnly` already uses for tokens. Both are row clauses, so every existing request
shape — totals, buckets, tab, keys, split, spend — takes them unchanged.

*Alternative rejected:* walk `core_parent_span_id` from the application's rows. It needs a sub-query
per depth and the DSL's composite translation to reach it; the path already holds the walk's result.

### D2. Three clause sets on an application's scope

`UsageScope` becomes `{ own, made?, tools? }`:

- `own` — `deployment` = app (unchanged);
- `made` — the priced model calls in the tree: tree clause + price clause;
- `tools` — tool calls in the tree that the application does not serve: tree clause +
  `deployment` ≠ app. The MCP view's own clause adds `tools/call` as it does today.

`getEntityScope` builds all three for an application; other entities carry `own` alone.

### D3. The LLM block reads money from `made`

`BlockReads` loses `ownSpendColumn` and `hasMadeTokens` and gains `isMoneyFromMade`: the KPI row's
`Total spend`, `Tokens` and `Cost per 1M tokens` read the `made` totals — the request the block
already issues for the `Models` tab's denominator — and the spend plot's request carries `made`.
`SpendColumn` and `RowScope.spendColumn` go: nothing sums `total_price` any more.

The money cards draw no sparkline: their buckets would be the `made` rows bucketed, one more request
per window for a line under a card. The heatmap of a block with `isMoneyFromMade` offers requests
alone, for the same reason: its hourly response is over the application's own calls. Its
breakdown tabs that read `own` rows — `Projects` — state no cost column: an application's own rows
carry no `deployment_price`, so the column would be empty.

*Alternative rejected:* keep `total_price` for spend and read tokens from the tree. Two bases on one
row of cards — `Cost per 1M tokens` would divide a chat-only spend by a tree-wide token count.

### D4. The MCP block reads `tools`

`isMadeOnly` becomes `isToolsOnly`, resolved to the `tools` clauses.

## Risks / Trade-offs

- [Spend counts work done as an MCP server; `Requests` counts chat calls only] → No figure divides
  one by the other; the spec states what each covers.
- [A shared nested application's model calls show on every application above it] → That is what a
  call tree means; dashboards of different applications are not summed anywhere.
- [Limits the log itself sets] → Prices are fixed at call time; a model with no configured price is
  absent (under 0.01% of tokens); calls an application makes to a provider outside DIAL are not in
  the log at all; the log lags by about eleven minutes. None is fixable on the dashboard.
- [`execution_path` completeness is measured, not contracted] → Backend question 2 asks for the
  contract; a unit test pins the clause so a change is one function.

## Migration Plan

Frontend only, in the open PR epam/ai-dial-admin-frontend#4821, behind the existing flags.
