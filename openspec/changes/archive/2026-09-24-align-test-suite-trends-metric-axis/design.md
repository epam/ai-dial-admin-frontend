## Context

`buildMetricTrendChartOptions` in `apps/ai-dial-admin/src/components/TestSuites/Trends/utils/chart-options.ts` already fixes the metric score domain to `0`–`1` with `0.25` intervals, draws grid lines, and hides the X axis. Unlike `buildOverallScoreChartOptions`, it hides Y-axis labels and configures no left grid margin. See `proposal.md` for motivation and `specs/test-suite-trends/spec.md` for the behavior contract.

## Goals / Non-Goals

**Goals:**
- Make Metric Trend score scale readable and consistent with Overall Score Trend.
- Keep chart options deterministic and directly unit-testable.

**Non-Goals:**
- Do not extract a shared chart configuration or change Overall Score Trend.
- Do not alter source data, series visibility state, metric lines, legend/tag controls, tooltip formatting, grid-line styling, or X-axis visibility.
- Do not add a browser-verification task; the user explicitly selected unit tests only. This isolated ECharts-option contract is asserted without requiring a local stack running with auth disabled.

## Decisions

### Keep the adjustment in the metric chart-options builder
Update `buildMetricTrendChartOptions` to expose its existing fixed domain with Y-axis labels and a non-zero left grid margin sized for the labels. This is the sole owner of Metric Trend ECharts configuration; changing `MetricTrendCard` would couple presentation markup to chart geometry.

**Alternative considered:** Share the Overall Score Trend grid constant/configuration. Rejected: the cards have a distinct compact layout, and shared configuration would couple unrelated chart interaction/layout needs beyond this small axis-alignment change.

### Assert the ECharts option contract through unit tests
Add a focused Vitest spec at `apps/ai-dial-admin/src/components/TestSuites/Trends/utils/tests/chart-options-metric-trend.spec.ts` for `buildMetricTrendChartOptions`. Assert the `0`/`1` bounds, `0.25` interval, visible Y-axis-label configuration, reserved left grid margin, hidden X axis, grid-line configuration, visible-series output, and tooltip configuration. This verifies the ECharts option contract; it does not prove rendered-label clipping. Existing `MetricTrendCard` interaction coverage continues to protect legend/tag filtering.

**Alternative considered:** Browser verification. Rejected by explicit user choice; unit tests are sufficient for deterministic options and avoid a local stack/auth dependency.

## Risks / Trade-offs

- [A fixed left margin reduces compact plot width] → Use only space needed for labels (`left: 28`); retain the card’s existing height, right margin, lines, and interactions.
- [Edge labels `0` and `1` clip at the compact card height] → Grow top/bottom grid margins from `2` to `10` so the half-height of the first and last labels stays inside the canvas.
- [Option-shape tests can couple to chart configuration] → Assert the requirements and preserved behavior, not unrelated ECharts internals or DOM rendering.

## Migration Plan

No migration, API, or persisted-data change. Deploy with the frontend; rollback reverts the chart-options change and its tests.
