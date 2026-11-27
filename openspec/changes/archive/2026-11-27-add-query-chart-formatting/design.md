## Context

See proposal.md — Why. The chart view today is `ResultChart`: a `SegmentedControl` for the type and two
kit `Select`s above the chart, an ECharts `SeriesChart` for bar, line and scatter (series only from several
Y columns, `chart-options.ts`), and the Usage `DonutFigure` for pie. `SeriesChart` draws its legend as the
HTML `ChartLegend` (hover previews a series, click pins it), not as an ECharts legend.

`ChartConfig` (`type`, `xField`, `yFields`) is persisted as a saved query's `chart` (`type`, `x_field`,
`y_field`) and is read by the custom dashboard widgets (`WidgetResult`, `WIDGET_VIEW_BY_CHART_TYPE`). The
analytics service stores `chart` without interpreting it, but reads every request body strictly: a member
it does not know is rejected with `400`.

A single-value trend already exists for custom dashboards: `use-widget-sparkline.ts` runs the widget's
structured query again, grouped by `date_trunc` of the timestamp field (`CustomDashboards/utils/sparkline.ts`),
and `Usage/Kpi/Sparkline.tsx` draws it. The Ask AI panel (`QueryBuilder/Ai/AiSidePanel.tsx`) is the
precedent for a collapsible side panel with a vertical rail, `inert`-free unmounting, and a localStorage
preference applied after mount.

## Goals / Non-Goals

**Goals:**
- One place for chart configuration, with the chart's drawing code split from its controls.
- Series split and legend placement as pure option builders, unit-tested without rendering ECharts.
- Reuse the dashboard sparkline query and figure for the scorecard rather than a second implementation.

**Non-Goals:**
- No change to the dimension/aggregate classification of structured or SQL runs.
- No ECharts-native legend; no stacking.

## Decisions

### 1. `ResultChart` becomes a layout of the chart figure and a `ChartFormattingPanel`

`ResultChart` keeps resolving the effective configuration (defaults, valid picks, available types) and
renders two children side by side: the figure (`SeriesChart`, the pie, or the scorecard) and
`ChartFormattingPanel`, which receives the resolved config, the option lists and `onChangeConfig`, and owns
no chart state. The panel follows `AiSidePanel`'s shape — an `aside` named by its heading, a collapse
control with `aria-expanded`/`aria-controls`, and when collapsed a narrow rail `button`. Collapsed, the
panel's body is not rendered (as `AiSidePanel` does), which satisfies "removed from the tab order" without
`aria-hidden`. Its open state lives in a `use-chart-panel-open` hook over localStorage, read in an effect
after mount.

*Alternative:* generalising `AiSidePanel` into a shared `Common/SidePanel`. Rejected for this change: the
two differ in placement (page edge vs inside the chart card), width and header content, and a shared
component would need props to fit each caller. Revisit if a third panel appears.

Kit controls: `Select` with an icon per option (`IconChartBar`, `IconChartLine`, `IconChartDots`,
`IconChartPie`, `IconNumber1`) for the type, `Select` for the axes and the legend position, `Switch` for
the legend. Section labels use the kit's lead typography.

### 2. The split is a row pivot, decided in one pure function

`resolveChartSplit(meta.dimensionColumns, xField)` returns the split column — the first entry of
`meta.dimensionColumns` that is not `xField` — or `null`; it applies only to an aggregate-mode run
(`hasChartSplit`), since an untranslated SQL run offers every column as a dimension. When it is not `null`, `resolveYFields` forces a single Y and the option
builder pivots: rows are grouped by X (keeping `sortRowsByX` ordering) and by split value; each split value
becomes one series whose data has `null` for an X with no row, so ECharts draws a gap. The top 10 split
values by summed Y stay as series; the rest are summed into "Other" — the same rule and label as pie's
`PIE_MAX_SLICES`. Series colours cycle `CHART_SERIES_COLOR_CYCLE`, as multi-Y series do today.

Scatter with a split uses a category X axis and one scatter series per split value; without a split it
keeps today's numeric-vs-numeric builder. The availability rule in `getAvailableChartTypes` grows the
same branch: scatter is offered when there is a split, or when there are two numeric columns as today.

*Alternative:* splitting only when the user picks a "Split by" column. Rejected by the design — no such
control — and an automatic split matches what the query already grouped by.

*Why sum for Other:* it is pie's existing rule; a split over an average aggregate will show a summed
"Other", which is acceptable for a tail bucket and stated nowhere as a value of its own.

### 3. Legend placement wraps `ChartLegend`, it does not move into ECharts

`ChartConfig` gains `legend: { isVisible: boolean; position: ChartLegendPosition }` with
`ChartLegendPosition` an enum (`Above`, `Right`, `Below`, `Left`). `SeriesChart` (and the pie, which now
also renders through `SeriesChart`) lays the figure and `ChartLegend` out in a flex row or column by
position; a vertical legend for Left/Right gets a fixed width and stacks its entries. `buildSeriesLegend`
keeps deciding whether there is a legend at all (two or more series, or pie), so "one series, no legend"
stays in one place.

*Alternative:* ECharts' own `legend` option. Rejected: it would drop the existing preview/pin behaviour and
its keyboard access, which `ChartLegend` already provides.

### 4. Pie moves from `DonutFigure` to an ECharts pie

`buildPieOptions` produces a `pie` series with radius `[0, '80%']`, no labels or leader lines beside it
(outside labels for long resource paths overlapped and crowded the pie; the legend names the slices), and
an item tooltip with the value. Slices come from the existing `buildShareFigure`
bucketing so the top-10-plus-Other rule is unchanged; a blank category stays unlabelled. The Usage `DonutFigure`
stays for the Usage pages and is no longer imported by the Query Builder.

### 5. Scorecard reuses the dashboard sparkline

`ChartType.Scorecard = 'scorecard'` — a plain string in the stored `type`, which the service accepts
today. Availability: one row and at least one strictly numeric column (`getStrictNumericColumns`). Its
Value selector lists those columns.

The sparkline query is lifted from the widget: `use-widget-sparkline.ts` is split into a query-level hook
`useQuerySparkline({ query, timeField, column, range, period, isEnabled })` that runs
`buildSparklineQuery` and `toSparklinePoints`, and a thin widget wrapper that derives those inputs from a
`WidgetQuery` as today. Both live under `Analytics/` shared code (the hook moves to
`src/components/Analytics/Common/use-query-sparkline.ts`), and `Usage/Kpi/Sparkline.tsx` is imported as is.
The Query Builder passes the last structured request it ran (`lastRequest`) and the current time range;
an SQL request, a missing timestamp field, or a group-by disables it, exactly as the widget does.

*Alternative:* a new sparkline builder for the Query Builder. Rejected — the widget's query shape and unit
choice are the ones a scorecard should match, and two copies would drift.

### 6. Persisted legend, with a defaulting read

`SavedQueryChart` gains `legend?: { visible: boolean; position: string }`, written by capture from
`ChartConfig.legend` and compared by the unsaved-changes check like the other chart members. Restore maps
it back; a missing legend or an unknown position becomes `{ isVisible: true, position: Below }`, applied on
read before the dirty baseline is taken, so a query saved before this change does not open as changed.
Panel open state is not in `ChartConfig`.

*Alternative:* keeping the legend as page state until the service accepts it. Rejected by the product
owner: the legend is an authored setting of the query, and shipping it unsaved would need a second change
to make it stick.

### 7. Custom dashboard widgets pick up the drawing, not the configuration

`WidgetResult` draws a query's chart through the same `buildChartOptions` and `SeriesChart`. The split is
opt-in through the build context's `splitField`, which the widget does not pass, so widget charts keep their
series as today; the shared legend layout reaches them as a visual change only, and their legend stays below,
since a widget passes no legend setting and gets the default. `getAvailableChartTypes`, which the widget's
view list also reads, is unchanged; the Query Builder's own list (`getQueryChartTypes`) adds the split
scatter and the scorecard. A widget offers no formatting panel and does not read the stored `legend`.
Its pie keeps the Usage `DonutFigure` (decision 4 changes only the Query Builder's pie). `ChartType.Scorecard`
maps to `WidgetView.SingleValue` in `WIDGET_VIEW_BY_CHART_TYPE`, so a query saved as a scorecard opens as a
single-value widget. Making widgets honour the stored chart configuration is a later change.

## Risks / Trade-offs

- [The service rejects an unknown `chart` member with `400`] → this change must not reach an environment
  before the service accepts the legend member; see Migration Plan.
- [A split with many X values and 10 series is dense] → series are capped at 10 plus Other; the axis
  tooltip lists all of them at one X.
- [The scorecard trend is a second request per run] → it runs only for the scorecard view, after the
  number is shown, and is dropped silently on failure.
- [A vertical legend on a narrow chart squeezes the plot] → Left/Right legends get a fixed width; the panel
  can be collapsed to give the chart room.

## Migration Plan

1. The analytics data-access service accepts, stores and returns a legend member on a saved query's `chart`
   (and wherever the same chart model is carried: revision snapshots and a dashboard's inline query).
2. Only then merge and deploy this change. Before step 1 is deployed, saving a query from this frontend
   fails with `400`.
3. Rollback: reverting the frontend leaves stored legend members unread; the previous frontend ignores them.
   A query saved as a scorecard opens in the previous frontend with a type it does not know and falls back to
   its default chart.
