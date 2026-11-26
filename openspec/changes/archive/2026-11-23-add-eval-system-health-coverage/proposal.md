## Why

Evaluation has pages for one run, one test suite's trends, and one entity's trends, but nothing that
answers the platform-wide question: _how much of what we deploy is actually evaluated?_ Admins
cannot see which models, applications and toolsets have no quality signal at all. The "System
Health" design closes that gap; this change delivers its first slices — the coverage cards and the first two
activity cards (_Test suites run this month_, _Test suites added this month_) — so the page and its data path
exist before the heavier sections (cost and metrics cards, run-trends table, health distribution) are added.

## What Changes

- Add a **System Health** item to the Evaluation menu group, marked with the `Preview` badge, linking to a
  new `/system-health` page. Gated like the rest of the group by `evaluationEnabled`.
- Add the System Health page with its first card row: four coverage cards — **Total Evaluatees**,
  **Total Models**, **Total Applications**, **Total Toolsets**.
- Each card shows the coverage percentage, a thin progress bar under it (not a donut), and a
  `N total · M uncovered` caption.
- An evaluatee is **covered** when at least one test suite run started on it in the last 30 days. The
  Total Evaluatees card has an info tooltip stating this rule.
- Totals come from one eval deployment listing, split into models, applications and toolsets by each
  entry's type; covered evaluatees come from one aggregate structured query over `test_suite_runs`. The
  percentage is computed on the frontend.
- A card whose data failed to load shows an error state; one still loading shows a loading state. The four
  cards share both sources, so they share one state.
- Add a second card row with two activity cards. **Test suites run this month** shows how many test suites
  had a run in the calendar month so far, out of all test suites, with the percentage. **Test suites added
  this month** shows how many test suites were created in the month so far, and across how many evaluatees.
  Both carry a delta against the **same span of the previous month** (1st to today's date in both), not the
  whole previous month, worded `vs prev. period`.
- The activity cards read through one new server action that runs their structured queries concurrently on
  the server, because Next.js runs a page's server actions one after another.

## Non-goals

- The other two cards of the second row: _Metrics added this month_ and _Eval cost this month_. The cost
  card needs a new backend aggregate endpoint and is a follow-up.
- The _Evaluation Run Trends_ table and the _Test Suite Health Distribution_ chart; both need backend
  design first.
- Routes as an evaluatee kind. A suite can target a route, but the design counts models, applications
  and toolsets only.
- The page header strip of the mock (`Dashboard 3 · …`, the `118 models · 224 …` summary line), the
  `Settings` / `Export` / `New Run` buttons, and the in-page tab bar (`Single Run / Evaluatee / Test
  Suite / System Health`). Those belong to the mock's own chrome; here the Evaluation menu is the
  navigation.
- Any new backend endpoint.

## Capabilities

### New Capabilities

- `eval-system-health`: The System Health page — its menu entry and route, the coverage card row, the
  covered/uncovered definition, the activity cards for test suites run and added this month, and the loading,
  empty and error behaviour of each card.

### Modified Capabilities

None. The new menu item is item-level `Preview`, as the policies items already are; `menu-badges` and
`menu-group-visibility` describe group-level behaviour that this does not change.

## Impact

- **Menu / routing:** `components/Menu/menu-configuration.tsx` (new item in the Evaluation group),
  `types/routes.ts` (new `ApplicationRoute`), `constants/i18n.ts` + `locales/en.ts` (`MenuI18nKey` entry and
  a new i18n enum for the page), new `app/[lang]/system-health/` route; `app/[lang]/runs/actions.ts` gains
  `executeStructuredQueries`, a batch of `executeStructuredQuery` run concurrently server-side.
- **New feature folder:** `components/EvalSystemHealth/` (cards, data hooks, query builders and parsing
  utils), co-located tests.
- **Reused, unchanged:** `TestSuites/Trends/Kpi/KpiCardFrame` for the card shell,
  `Common/PassRateBar` for the progress bar, `executeStructuredQuery` / `getDeployments` server actions, the
  `utils/structured-query/build` helpers, and `EvalTrendsTab/deployment-month-cost`'s
  `buildMonthCostWindows` for the month-to-date and matching previous-month spans.
- **Backend:** reads only — `GET /api/v1/deployments` and `POST /api/v1/queries/execute` on the eval API
  (`DIAL_EVAL_API_URL`). No contract change.
- **Docs:** `docs/MENU-DOCUMENTATION.md` lists the Evaluation items and says which sub-items carry a badge
  (currently only the two Governance policy items); it gains the System Health entry and that sentence is
  updated.
