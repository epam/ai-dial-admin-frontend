## Why

The Query Builder chart view crowds its type switch and axis selectors into a row above the chart, has no
control over the legend, and can only draw several series from several aggregate columns — a result
grouped by a time bucket and a category (requests per 15 minutes by sentiment) plots its rows one after
another instead of one line per category. A single-number result (total cost over the period) cannot be
charted at all. The new design moves the configuration into a collapsible formatting panel, splits a
second dimension into series, lets the author place or hide the legend, and adds a Scorecard for a single
value.

## What Changes

- The chart view gets a **Chart formatting** panel at its right edge: a Data section (chart type, then the
  type's column selectors) and a Legend section (an on/off switch and a position: Above, Right, Below,
  Left). The panel collapses to a narrow rail; whether it is open is a per-browser preference. The type
  switch and selectors above the chart are removed.
- **Series split by a second dimension**: when the result has a second dimension column beside the one on
  the X axis, bar, line and scatter draw one series per value of that column, against a single Y column.
  No control picks the split column; it follows from the result.
- **Legend** follows the chart's configuration — shown or hidden, at the chosen position — for every chart
  with two or more series and for pie.
- **Pie** draws a plain pie with labelled slices and leader lines in place of the donut with a centre total.
- **Scorecard**, a new chart type: the value's label, the value as a large formatted number, and, where the
  query allows it, a trend line of the same aggregate over the same period bucketed by time. Offered for a
  single-row result with a numeric column.
- The chart configuration a saved query stores grows the **legend settings**; the Scorecard type is stored
  in the existing `type` member. A configuration stored without legend settings opens with the legend on,
  below the chart. Storing the legend needs a new member in the analytics service's saved-query chart model,
  so this change ships after the service accepts it.
- The draft builder opens on `dial_usage_log` instead of the first table in the list, the table most
  queries start from; without it the first queryable table stays the default.
- A chart category with no value is left unlabelled instead of reading "(no value)".

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/query-viewer`: the chart view's controls move into a formatting panel; series split by a
  second dimension; configurable legend; pie without the donut; a new Scorecard type that also makes a
  single-row result chartable.
- `analytics/saved-queries`: the stored chart configuration carries legend settings and the Scorecard type,
  and an older configuration without legend settings opens with defaults.
- `analytics/query-builder`: a draft opened without a picked table starts on `dial_usage_log` when it is
  queryable, and on the first queryable table otherwise.
- `analytics/source-panel`: a table row opened in a new tab shows that same default table.

## Non-goals

- No "Split by" control, and no stacking — split series stand side by side as today's multi-series bars.
- No per-series colour, axis-scale, label-format or title settings in the panel.
- Custom dashboard widgets get no formatting panel, no series split and do not read the stored legend
  settings; the shared legend layout reaches them as a visual change only, and a query saved as a Scorecard
  shows as a single value.
- No change to how dimension and aggregate columns are classified for structured or SQL runs.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/` — `ResultChart`, `chart-options.ts`,
  `SeriesChart`, a new formatting panel and Scorecard; `utils/chart-types.ts`, `utils/chart-fields.ts`.
- `src/models/analytics/query-builder.ts` (`ChartType`, `ChartConfig`), `src/models/analytics/saved-query.ts`
  (`SavedQueryChart`), `QueryBuilder/utils/saved-query.ts` (capture and restore).
- Backend: the analytics data-access service's saved-query `chart` model gains a legend member (separate
  repository); this change depends on it.
- The Custom Dashboards sparkline helpers (`CustomDashboards/utils/sparkline.ts`,
  `Widget/use-widget-sparkline.ts`) and `Usage/Kpi/Sparkline.tsx` become shared with the Scorecard; the
  widget view mapping (`constants/analytics/dashboards.ts`) gains the Scorecard type.
