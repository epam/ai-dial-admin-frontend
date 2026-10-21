## Why

Three readings of the Usage dashboard ask more of the reader than they should:

- In the LLM view the share chart and the heatmap open on calls, while the question an admin brings
  to that view is usually where the money goes. Cost is one click away, and it is the second option.
- The breakdown card shows the ranked head of a dimension, but nothing on it says so. A reader takes
  ten rows for the whole list and misses what ranks below.
- The full-list dialog can only be read in calls order. Finding the slowest or the most failing
  entries means scrolling the whole dimension. The backend already orders by any measure the query
  selects, so the dialog can offer it without a backend change.

## What Changes

- **Cost first and selected by default** in the share chart and the heatmap wherever the view is
  priced (the LLM view, except an application's heatmap, which offers no cost). Where no cost is
  offered, nothing changes. Returning to the LLM view returns to cost.
- **The breakdown card states that it shows the top rows**, with the number it is cut at, next to its
  title.
- **The full-list dialog's columns are sortable**, both directions, by the dimension, share, calls,
  error rate, average latency and cost. The order is taken by the backend, as the default calls order
  already is, so the dialog still reads block by block. The card stays a ranked head with no sort.
- **Breaking:** the dashboard's default reading of the LLM view changes from calls to cost.

## Non-goals

- Sorting on the card. It holds one ranked page; a sort there would reorder the page while hiding the
  rows it never fetched.
- Sorting by a measure's change against the previous window. The change is computed on the client
  per block and is not something the backend can order by.
- Sorting the share chart's full list. Its order is the ring's ranking, by the measure it splits by.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/dashboards`: the share chart's and the heatmap's default measure in priced views; the
  breakdown card's top-N label; column sorting in the breakdown's full-list dialog.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Usage/` — `Charts/ShareBreakdown.tsx`,
  `Charts/ActivityHeatmap.tsx`, `UsageBlock.tsx` (default measures and option order);
  `Breakdown/BreakdownTable.tsx`, `Breakdown/BreakdownGrid.tsx`, `use-breakdown-dialog-rows.ts`,
  `queries.ts` (title label, dialog sort model to the tab request, an error-rate measure);
  i18n keys for the top-N label.
- No backend change.
