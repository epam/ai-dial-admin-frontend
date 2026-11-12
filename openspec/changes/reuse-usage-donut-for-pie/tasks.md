## 1. Shared slice builder

- [x] 1.1 Move `buildShareFigure` from `apps/ai-dial-admin/src/components/Analytics/CustomDashboards/utils/widget-view-options.ts` to a shared Analytics util that takes the slice count, and update its callers
- [x] 1.2 Move its tests and add cases for 5, 7 and 10 slices and for a result with fewer categories than the count

## 2. Query page pie

- [x] 2.1 Render the pie type in `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/ResultChart.tsx` with `Usage/Charts/DonutFigure` and 10 slices, captioned by the Value column's label; selectors and type switching unchanged
- [x] 2.2 Update `QueryBuilder/Result/tests` for the pie: the donut gets the top 10 and Other, the total and the caption

## 3. Widget pie

- [x] 3.1 In `apps/ai-dial-admin/src/components/Analytics/CustomDashboards/Widget/WidgetResult.tsx`, size the Pie chart view's donut by the widget's width (up to 4 columns 5, up to 8 columns 10, wider 15) with the legend in columns of six rows, and fewer rows, slices and a smaller ring on a card three rows tall, passed down from `WidgetCard`
- [x] 3.2 Draw a query's own view whose stored chart is a pie with the same donut, on that chart's Category and Value columns
- [x] 3.3 Test the width bands and the pie query's own view in `CustomDashboards/Widget/tests` and the band helper in `CustomDashboards/utils/tests`

## 4. Cleanup

- [x] 4.1 Remove `buildPieChartOptions`, `bucketTopSlices` and the `PieSlice` model, with their tests; `PIE_MAX_SLICES` stays as the query page's slice count

## 5. Custom dashboards spec

- [x] 5.1 After epam/ai-dial-admin-frontend#5518 merges, state in `openspec/changes/add-custom-dashboards/specs/analytics/custom-dashboards/spec.md` that a widget's Pie chart view and a pie query's own view draw the donut with 5, 10 or 15 slices by width, the legend in columns of six rows

## 6. Browser verification

- [x] 6.1 Run the `spec-browser-verify` skill for this change against the local stack with `ANALYTICS_ENABLED`, `ANALYTICS_USAGE_ENABLED` and `ANALYTICS_CUSTOM_DASHBOARDS_ENABLED` truthy; it builds a VerificationRequest from the change's scenarios (the query page pie, and a widget pie at Small, Medium and Large) and runs them through the `spec-verification-gate` sub-agent. Resolve every `fail` verdict before the change is complete

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test` and fix every failure
