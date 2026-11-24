## Why

The System Health page now ranks the weakest test suites (the run-trends table) but cannot say **whether the
platform as a whole is getting healthier or sicker**. The right half of the table's row is a skeleton waiting
for the _Test Suite Health Distribution_ chart. The backend now serves it ready-made:
`GET /api/v1/analytics/test-suites/health-distribution` returns, per UTC week, how many test suites had a
weekly pass rate at or above a threshold (healthy) and how many were below it (failing). This change replaces
the skeleton with that chart.

## What Changes

- Replace the placeholder with a **Test suite health distribution - 5 weeks** chart in the same slot (right
  half of the run-trends row on a standard screen, below the table on a smaller one):
  - Five 100%-stacked bars, one per week, oldest to newest, the current week last. Each bar splits the week's
    suites into **Healthy** (green) and **Fail** (red) by share, so every bar with data reaches the same
    height. A week with no counted suite shows no bar.
  - The x-axis labels each bar with the week's start date (a Monday, UTC), such as `Nov 3`.
  - A legend names the two bands with the threshold the backend applied: `Healthy ≥ 0.75`, `Fail < 0.75`.
  - **No percentages are drawn on the bars.** Hovering a bar shows a tooltip with the week and, for Healthy
    and Fail, the suite count and its share (for example `Healthy 21 suites · 65.8%`).
  - A visually hidden table carries the same figures for assistive technology.
  - An **info icon beside the title**, as on the Total Evaluatees card, opens a tooltip on hover and keyboard
    focus that explains the chart: what a bar shows, when a suite is healthy (pass rate at or above the
    threshold across its runs that week), that a suite counts only in weeks it ran, and that one evaluatee
    can have several suites, so this is more granular than evaluatee-level health. The design mock's text
    also names a _watch_ (0.60–0.74) and a _critical_ (< 0.60) zone; the backend has only healthy and
    failing, so the tooltip leaves those out.
- Own loading, empty and error states, independent of the cards and the table. The empty state says a week
  fills in once runs are recorded, because the backend writes missing pass counts in the background and older
  weeks can be under-reported until it has.
- The request asks for 5 weeks and the backend's default threshold of 0.75, and sends no filter.
- Read the data through one new server action backed by a new `getHealthDistribution` method on
  `AnalyticsApi`.

## Non-goals

- A configurable threshold or week count, and filters (`suiteType` and the other test-suite filter fields).
  The endpoint accepts them; the chart sends none.
- Drilling from a bar into the suites behind it. The endpoint returns counts, not suite ids.
- Percentages or counts drawn on the bars (the mock labels the last bar; this version uses the tooltip).
- A third _watch_ band. The mock's info text mentions one, but the legend and the endpoint have two bands.
- Reloading when the week rolls over while the page stays open. The cards reload at local midnight; the chart
  shows the weeks as of the load, and a refresh picks up the new one.
- The two remaining cards of the second row (_Metrics added this month_, _Eval cost this month_).
- Any backend change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `eval-system-health`: gains the health distribution chart — what a bar and a band mean, the legend, the
  tooltip, the week labels and its loading, empty and error states; the run-trends placement requirement now
  pairs the table with the chart rather than a placeholder.

## Impact

- **Backend (read only):** `GET /api/v1/analytics/test-suites/health-distribution?weeks&threshold` on the eval
  API (`DIAL_EVAL_API_URL`), authenticated like the other analytics endpoints.
- **Data layer:** `server/eval/analytics-api.ts` (`getHealthDistribution`), `app/[lang]/runs/actions.ts` (a
  server action beside the other analytics ones), new `models/evaluation/health-distribution.ts`.
- **Feature folder:** `components/EvalSystemHealth/` gains the chart section, the chart, a data hook and pure
  mapping utils; `HealthDistributionPlaceholder` and its spec are deleted; `SystemHealth.tsx` mounts the
  section in the placeholder's place.
- **Reused, unchanged:** `SummarySection`, `useChartColors`, `ChartLegend`, `ReactECharts`, `formatPercent`,
  the kit `Spinner`, `Notification`, `Button` and `NoDataContent`.
- **i18n and docs:** new `EvalSystemHealthI18nKey` entries and `locales/en.ts` strings (the title gains a
  week-count parameter); `docs/MENU-DOCUMENTATION.md` System Health entry gains the chart.
