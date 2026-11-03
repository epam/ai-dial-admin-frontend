# run-summary-cost-cards Specification

## Purpose
Defines how the Run Summary Total Run Cost card fetches the run's total cost independently of other
Summary analytics, presents a calculating state until the run totals endpoint produces real figures,
shows the source and metrics split with a per-part dash for an absent part, and surfaces success or
endpoint failure without blanking the rest of the Summary KPI strip.

## Requirements

### Requirement: A run that can have no cost is not polled

Even with `COST_FETCH_MAX_WAIT_MS` bounding the wait, a run that will never produce a figure should not
spend that whole window calculating when the Summary tab can already tell. The endpoint cannot distinguish
"still aggregating" from "there will never be one" from its payload alone, so the Summary tab SHALL rule the
case out from data it already holds and skip the fetch entirely. It SHALL do so when, and only when, no usage
row can exist:

- the run is in a transitional status (still running, or cancelling) — nothing is aggregated yet, and the
  sibling KPI cards already show a dash rather than a value;
- the suite is an MCP-tool or Route suite — cost aggregation does not support those suite types at all, so
  no usage row is ever produced regardless of whether the run computed metrics;
- the run's deployed model is confirmed to have no pricing configured (no Prompt and no Completion rate) —
  there is nothing for the backend to ever multiply usage by. This is resolved from the model's own config
  (the same Catalog-then-Entities lookup the Summary tab already makes to link to the deployment), not from
  the cost endpoint, and only ever applies to a model deployment: an Application has no pricing of its own at
  the Admin level, so this check never rules an Application-based run out.

The Summary tab SHALL NOT skip the cost request because the structured-query slice lacks runtime figures.
CANCELLED ("Stopped") and FAILED runs commonly have priced usage without those figures; gating the fetch on
that signal wiped a successful response when the slice resolved later.

A run that completed `COST_AGGREGATION_STALE_AFTER_MS` (12 hours) or more ago SHALL NOT be waited on:
aggregation is long finished, so the Summary tab SHALL read the totals exactly once and settle on the result
— a real figure if there is one, otherwise an em dash with no Calculating copy and no polling.

Each check SHALL evaluate to "costs are still possible" while the evidence for it is loading, so a pending
fetch is never mistaken for a zero. When the fetch is skipped, the card SHALL show a single em dash with no
source or metrics lines and SHALL NOT show the Calculating copy. If the evidence later changes — a running run
completes, or the model-pricing check resolves to "no pricing" after the fetch already started on the
optimistic guess — the fetch SHALL start, respectively stop, to match. The same rules apply to each run on the
Run Comparison Summary.

#### Scenario: An in-progress run shows dashes instead of calculating
- **WHEN** the Summary tab renders a run whose status is RUNNING or CANCELLING
- **THEN** the run totals request is not made
- **AND** the Total Run Cost card shows an em dash rather than the Calculating label

#### Scenario: An MCP-tool or Route run is never polled
- **WHEN** the run's suite snapshot is an MCP-tool or Route suite
- **THEN** the run totals request is not made, regardless of how many metrics the run computed
- **AND** the card shows an em dash

#### Scenario: A run completed over 12 hours ago is read once, not polled
- **WHEN** the Summary tab renders a run that completed more than 12 hours ago and the endpoint returns no
  figures
- **THEN** the request is made once and not retried
- **AND** the card shows an em dash rather than the Calculating label

#### Scenario: A model confirmed to have no pricing is never polled
- **WHEN** the run's deployment resolves to a model whose config has neither a Prompt nor a Completion rate
- **THEN** the request either is not made, or is cancelled once the pricing check resolves if it had already
  started on the optimistic guess
- **AND** the card settles to an em dash rather than the Calculating state

#### Scenario: A model confirmed to have pricing is still polled
- **WHEN** the run's deployment resolves to a model whose config has a Prompt or a Completion rate
- **THEN** the request is made as usual

#### Scenario: An Application deployment is never ruled out by the pricing check
- **WHEN** the run's deployment resolves to an Application rather than a Model
- **THEN** the pricing check never reports "no pricing" for it
- **AND** the request is made as usual, independent of the pricing check

### Requirement: An endpoint error shows the Error badge

An endpoint error is the only thing that turns the Total Run Cost card to the Error state: the run totals
request returning null, or throwing. When one occurs — on the first attempt or on any later poll — the card
SHALL show the kit Error badge in place of the value, SHALL NOT show Calculating copy or the breakdown, and
polling SHALL stop. Waiting is never an error, however long it lasts.

#### Scenario: Null response shows Error without dropping other KPIs
- **WHEN** the run totals request returns null after the structured-query slice has resolved
- **THEN** the Total Run Cost card shows the Error badge
- **AND** the non-cost KPI cards remain visible with their values

#### Scenario: A completed run with no results errors alongside the strip
- **WHEN** a COMPLETED run produced no test-case results and the endpoint also has no figures
- **THEN** the Total Run Cost card shows the Error badge, as the other KPI cards do for the same run
- **AND** the same run in an incomplete status (PENDING, RUNNING, CANCELLING, CANCELLED, FAILED) shows an em
  dash on every card instead of the Error badge

#### Scenario: Cancelled or failed runs keep cost figures without eval_summaries averages
- **WHEN** a CANCELLED or FAILED run has no runtime figures from the structured-query slice
- **AND** the run totals request returns at least one numeric figure
- **THEN** the card shows the formatted dollar values
- **AND** it shows neither the Error badge nor an em dash in place of those values

#### Scenario: An error on a later poll settles the cards
- **WHEN** the card has been calculating across one or more figureless payloads
- **AND** a later attempt returns null or throws
- **THEN** the card shows the Error badge and Calculating copy is no longer shown
- **AND** no further attempts are made

### Requirement: Total Run Cost card is always shown beside other Summary KPIs

The Run Summary analytics strip SHALL render one **Total Run Cost** card whenever the other KPI cards
render. The system SHALL NOT gate it behind a feature flag. Cost fetch failures or delays SHALL NOT remove
or blank the non-cost KPI cards. The card SHALL show the run's total cost (`$…`) as its value and, below it,
`<Source type>: <cost>` and `Metrics: <cost>`, where `<Source type>` is the evaluated entity's kind (Model,
Application, MCP or Route, falling back to "Source").

#### Scenario: Cost card renders with other KPIs
- **WHEN** the Run Summary analytics strip has resolved its structured-query slice
- **THEN** the Total Run Cost card is present alongside the other KPI cards

#### Scenario: Slow costs leave other KPIs available
- **WHEN** the run totals request is still in flight after the structured-query slice has resolved
- **THEN** the non-cost KPI cards still show their resolved values
- **AND** the Total Run Cost card shows its calculating state rather than being hidden

#### Scenario: Total and breakdown
- **WHEN** the run's source cost is $0.42 and its metrics cost is $0.08
- **THEN** the card shows `$0.5`, `Model: $0.42` and `Metrics: $0.08` for a model run

### Requirement: Total Run Cost shows a dash for an absent part

When a settled payload carries a figure for one part but not the other, only the missing part's value SHALL
be an em dash; the total SHALL be the present part alone and the card SHALL NOT show the Error badge or the
calculating state. This SHALL include a run that computed zero metrics, whose metrics cost can never exist:
for such a run the Metrics value SHALL settle to an em dash as soon as the metric snapshot count is known to
be zero, without waiting on the cost request, while the rest of the card keeps its own calculating or
settled state. While the metric snapshot count is not yet known the Metrics value SHALL follow the card's
state, so a run that does have metrics is never shown a premature dash.

#### Scenario: Only the metrics cost is absent
- **WHEN** the run totals payload has a source cost of $0.42 and no metrics cost
- **THEN** the total shows `$0.42`, the source value shows `$0.42` and the Metrics value shows an em dash
- **AND** the card shows no Error badge

#### Scenario: Zero metrics settles the Metrics value immediately
- **WHEN** the run's metric snapshot count is known to be zero and the cost request has not settled
- **THEN** the Metrics value shows an em dash
- **AND** the total and the source value still show the calculating state

#### Scenario: Unknown metric count never shows a premature dash
- **WHEN** the run's metric snapshot count has not yet loaded
- **THEN** the Metrics value follows the card's calculating state rather than showing an em dash

### Requirement: Calculating state shows an expectation until settle

Until the run totals request has settled the Total Run Cost card, its value area SHALL show the Calculating
label, and its breakdown area SHALL show the soft expectation copy ("Usually under 10 min") in place of the
Source type and Metrics values. The system SHALL NOT use `AnalyticsCard.isLoading` for this state, because
that path hides the description.

#### Scenario: Calculating copy while costs are pending
- **WHEN** the structured-query slice has resolved and the run totals request has not yet settled
- **THEN** the Total Run Cost card's value area shows the Calculating label
- **AND** the breakdown area shows the expectation copy instead of cost values

### Requirement: A payload carrying no figures is not a result

The costs endpoint answers as soon as the run row exists, but the backend aggregates usage logs
asynchronously, so a just-finished run gets a payload back within milliseconds that carries no figures at
all — null totals, an empty list, an empty object, or an empty body. A payload SHALL only settle the card
when at least one of the source cost / metrics cost is a finite number; zero counts as a figure. While no
such payload has arrived, the card SHALL remain in the calculating state and SHALL NOT fall back to an em
dash, and the system SHALL retry the request on a fixed interval until a figure arrives, the endpoint
reports an error, or `COST_FETCH_MAX_WAIT_MS` elapses since the first attempt. A long aggregation is slow,
not broken, and an Error badge over data still on its way would be wrong — but the endpoint itself cannot
distinguish a slow aggregation from a run that will never produce a figure, so for whatever case "A run that
can have no cost is not polled" has not already ruled out from known data, the wait still needs a backstop
rather than running forever. Polling SHALL stop when the card unmounts or the run id changes.

#### Scenario: Not-yet-aggregated payload keeps the calculating state
- **WHEN** the run totals request resolves with a payload whose figures are all absent or null
- **THEN** the card still shows the Calculating label and the expectation copy
- **AND** it shows neither an em dash nor the Error badge

#### Scenario: Retry picks up the figures once the backend has them
- **WHEN** a not-yet-aggregated payload has kept the card calculating
- **AND** a later retry resolves with at least one numeric figure
- **THEN** the card leaves the calculating state and shows the formatted values

#### Scenario: Polling outlasts a long aggregation
- **WHEN** the endpoint has returned payloads without figures for several minutes, short of
  `COST_FETCH_MAX_WAIT_MS`
- **THEN** the card is still calculating and further attempts are still being made

#### Scenario: A run that can never have a cost settles to a dash instead of calculating forever
- **WHEN** the endpoint has returned only figureless payloads for `COST_FETCH_MAX_WAIT_MS` since the first
  attempt
- **THEN** polling stops
- **AND** the card shows a single em dash, with no source or metrics lines, rather than the Calculating
  state, and no Error badge

#### Scenario: Polling stops when the card goes away
- **WHEN** the Summary tab unmounts, or the run id changes, while costs are still calculating
- **THEN** no further attempts are made for the old run

### Requirement: Successful costs render dollar totals

When the run totals request returns a payload with figures, the Total Run Cost card SHALL show the formatted
dollar total and, beneath it, the formatted source cost and metrics cost. A null part SHALL show an em dash
(see "Total Run Cost shows a dash for an absent part") and SHALL NOT be treated as a card-level error.

#### Scenario: Dollar values on success
- **WHEN** the endpoint returns figures for both the source and metrics parts
- **THEN** the card shows the `$…` total and both `$…` part values
- **AND** it shows neither the Error badge nor the Calculating copy

#### Scenario: No cost at all is one dash
- **WHEN** the card has settled and neither the source nor the metrics cost has a figure
- **THEN** the card shows a single em dash
- **AND** it shows no `<Source type>` or Metrics lines

#### Scenario: Zero is a real value
- **WHEN** the endpoint returns 0 for both parts
- **THEN** the card shows `$0`, `<Source type>: $0` and `Metrics: $0`
