## 1. Model and persistence

- [x] 1.1 Add `ChartType.Scorecard`, the `ChartLegendPosition` enum and `ChartConfig.legend` (`isVisible`, `position`) in `src/models/analytics/query-builder.ts`; add `legend` to `SavedQueryChart` in `src/models/analytics/saved-query.ts`; default the legend to on/Below in `DEFAULT_CHART_CONFIG` (`src/constants/analytics/query-builder.ts`)
- [x] 1.2 Capture and restore the legend in `QueryBuilder/utils/saved-query.ts`, include it in the unsaved-changes comparison, and default a missing legend or unknown position to on/Below before the dirty baseline is taken
- [x] 1.3 Map `ChartType.Scorecard` to `WidgetView.SingleValue` in `WIDGET_VIEW_BY_CHART_TYPE` (`src/constants/analytics/dashboards.ts`); keep `WidgetResult` passing no legend setting (default Below) and keeping its `DonutFigure` pie

## 2. Option builders

- [x] 2.1 Add `resolveChartSplit(meta, xField)` and make `resolveYFields` / `keepValidYFields` (`QueryBuilder/utils/chart-fields.ts`) force a single Y while a split applies
- [x] 2.2 Pivot split rows into series in `Result/chart-options.ts` for bar and line: one series per split value, `null` for a missing X, top 10 by summed Y plus "Other", ordered by total, axis tooltip headed by the X value
- [x] 2.3 Add the categorical split scatter to `chart-options.ts` and extend `getAvailableChartTypes` (`QueryBuilder/utils/chart-types.ts`) to offer scatter with a split and the scorecard for a single row with a strictly numeric column
- [x] 2.4 Add `buildPieOptions` (full pie, outside labels with leader lines, item tooltip) on top of `buildShareFigure`'s bucketing, and make `buildSeriesLegend` return pie slices

## 3. Chart figure and legend

- [x] 3.1 Lay out `SeriesChart` and `ChartLegend` by `ChartLegendPosition` (row for Left/Right with a fixed-width stacked legend, column for Above/Below) and hide the legend when `isVisible` is false
- [x] 3.2 Render pie through `SeriesChart` instead of the Usage `DonutFigure` in `Result/ResultChart.tsx`

## 4. Formatting panel

- [x] 4.1 Add `Result/ChartFormattingPanel.tsx` (Data section: type `Select` with per-type icons, then the type's column selectors, Pie labelled Slices/Value; Legend section: kit `Switch` and position `Select`; none of the Legend section for the scorecard) following `AiSidePanel`'s collapse pattern, and a `use-chart-panel-open` localStorage hook applied after mount
- [x] 4.2 Rewire `ResultChart.tsx` to the figure + panel layout, removing the `SegmentedControl` and inline selectors; add the i18n keys (panel title, section labels, Slices, legend labels and positions, Scorecard)

## 5. Scorecard

- [x] 5.1 Extract `useQuerySparkline` into `src/components/Analytics/Common/use-query-sparkline.ts` from `CustomDashboards/Widget/use-widget-sparkline.ts`, leaving the widget hook as a thin wrapper with unchanged behaviour
- [x] 5.2 Add `Result/ResultScorecard.tsx` (label, large formatted number, `Usage/Kpi/Sparkline` when points exist) and pass it the last structured request and the current time range from `QueryBuilder.tsx`; make a single-row result with no dimension chartable as a scorecard only

## 6. Specs and tests

- [x] 6.1 Unit tests: split resolution and pivot (gaps, top-10 + Other, ordering), scatter split, pie options, legend layout, type availability, legend capture, restore defaults and dirty comparison, `useQuerySparkline` and the unchanged widget hook
- [x] 6.2 Component tests: `ChartFormattingPanel` (controls per type, collapse state and its persistence, keyboard reachability when collapsed), `ResultChart` wiring, `ResultScorecard` (with and without trend, failed trend raises no notification), saved-query round-trip of the legend and the scorecard, and a pre-legend query not opening as changed
- [x] 6.3 Run the `spec-browser-verify` skill for this change against the local app (auth working in the Playwright session) and resolve every `fail` verdict; for scenarios that save a query, create a query of its own and delete it afterwards
- [x] 6.4 Run lint, format, both typechecks and the full test suite

## 7. Default draft table

- [x] 7.1 Make `resolveDraftTable` (`SourcePanel/utils/source-panel.ts`) fall back to `dial_usage_log` before the first queryable table, with unit tests for both fallbacks
- [x] 7.2 Drop the "(no value)" category label from the Query Builder chart, the dashboard widget and `buildShareFigure`, so a blank category stays unlabelled
- [x] 7.3 Draw the bar/line Y selector as a single-value select in `Result/ResultChart.tsx` when only one aggregate column is available
- [x] 7.4 Offer only the scorecard for a one-row result with no category column (including an untranslated SQL run whose columns are all numeric), and draw the first offered type when the held type is not offered, in `utils/chart-types.ts` and `Result/ResultChart.tsx`
- [x] 7.5 Drop the pie's outside labels and leader lines, and size the legend by its entries up to two fifths of the chart area on every side, with truncated entries, in `Result/chart-options.ts` and `Result/SeriesChart.tsx`
- [x] 7.6 Start the chart formatting panel collapsed until the user opens it (`Result/use-chart-panel-open.ts`)
- [x] 7.7 Label every category on the X axis and tilt the labels when they do not fit the chart's width (`fitCategoryLabels` in `Result/chart-options.ts`, measured in `Result/SeriesChart.tsx`)
