## Why

The System Health page tells an admin how much of what is deployed has been evaluated and how busy
evaluation was this month, but not **how the evaluated things are doing**. Spotting a suite whose pass rate
has just dropped means opening every suite's Trends tab. The backend now stores a pass count per completed
run and serves a ready-made ranking, `GET /api/v1/analytics/test-suites/run-trends`: suites worst latest pass
rate first, each with its last 10 completed runs. This change puts that ranking on the page as the
**Evaluation Run Trends** table, so the weakest suites are the first thing an admin sees.

## What Changes

- Add an **Evaluation Run Trends** table below the activity cards on `/system-health`, taking the left half of
  the row on a standard screen and the full width on a smaller one. The right half holds a skeleton
  placeholder titled _Test suite health distribution_, standing in for the chart that does not exist yet.
  One row per test
  suite, in the backend's fixed order (lowest latest pass rate first), with these columns:
  - **Test suite** — the suite's name with its id on a second line, as the runs table pairs a run's name
    with its id. The name opens the suite.
  - **Evaluatee** — the evaluatee's name with its type (model, application, toolset or route) on a second
    line, as the runs table's _Target_ column does. There is no separate Type column.
  - **Run trends - 10 runs** — a bar chart of the suite's pass rate over its latest completed runs (up to 10),
    oldest to newest, as in the design mock: one bar per run, its height the pass rate and its colour the
    pass-rate band.
  - **Latest** — the pass rate of the newest run, as a percentage with a thin bar.
  - **Δ prev** — the change against the run before it, as a signed percentage-point badge.
- The table is server-paged, 10 suites per page, with previous/next controls and a `page of pages` label.
  The order is the backend's and cannot be re-sorted; there are no filters in this version.
- The table has its own loading, empty and error states, independent of the cards. The empty state says
  that a run shows up once its results are recorded, because the backend writes missing pass counts in the
  background.
- Read the data through one new server action backed by a new `getRunTrends` method on `AnalyticsApi`.

## Non-goals

- The other two cards of the second row (_Metrics added this month_, _Eval cost this month_) and the _Test
  Suite Health Distribution_ chart.
- Filters and re-sorting. The endpoint supports `filter` (e.g. `suiteType`); the table sends none. The
  backend gives no sort control, and sorting one page client-side would mislead.
- Deep-linking the suite's Trends tab. The suite view keeps its active tab in local state, so the name
  opens the suite at its default tab.
- The run status, run name and suite version of the mock. The endpoint does not return them.
- Showing the threshold or overall score. The figure is the backend's pass rate (test cases that passed
  over all test cases), the same number as the `Test Suite Trends` pass-rate card.
- Any backend change. `POST /analytics/test-suites/pass-rate` also changed, but nothing in the frontend
  calls it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `eval-system-health`: gains the run-trends table — its columns and row content, the fixed order and
  paging, the test suite and evaluatee cells, the run trend bars, the latest/delta cells, and its loading, empty and error states.

## Impact

- **Backend (read only):** `GET /api/v1/analytics/test-suites/run-trends?page&size` on the eval API
  (`DIAL_EVAL_API_URL`). Authenticated like the other analytics endpoints; no frontend-visible contract
  change elsewhere.
- **Data layer:** `server/eval/analytics-api.ts` (`getRunTrends`), `app/[lang]/runs/actions.ts` (a server
  action beside the other analytics ones), new `models/evaluation/run-trend.ts`.
- **Feature folder:** `components/EvalSystemHealth/` gains the table, its cells, the pager, a paging hook
  and pure row-mapping utils; `SystemHealth.tsx` mounts the table under the activity row.
- **Reused, unchanged:** `GridView`, `TitleSubtitleCellRenderer` (as the runs table uses it), `PassRateBar`
  and its band classes, `formatPassRatePercent`, `formatPassRateDelta`, and the `EvaluationPageData<T>` page
  envelope.
- **i18n and docs:** new `EvalSystemHealthI18nKey` entries and `locales/en.ts` strings;
  `docs/MENU-DOCUMENTATION.md` System Health entry gains the table.
