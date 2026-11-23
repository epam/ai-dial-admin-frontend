## Why

A bar or line chart can plot only one aggregate column, so comparing two measures over the same X axis —
new against returning users per week, requests against errors per day — takes two charts or a table. The
analytics service now stores a chart's Y axis as a list of result columns, one per series, which lets a saved
query keep a multi-series chart.

## What Changes

- A chart's Y axis is a list of result columns everywhere the frontend reads or writes a chart: the saved
  query page, its save and duplicate payloads, and a dashboard widget's chart. A one-element list is today's
  single-series chart.
- Reading tolerates a legacy single string and drops empty entries; writing always sends a list.
- In the query viewer's Chart view, bar and line take several Y columns: the Y selector becomes a
  multi-select, each picked column draws as its own series in its own palette colour, a legend names the
  series when there are two or more, and bars of one X value stand side by side.
- Pie and scatter keep exactly one Y column. Switching to either keeps only the first valid pick.
- A dashboard widget showing its saved query's chart draws every series the same way, since it renders
  through the same chart builder.

## Non-goals

- A second Y axis for series of different scale.
- Per-series styling: colour, line or bar type, axis assignment.
- The dashboard Time series view, which keeps plotting its first aggregate against the compared period.
- Stacking series.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/query-viewer`: the "Result table and chart views" requirement lets bar and line plot several
  aggregate columns as separate series, and keeps pie and scatter to one.

## Impact

- Models: the saved-query chart and the builder's chart configuration (`src/models/analytics/saved-query.ts`,
  `src/models/analytics/query-builder.ts`, `DEFAULT_CHART_CONFIG`).
- Mapping: `QueryBuilder/utils/saved-query.ts` (payload and restore).
- Chart rendering: `QueryBuilder/Result/chart-options.ts` and `ResultChart.tsx`.
- Dashboards: `CustomDashboards/utils/chart-axes.ts` and `Widget/WidgetResult.tsx`. The custom-dashboards
  requirement already says a widget shows its stored chart type and axis columns, so it needs no delta.
- Saved queries already stored with one Y column keep rendering as a single-series chart.
