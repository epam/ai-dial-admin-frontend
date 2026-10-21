## Why

The share chart answers one question: which entities carry the window's calls. It cannot answer the
question an operator asks next — which entities carry the window's money — and the two rankings are
not the same list. A cheap high-volume model outranks an expensive rare one on calls and loses to it
on spend, so reading cost off a call ranking is not a rounding error but the wrong entities.

The breakdown table already states cost per row, so the figure exists; what is missing is the
ability to split the ring by it.

## What Changes

- The share chart offers a measure to split by: `Calls`, as today, and `Cost`. Calls stays the
  default and stays first, so the card opens exactly as it does now.
- The MCP view offers no such choice: no `mcp` row carries a price.
- Choosing a measure re-issues the ranking request ordered by it. The cut is taken by the backend,
  so ranking on calls and rendering spend would keep the wrong rows — this is one request of a shape
  the page already issues, as switching a breakdown tab is.
- The ring's denominator, its centre figure and its legend follow the chosen measure, so the slices
  add up to the window either way and money renders as money.

## Impact

- Affected specs: `analytics/dashboards`
- Affected code: `Usage/Charts/ShareBreakdown.tsx`, `Usage/utils/donut.ts`, `Usage/queries.ts`,
  `Usage/use-usage-dashboard-data.ts`, `Usage/UsageDashboard.tsx`, the module's i18n keys
- No new request shape, and no extra request while the measure is unchanged.
