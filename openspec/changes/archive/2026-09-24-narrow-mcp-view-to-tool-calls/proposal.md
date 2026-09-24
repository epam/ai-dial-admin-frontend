## Why

The MCP view counted every MCP protocol request as a call. Measured on the live dataset, `tools/call`
is 13% of those rows; the rest is the handshake and discovery a client fires per connection —
`tools/list`, `initialize`, `notifications/initialized`, `resources/list`.

The consequences were not cosmetic. The `Requests` card disagreed with `Total tool calls` beside it
by construction, which is what a reader noticed first. Worse, the rankings measured connections
rather than use: over one day, one toolset sat third by rows and seventh by tool calls, with 5% of
its traffic being an actual call, while another sat sixth by rows and third by tool calls. Error rate
and average latency described handshakes — fast, rarely failing — rather than tool execution.

## What Changes

- The MCP view reads only `tools/call` rows. Every figure it states — the count, the share chart,
  the time series, the breakdown, the error rate, the latency — then rests on one basis: work done.
- `Total tool calls` is removed as a card of its own, because it would restate the count beside it.
  The count card is named for tool calls in that view instead, so the figure it carried survives.
- The per-row tool-call measure leaves the query and the measure set with it.

Separately, the caller count is made resilient. `user_ref` comes from an enrichment provisioned per
environment rather than shipped with the service, and where it is absent the column is null on every
row and the card read zero — on every view, not only this one. The measure now falls back to the
anonymized hash per row, which agrees with the reference wherever the enrichment is there.

## Impact

- Affected specs: `analytics/dashboards`
- Affected code: `Usage/queries.ts`, `Usage/constants.ts`, `Usage/models.ts`, `Usage/utils/folds.ts`,
  `Usage/utils/kpi-cards.ts`, `Usage/utils/delta-tone.ts`, `Usage/Kpi/KpiRow.tsx`
- The MCP view's headline figures drop to roughly an eighth of what they read before. That is the
  correction, not a regression: the figures they replace counted connections.
