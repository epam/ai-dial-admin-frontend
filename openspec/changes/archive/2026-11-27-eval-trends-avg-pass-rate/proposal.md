# Proposal

## Why

Operators on a model or application Eval Trends tab see suite count and month-to-date eval cost under
“Trends in All Test Suites,” but they still lack the cross-suite average pass-rate KPI from Figma.
That card was deferred until a suite-scoped aggregate existed. The eval service now exposes
`POST /api/v1/analytics/test-suites/pass-rate` (Issue #5481 / backend #297).

## What Changes

- Add an **Avg Pass Rate Across All Test Suites** KPI card on the Eval Trends tab, in a row
  immediately before the existing month-cost card.
- Load the mean latest-run pass rate (and previous-run rate for trend) via the suite pass-rate
  endpoint for the entity’s loaded suite ids.
- Show a percentage, a Trending up / Trending down badge when the rate moved, and a footer based on
  the loaded suite count.
- Update the open `entity-eval-trends` proposal/design so this card is no longer listed as deferred.

## Non-goals

- Changing suite Trends chart/KPI contracts or the per-suite score pills.
- Approximating pass rate from per-run admin APIs when the summary endpoint fails.
- Deployment-scoped pass-rate without suite ids (the endpoint takes suite ids).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `entity-eval-trends`: add the cross-suite average pass-rate KPI beside the month-cost card.

## Impact

- `components/EvalTrendsTab` (new card, hook, helpers; layout row with the cost card).
- Eval `RunsApi` + test-suites server action for `POST /api/v1/analytics/test-suites/pass-rate`.
- i18n for the card title and trend badge labels.
- Co-located unit and component tests; browser verification of the card scenarios.
