## Why

The same data is drawn as three different pies: the usage dashboard and a custom dashboard's Pie chart view draw
a donut with the total in its ring and each slice's figure and share in a legend, while the query page and a
widget showing a pie query draw a plain pie with labels on the slices. A reader moving between the query page and
a dashboard sees one result in two shapes, and only one of them states the total and the shares.

## What Changes

- The query page's pie chart type is drawn as the usage dashboard's donut: the total in the ring under the value
  column's label, the largest categories as slices with the rest folded into Other, and a legend stating each
  slice's figure and share. It keeps showing the top 10 categories.
- A custom dashboard widget draws the same donut for its Pie chart view and for a query whose own view is a pie.
  How many slices it names follows the widget's width: up to 4 grid columns 5, up to 8 columns 10, wider 15.
  A legend longer than six entries flows into further columns beside the ring, on a widget and on the query page.
  A widget three grid rows tall shows a smaller ring and fewer categories, so nothing is clipped.
- The usage dashboard keeps its donut and its 5 slices.
- The query page's separate pie renderer is removed once nothing uses it.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `analytics/query-viewer`: the pie chart type is drawn as the usage dashboard's donut, with its total and a
  legend of figures and shares; it still names the top 10 categories and folds the rest into Other.

## Non-goals

- A user setting for the number of slices, on the query page or on a widget.
- Changing the usage dashboard's donut, its slice count or its legend search.
- Changing the Category/Value selectors, chart-type switching, or how bar, line and scatter are drawn.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/ResultChart.tsx` and `chart-options.ts`: the
  pie branch renders the usage donut; the ECharts pie builder goes.
- `apps/ai-dial-admin/src/components/Analytics/CustomDashboards/Widget/WidgetResult.tsx`: the Pie chart view and a
  pie query's own view share the donut, sized by the widget's width.
- The slice builder now in `CustomDashboards/utils/widget-view-options.ts` moves to a shared Analytics util with a
  slice count, used by both pages.
- `Usage/Charts/DonutFigure.tsx` is reused as is.
- The open PR epam/ai-dial-admin-frontend#5518 edits `WidgetResult.tsx` and the `add-custom-dashboards` change;
  this change lands after it.
