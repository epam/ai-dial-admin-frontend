## Context

See `proposal.md` for motivation and scope, and the `eval-system-health` spec delta for the requirements. The
constraints that shape the approach:

- **A ready-made backend read.** `POST /api/v1/costs/total` takes `{ from, to }` (epoch ms, both inclusive,
  optional `deploymentIds`) and answers `{ totalCost, testCaseCost, metricEvalCost }`. Each is omitted from the
  JSON when no usage-log row matched; a phase with no usage inside a non-empty period is `0`. Without
  `deploymentIds` it sums each request's own price, so a request nested under an application counts once.
  Usage of deleted runs is still counted. It is a `POST` only because of the id list; it reads.
- **Failure reaches the client two ways.** `BaseApi.sendRequest` returns `null` for a failed response, but
  returns `undefined` for a 403 (a deliberate `void 0`). A caller must test `== null`, not `=== null`. The
  endpoint's 502 and 504 documentation shows the success body shape; whatever the body, a non-2xx is a failure.
- **Cost reads live in `RunsApi`.** `getDeploymentCosts` and `getRunsTotalCosts` sit there with their
  `/costs/…` URL constants; the precedent `getDeploymentPeriodCosts` server action calls the current and the
  previous window concurrently and returns both — but it turns a failed window into "no usage", which would
  show a failed request as an em dash. The System Health cards report failures as errors instead.
- **The periods already exist.** `buildMonthCostWindows(date)` returns the local month-to-date window and the
  matching previous span, with both ends inclusive epoch ms (end of day `23:59:59.999`) — exactly the endpoint's
  inclusive `to`. `useActivityData` derives them from `useStartOfToday()`, which re-ticks at local midnight, and
  returns them next to the cards.
- **Cost formatting and the badge exist.** `formatGroupedMonthCost` (`$1,842`, cents only when non-zero),
  `formatMonthCostDelta` (`+$214` / `-$214`, `null` when either side is missing or the difference is exactly
  0) and `EvalMonthCostDeltaBadge`, whose default is "a rise is red" — the cost direction.
- **Server actions run one after another.** The page already queues the deployment listing, coverage, the
  activity batch, run trends and the distribution; the cost request queues behind them (see the archived
  `add-eval-system-health-coverage` design, D4). Each consumer owns its state, so a card shows its spinner
  until its turn and no card waits on another's result.

## Goals / Non-Goals

**Goals:**

- The card's figures and states come from a pure builder, unit-tested without a component.
- One clock for the whole row: the cost card covers exactly the periods the count cards cover, and a midnight
  rollover moves all three together.
- A failed request is an error, never a silent `$0` or a total built from one period.

**Non-Goals:**

- A generic "period costs" abstraction shared with the Trends tab. Its card is per deployment and swallows
  failures on purpose; this one is platform-wide and does not.
- Folding the request into another server action (see Risks).

## Decisions

### D1. Data path: `RunsApi.getTotalCosts(from, to, token)` and `getEvalPeriodCosts(...)`

`getTotalCosts(fromMs, toMs, token)` in `server/eval/runs-api.ts` posts `{ from, to }` to
`${API}/costs/total` (constant `TOTAL_COSTS_URL` beside the other cost URLs) through `this.post` and returns
`TotalCosts | null`. The body carries no `deploymentIds`. The types go in `models/evaluation/run.ts` beside
`DeploymentCosts`: `TotalCostsRequest` (`from`, `to`) and `TotalCosts` (`totalCost`, `testCaseCost`,
`metricEvalCost`, each `number | null`).

The response omits absent values rather than sending `null`. The method returns the parsed body, and the card
builder reads each field with `?? null`, so the type stays honest (`number | null`) without a mapping layer
that would have to be kept in step.

The server action `getEvalPeriodCosts(currentFromMs, currentToMs, previousFromMs, previousToMs)` in
`app/[lang]/runs/actions.ts` authenticates once and runs both calls with `Promise.all`, returning
`EvalPeriodCosts { current: TotalCosts | null; previous: TotalCosts | null }`. A window that failed is `null`
there — the `== null` test also catches the `undefined` of a 403 and converts it to `null`, so the client sees
one failure value. This is the one deliberate difference from `getDeploymentPeriodCosts`.

_Alternatives:_ reusing `getDeploymentCosts` per deployment and summing — rejected, one request per deployment
and no judge/execution split guarantee, and the new endpoint exists for this. Two server actions, one per
window — rejected, they would queue one after the other for no benefit. Adding the call to
`executeStructuredQueries` — rejected, it is not a structured query.

### D2. View-model built by a pure function

`buildEvalCostCard(source)` takes a `CoverageSource<EvalPeriodCosts>` (the existing load-state shape) and returns
`EvalCostCardModel`:

- `status` — `Loading` and `Error` pass through; `Ready` becomes `Error` when `current` or `previous` is
  `null` (design goal: never a one-window total).
- `total`, `evaluateesCost`, `judgesCost` — the current window's `totalCost`, `testCaseCost`, `metricEvalCost`,
  each `number | null`.
- `deltaLabel` — `formatMonthCostDelta(current.totalCost, previous.totalCost)`, so a missing side yields no
  badge, and (D3) a sub-cent change does too.

The model and the source type live in `components/EvalSystemHealth/models.ts`. `EvalCostCardModel` is separate
from `ActivityCardModel`: that one is a count with a rate and an evaluatee count and a signed integer delta;
forcing money into it would add three more nullable fields to every count card.

### D3. A sub-cent change shows no badge

`formatMonthCostDelta` compares `latest - previous` with `0` while `formatGroupedMonthCost` rounds to cents. A
change of `0.003` therefore yields a badge reading `+$0`, which says the opposite of "no change". The helper
compares the rounded cents instead and returns `null` when the difference rounds to zero. The Trends tab's
month-cost card shares the helper and gains the same fix; its spec gains the case. This is the only edit to
shared code.

### D4. One clock: the cost hook takes the activity windows

`useEvalCostData(windows)` receives the `MonthCostWindows` that `useActivityData` already derives from
`useStartOfToday()`, and `ActivityCardRow` passes them through. The hook loads on every change of `windows`
(it resets to loading first, as `useActivityData` does), drops a response that a newer load superseded with the
same `isCancelled` flag, and treats a thrown action as a failed source. Passing the windows rather than calling
`useStartOfToday` again guarantees that the three cards always describe identical periods and starts one
midnight timer, not two.

_Alternative:_ the hook calling `useStartOfToday` itself — rejected, two timers could straddle midnight by a
tick and show a count for one month against a cost for another.

### D5. The card component

`EvalCostCard` renders on `KpiCardFrame` like `ActivityCard` (title, `aria-label`) with the same three states:
a `Spinner`, a `Notification` with `role="alert"`, or the figures. The ready state shows the formatted total
(`formatGroupedMonthCost`, an em dash when `null`), `EvalMonthCostDeltaBadge` when `deltaLabel` is set (default
colouring, a rise is red), the split line (hidden when `total` is `null`; `—` for a single missing part), and
the sr-only periods sentence, reusing the `ActivityPeriods` string. `ActivityCardRow` renders it after the count
cards; the row stays a four-column grid, so the fourth slot stays free for the _Metrics added_ card.

### D6. Strings

New `EvalSystemHealthI18nKey` entries: `EvalCostThisMonth` (`Eval cost this month`), `EvalCostSplit`
(`{evaluatees} evaluatees · {judges} judges`) and `EvalCostLoadFailed` (`Failed to load eval cost`). The
amounts are formatted before they are passed in, so the string has no number logic. The badge text is the
existing `EvalTrendsDeltaVsPrevPeriod`.

## Risks / Trade-offs

- [The cost request queues behind five other server actions, so the card spins the longest] → The same holds
  for run trends and the distribution, and each card owns its state; folding the page's reads into one
  concurrent action is a separate, page-wide change.
- [A zero-cost month shows `$0` while an unused month shows `—`] → That is the backend's own distinction (`0`
  for an unused phase in a non-empty period, absent when no row matched); the spec states it.
- [The delta is hidden when the previous month has no cost, which is when it would be largest] → A change from
  nothing has no percentage, and a bare `+$4,218` would read as growth from a measured baseline; showing the
  total alone is the honest figure. Treating an absent period as `0` is a one-line change if product asks.
- [Local-calendar periods against a UTC-agnostic backend] → The endpoint takes epoch ms, so the local month
  boundaries the count cards use are sent unchanged; the three cards agree with each other, which is what the
  admin compares.
- [`formatMonthCostDelta` is shared with the Trends tab] → The change only removes a `+$0` badge; its spec is
  extended and the card's rendering is untouched.
