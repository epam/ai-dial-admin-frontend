## Why

The activity row of the System Health page answers "how much evaluation happened this month" in suites, but not
in money. Evaluation spends real tokens twice — once running each test case against the evaluatee, and again
when judge models score the answers — and an admin has no platform-wide figure for it. The backend now serves
one: `POST /api/v1/costs/total` sums the evaluation-tagged usage of every deployment in a time window and
splits it into the test-case part and the metric-evaluation (judge) part. This change adds the **Eval cost this
month** card from the design mock.

## What Changes

- A third card in the activity row, **Eval cost this month**, beside _Test suites run_ and _Test suites
  added_. It shows:
  - the month-to-date total as grouped dollars (`$4,218`);
  - beneath it the split, `$2,840 evaluatees · $1,378 judges` (test-case cost, then metric-evaluation cost);
  - a delta badge against the same span of the previous month (`+$342 vs prev. period`). For cost a rise is the
    unfavourable direction, so a rise is red and a fall is green — the opposite of the two count cards.
- The card compares the same two periods as the other activity cards (the first of the local month to the end
  of today, against the first of last month to the same day-of-month), reuses their calendar clock so all
  three cards always cover identical periods, and reloads at local midnight with them.
- The card has its own loading and error state and loads independently: a failed cost request does not put the
  count cards into error, and a failed count query does not blank the cost.
- No cost recorded in the period (the backend's all-`null` answer) shows an em dash, with no split and no
  badge — not `$0`, which would claim a measured zero.
- Read the figures through one new server action that calls the endpoint for both periods concurrently, backed
  by a new `getTotalCosts` method on `RunsApi` beside `getDeploymentCosts`.
- `formatMonthCostDelta` stops producing a `+$0` / `-$0` badge for a change smaller than a cent (the shared
  helper rounds to cents for display but only checked for exact zero).

## Non-goals

- Restricting the cost to chosen deployments. The endpoint accepts `deploymentIds`; the card sends none, so it
  sums every deployment, counting a request nested under an application once.
- A tooltip or breakdown by deployment, model or suite.
- The _Metrics added this month_ card of the same mock row. It will take the slot before this card when it is
  built.
- A retry control on the card (the other activity cards have none).
- Showing a delta when either period has no recorded cost.
- Any backend change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `eval-system-health`: the activity row gains the Eval cost card — what its figures are, the split, the delta
  badge with cost colouring, the empty and error states and its independence from the count cards; the
  calendar-reload requirement now covers it.

## Impact

- **Backend (read only):** `POST /api/v1/costs/total` with `{ from, to }` (epoch ms, both inclusive) on the
  eval API, authenticated like the other cost endpoints. Answers `{ totalCost, testCaseCost, metricEvalCost }`,
  each omitted when no usage row matched.
- **Data layer:** `server/eval/runs-api.ts` (`getTotalCosts`, a URL constant beside the other `/costs/…`
  ones), `models/evaluation/run.ts` (the response and request types), `app/[lang]/runs/actions.ts` (a server
  action beside the other cost and analytics ones).
- **Feature folder:** `components/EvalSystemHealth/` gains the card, a data hook and a pure card builder;
  `ActivityCardRow` renders it after the two count cards.
- **Shared helper:** `components/EvalTrendsTab/deployment-month-cost.ts` (`formatMonthCostDelta`), which the
  Trends tab's month-cost card also uses — its sub-cent deltas lose the empty badge there too.
- **Reused, unchanged:** `buildMonthCostWindows`, `useStartOfToday`, `formatGroupedMonthCost`,
  `EvalMonthCostDeltaBadge`, `KpiCardFrame`, the kit `Spinner` and `Notification`.
- **i18n and docs:** new `EvalSystemHealthI18nKey` entries and `locales/en.ts` strings;
  `docs/MENU-DOCUMENTATION.md` System Health entry gains the card.
