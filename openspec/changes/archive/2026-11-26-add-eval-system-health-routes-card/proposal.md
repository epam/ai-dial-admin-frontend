## Why

The coverage row of the System Health page answers "how much of what is deployed has been evaluated" for
models, applications and toolsets, but a test suite can also target a **platform route**, and a route that no
suite ever runs has the same absent quality signal as an unevaluated model. Routes are already evaluatees
everywhere else on the page — the run-trends table labels a route-targeted suite `Route` — yet they are in
neither the coverage cards nor the Total Evaluatees count, so the page understates both what is evaluable and
what is uncovered.

## What Changes

- A fifth coverage card, **Total routes**, after Total Toolsets, in the same form as its siblings: percentage,
  progress bar and a `N total · M uncovered` caption.
- A route is **covered** when at least one test suite run targeting it started in the last 30 days and the
  suite that produced the run still exists — the rule the other cards use, read through the suite's route
  reference instead of its deployment references.
- **Total Evaluatees now includes routes**: its total and its covered count are the sums over models,
  applications, toolsets and routes.
- Routes are read from the platform route listing — the same Core listing the Create Test Suite dialog's Routes
  tab shows — keeping items and dropping folders. This is **one extra request**; routes are not deployments,
  so the deployment listing cannot carry them. The existing `getRoutes()` cannot be reused as is: it returns an
  empty list when the read fails, which would show as "0 routes" instead of an error, so a failure-aware
  variant of the listing is added beside it.
- Coverage of routes needs **no extra query**: the existing coverage query also selects and groups by the
  suite's route reference name, and the parser returns the covered route names beside the covered deployment
  ids. A suite's stored route name carries the `routes/platform/` prefix, the listing's name does not; they are
  compared in one form.
- The route listing is its own data source, so its failure no longer takes every card down. Total Routes and
  Total Evaluatees (which needs the route total) show the error; Total Models, Total Applications and Total
  Toolsets keep their figures. A failure of the coverage query still puts all five cards in error, since
  every card needs it.
- **Routes are evaluatees on the activity row too.** The caption of **Test suites added this month**
  (`across N evaluatees`) counts the distinct routes the new suites target together with the models,
  applications and toolsets, so it agrees with Total Evaluatees. This replaces the spec rule that a
  route-targeted suite targets no evaluatee.
- **The page layout is reworked.** On a standard screen: a first row of four key figures (Total Evaluatees,
  Test suites run, Test suites added, Eval cost); below it a row that shares its width between a two-by-two
  block of coverage cards on the left — Total Models, Applications, Toolsets, Routes — and the Test suite
  health distribution chart on the right, the cards stretched to the chart's height; and below that the
  Evaluation Run Trends table at full width. Before, the four coverage cards led, the activity cards had their
  own row, and the table shared a row with the chart. On a narrower screen the chart takes the full width
  below the cards, and each group of cards goes three to a line, then two, then one.
- The `eval-system-health` spec's Purpose, and the System Health entry of `docs/MENU-DOCUMENTATION.md`, name
  routes.

## Non-goals

- Counting route folders, or listing routes recursively.
- A retry control on the cards, or retrying a failed route listing on its own.
- Any backend change, and any change to how a route is chosen in the Create Test Suite dialog.
- Per-card loading of the three deployment cards ahead of routes beyond what the error split already gives:
  the deployment cards and the route card each wait only for their own sources.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `eval-system-health`: the coverage row gains the Total routes card and the evaluatee definition gains
  routes (what is listed, what covers one, how names are matched); Total Evaluatees aggregates four kinds;
  the card loading and error rules become per card instead of one shared state; the page layout is reworked as
  above (the Coverage card row requirement is modified; the Activity card row requirement is removed and
  restated as the Key figures row and the coverage cards beside the chart; the run-trends placement and table
  requirements are modified for the full-width table); the Test suites added caption counts routes (that requirement is removed and restated under a new
  name, because a modified requirement cannot drop its old route scenario).

## Impact

- **Backend (read only):** Core `GET /v1/metadata/route/platform/`, paged, through a new `AssetApi.listStrict`
  and a `listPlatformRoutes` server action beside `getRoutes`; and the existing structured query on
  `test_suite_runs`, now also selecting and
  grouping by `routes_ref::name`, and the Test suites added query on `test_suites`, now also selecting
  `routes_ref::name`. Both were run against the local backend and accepted: the aggregate `groupBy` returns the
  route as its own group (`routes/platform/<name>`), and the `test_suites` row select returns it per suite.
- **Data layer:** `server/core/asset-api.ts` (`listStrict`), `app/[lang]/test-suites/actions.ts`
  (`listPlatformRoutes`); `list` and `getRoutes` are unchanged.
- **Feature folder:** `components/EvalSystemHealth/` — `models.ts` (a `Routes` kind, a routes source, a
  covered-ids type with two sets), `constants.ts`, `use-coverage-data.ts`, `utils/build-coverage-cards.ts`, `utils/build-coverage-query.ts`,
  `utils/parse-coverage-rows.ts`, `utils/build-activity-queries.ts` and `utils/parse-activity-results.ts`;
  their specs. The layout touches `SystemHealth.tsx`, `CoverageCardRow.tsx`, `ActivityCardRow.tsx` and
  `HealthDistributionSection.tsx`, and their specs.
- **Reused, unchanged:** `fromCanonicalRouteName` / `toCanonicalRouteName`, `CoverageCard`,
  `KpiCardFrame`, `PassRateBar`, the kit `Spinner` and `Notification`.
- **i18n and docs:** a `TotalRoutes` entry in `EvalSystemHealthI18nKey` and `locales/en.ts`;
  `docs/MENU-DOCUMENTATION.md` System Health entry.
- **Server actions queue:** the page's server actions already run one after another; the route listing adds one
  more ahead of or behind the others (see design D5).
