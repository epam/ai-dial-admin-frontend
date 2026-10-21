## 1. Focused unit coverage (TDD)

- [x] 1.1 Add a failing focused Vitest spec at `apps/ai-dial-admin/src/components/TestSuites/Trends/utils/tests/chart-options-metric-trend.spec.ts` for `buildMetricTrendChartOptions`; assert its required ECharts option contract: fixed domain and interval, visible Y-axis-label configuration, non-zero left grid margin, hidden X axis, split lines, tooltip, and visible-series filtering. Verify it fails before task 2.1 with `cd apps/ai-dial-admin && npx vitest run src/components/TestSuites/Trends/utils/tests/chart-options-metric-trend.spec.ts`.

## 2. Metric Trend chart options

- [x] 2.1 Update `buildMetricTrendChartOptions` in `apps/ai-dial-admin/src/components/TestSuites/Trends/utils/chart-options.ts` to satisfy task 1.1: expose the existing fixed `0`–`1` domain with `0.25` Y-axis intervals and visible labels, and reserve a non-zero left grid margin; preserve metric series, tooltip, split lines, and hidden X axis. Verify task 1.1 passes with `cd apps/ai-dial-admin && npx vitest run src/components/TestSuites/Trends/utils/tests/chart-options-metric-trend.spec.ts`.

## 3. Unit coverage

- [x] 3.1 Confirm the focused test verifies the ECharts option contract rather than rendered-label clipping, and run both `apps/ai-dial-admin/src/components/TestSuites/Trends/utils/tests/chart-options-metric-trend.spec.ts` and `apps/ai-dial-admin/src/components/TestSuites/Trends/tests/MetricTrendCard.spec.tsx`; verify the former covers changed options and the latter retains legend/tag filtering coverage.

> Browser verification task omitted by explicit user choice. Unit tests cover the deterministic ECharts option contract; a browser task would require a local stack running with auth disabled.

## 4. Quality gates

- [x] 4.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test`; verify all pass.
