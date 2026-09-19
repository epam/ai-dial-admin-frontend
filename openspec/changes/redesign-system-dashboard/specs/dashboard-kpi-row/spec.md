## Purpose

Defines the dashboard's headline row of five KPI cards — what each one measures, how its
previous-period delta and sparkline read, and which of the view's requests each figure comes from,
including the token figures that must stay root-only to avoid double counting.

## ADDED Requirements

### Requirement: Five KPI cards head the dashboard

The dashboard SHALL render a KPI row above the charts, carrying five cards in this order:
`Total spend`, `Requests`, `Tokens`, `Cost per 1M tokens`, `Unique users`. Each card SHALL show a
title, its current value, a delta against the previous period when comparison is on, and a
sparkline over the current window. A card MAY carry a one-line caption beneath the value.

Values SHALL be abbreviated for reading (thousands, millions, billions) and money SHALL carry its
currency marker. A card whose request failed SHALL render the existing no-data state rather than a
zero, because zero spend and unknown spend are different answers.

This row replaces the four single-value cards of the current Chat view and the three of the MCP
view. Each view SHALL render the KPI row with the cards its data supports.

#### Scenario: KPI row renders five cards in order

- **WHEN** the Models view loads successfully
- **THEN** the KPI row shows `Total spend`, `Requests`, `Tokens`, `Cost per 1M tokens` and
  `Unique users` in that order

#### Scenario: A failed request shows no data rather than zero

- **GIVEN** the request feeding a card failed
- **WHEN** the card renders
- **THEN** it shows the no-data state
- **AND** it does not show `0`

#### Scenario: Cards carry no delta when comparison is off

- **GIVEN** comparison is off
- **WHEN** the KPI row renders
- **THEN** no card shows a delta
- **AND** every card still shows its sparkline

### Requirement: Token figures are summed over tree roots only

`Tokens` SHALL be the sum of prompt and completion tokens over the rows that **reached an
upstream**, not over every row in the window. An orchestrating application gets a row of its own
carrying the tokens of the model calls it made, so summing every row counts those twice — measured
on the live dataset, 5.1bn of 16.7bn prompt tokens are such repeats. A row that reached an upstream
is one whose upstream URI is non-empty; the guard is expressed in the query, so no fold can
disagree with the card about which rows count.

Spend needs no such guard: an orchestrator's row carries no price.

`Cost per 1M tokens` SHALL divide `Total spend` by that same token total, scaled to one million
tokens. A window whose token total is zero SHALL state no figure rather than a division result.

Because both figures are window sums rather than per-bucket ones, they SHALL be derived from
the consumption response, and their deltas from its previous-window measures.

#### Scenario: Orchestrator and child do not double count

- **GIVEN** the window contains a root deployment with 100 prompt and 50 completion tokens and a
  child of it with 80 prompt and 40 completion tokens
- **WHEN** the `Tokens` card renders
- **THEN** it shows 150
- **AND** the child's tokens are not added a second time

#### Scenario: Multi-project rows for one deployment collapse first

- **GIVEN** the window contains three rows for the same deployment triplet under three different
  projects, carrying 0, 100 and 200 prompt tokens
- **WHEN** the `Tokens` card renders
- **THEN** it shows 300

#### Scenario: Zero tokens suppress the cost-per-token card

- **GIVEN** the window's root-only token total is zero
- **WHEN** the `Cost per 1M tokens` card renders
- **THEN** it shows the no-data state
- **AND** it does not show a division result

#### Scenario: Large totals keep precision

- **GIVEN** the root-only token total approaches the largest exactly representable integer
- **WHEN** the card renders
- **THEN** the displayed figure is the precise sum, accumulated without intermediate float drift

### Requirement: A delta states direction, magnitude and the compared value

When comparison is on, a card's delta SHALL show the signed percentage change from the previous
window's value to the current one, and the card SHALL make the compared figure available — either in
its caption or on hover — so a percentage is never the only thing a reader can see.

Direction SHALL be conveyed by more than colour: the sign SHALL be rendered as text, and the colour
SHALL only reinforce it.

A delta SHALL be coloured by whether the change is the welcome one **for that metric**, which the
page declares per metric rather than inferring from the sign: spend, cost per token, error rate and
latency are better falling; requests, tokens, users and tool calls are read as better rising. A
metric with no declared direction SHALL render its delta without a judgement. Colour is therefore
never the only carrier of meaning, and a rise is not uniformly green.

A previous window whose value is zero while the current one is not SHALL render as a new-activity
marker rather than an infinite or 100% change. Both windows at zero SHALL render no delta.

#### Scenario: Delta shows sign as text

- **WHEN** a card's current value exceeds its previous value
- **THEN** the delta reads with an explicit `+` sign
- **AND** the direction is legible without relying on colour

#### Scenario: Colour follows the metric, not the sign

- **WHEN** spend rises and requests rise by the same proportion
- **THEN** the spend delta is coloured as unwelcome and the requests delta as welcome

#### Scenario: Previous value is available to the reader

- **WHEN** a delta is shown
- **THEN** the previous window's value is reachable from the card

#### Scenario: Growth from zero is not a percentage

- **GIVEN** the previous window's value is zero and the current one is not
- **WHEN** the card renders
- **THEN** the card marks this as new activity
- **AND** it shows neither an infinite change nor `+100%`

#### Scenario: Both windows empty show no delta

- **GIVEN** both windows' values are zero
- **WHEN** the card renders
- **THEN** no delta is shown

### Requirement: A sparkline plots the current window only

A card's sparkline SHALL plot the metric over the current window's time buckets, at the resolution
the page already picks for its time series. It SHALL NOT plot the previous window — the delta
carries that comparison — and SHALL NOT carry axes, gridlines or a legend.

A sparkline SHALL be omitted, leaving the value and delta in place, for a metric the bucketed
request cannot express per bucket. Empty buckets inside the window SHALL be plotted as zero rather
than skipped, so a gap in traffic reads as a gap.

#### Scenario: Sparkline follows the page resolution

- **WHEN** the period is long enough that the time series buckets by hour
- **THEN** each sparkline plots one point per hour of the current window

#### Scenario: Gaps in traffic are plotted as zero

- **GIVEN** the window contains buckets with no rows
- **WHEN** a sparkline renders
- **THEN** those buckets are plotted at zero
- **AND** the line does not join across them as if they were absent

#### Scenario: A metric without per-bucket meaning omits its sparkline

- **GIVEN** a card whose metric cannot be expressed per time bucket
- **WHEN** the card renders
- **THEN** the card shows its value and delta with no sparkline
