## Why

An application's dashboard reads "the calls it made" as rows whose `parent_deployment` is the
application, which sees only its direct calls. An orchestrating application does most of its work
through nested applications, so the figures that rest on those rows are mostly missing. Measured on
dev over a week: one orchestrator's direct model calls carry about 2% of the tokens its whole call
tree spent, and its MCP view shows no tool calls at all, because every tool it uses is called by an
application it called.

Spend has a quieter gap of the same kind. It sums `total_price` over the application's own calls,
and only a call made to the application as a chat carries one. Work the application does when
another application invokes it as an MCP server carries no `total_price` anywhere, and is missed — up
to two thirds again of one application's spend.

## What Changes

- An application's money and token figures come from one source: **the priced model calls in its
  call tree** — rows whose `execution_path` contains the application and that carry a price.
  - `Total spend` is the sum of their prices.
  - `Tokens` is their tokens; the "Direct model calls" caption goes.
  - `Cost per 1M tokens` divides the two, on one basis.
  - The `Models` tab and the share donut rank those calls by model; the tab's cost column sums to
    `Total spend`.
  - The spend plot reads those calls.
- An application's MCP view reads **the tool calls in its call tree**, leaving out calls to the
  application itself as an MCP server.
- `Requests`, `Unique callers`, `Error rate`, `Avg latency`, the requests and latency plots and the
  heatmap stay on the calls made to the application, so one user request is still one request.
- The figures with no counterpart on the tree draw no sparkline, and the heatmap offers no cost on
  an application's LLM view, rather than plot a second basis beside the card.

## Non-goals

- **Tools an application serves as an MCP server.** A separate question: those are other callers'
  use of the application, not the application's use of tools.
- **Models, toolsets and the standalone page.** Their figures are unaffected.
- **Backend changes.** Every figure reads columns the log has now.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/dashboards`: an application's spend, token, model and tool figures read its call tree
  rather than its direct calls.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Usage/utils/entity-scope.ts` — the application's
  `made` clauses become the call tree; a tool-call variant for the MCP view.
- `constants.ts` (`ENTITY_BLOCKS` application entries), `utils/entity-blocks.ts`
  (`resolveBlockRows`), `use-usage-dashboard-data.ts` (spend and spend-plot source),
  `Kpi/KpiRow.tsx`, `utils/kpi-cards.ts`, `Charts/ActivityHeatmap.tsx`.
- `openspec/specs/analytics/dashboards/spec.md` via this change's delta.
- Lands in the open PR epam/ai-dial-admin-frontend#4821 beside the change it corrects.
