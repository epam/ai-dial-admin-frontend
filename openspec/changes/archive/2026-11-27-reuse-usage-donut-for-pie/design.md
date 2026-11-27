## Context

See proposal.md — Why. Two pie renderers exist today. The query page builds an ECharts pie with its own top-10
bucketing (`buildPieChartOptions`, `bucketTopSlices`, `PIE_MAX_SLICES`) and draws it through `SeriesChart`. The
usage dashboard and the custom dashboard's Pie chart view draw `DonutFigure`: an ECharts ring plus a React legend,
fed by slices that `buildShareFigure` (in `CustomDashboards/utils/widget-view-options.ts`) folds at a fixed five.
A widget in its query's own view whose query keeps a pie goes down the query page's path.

## Goals / Non-Goals

**Goals:**
- One donut component and one slice builder behind every pie in Analytics.
- The slice count is an argument of the slice builder, decided by where the donut is drawn.

**Non-Goals:**
- Moving `DonutFigure` out of `Usage/Charts`; the query page already imports from `Usage/` (the chart legend).
- Any change to the usage dashboard's donut card or its modal.

## Decisions

- **Slice builder moves to a shared Analytics util and takes the slice count.** `buildShareFigure` is pure and has
  no dashboard concept in it; it moves out of `CustomDashboards/utils` so the query page can import it without
  reaching into the dashboard feature. Alternative: keep it in the dashboard utils and import across — rejected,
  it would make the query page depend on the dashboard feature.
- **The query page passes 10.** It keeps the slice count its spec already states.
- **A widget derives its slice count from its width.** The count follows `layout.w` on the 12-column grid: up to 4
  columns 5, up to 8 columns 10, wider 15. A layout the user resizes by hand gets the count of its band, so every
  width has one answer. Alternative: a per-widget setting — rejected by the user for now; the width bands need no
  setting and no storage.
- **The legend flows into columns of six.** A widget card is about six legend rows tall, so a longer legend would
  scroll. `DonutFigure` takes an optional rows-per-column; given one, the legend becomes a column-major grid of that
  many rows, each column capped at 280 px so the ring and the legend still sit side by side on a Medium widget.
  Without it the legend stays the usage dashboard's single column, so the usage page does not change. The query
  page passes the same six rows, so its ten slices and Other read as two columns.
- **A short card takes a shorter pie.** A widget three grid rows tall (the Small preset, and the grid's minimum)
  has room for four legend rows and a 140 px ring, not six rows and a 200 px ring. Its legend takes four rows per
  column and its slice count shrinks to what those columns hold, one row kept for Other — so a Small widget names 3
  categories plus Other, and no card clips its ring or legend. Alternative: raise the Small preset to four rows —
  rejected, the preset is also the grid's minimum, so it would stop every widget from being three rows tall.
- **A pie query's own view uses the same donut.** The widget's Query view of a query whose stored chart is a pie
  renders the donut with that chart's Category and Value columns, so the query's own view and the Pie chart view
  draw a pie the same way.
- **The ECharts pie builder goes.** Once the query page and the widget both render the donut,
  `buildPieChartOptions`, `bucketTopSlices` and the `PieSlice` model have no consumer and are removed with their
  tests. `PIE_MAX_SLICES` stays: it is the slice count the query page passes to the donut.
- **The custom-dashboards wording waits for #5518.** The custom-dashboards capability is still the unarchived
  `add-custom-dashboards` change, which the open PR epam/ai-dial-admin-frontend#5518 also edits; its widget text is
  updated in that change once #5518 has merged, rather than here, so the two do not fight over one file.

## Risks / Trade-offs

- [A query-page pie loses its labels on the slices] → the legend names every slice with its figure and share,
  which is what the slice labels carried.
- [The donut sums only positive values, the ECharts pie drew every row] → a zero or negative category was never
  readable as a slice; the spec now says such categories are not drawn.
- [This change and #5518 both edit `WidgetResult.tsx`] → this change lands after #5518 and is rebased on it.
