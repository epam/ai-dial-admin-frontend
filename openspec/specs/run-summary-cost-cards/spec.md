# run-summary-cost-cards Specification

## Purpose
Defines how Run Summary KPI cost cards (Test Case LLM Cost, Metric-Eval Cost) fetch independently
of other Summary analytics, present a calculating elapsed-time state while `getRunCosts` is in
flight, and surface success, failure, or a client-side soft timeout without blanking the rest of
the Summary KPI strip.
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

While `getRunCosts` is in flight and neither a result nor the client timeout has settled the cards,
each cost card SHALL show a spinner with the Calculating label as its value and a description of the
form `MM:SS elapsed · usually under 2 min`, where `MM:SS` is the wall-clock time since the fetch
started. The system SHALL NOT use `DialAnalyticsCard.isLoading` for this state, because that path
hides the description.

#### Scenario: Calculating copy while costs are pending

- **WHEN** the structured-query slice has resolved and `getRunCosts` has not yet settled
- **THEN** each cost card’s value area shows a spinner and the Calculating label
- **AND** each cost card’s description shows elapsed time in `MM:SS` plus the soft “usually under
  2 min” expectation

#### Scenario: Elapsed time ticks while pending

- **WHEN** fifteen seconds have elapsed since the costs fetch started and the fetch is still pending
- **THEN** the cost card description includes `00:15 elapsed`

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

### Requirement: Failure or three-minute timeout shows the Error badge

When `getRunCosts` returns null, throws, or has not settled after three minutes of client-side wait,
each cost card SHALL show the kit Error badge and SHALL NOT show Calculating copy. The three-minute
timeout SHALL NOT abort the in-flight server action; if a payload arrives after the timeout, the
cards SHALL replace the Error badge with the successful values.

#### Scenario: Null response shows Error without dropping other KPIs

- **WHEN** `getRunCosts` returns null after the structured-query slice has resolved
- **THEN** each cost card shows the Error badge
- **AND** the non-cost KPI cards remain visible with their values

#### Scenario: Three-minute soft timeout shows Error

- **WHEN** three minutes have elapsed since the costs fetch started and no result has arrived
- **THEN** each cost card shows the Error badge
- **AND** Calculating copy is no longer shown

#### Scenario: Late success after timeout replaces Error

- **WHEN** the three-minute timeout has already put the cost cards into the Error state
- **AND** `getRunCosts` later resolves with a successful payload
- **THEN** each cost card replaces the Error badge with the corresponding dollar (or em-dash) value

