## 1. Chart model as a list of Y columns

- [x] 1.1 Change `SavedQueryChart.y_field` to `string[] | null` (`src/models/analytics/saved-query.ts`) and `ChartConfig.yField` to `yFields: string[] | null` (`src/models/analytics/query-builder.ts`); update `DEFAULT_CHART_CONFIG` in `src/constants/analytics/query-builder.ts`
- [x] 1.2 In `QueryBuilder/utils/saved-query.ts`, add the reader that normalizes a stored `y_field` (list kept without blank entries, legacy string → one-element list, `null` → `null`), use it in the restore path, and make `toSavedQueryChart` always write the list
- [x] 1.3 Unit tests for the reader and both mapping directions in `QueryBuilder/utils/tests/saved-query.spec.ts`; update the spec fixtures that build a chart (`DuplicateQuery.spec.tsx`, `EditQuery.spec.tsx`, `SavedQueryPage.spec.tsx`, `QueryBuilderChartConfig.spec.tsx`) so both typechecks stay at zero

## 2. Multi-series chart options

- [x] 2.1 `buildChartOptions` and `buildCartesianOptions` in `QueryBuilder/Result/chart-options.ts` take a list of Y columns: one series keeps today's accent colour, axis name and no legend; two or more draw one series per column in `CHART_SERIES_COLOR_CYCLE` order, with no Y-axis name and grouped (unstacked) bars, and the usage dashboard's `ChartLegend` under the plot (display labels, hover preview, click to pin) in both the query viewer and the dashboard widget; pie and scatter use only the first column
- [x] 2.2 Unit tests in `QueryBuilder/Result/tests/` for series count, order, colours, legend presence, axis name, bar grouping, and pie/scatter ignoring extra columns

## 3. Multi-select Y in the query viewer

- [x] 3.1 Add `isMultiY` to `ChartSlotDescriptor` (`src/models/analytics/query-builder.ts`) and set it in `CHART_SLOT_DESCRIPTORS`: bar and line `true`, pie and scatter `false`
- [x] 3.2 In `QueryBuilder/Result/ResultChart.tsx`, render the Y selector as ui-kit `Select` with `multiple` and `collapseTagOverflow` when `isMultiY`; resolve the Y list (stale picks filtered, `null` → default, `[]` → no-valid-pick hint); on a type switch filter the picks to the new options and keep only the first for a single-Y type
- [x] 3.3 Component tests in `QueryBuilder/Result/tests/ResultChart.spec.tsx` for picking two columns, clearing all picks, switching line → pie → line, and restoring a stored multi-column chart

## 4. Dashboard widget draws every series

- [x] 4.1 `resolveChartAxes` (`CustomDashboards/utils/chart-axes.ts`) returns the resolved Y list by the same rules as the query viewer; `WidgetResult.tsx` reads the chart through the shared reader and passes the list to `buildChartOptions`
- [x] 4.2 Update `CustomDashboards/utils/tests/chart-axes.spec.ts` and add a `WidgetResult` case for a two-series chart and for a legacy single-string chart

## 5. Browser verification

- [x] 5.1 Run the `spec-browser-verify` skill for this change against the running local app, covering the query-viewer scenarios on a saved query created for the check, and resolve every `fail` verdict before continuing

## 6. Quality checks

- [x] 6.1 From `apps/ai-dial-admin/`, run the touched specs with `npx vitest run`, then `npm run lint`, `npm run typecheck`, `npm run typecheck:specs`, and the full `npm run test`
