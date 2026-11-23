# Tasks

## 1. Backend query spike

- [x] 1.1 Against a running eval backend, read `getQueryEntitySchema('test_suite_runs')` and execute the
  coverage aggregate from design D3 (group by `deployment_ref::id` and `mcp_deployment_ref::id`, filter on
  `started_at_ms` and `test_suite_id IN (test_suites.id)`); record the outcome in `design.md` Risks. If the
  group-by-path or the cross-entity subquery is rejected, switch to the fallback named there and update the
  _A deleted suite's runs do not cover_ scenario in `specs/eval-system-health/spec.md` before continuing.
  Done when the query returns rows for a known-covered model and the design note says which variant ships.

## 2. Menu entry and route

- [x] 2.1 Add `ApplicationRoute.SystemHealth = '/system-health'` in
  `apps/ai-dial-admin/src/types/routes.ts`, `MenuI18nKey.SystemHealth` in `constants/i18n.ts` with its
  `locales/en.ts` string, and the `{ key, href, badge: MenuBadge.Preview }` item after Datasets in
  `components/Menu/menu-configuration.tsx`. Done when `menu-configuration.spec.ts` asserts the item, its
  badge, and its absence when `evaluationEnabled` is false.
- [x] 2.2 Add the System Health entry to the Evaluation section of `docs/MENU-DOCUMENTATION.md` and update
  the sentence at the top that lists which sub-items carry a badge. Done when the doc names the item, its
  `Key`, and its `[Preview]` marker.

## 3. Coverage data layer

- [x] 3.1 Add `components/EvalSystemHealth/models.ts` and `constants.ts` (card kinds enum, 30-day window
  length, query field names, i18n-free view-model types).
- [x] 3.2 Add pure utils in `components/EvalSystemHealth/utils/`: `build-coverage-query` (takes the window
  start as a parameter), `parse-coverage-rows` (rows to id sets), `group-deployment-ids` (one listing split
  into models, applications and toolsets by `$type`), and `build-coverage-cards` (the two sources to the four
  card view-models, including the id normalisation, the intersection with each kind's listing, the
  zero-total case and the shared loading/error status of design D4). Done when each util has a unit spec
  covering the spec's _Coverage definition_, _Total Evaluatees aggregates the kinds_, _Zero totals_ and
  _Card loading and error states_ scenarios.
- [x] 3.3 Add the `use-coverage-data` hook: one unfiltered `getDeployments()` call and the
  `executeStructuredQuery` call, treat `success: false`, a throw, or a `null` query result as that source's
  failure, cancel on unmount, and return the card view-models. Done when a hook spec covers loading,
  all-success, the single listing request, the listing failing, and the query failing.

## 4. Page and cards

- [x] 4.1 Add `EvalSystemHealthI18nKey` in `constants/i18n.ts` and strings in `locales/en.ts` (card titles,
  parameterised caption, tooltip body, load-error message), reusing shared keys where one fits.
- [x] 4.2 Build `CoverageCard` (in `KpiCardFrame`, percentage via `formatPassRatePercent`, `PassRateBar`,
  caption, loading and error states, `—` for zero total), the Total Evaluatees info tooltip with a focusable
  labelled trigger, and the `CoverageCardRow` that renders the four cards in order. Confirm the ui-kit
  `Tooltip` props through the `ai-dial-ui-kit` MCP server first. Done when component specs query by role and
  accessible name and cover the percentage and caption, the bar's accessible name and value, the tooltip on
  hover and focus, zero total, loading, and error.
- [x] 4.3 Add `app/[lang]/system-health/page.tsx` (`dynamic = 'force-dynamic'`) rendering the row. Done when
  `npm run typecheck` is clean and the page renders under `npm start`.

## 5. Activity cards

- [x] 5.1 Add `executeStructuredQueries(queries)` to `app/[lang]/runs/actions.ts`: run the queries
  concurrently with the user's token and return one result per query, `null` for a query that failed or
  threw. Extract the existing-suite-ids subquery from `build-coverage-query` into its own util that both
  coverage and activity queries use. Done when `app/[lang]/runs/actions.spec.ts` asserts the token is passed,
  the results keep the input order, and one failing query yields `null` without rejecting the others.
- [x] 5.2 Add the activity data layer in `components/EvalSystemHealth/`: models and constants, pure utils
  `build-activity-queries` (the five queries of design D8, taking the two periods as parameters),
  `parse-activity-results` (group-row count, `totalCount`, distinct normalised targets), `build-activity-cards`
  (the two view-models, percentage, deltas, and per-card status from its own queries) and `format-activity`
  (signed delta, grouped count), plus the `use-activity-data` hook (periods from `buildMonthCostWindows`, one
  batched call, cancel on unmount). Done when each util and the hook have unit specs covering the spec's
  _Month periods_, _Test suites run this month_, _Test suites added this month_, _Activity delta badge_ and
  _Activity card loading and error states_ scenarios.
- [x] 5.3 Build `ActivityCard` and `ActivityCardRow`, add the `EvalSystemHealthI18nKey`
  strings (titles, run and added captions with the singular form; the delta uses `EvalMonthCostDeltaBadge` with a new
  `isIncreaseGood` flag) and mount the row under the coverage row in `SystemHealth`. Done when component specs
  query by role and accessible name and cover the count and caption, increase, decrease and no-change badges,
  the screen-reader period text, zero total, loading, and error, and the row renders both cards in order.

- [x] 5.4 Review follow-ups. Match every evaluatee against the ids of both refs (one covered set), reuse
  `EvalMonthCostDeltaBadge` for the activity delta, add `useStartOfToday` and reload both data hooks when the
  day rolls over, give the System Health menu item `IconActivity`, and add its breadcrumb entry. Done when
  specs cover the either-ref match, the badge colours both ways, the day rollover and no reload within a day,
  the icon, and the breadcrumb.

## 6. Browser verification

- [x] 6.1 Run the `spec-browser-verify` skill against `openspec/changes/add-eval-system-health-coverage`
  with the local stack up and auth disabled; fix every `fail` verdict and re-run the failing scenarios until
  none remain. Also compare the two activity counts with the `/runs` and `/test-suites` lists for the same
  month. Done when the VerificationReport has no `fail`, and any `blocked` scenario is explained.
  _Closed on the user's word: they verified the page in the browser themselves, so the skill was not run._

## 7. Quality checks

- [x] 7.1 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run typecheck:specs` at zero,
  then the full `npm run test`; run `openspec validate add-eval-system-health-coverage --strict`. Done when
  all of them pass.
