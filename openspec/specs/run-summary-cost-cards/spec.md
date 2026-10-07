# run-summary-cost-cards Specification

## Purpose
Defines how Run Summary KPI cost cards (Test Case LLM Cost, Metric-Eval Cost) fetch independently
of other Summary analytics, present a calculating elapsed-time state until `getRunCosts` produces
real figures, and surface success or endpoint failure without blanking the rest of the Summary KPI
strip.
## Requirements
### Requirement: Cost cards are always shown beside other Summary KPIs

The Run Summary analytics strip SHALL render Test Case LLM Cost and Metric-Eval Cost cards whenever
the other KPI cards render. The system SHALL NOT gate those cards behind a temporary feature flag.
Cost fetch failures or delays SHALL NOT remove or blank the non-cost KPI cards.

#### Scenario: Cost cards render with other KPIs

- **WHEN** the Run Summary analytics strip has resolved its structured-query slice
- **THEN** the Test Case LLM Cost and Metric-Eval Cost cards are present alongside the other KPI
  cards

#### Scenario: Slow costs leave other KPIs available

- **WHEN** `getRunCosts` is still in flight after the structured-query slice has resolved
- **THEN** the non-cost KPI cards still show their resolved values
- **AND** each cost card shows its calculating state rather than hiding the cards

### Requirement: Calculating state shows elapsed time until settle

Until `getRunCosts` has settled the cards, each cost card SHALL show a spinner with the Calculating
label as its value and a description of the form `MM:SS elapsed · usually under 2 min`, where
`MM:SS` is the wall-clock time since the first attempt started. The elapsed counter SHALL keep
running across retries — it measures the wait, not the current request. The system SHALL NOT use
`DialAnalyticsCard.isLoading` for this state, because that path hides the description.

#### Scenario: Calculating copy while costs are pending

- **WHEN** the structured-query slice has resolved and `getRunCosts` has not yet settled
- **THEN** each cost card’s value area shows a spinner and the Calculating label
- **AND** each cost card’s description shows elapsed time in `MM:SS` plus the soft “usually under
  2 min” expectation

#### Scenario: Elapsed time ticks while pending

- **WHEN** fifteen seconds have elapsed since the costs fetch started and the fetch is still pending
- **THEN** the cost card description includes `00:15 elapsed`

### Requirement: A payload carrying no averages is not a result

The costs endpoint answers as soon as the run row exists, but the backend aggregates usage logs
asynchronously, so a just-finished run gets a payload back within milliseconds that carries no
figures at all — all-null averages, an empty object, or an empty body. A payload SHALL only settle
the cost cards when at least one of `avgTestCaseCost` / `avgMetricEvalCost` is a finite number; zero
counts as a figure. While no such payload has arrived, the cards SHALL remain in the calculating
state and SHALL NOT fall back to an em dash, and the system SHALL retry `getRunCosts` on a fixed
interval until a figure arrives, the endpoint reports an error, or `COST_FETCH_MAX_WAIT_MS` elapses
since the first attempt. A long aggregation is slow, not broken, and an Error badge over data still
on its way would be wrong — but `/costs` itself cannot distinguish a slow aggregation from a run that
will never produce a figure, so for whatever case "A run that can have no cost is not polled" has not
already ruled out from known data, the wait still needs a backstop rather than running forever.
Polling SHALL stop when the cards unmount or the run id changes.

#### Scenario: Not-yet-aggregated payload keeps the calculating state

- **WHEN** `getRunCosts` resolves with a payload whose averages are both absent or null
- **THEN** both cost cards still show the spinner, the Calculating label, and the elapsed description
- **AND** neither card shows an em dash or the Error badge

#### Scenario: Retry picks up the averages once the backend has them

- **WHEN** a not-yet-aggregated payload has kept the cards calculating
- **AND** a later retry of `getRunCosts` resolves with at least one numeric average
- **THEN** the cards leave the calculating state and show the formatted values

#### Scenario: Polling outlasts a long aggregation

- **WHEN** `getRunCosts` has returned payloads without figures for several minutes, short of
  `COST_FETCH_MAX_WAIT_MS`
- **THEN** the cost cards are still calculating and further attempts are still being made
- **AND** neither card has shown an em dash or the Error badge

#### Scenario: A run that can never have a cost settles to a dash instead of calculating forever

- **WHEN** `getRunCosts` has returned only figureless payloads for `COST_FETCH_MAX_WAIT_MS` since the
  first attempt
- **THEN** polling stops
- **AND** both cost cards show an em dash rather than the Calculating state
- **AND** neither card shows the Error badge

#### Scenario: Polling stops when the cards go away

- **WHEN** the Summary tab unmounts, or the run id changes, while costs are still calculating
- **THEN** no further `getRunCosts` attempts are made for the old run

### Requirement: A run that can have no cost is not polled

Even with `COST_FETCH_MAX_WAIT_MS` bounding the wait, a run that will never produce a figure should
not spend that whole window calculating when the Summary tab can already tell. The endpoint cannot
distinguish "still aggregating" from "there will never be one" from its payload alone, so the Summary
tab SHALL rule the case out from data it already holds and skip the fetch entirely. It SHALL do so
when, and only when, no usage row can exist:

- the run is in a transitional status (still running, or cancelling) — nothing is aggregated yet,
  and the sibling KPI cards already show a dash rather than a value;
- the structured-query slice reports no test-case results at all;
- the suite is an MCP-tool suite — cost aggregation does not support MCP-tool suites at all, so no
  usage row is ever produced regardless of whether the run computed metrics;
- the run's deployed model is confirmed to have no pricing configured (no Prompt and no Completion
  rate) — there is nothing for the backend to ever multiply usage by, so no usage row can price out
  to a figure. This is resolved from the model's own config (the same Catalog-then-Entities lookup
  the Summary tab already makes to link to the deployment), not from `/costs`, and only ever applies
  to a model deployment: an Application has no pricing of its own at the Admin level, so this check
  never rules an Application-based run out — consistent with such runs pricing out normally.

Each check SHALL evaluate to "costs are still possible" while the evidence for it is loading, so a
pending fetch is never mistaken for a zero. When the fetch is skipped, the cards SHALL show an em
dash and SHALL NOT show the Calculating copy. If the evidence later changes — a running run
completes, or the model-pricing check resolves to "no pricing" after the fetch already started on
the optimistic guess that costs were possible — the fetch SHALL start, respectively stop, to match.

#### Scenario: An in-progress run shows dashes instead of calculating

- **WHEN** the Summary tab renders a run whose status is RUNNING or CANCELLING
- **THEN** `getRunCosts` is not called
- **AND** both cost cards show an em dash rather than the spinner and Calculating label

#### Scenario: An MCP-tool run is never polled

- **WHEN** the run's suite snapshot is an MCP-tool suite
- **THEN** `getRunCosts` is not called, regardless of how many metrics the run computed
- **AND** both cost cards show an em dash

#### Scenario: A model confirmed to have no pricing is never polled

- **WHEN** the run's deployment resolves to a model whose config has neither a Prompt nor a
  Completion rate
- **THEN** `getRunCosts` either is not called, or is cancelled once the pricing check resolves if it
  had already started on the optimistic guess that costs were possible
- **AND** both cost cards settle to an em dash rather than the Calculating state

#### Scenario: A model confirmed to have pricing is still polled

- **WHEN** the run's deployment resolves to a model whose config has a Prompt or a Completion rate
- **THEN** `getRunCosts` is called as usual

#### Scenario: An Application deployment is never ruled out by the pricing check

- **WHEN** the run's deployment resolves to an Application rather than a Model
- **THEN** the pricing check never reports "no pricing" for it
- **AND** `getRunCosts` is called as usual, independent of the pricing check

### Requirement: Metric-Eval Cost settles independently of Test Case LLM Cost when there are no metrics

A run that computed zero metrics can never have a metric-eval cost — there is no metric-eval usage
for the backend to bill, independent of suite type or whether the deployed model has pricing. That
fact is known from the metric snapshots the Summary tab already fetches for its other sections, so
the Metric-Eval Cost card SHALL settle to an em dash as soon as the snapshot count is known to be
zero, without waiting on `/costs` and without sharing the Test Case LLM Cost card's Calculating
state for it. This SHALL NOT affect whether `/costs` itself is fetched: the Test Case LLM Cost card
can still resolve to a real figure for a no-metrics run, so the fetch proceeds as usual and that card
keeps its own Calculating/settled state unchanged. The Metric-Eval Cost card SHALL show this as a
plain em dash, never the Error badge — a run having no metrics is an expected shape, not a failure.
While the snapshot count is not yet known, the Metric-Eval Cost card SHALL behave exactly as it did
before this requirement (sharing the Test Case LLM Cost card's state), so a run that does have
metrics is never shown a premature dash.

#### Scenario: Zero metrics settles Metric-Eval Cost to a dash immediately

- **WHEN** the run's metric snapshot count is known to be zero
- **THEN** the Metric-Eval Cost card shows an em dash right away, regardless of whether `getRunCosts`
  has settled
- **AND** it shows neither the Calculating state nor the Error badge

#### Scenario: Test Case LLM Cost is unaffected by a zero metric count

- **WHEN** the run's metric snapshot count is known to be zero and `getRunCosts` has not yet settled
- **THEN** the Test Case LLM Cost card still shows its own Calculating state
- **AND** it later resolves to a dollar value or an em dash exactly as it would for any other run

#### Scenario: At least one metric keeps the two cards in lockstep

- **WHEN** the run's metric snapshot count is known to be at least one
- **THEN** the Metric-Eval Cost card shares the Test Case LLM Cost card's Calculating/settled state as
  it did before this requirement

#### Scenario: An unknown metric count never shows a premature dash

- **WHEN** the run's metric snapshot count has not yet loaded
- **THEN** the Metric-Eval Cost card shows the Calculating state rather than an em dash

### Requirement: Successful costs render dollar averages

When `getRunCosts` returns a payload, each cost card SHALL show the formatted dollar average (or an
em dash when that field is null) and the average-per-test-case description. A null field SHALL NOT
be treated as a card-level error.

#### Scenario: Dollar values on success

- **WHEN** `getRunCosts` returns non-null averages for both cost fields
- **THEN** each cost card shows the corresponding `$…` value and the average-per-test-case
  description
- **AND** neither cost card shows the Error badge or Calculating copy

#### Scenario: Null cost field uses an em dash

- **WHEN** `getRunCosts` returns a payload where one cost field is null and the other is a number
- **THEN** the null field’s card shows an em dash
- **AND** the numeric field’s card shows its `$…` value
- **AND** neither card shows the Error badge

The em dash belongs to this settled case only. A payload where *both* fields are null has not
settled the cards at all — see "A payload carrying no averages is not a result".

### Requirement: An endpoint error shows the Error badge

An endpoint error is the only thing that turns the cost cards to the Error state: `getRunCosts`
returning null, or throwing. When one occurs — on the first attempt or on any later poll — each cost
card SHALL show the kit Error badge, SHALL NOT show Calculating copy, and polling SHALL stop. Waiting
is never an error, however long it lasts.

#### Scenario: Null response shows Error without dropping other KPIs

- **WHEN** `getRunCosts` returns null after the structured-query slice has resolved
- **THEN** each cost card shows the Error badge
- **AND** the non-cost KPI cards remain visible with their values

#### Scenario: A settled run with no results errors alongside the strip

- **WHEN** a run in a settled status produced no test-case results
- **THEN** the cost cards show the Error badge, as the other KPI cards do for the same run
- **AND** the same run in an incomplete status shows an em dash on every card instead

#### Scenario: An error on a later poll settles the cards

- **WHEN** the cards have been calculating across one or more figureless payloads
- **AND** a later `getRunCosts` attempt returns null or throws
- **THEN** each cost card shows the Error badge and Calculating copy is no longer shown
- **AND** no further attempts are made

