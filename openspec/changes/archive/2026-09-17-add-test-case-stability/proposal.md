## Why

The Test Suite Trends tab already shows KPI cards, Overall Score Trend, and Metric Trends for the
last `TRENDS_RUN_WINDOW` (10) runs, but it does not show how individual test cases pass or fail
across that window. Design exists in Figma (node 6336:12473); run IDs for the window already live
on `TrendsData.runOrder[].runId`. Issue [#4551](https://github.com/epam/ai-dial-admin-frontend/issues/4551).

## What Changes

- Add a **Test Case Stability** `SummarySection` on Trends below Metric Trends: heatmap of
  test cases × Trends-window runs, cells from `eval_summaries` (`score`, `passed`).
- Fetch per-test-case rows via structured query on `eval_summaries` filtered to `runOrder` run IDs
  (BE contract: row mode, select run id / test case name / score / passed, limit 200).
- Extract domain-free heatmap grid chrome from Run Comparison into `Common/HeatMap/` and reuse it
  for Stability (and rewire Compare to the shared shell). Compare-specific builders, toolbar, and
  Absolute/Delta stay in Compare.
- Handle missing test cases in a run as matrix gaps (not crashes).
- Add i18n keys and unit/component tests; browser-verify Trends Stability scenarios.

## Non-goals

- No new REST list endpoint.
- No change to Compare Absolute/Delta, metrics toolbar, or request/turn axes.
- No KPI strip or Overall/Metric chart behavior changes.
- No pass/fail color palette beyond existing accuracy `ColorScale` on score (unless Figma requires
  it at apply time).

## Capabilities

### New Capabilities

- `test-suite-trends`: Test Case Stability section on Trends (data contract, matrix/gap behavior,
  shared heatmap shell). Capability was also introduced for Runs Passed Threshold by the sibling
  in-flight change; this delta adds Stability requirements to the same capability path.

### Modified Capabilities

_(none)_

## Impact

- `apps/ai-dial-admin/src/components/Common/HeatMap/` — extracted grid chrome from Compare.
- `apps/ai-dial-admin/src/components/Runs/Compare/HeatMap/` — rewired to Common; builders stay.
- `apps/ai-dial-admin/src/components/TestSuites/Trends/` — query, pivot, hook, Stability section.
- `apps/ai-dial-admin/src/constants/i18n.ts`, `src/locales/en.ts` — TestSuites Stability keys.
- Co-located unit/component tests; `spec-browser-verify` for browser-observable scenarios.
