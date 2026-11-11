## Context

A chart is stored with its saved query as `{ type, x_field, y_field }` and travels unchanged into a dashboard
widget, whether the widget references the saved query or holds an inline copy of it. The analytics service
now returns `y_field` as a list of result-column names, accepts a list on write, and still accepts a single
string. It checks neither the names nor the count, so every rule about how many columns a chart type takes
is the frontend's.

Two renderers read the chart: the query viewer's `ResultChart` and the dashboard widget's Query view
(`WidgetResult`, through `resolveChartAxes`). Both end in `buildChartOptions`, which today draws exactly one
series.

## Goals / Non-Goals

**Goals:**

- One chart model on both sides of the wire: a list of Y columns, never a string.
- One builder that both renderers share, so a widget never draws a chart differently from the query page.

**Non-Goals:**

- Changing how the X axis, pie bucketing or scatter points are chosen.
- Any change to the dashboard Time series, Share, Heatmap or Single value views: they read the result's first
  aggregate, not the chart configuration.

## Decisions

**`ChartConfig.yFields: string[] | null` replaces `yField`.** `null` means "not picked", and the renderer
derives the default, the first aggregate not on X, as it does today. `[]` means the user removed every pick,
which shows the no-valid-pick hint. A single `string[]` with `[]` as "unset" would snap the selector back to
its default the moment the user cleared it.
Alternative rejected: keeping `yField` and adding `yFields` beside it, which gives two sources for one axis
and every reader a reconciliation rule.

**Normalize once, where a stored chart is read.** One pure reader turns a stored `y_field` into
`yFields`:
- a list keeps its non-blank string entries in order;
- a string becomes a one-element list;
- `null` or absent stays `null`.

It lives with the saved-query mapping in `QueryBuilder/utils/saved-query.ts`, which already owns the
stored-to-builder conversion. `WidgetResult` and `resolveChartAxes` call the same reader instead of reading
`chart.y_field` directly. The writer always sends the list, and sends `null` for `null`.

**Stale picks are filtered, not trusted.** A rerun can drop a column a stored pick names. The resolved Y list
keeps only picks present in the selector's options, and falls back to the default when nothing survives and
the stored value was `null`. Today a stale single pick is passed through and draws an empty series.

**Per-type arity lives in the slot descriptor.** `ChartSlotDescriptor` gains `isMultiY`: `true` for bar and
line, `false` for pie and scatter. The selector renders ui-kit `Select` with `multiple` and
`collapseTagOverflow` when it is set, and a single `Select` otherwise. A type switch filters the picks to
the new options and truncates them to the first one when the new type is single-Y. `buildChartOptions`
receives the list and passes only its first element to the pie and scatter builders, so neither can draw
from a second column even if a stored chart carries one.

**Series styling.**
- One series keeps today's look exactly: accent colour, Y-axis name, no legend.
- Two or more series take colours in order from `CHART_SERIES_COLOR_CYCLE`, the palette the pie already
  uses, and repeat it past six series.
- The Y-axis name is dropped, because no single column names the axis. The legend is the usage dashboard's
  own `ChartLegend` under the plot, not ECharts' built-in one: it names each series by its display label,
  previews a series on hover or focus and pins it on click, so a query chart reads like the usage plots.
  The entries come from the built series, so name and colour have one source.
- The axis tooltip already lists every series at the hovered X value.
- Bars use ECharts' default grouping, with no `stack`. Stacked series read as per-series values they are
  not, the same reason the usage plots were unstacked.

**The custom-dashboards spec needs no delta.** Its requirement that a widget "shows the chart with the stored
chart type and axis columns" already covers several Y columns once the shared builder draws them.

## Risks / Trade-offs

- [Series of very different scale share one axis, so the smaller one reads as flat] → Out of scope; a second
  axis is a separate change. The user picks which columns to combine.
- [A saved query written by this frontend cannot be read by an older analytics service] → An older service
  fails on a list `y_field`. The service's upgrade notes own the rollback condition. The frontend MUST NOT
  write a string to stay compatible, because the current service returns lists to every client anyway.
- [Before the service is upgraded, the frontend receives a string and its list writes are rejected] → The
  reader accepts a string, so reading works on either version, but saving a chart fails until the service
  accepts a list. The analytics service MUST be upgraded before this frontend ships.

## Migration Plan

No data migration: stored single-column charts open as one-element lists through the reader. Deploy the
analytics service version that stores `y_field` as a list first, then this frontend.
