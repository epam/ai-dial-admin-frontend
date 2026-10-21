## Purpose

Defines the dashboard's headline row of five KPI cards — what each one measures, how its
previous-period delta and sparkline read, and which of the view's requests each figure comes from,
including the rows the spend and token figures share and the principal the caller count is over.

## ADDED Requirements

### Requirement: Five KPI cards head the dashboard

The dashboard SHALL render a KPI row above the charts, carrying five cards in this order:
`Total spend`, `Requests`, `Tokens`, `Cost per 1M tokens`, `Unique callers`. Each card SHALL show a
title, its current value, a delta against the previous period when comparison is on, and a
sparkline over the current window. A card MAY carry a one-line caption beneath the value.

A card's value SHALL be abbreviated for reading (thousands, millions, billions), with money carrying
its currency marker: a card holds one figure in a fixed width, and that is what an abbreviation is
for.

Every figure read as part of a set SHALL be stated in full instead, with its thousands grouped —
`1,000,000`, not `1000000` and not `1.0M` — in one locale for the whole page. That covers the
breakdown's columns, the donut's legend and centre, the row panel, every plot's tooltip and its
axes. An abbreviation compares badly where the comparison is the point: `1.0M` against `1.2M` hides
the difference a reader came for. One locale, rather than the reader's own, keeps two widgets from
separating thousands differently side by side.

Where a column's rounding can hide what the change beside it measures — an error rate printing
`0.0%` that still rose by half again, a price rounded past its cents — the figure SHALL offer its
exact reading on hover, stating the counts it was derived from.

A card whose request failed SHALL render the existing no-data state rather than a zero, because zero
spend and unknown spend are different answers.

This row replaces the four single-value cards of the current Chat view and the three of the MCP
view. Each view SHALL render the KPI row with the cards its data supports.

#### Scenario: A card abbreviates and a column does not

- **GIVEN** a window of a million calls
- **WHEN** the KPI row renders
- **THEN** its card reads `1.0M`
- **WHEN** the breakdown renders a row of a million calls
- **THEN** that figure reads `1,000,000`

#### Scenario: A rounded figure offers its exact reading

- **GIVEN** a row whose error rate rounds to `0.0%` while its change reads a rise
- **WHEN** the reader hovers the figure
- **THEN** the exact rate is stated, with the failures and calls behind it

#### Scenario: KPI row renders five cards in order

- **WHEN** the Models view loads successfully
- **THEN** the KPI row shows `Total spend`, `Requests`, `Tokens`, `Cost per 1M tokens` and
  `Unique callers` in that order

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

### Requirement: Tokens are counted once per call, on the row that was priced for it

`Tokens` SHALL be the sum of prompt and completion tokens over the rows that carry a price of their
own. An application calling a model gets a row of its own carrying the tokens of the call it made,
so summing every row counts those tokens twice — once on the application and once on the model.
Spend does not double the same way: only the row that reached a model carries a price. The presence
of a price is therefore what separates a call from a record of a call, and the test SHALL be for a
price being present rather than for any particular amount.

The summation is expressed in the query, so no fold can disagree with the card about which rows
count, and `Cost per 1M tokens` divides two figures resting on one basis.

A model configured with no price loses its tokens from the total by the same rule. Measured on the
live dataset that is under a hundredth of a percent of them, against roughly two percent lost to
double counting, so the trade is taken knowingly.

An earlier draft guarded the sum with a non-empty upstream URI instead, reading a row without one as
an orchestrating application. Measured, that reading was wrong twice over: the column is empty on
whole adapters, so the guard dropped two fifths of all tokens — ordinary model calls holding about
half of all spend — while keeping the orchestrator rows it was meant to drop, which fill it.

`Cost per 1M tokens` SHALL divide `Total spend` by that token total, scaled to one million tokens.
A window whose token total is zero SHALL state no figure rather than a division result.

Because both figures are window sums rather than per-bucket ones, they SHALL be derived from
the consumption response, and their deltas from its previous-window measures.

#### Scenario: An application's row does not repeat its model's tokens

- **GIVEN** an application called a model for a thousand tokens
- **AND** the window therefore holds the application's row and the model's row
- **WHEN** the KPI row renders
- **THEN** `Tokens` counts that thousand once
- **AND** `Total spend` sums the price of the model's row, which the application's row does not carry

#### Scenario: Tokens and spend rest on one basis

- **WHEN** `Cost per 1M tokens` renders
- **THEN** the rows behind its numerator are the rows behind its denominator

#### Scenario: Multi-project rows for one deployment collapse first

- **GIVEN** the window contains three rows for the same deployment triplet under three different
  projects, carrying 0, 100 and 200 prompt tokens
- **WHEN** the `Tokens` card renders
- **THEN** it shows 300

#### Scenario: Zero tokens suppress the cost-per-token card

- **GIVEN** the window's token total is zero
- **WHEN** the `Cost per 1M tokens` card renders
- **THEN** it shows the no-data state
- **AND** it does not show a division result

#### Scenario: Large totals keep precision

- **GIVEN** the token total approaches the largest exactly representable integer
- **WHEN** the card renders
- **THEN** the displayed figure is the precise sum, accumulated without intermediate float drift

### Requirement: The caller count is over the principal, so key traffic is not one caller

The fifth card SHALL count distinct **principal references** over the window: the identity-provider
user id on a call authenticated by a token, and the project the key belongs to on a call
authenticated by an API key. Both branches of traffic are therefore counted, which is why the card
is named for callers rather than users.

It SHALL NOT count the anonymized user hash. That field is populated only on token calls and empty
on every key call, so a distinct count over it folds all key traffic into one bucket and reports it
as a single caller — measured on the live dataset, the overwhelming majority of rows counted as
one.

Two keys of the same project SHALL count once, because the log records no key identifier. The card
therefore answers "how many distinct principals called" and not "how many keys were used".

#### Scenario: Key traffic is not folded into a single caller

- **GIVEN** the window holds calls from two projects' API keys and from one user's token
- **WHEN** the card renders
- **THEN** it counts three callers

#### Scenario: Two keys of one project count once

- **GIVEN** every call in the window was made with one of two keys belonging to the same project
- **WHEN** the card renders
- **THEN** it counts one caller

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
