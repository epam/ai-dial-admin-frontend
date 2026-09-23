# Analytics Dashboards

## Purpose

The Dashboards page of the Analytics group, read from the usage log through the structured-query
endpoint: how the page is reached at runtime and what it shares with the existing telemetry
dashboard, how many requests it issues and what each one answers, the page-wide `Compare` control,
the KPI row, the activity heatmap, the share donut, and the tabbed breakdown table with its dialog
and row panel.

## Requirements

### Requirement: An environment flag decides which page Dashboards renders

The system SHALL expose an environment variable that, when truthy per the existing flag helper and
combined with the Analytics group's own flag, is surfaced on the runtime feature-flags object. The
flag SHALL be read where the other feature flags are initialized and SHALL be added to the
feature-flags model alongside them, so no surface learns about it through a separate mechanism. It
SHALL be declared in the environment template as a commented entry.

The `/dashboards` route SHALL render:

| Configuration | `/dashboards` renders |
| --- | --- |
| both flags truthy | the analytics page, or the forbidden page for a user without analytics access |
| either flag falsy, admin API configured, dashboard not disabled | the existing telemetry dashboard, with its own controls and its refresh-interval selector |
| otherwise | not found |

The usage flag without the analytics flag is a misconfiguration: it SHALL serve no analytics at all,
exactly as if the usage flag were off. "Dashboard not disabled" is the existing dashboard flag,
which `DISABLE_MENU_ITEMS` containing `dashboard` switches off.

The route and the menu SHALL decide from the same inputs, so a reachable item never leads to a
missing page and a reachable page is never absent from the menu. The one exception is the
`dashboard` token of `DISABLE_MENU_ITEMS` while the analytics page is on: it hides the item and
leaves the page reachable by URL, as the token does for every other menu item.

#### Scenario: Both flags on render the analytics page

- **GIVEN** the analytics flag and the usage flag both resolve truthy
- **WHEN** the user opens `/dashboards`
- **THEN** the analytics page renders

#### Scenario: The usage flag off falls back to the telemetry dashboard

- **GIVEN** the usage flag is unset and the admin API is configured
- **WHEN** the user opens `/dashboards`
- **THEN** the existing telemetry dashboard renders, with its refresh-interval selector

#### Scenario: The analytics flag off falls back too

- **GIVEN** the usage flag resolves truthy but the analytics flag does not, and the admin API is
  configured
- **WHEN** the user opens `/dashboards`
- **THEN** the existing telemetry dashboard renders

#### Scenario: A disabled telemetry dashboard is not served

- **GIVEN** either flag is falsy, the admin API is configured, and `DISABLE_MENU_ITEMS` contains
  `dashboard`
- **WHEN** the user opens `/dashboards`
- **THEN** the route answers as not found

#### Scenario: Neither page can render

- **GIVEN** either flag is falsy and the admin API is not configured
- **WHEN** the user opens `/dashboards`
- **THEN** the route answers as not found

#### Scenario: Flag is falsy for the usual falsy spellings

- **GIVEN** the variable is set to `false`, an empty string, `0`, or any value the flag helper
  treats as falsy
- **WHEN** the feature flags are initialized
- **THEN** the flag is false and `/dashboards` does not render the analytics page

#### Scenario: Access control still applies behind the flag

- **GIVEN** both flags resolve truthy
- **WHEN** a user without analytics access opens `/dashboards`
- **THEN** the forbidden page renders rather than either dashboard

### Requirement: The sidebar offers exactly one Dashboards item

The sidebar SHALL offer at most one item named `Dashboards`, pointing at `/dashboards`, placed by
the configuration:

| Configuration | Item |
| --- | --- |
| both flags truthy | first item of the Analytics group |
| either flag falsy, admin API configured, dashboard not disabled | in the Audit group, where the telemetry dashboard's item stood |
| otherwise | absent |

The Analytics group SHALL NOT be shown only to host the item: while its own flag is off it stays
hidden, and the item lives in the Audit group.

The item SHALL answer to the `dashboard` token of `DISABLE_MENU_ITEMS` in either group, as the
telemetry dashboard's item did.

#### Scenario: Analytics on puts the item first in Analytics

- **GIVEN** both flags resolve truthy and the admin API is configured
- **WHEN** the sidebar menu renders
- **THEN** the Analytics group's first item is `Dashboards`
- **AND** the Audit group offers no `Dashboards` item

#### Scenario: Analytics off keeps the item in Audit

- **GIVEN** the usage flag is unset and the admin API is configured
- **WHEN** the sidebar menu renders
- **THEN** the Audit group offers a `Dashboards` item
- **AND** no other group offers one

#### Scenario: The usage flag without Analytics is treated as off

- **GIVEN** the usage flag resolves truthy, the analytics flag does not, and the admin API is
  configured
- **WHEN** the sidebar menu renders
- **THEN** the Audit group offers a `Dashboards` item
- **AND** no Analytics group is shown

#### Scenario: Analytics on without the admin API

- **GIVEN** both flags resolve truthy and the admin API is not configured
- **WHEN** the sidebar menu renders
- **THEN** the Analytics group's first item is `Dashboards`

#### Scenario: The disable token hides the item wherever it is

- **GIVEN** `DISABLE_MENU_ITEMS` contains `dashboard`
- **WHEN** the sidebar menu renders, with the analytics flags on or off
- **THEN** no group offers a `Dashboards` item

### Requirement: The old paths redirect to Dashboards

Opening `/dashboard` or `/usage` SHALL redirect to `/dashboards`, whatever the configuration, so a
bookmark or a link to either old page lands on the page the configuration admits.

#### Scenario: The telemetry dashboard's old path redirects

- **WHEN** the user opens `/dashboard`
- **THEN** the browser lands on `/dashboards`

#### Scenario: The usage page's old path redirects

- **WHEN** the user opens `/usage`
- **THEN** the browser lands on `/dashboards`

### Requirement: The entity Audit tab keeps the telemetry dashboard

Every entity's Audit tab SHALL keep rendering the existing telemetry dashboard, with its own
controls and its refresh-interval selector, whatever the analytics flags' values. The unified route
decides only what the standalone page shows.

#### Scenario: Entity Audit tab is unaffected by the flags

- **GIVEN** both flags resolve truthy
- **WHEN** the user opens an entity's Audit tab
- **THEN** the existing telemetry dashboard renders

### Requirement: The analytics page is headed Dashboards and offers no telemetry help

While `/dashboards` serves the analytics page, the page SHALL be headed `Dashboards`, the same name
as its menu item, and the header's help control SHALL offer no documentation link: the only link
keyed by the route documents the telemetry dashboard. While the route serves the telemetry
dashboard, the help control SHALL keep offering that link.

#### Scenario: The analytics page names itself after the section

- **GIVEN** both flags resolve truthy
- **WHEN** the user opens `/dashboards`
- **THEN** the page heading reads `Dashboards`

#### Scenario: No telemetry help over the analytics page

- **GIVEN** both flags resolve truthy
- **WHEN** the user opens `/dashboards`
- **THEN** the header offers no help link

#### Scenario: Telemetry help stays with the telemetry dashboard

- **GIVEN** either flag is falsy and `/dashboards` serves the telemetry dashboard
- **WHEN** the user opens `/dashboards`
- **THEN** the header's help link opens the telemetry dashboard documentation

### Requirement: The two pages share no mutable state

The usage page SHALL NOT read or write any browser-stored preference, query constant, context value
or component that the existing dashboard owns.

Shared code SHALL be limited to what neither page needs to change: the structured-query server
action, the domain-free presentational components, the time-filter hook, and the design system. A
change required to make one of those fit the usage page SHALL be made so that the existing
dashboard's behaviour is unchanged by construction — in the usage page's own wrapper where a
wrapper can express it, and otherwise behind a parameter whose default is the existing behaviour.

#### Scenario: A shared component keeps its behaviour for its existing callers

- **GIVEN** a shared presentational component the usage page also renders
- **WHEN** an existing caller renders it without naming the new parameter
- **THEN** it renders exactly as it did before the usage page existed

#### Scenario: The telemetry dashboard depends on nothing in the usage page's module

- **GIVEN** the telemetry dashboard's modules
- **WHEN** their imports are followed
- **THEN** none reaches the usage page's own module; only the route that chooses between the two
  pages imports both

### Requirement: A view issues one request per data shape, per window

A view SHALL obtain everything it renders from these shapes, each covering exactly one window:

1. a **totals** request grouped by nothing, feeding the KPI figures and the window total that every
   share on the page is normalized against;
2. a **bucketed** request grouped by a time bucket, feeding the time series, the KPI sparklines and
   the latency percentiles;
3. a **leading-dimension** request grouped by the view's first breakdown dimension, feeding the
   share chart and naming the series the split plot draws;
4. a **tab** request grouped by the active breakdown tab's dimension, ordered and limited
   server-side, feeding the breakdown table;
5. a **split-series** request grouped by time bucket and the leading dimension, issued only while
   the split plot is the one showing;
6. a **spend** request bucketed over the page's own window at a bin of its own, issued only while
   the spend plot is the one showing;
7. a **heatmap** request bucketed hourly over the heatmap's own week, independent of the page
   period;
8. a **dialog block** request, the tab shape asked for one page of rows at an offset, issued only
   while the full-list dialog is open and once per block the reader scrolls to, with a second
   request per block naming that block's dimension values in the previous window.

Shapes 1, 2 and 4 SHALL be issued once per window, so comparison adds one request each. The others
SHALL be issued once regardless of comparison, except shape 8, whose comparison request is per
block rather than per window.

The spend request SHALL read the page's window like every other plot. It differs only in its bin:
the page's resolution targets up to 200 points, which reads as a line and not as a row of bars, so
spend takes the smallest recognizable step that cuts the window into roughly a dozen and a half
bars. An earlier draft read spend on a calendar scale of its own — the last 14 days, or 12 months
for a longer window — which answered a question the page was not asking and disagreed with every
other figure on it.

Totals is a shape of its own because distinct users cannot be summed out of the bucketed response:
a user active in several buckets is one user, and no fold over per-bucket counts can know that.

Shapes 5 and 6 SHALL NOT be issued until their plot is selected, and the share chart's request
SHALL NOT be re-issued when the breakdown tab changes, so reading the table below does not reload
the ring above it.

Requests SHALL be issued in parallel, and a widget SHALL render as soon as the request it depends
on resolves rather than waiting for the others. No widget SHALL issue a request of its own; a
widget receives rows as input.

#### Scenario: A view reads each window exactly once on load

- **GIVEN** comparison is on and the requests plot is the one showing
- **WHEN** the view loads
- **THEN** eight requests are issued: totals, bucketed and tab rows for each of the two windows,
  the leading dimension, and the heatmap's week
- **AND** no shape is requested twice for the same window

#### Scenario: Comparison off drops the second window's requests

- **GIVEN** comparison is off
- **WHEN** the view loads
- **THEN** the totals, bucketed and tab shapes are each requested once

#### Scenario: Switching tab re-issues only the tab request

- **GIVEN** the view has loaded
- **WHEN** the user selects another breakdown tab
- **THEN** the tab shape is re-issued
- **AND** the totals, bucketed, leading-dimension and heatmap responses are reused

#### Scenario: A conditional plot is not paid for until it is chosen

- **GIVEN** the requests plot is the one showing
- **WHEN** the view loads
- **THEN** no split-series and no spend-periods request is issued
- **AND** selecting the split plot issues the split-series request

#### Scenario: Switching view re-issues every shape

- **WHEN** the user switches `View by` from LLM to MCP
- **THEN** the shapes are re-issued against the MCP view's event kinds and dimensions
- **AND** the number of requests does not grow with the number of widgets shown

#### Scenario: A resolved request renders its widgets without waiting for the others

- **GIVEN** the bucketed request resolves before the tab request
- **WHEN** it resolves
- **THEN** the time series renders
- **AND** the breakdown table remains in its loading state

### Requirement: Every bucketed request states its row limit

A request that groups by a time bucket SHALL state a row limit explicitly. The service applies a
default limit when a query states none and truncates the response silently — the response carries
no marker for it — so an unstated limit turns a long window, or a split with several series, into a
chart that ends early without saying so.

#### Scenario: A long window is not cut without a word

- **GIVEN** a window whose bucket count exceeds the service's default limit
- **WHEN** the bucketed request resolves
- **THEN** the response covers the whole window
- **AND** the chart's last bucket is the window's last bucket

### Requirement: A failure is stated once, in a notification, and leaves its widget empty

When one request fails, the widgets fed by the others SHALL still render their data. The failure
SHALL be stated in a notification carrying what the service said, and the widget the failed request
feeds SHALL render its empty state rather than the message.

The notification SHALL be raised once per distinct message for the life of a load, not once per
request: the page issues up to nine of them across two hooks, and a backend that is down fails all
of them the same way. A new load SHALL clear what was already stated, so the same failure is worth
saying again.

A widget SHALL NOT print the message itself. Seven cards each reading "Load failed" says one thing
seven times, and an empty state is what the widget has to show either way — a window that reported
nothing and a window that could not be read look the same on the page, and the notification is what
tells them apart.

A rejected request SHALL be handled as a failure rather than left unhandled, so no widget is left
in its loading state indefinitely.

#### Scenario: Tab request fails, bucketed widgets still render

- **GIVEN** the tab request fails and the bucketed request succeeds
- **WHEN** the page settles
- **THEN** the time series renders its data
- **AND** the breakdown table renders its empty state

#### Scenario: One outage is one notification

- **GIVEN** every request fails with the same message
- **WHEN** the page settles
- **THEN** exactly one notification is raised
- **AND** it carries that message
- **AND** no widget prints it

#### Scenario: A rejected request settles its widget

- **GIVEN** a request rejects rather than returning a failure
- **WHEN** the page settles
- **THEN** the widget it feeds leaves its loading state

### Requirement: The page does not poll and refreshes on request

This page SHALL NOT poll. Its controls bar SHALL offer no refresh-interval option, and no widget
SHALL hold a timer that re-issues its data. The controls bar SHALL instead offer a `Refresh`
control that re-issues every request once per activation, disabled while any of them is in flight.

Two reasons. An interval a reader cannot see the effect of changes the figures under them without
saying so, and a comparison makes that worse because both windows slide at once. And the dataset is
minutes behind live by construction, so an interval shorter than that lag re-reads the same rows.

This says nothing about the existing dashboard, which keeps its interval selector — see the
gating requirements above.

For a preset period, a manual refresh SHALL recompute the time range from the current time, so
`Last 2d` after a refresh means the two days ending now. For a custom range, the fixed dates SHALL
be reused unchanged.

#### Scenario: No interval selector is offered

- **WHEN** the user opens the usage page
- **THEN** the controls bar offers no refresh-interval option
- **AND** the page issues no further requests until the user acts

#### Scenario: Refresh re-issues the requests once

- **WHEN** the user activates `Refresh`
- **THEN** every request is issued exactly once
- **AND** the control is disabled until they all settle

#### Scenario: Refresh slides a preset window

- **GIVEN** the period is a preset and time has passed since the page loaded
- **WHEN** the user activates `Refresh`
- **THEN** the requested range is recomputed from the current time

#### Scenario: Refresh keeps a custom range fixed

- **GIVEN** a custom date range is selected
- **WHEN** the user activates `Refresh`
- **THEN** the original start and end dates are requested again unchanged

### Requirement: A plot's tooltip names the period its bucket covers

Every bucketed plot — the calls line, the split plot, the latency percentiles and the spend bars —
SHALL head its tooltip with the period the hovered bucket covers, from its start to the start of the
next one, which is the bound the query itself used. The axis SHALL keep naming only the start, since
it has one line per tick.

A bucket's own timestamp names only where it begins, so a tooltip stating it alone left the reader to
work out how much traffic the figure covered — an hour's worth or a week's. A step of a day or more
SHALL state no clock, and a shorter one SHALL name the day once unless the period crosses midnight.

A series' colour SHALL be stated on the series itself, not only on the line it paints: the tooltip's
marker and the legend read the series, so a colour given to `lineStyle` alone left them on the
charting library's own palette and disagreeing with the plot.

A latency line SHALL break where a bucket has no percentile to state. A bucket with no calls has no
response time, and joining across it drew a flat line through hours the platform was idle — a
reading the window never took. Such a line SHALL also go unsampled: a sampler drops points to fit
the pixels, gaps included, and bridges them again. A calls or spend plot needs neither, because an
empty bucket there is a real zero.

#### Scenario: A latency line breaks over an idle stretch

- **GIVEN** a window whose middle buckets recorded no calls
- **WHEN** the latency plot renders
- **THEN** the lines break over those buckets rather than joining across them

#### Scenario: A tooltip marker matches its line

- **GIVEN** a plot of more than one series
- **WHEN** the reader hovers it
- **THEN** each marker in the tooltip carries the colour of the line it names

#### Scenario: The tooltip states both ends of the bucket

- **GIVEN** a plot bucketed at two hours
- **WHEN** the reader hovers a bucket
- **THEN** the tooltip heads with that bucket's start and the start of the next one

#### Scenario: A daily bucket states no clock

- **GIVEN** a plot bucketed at a day or more
- **WHEN** the reader hovers a bucket
- **THEN** the period is stated as dates alone

### Requirement: Compare control sits beside the period selector and governs the whole page

The controls bar SHALL render a `Compare` selector after the period selector, offering
`Previous period` and an off option. The selection SHALL apply to every widget on the page that can
express a change over time — the KPI cards and the breakdown table's delta column — rather than to
one widget. The selection SHALL NOT affect the URL, and SHALL survive switching the `View by`
option so a reader who moves between views keeps the comparison they asked for.

`Previous period` SHALL be the default. A figure without a comparison answers "how much" and not
"more or less than before", which is the question this page exists to answer; a reader who does not
want the comparison turns it off.

#### Scenario: Comparison is on by default

- **WHEN** the user opens the usage page
- **THEN** the `Compare` selector reads `Previous period`
- **AND** each KPI card renders a delta against the previous window
- **AND** the breakdown table renders its delta column

#### Scenario: Turning comparison off drops every comparison at once

- **WHEN** the user selects the off option
- **THEN** no KPI card renders a delta
- **AND** the breakdown table renders no delta column

#### Scenario: Comparison survives a view switch

- **GIVEN** comparison is set to `Previous period` in the LLM view
- **WHEN** the user switches `View by` to MCP
- **THEN** comparison is still `Previous period`

### Requirement: The previous window is the same span immediately before the current one

For a preset period, the previous window SHALL be the same span ending where the current window
begins — `Last 2d` compares against the two days before those two days. For a custom range, the
previous window SHALL be the same duration ending at the custom range's start. The previous window
SHALL be derived from the current window when the window is taken, not stored, so a preset's
sliding window and its comparison always share an edge.

The window SHALL be taken once per change to the inputs that define it — the period, the custom
range, and the manual refresh — and SHALL NOT be re-taken during rendering, so a preset window
computed from the clock does not produce a new range on every pass.

#### Scenario: Preset period compares against the adjacent span

- **GIVEN** the period is `Last 2d`
- **WHEN** the page requests data with comparison on
- **THEN** the current window covers the last two days
- **AND** the previous window covers the two days ending where the current window begins

#### Scenario: Custom range compares against the same duration before it

- **GIVEN** a custom range spanning four days
- **WHEN** the page requests data with comparison on
- **THEN** the previous window spans four days and ends at the custom range's start

#### Scenario: A window is taken once per input change

- **GIVEN** the page has loaded
- **WHEN** nothing about the period changes
- **THEN** no widget re-issues its request

### Requirement: Each window is a request of its own

The query grammar carries no comparison in expression position, so one aggregate cannot split its
own rows into two windows. A widget group that compares SHALL therefore issue one request per
window and pair the responses on the client, rather than widening a single request to the union of
the two.

Turning comparison on SHALL add exactly one request per comparing shape, and SHALL leave every
non-comparing shape — the share chart's ranking, the heatmap's week, the split series, the spend
periods — at one request.

#### Scenario: Enabling comparison adds one request per comparing shape

- **GIVEN** the page has loaded with comparison off
- **WHEN** the user turns comparison on
- **THEN** the totals, the bucketed series and the breakdown rows are each requested a second time
- **AND** each of those requests covers exactly one of the two windows

#### Scenario: A row is attributed to exactly one window

- **WHEN** the two responses are paired into current and previous figures
- **THEN** every row contributes to exactly one of the two windows
- **AND** no row on the boundary is counted in both

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

### Requirement: The heatmap paints the figure the reader picks

The heatmap SHALL offer a switch between the figures it can paint per hour — requests and cost —
placed with the week pager, since both decide what the grid shows: one which week, the other which
figure.

Both figures SHALL be read from the heatmap's own hourly response rather than a second request, so
switching paints what is already in hand. The shading ceiling SHALL follow the active figure: an
hour's cost has nothing to do with the busiest hour's call count.

Cost SHALL be offered in the LLM view only. An MCP row carries no price, so the grid there would be
a week of empty cells. An hour with no price SHALL read as nothing rather than as its call count.

A cell SHALL state the active figure in its own words — a count of requests, or an amount spent —
in both its tooltip and the label a screen reader reads.

#### Scenario: Switching the figure repaints the grid

- **GIVEN** the LLM view's heatmap on requests
- **WHEN** the reader switches to cost
- **THEN** the cells shade by the cost of each hour
- **AND** no further request is issued

#### Scenario: The MCP view offers no cost

- **WHEN** the MCP view's heatmap renders
- **THEN** it offers requests alone

#### Scenario: A cell names the figure it carries

- **GIVEN** the grid is painting cost
- **WHEN** the reader hovers an hour
- **THEN** the tooltip states that hour and the amount, with no word between them

### Requirement: The heatmap is a day-by-hour grid over the current window

The dashboard SHALL render a heatmap whose rows are days and whose columns are the 24 hours of a
day, each cell carrying the call count for that hour of that day within the current window. Cells
SHALL be read from the bucketed request, restricted to the current window; the previous window SHALL
NOT be plotted.

The hour axis SHALL state the timezone it is drawn in, because an hour-of-day reading is meaningless
without one. A window shorter than one day SHALL still render, showing the hours it covers.

A window whose span exceeds what the grid can show legibly SHALL render the most recent days that
fit and state that it is truncated, rather than compressing every day into an unreadable row.

#### Scenario: Seven-day window renders seven day rows

- **GIVEN** the period covers seven days
- **WHEN** the heatmap renders
- **THEN** it shows seven day rows and 24 hour columns
- **AND** the hour axis states its timezone

#### Scenario: Sub-day window renders the hours it covers

- **GIVEN** the period covers six hours
- **WHEN** the heatmap renders
- **THEN** it renders the covered hours rather than an empty grid

#### Scenario: Over-long window is truncated with a statement

- **GIVEN** the period covers more days than the grid can render legibly
- **WHEN** the heatmap renders
- **THEN** it shows the most recent days that fit
- **AND** it states that earlier days are not shown

### Requirement: Intensity is relative to the window and readable without colour alone

Cell intensity SHALL be scaled against the window's own maximum cell, so the grid always uses its
full range. The heatmap SHALL carry a legend naming the low and high ends of that scale with their
values, so intensity is quantified rather than merely ordered.

An hour with no calls SHALL be visually distinct from the lowest non-zero intensity — an empty hour
and a quiet hour are different facts. Every cell's exact value SHALL be reachable on hover and
through its accessible name, so the grid does not depend on colour discrimination to be read.

#### Scenario: Scale is relative to the window maximum

- **GIVEN** the busiest hour in the window carries 500 calls
- **WHEN** the heatmap renders
- **THEN** that cell renders at the high end of the scale
- **AND** the legend names the value at each end

#### Scenario: Empty hour differs from a quiet hour

- **GIVEN** one hour carries no calls and another carries one call
- **WHEN** the heatmap renders
- **THEN** the two cells are visually distinct

#### Scenario: Cell value is reachable without colour

- **WHEN** the user hovers or focuses a cell
- **THEN** the cell's day, hour and exact call count are stated

### Requirement: The heatmap follows the view and the page filters

The heatmap SHALL plot the active view's calls — model calls or MCP calls — and SHALL
honour the page's applied entity and project filters. Switching view SHALL replot it from the new
view's bucketed request without leaving the previous view's cells in place.

#### Scenario: Switching view replots the grid

- **GIVEN** the heatmap shows model calls
- **WHEN** the user switches `View by` to MCP
- **THEN** the grid replots MCP calls
- **AND** no cell from the previous view remains

#### Scenario: Filters narrow the grid

- **GIVEN** a project filter is applied
- **WHEN** the heatmap renders
- **THEN** its cells count only calls matching that filter

### Requirement: The donut shows the top five plus a residual slice

The dashboard SHALL render a donut splitting the current window's calls across the five highest
entities of the active view's primary dimension, with every remaining entity folded into one
`Other` slice. Slices SHALL be ordered by value, descending, and `Other` SHALL always render last
regardless of its size.

Each slice SHALL state its entity and its share of the window's total calls. The donut's centre
SHALL state the window's total, so the shares have a denominator on screen.

`Other` SHALL state how many entities it folds, so a reader can tell a long tail from a sixth
entity. When five or fewer entities exist, no `Other` slice SHALL be rendered.

#### Scenario: Long tail folds into Other

- **GIVEN** the window contains twelve deployments
- **WHEN** the donut renders
- **THEN** it shows five named slices and one `Other` slice
- **AND** `Other` states that it folds seven entities

#### Scenario: Other renders last even when large

- **GIVEN** `Other` carries a larger share than any named slice
- **WHEN** the donut renders
- **THEN** `Other` is still the last slice

#### Scenario: Few entities render without Other

- **GIVEN** the window contains three deployments
- **WHEN** the donut renders
- **THEN** it shows three slices and no `Other` slice

#### Scenario: Centre states the denominator

- **WHEN** the donut renders
- **THEN** its centre states the window's total call count

### Requirement: The dialog lists the whole dimension, a block at a time

`View all` SHALL open a dialog listing the dimension beyond the ring's five slices, reading it in
blocks as the list is scrolled rather than in one page.

The ring in that dialog SHALL draw every row read so far, not the card's five. The dialog is where
the long tail is being read, and a ring that kept folding it into one slice would answer the
question the card already answered. Its residual is therefore the window's total minus the rows
read, and SHALL shrink as the legend reads further.

The dialog's own filter SHALL narrow the list and never the ring, and SHALL apply to the rows read so
far: it is a way to find an entity in a list that is already open, not a second reading of the
window.

While a block is in flight the dialog SHALL say so with a spinner under the list, so the rows
already read stay where the reader left them.

#### Scenario: A block in flight is stated under the list

- **GIVEN** the dialog is reading the next block
- **WHEN** it renders
- **THEN** a spinner is shown under the list
- **AND** it is gone once the block has arrived

#### Scenario: Scrolling the list reads further into the dimension

- **GIVEN** the dialog is open on a dimension holding more entities than one block
- **WHEN** the reader scrolls the list to its end
- **THEN** the next block of entities is read and listed

#### Scenario: The ring draws what the list has read

- **GIVEN** the dialog has read several blocks
- **WHEN** the ring renders
- **THEN** every row read so far is a slice of it
- **AND** its residual is the window's total minus those rows

#### Scenario: Nothing further is read once the dimension ends

- **GIVEN** the dialog has read every entity of the dimension
- **WHEN** the reader scrolls the list to its end again
- **THEN** no further request is issued

### Requirement: Shares are computed against the window total, and ties are ordered stably

A slice's share SHALL be its calls divided by the sum of all the window's calls, including the
entities folded into `Other` — never against the largest slice. The shares of all rendered slices
SHALL therefore sum to the whole.

Entities tied on value SHALL be ordered by name so that repeated renders of the same window produce
the same donut, and the five-slice cut SHALL be taken after that ordering, so a tie at the boundary
resolves the same way every time.

An entity with a missing name SHALL render the same fallback label the breakdown table uses for that
dimension, never the literal text `undefined`.

#### Scenario: Shares sum to the whole

- **WHEN** the donut renders with an `Other` slice
- **THEN** the shares of the five named slices and `Other` sum to 100%

#### Scenario: Share is not relative to the largest slice

- **GIVEN** the largest entity accounts for two fifths of the window's calls
- **WHEN** the donut renders
- **THEN** its slice states two fifths, not the whole

#### Scenario: Ties resolve identically across renders

- **GIVEN** two entities at the five-slice boundary carry equal call counts
- **WHEN** the donut is rendered twice over the same window
- **THEN** the same entity is named in both renders

#### Scenario: Missing name uses the shared fallback label

- **GIVEN** a slice's entity name is missing
- **WHEN** the donut renders
- **THEN** the slice carries the dimension's fallback label
- **AND** the literal text `undefined` is not shown

### Requirement: Hovering a slice answers which slice it is

Hovering a slice SHALL keep that slice's colour and fade the others, so the ring answers which slice
the cursor is on. The hovered slice SHALL NOT grow: scaling it moves the ring's edge under the
cursor, which reads as the pointer having left the slice it is on.

#### Scenario: The hovered slice is the only one at full strength

- **WHEN** the cursor rests on a slice
- **THEN** that slice keeps its colour and the others fade
- **AND** the ring's geometry does not change

### Requirement: The donut follows the view's primary dimension

The donut's dimension SHALL be the active view's leading breakdown dimension — models in the LLM
view, MCP servers in the MCP view — matching the breakdown table's default tab, so the two widgets
never disagree about what the page is about.

The donut SHALL read that dimension from a request of its own rather than from the breakdown
table's. Sharing the table's response would make the ring reload, and change what it splits by,
every time a reader switched the tab below it.

#### Scenario: Donut and table agree on dimension

- **WHEN** a view loads
- **THEN** the donut splits by the same dimension the breakdown table's default tab lists

#### Scenario: Switching view switches the dimension

- **GIVEN** the donut splits by model
- **WHEN** the user switches `View by` to MCP
- **THEN** the donut splits by MCP server

#### Scenario: Switching the breakdown tab leaves the donut alone

- **GIVEN** the donut splits by model
- **WHEN** the user selects the Projects tab in the breakdown table
- **THEN** the donut still splits by model
- **AND** it issues no request

### Requirement: One tabbed table replaces the per-dimension grids

Each view SHALL render a single breakdown table whose tabs select the dimension its rows are grouped
by. The tab sets SHALL be:

- **LLM view**: `Models`, `Applications`, `Projects`
- **MCP view**: `MCP Servers`, `Tools`, `Applications`, `Projects`

The first tab of each set SHALL be the default. Switching tab SHALL issue exactly one request — the
tab request named under the request contract above, grouped by that tab's dimension and ordered and
limited server-side — and SHALL NOT re-issue the view's other requests. A tab is grouped and ranked
by the backend rather than regrouped on the client because a top-N taken over rows grouped by every
dimension at once ranks combinations, not the dimension the tab is about.

The selected period SHALL apply to every tab.

#### Scenario: Default tab is the view's leading dimension

- **WHEN** the MCP view loads
- **THEN** the breakdown table shows the `MCP Servers` tab
- **AND** tabs for `Tools`, `Applications` and `Projects` are offered

#### Scenario: Switching tab issues exactly one request

- **GIVEN** the breakdown table has rendered
- **WHEN** the user selects another tab
- **THEN** one request is issued per window, grouped by the new tab's dimension
- **AND** the view's totals, bucketed and leading-dimension responses are reused

### Requirement: Each tab states what it counts and what one row aggregates

The table SHALL state, for the active tab, which field the dimension is read from and what a single
row covers. A tab's name alone does not say it: `Applications` ranks the deployment that *called*
the model rather than applications that were called, and `Projects` ranks the project the calling
API key belongs to rather than a project the traffic was about. A reader who cannot tell which of
those a row is has no way to read the ranking.

The statement SHALL change with the tab, SHALL sit with the table's title rather than inside a
tooltip, and SHALL name the fallback bucket where the tab has one, so a row labelled `Direct call`
or `No Project` is explained where it is ranked.

#### Scenario: The statement follows the active tab

- **GIVEN** the `Models` tab is selected
- **WHEN** the user selects `Projects`
- **THEN** the table's description changes to the one describing projects

#### Scenario: A fallback bucket is explained where it is ranked

- **WHEN** the `Applications` tab is selected
- **THEN** its description names the bucket a call made directly against a model falls into

### Requirement: The LLM view states each row's cost

In the LLM view, every tab SHALL carry a cost column holding the sum of the row's prices over the
window, formatted as money like every other spend figure on the page. A row with no price SHALL
state no figure rather than a zero.

The MCP view SHALL NOT render the column: an `mcp` row carries no price at all, so the column would
be an empty one on every row rather than a measure.

#### Scenario: Cost is stated per row in the LLM view

- **WHEN** the `Models` tab renders in the LLM view
- **THEN** each row states its cost over the window

#### Scenario: The MCP view offers no cost column

- **WHEN** the `MCP Servers` tab renders
- **THEN** the table has no cost column

### Requirement: Rows state their share of the window as a figure

Every tab SHALL render, per row, the dimension value, its `Share of calls`, its call count, and the
tab's own extra measures. `Share of calls` SHALL be the row's calls divided by **the sum of all rows
in the window for that dimension** — including rows beyond the shown top-N — never by the largest
row's calls. A share MUST NOT be rendered such that the top row reads as 100% while accounting for a
fraction of the traffic.

The share SHALL be stated as a figure, not as a bar. Rows arrive ranked by calls, so a bar's length
only ever descends and restates the ranking, while taking a column's width to do it.

Every column SHALL take an equal share of the table's width, and every figure SHALL end on its
cell's right edge, so a column reads down as one set of numbers. Each measure carries its own change
beside it, so the columns hold figures of one kind and deserve one width.

Rows SHALL be ordered by calls, descending, with ties broken by the dimension value so repeated
renders of one window agree. That order is the backend's and the table offers no control over it,
so the header SHALL NOT claim a sort state: `aria-sort` belongs to a column a reader can reorder,
and announcing one that cannot be changed offers an interaction that does not exist.

#### Scenario: Share is relative to the window total

- **GIVEN** the window carries 204 calls across seven deployments, the largest of which carries 81
- **WHEN** the `Deployments` tab renders
- **THEN** the largest row's share reads as its portion of 204, not as 100%

#### Scenario: The share is a figure

- **WHEN** a row renders its share
- **THEN** it states the percentage as a figure and draws no bar

#### Scenario: Shares account for rows beyond the top-N

- **GIVEN** more rows exist than are shown
- **WHEN** the shown rows render
- **THEN** their shares sum to less than 100%
- **AND** each share is computed against the full window total

#### Scenario: No column claims a sort a reader cannot change

- **WHEN** the table renders ordered by calls
- **THEN** no column header announces a sort state

### Requirement: Each measure states its own change beside it

When comparison is on, every measure a row states — its calls, its error rate, its average latency
and its cost — SHALL state its own change from the previous window, in the same cell, as the ratio of
that measure's own previous value. The change SHALL be read from the previous-window response,
matched to the row by its dimension value.

There SHALL be no delta column of its own. One column can compare only one measure, and standing
beside `Cost` it read as a change in money while it was counting calls. Each change SHALL carry the
direction its own measure gives it — more calls read as growth, more spend, more errors and more
latency do not — in the same pill the KPI cards state their change in, so one change reads the same
way page-wide.

The figure SHALL end on the cell's right edge, like every other number in the table, and the change
SHALL sit in a track of its own beside it, right-aligned — so the figures read down as one set and
the changes as another, while each change still touches the figure it belongs to. Letting the
change's own width place the figure left both columns ragged.

A row absent from the previous window's response SHALL be called new only when that response was
the whole dimension — non-empty, and shorter than the page size it was asked for. When the previous
window recorded nothing at all, or its response was cut at the page size, the row's absence says
nothing: the table SHALL state no comparison for it rather than calling it new. A window with no
traffic would otherwise make every row look new, and a row ranked below the cut would be called new
while it had been there all along.

A row present in the previous window but absent from the current one SHALL NOT be added to the
table — the table lists the current window's rows — and its disappearance is instead visible in the
totals.

The delta SHALL carry its direction as a shape and as text, not as colour alone: an arrow, the
magnitude, and the direction spelled out for a screen reader.

When comparison is off, no change SHALL be stated.

#### Scenario: Delta matched by dimension value

- **GIVEN** comparison is on and a deployment appears in both windows
- **WHEN** its row renders
- **THEN** the delta states the signed change between the two windows' call counts

#### Scenario: A row new in this window reads as new

- **GIVEN** the previous window's response listed the whole dimension
- **AND** a model has calls in the current window and none in that response
- **WHEN** its row renders
- **THEN** the delta column marks it as new
- **AND** it shows no percentage

#### Scenario: An empty previous window makes no row new

- **GIVEN** the previous window recorded no calls at all
- **WHEN** the table renders
- **THEN** no row is marked new
- **AND** each states that there is no comparison

#### Scenario: A truncated previous response makes no row new

- **GIVEN** the previous window's response was cut at the page size
- **AND** a model in the current window is absent from it
- **WHEN** its row renders
- **THEN** it states no comparison rather than being marked new

#### Scenario: Each measure compares itself

- **GIVEN** comparison is on and a row's cost doubled while its calls halved
- **WHEN** the table renders
- **THEN** the cost cell states a rise and the calls cell a fall
- **AND** the rise in cost is toned as unwelcome while a rise in calls would be welcome

#### Scenario: No delta column is rendered

- **GIVEN** comparison is on
- **WHEN** the table renders
- **THEN** no column of its own states the change

#### Scenario: Figures line up whatever the changes beside them

- **GIVEN** one row states a change and the next has none to state
- **WHEN** the table renders
- **THEN** both figures end on the same line, and so do the changes beside them

#### Scenario: Nothing is stated when comparison is off

- **GIVEN** comparison is off
- **WHEN** the table renders
- **THEN** no cell states a change

### Requirement: Top-N is answered by the backend and the dialog holds the full list

The card SHALL show the ranked head of the dimension — ten rows — offering a `View all` affordance
that opens the full list in a dialog. Both the card's page and the full list SHALL be ordered and
limited by the backend, not by trimming a client-side list.

Neither surface SHALL offer column sorting or per-column filters. The card holds one ranked page, so
both would reorder or sieve that page while hiding that the rest of the dimension was never fetched.
The dialog reads the whole dimension, but block by block, so a filter there would sift the blocks it
has read and silently miss the rest.

The card SHALL NOT offer a search field either: a term pushed into the aggregate re-ranks the whole
window and answers with rows the card never loaded, so the field read as a page that reorders
itself. Finding a row outside the head is the dialog's job.

#### Scenario: The card states ten rows and offers the full list without counting it

- **GIVEN** the window contains more rows than the bound
- **WHEN** the table renders
- **THEN** it offers `View all`
- **AND** it states no row count, since the count it holds is the count of its own page

#### Scenario: No column offers a filter on either surface

- **WHEN** the card renders
- **THEN** its columns offer no filter
- **WHEN** the full-list dialog opens
- **THEN** its columns offer no filter either, and it offers a search over the dimension

#### Scenario: The card offers no search field

- **WHEN** the card renders
- **THEN** no search field is present
- **AND** switching tab issues the tab's own request and nothing else

#### Scenario: A row outside the head is reached through the dialog

- **GIVEN** a deployment ranks below the card's ten rows
- **WHEN** the user opens `View all` and searches for its name
- **THEN** the row is listed

### Requirement: The dialog reads the dimension a block at a time

The dialog SHALL read its rows in blocks as it is scrolled, not as one page: a dimension can hold
more rows than the query surface will answer at once, and a reader who opened the dialog to look at
the head should not wait for the tail.

The dialog SHALL offer one search field over the dimension, answered by the backend and matched
case-insensitively, so a term reaches values no block has read. The term SHALL be debounced before
it becomes a request, since the field reports every keystroke, and SHALL be part of what identifies
the list: a new term drops the blocks in hand and reads from the first one again. Closing the dialog
SHALL clear it.

The ranking SHALL carry the dimension as its last key, so a block is a stable slice of it: two rows
holding the same figure would otherwise be free to come back in either order, and the same row could
arrive in two blocks or in none.

While a block is in flight the dialog SHALL say so with a spinner over the rows, not in place of
them: a block read on scroll leaves the rows above it on screen, and replacing the grid would drop
the reader back to the top of the list.

An empty result in the dialog SHALL be stated by the grid's own no-rows message: there the emptiness
is a term that matched nothing, while the card's message names a period with no traffic — wrong, and
drawn on top of the grid's own answer.

The card's empty state SHALL name no period. The page states its window in the time filter above,
and repeating it inside the card bought a second copy of that reading, its own formatting and three
props threaded through the grid.

A fallback bucket SHALL keep its ranked place in the dialog rather than being pinned last as it is
on the card: a block is 25 rows of a longer list, so pinning moves the bucket to the end of its own
block, which is a position in the middle of the list.

The delta SHALL be read per block, by asking the previous window for that block's own dimension
values. A block is a position in this window's ranking, which the previous window does not share, so
the values are asked for by name. A row the previous window does not answer for SHALL state no
comparison rather than being called new, and a fallback bucket — whose value is an absence rather
than a name — SHALL state none either.

#### Scenario: Scrolling reads the next block

- **GIVEN** the dialog is open on a dimension holding more rows than one block
- **WHEN** the reader scrolls past the loaded rows
- **THEN** the next block is read at its offset
- **AND** the rows already shown are not re-read

#### Scenario: A block in flight is stated over the rows

- **GIVEN** the dialog has rows on screen and is reading the next block
- **WHEN** the grid renders
- **THEN** a spinner is shown over those rows
- **AND** the rows already read stay where they are

#### Scenario: The search reaches the whole dimension

- **GIVEN** the dialog is open
- **WHEN** the reader searches for a value ranked below every loaded block
- **THEN** the rows are read again from the first block, narrowed by that term
- **AND** the matching row is listed

#### Scenario: A term that matches nothing is stated by the grid

- **GIVEN** the dialog is open and searched for a value no row carries
- **WHEN** the grid renders
- **THEN** the grid's own no-rows message is shown
- **AND** the card's own empty message is not

#### Scenario: Closing the dialog clears the term

- **GIVEN** the dialog is open with a term typed
- **WHEN** the reader closes it and opens it again
- **THEN** the field is empty and the whole dimension is listed

#### Scenario: A block states its own comparison

- **GIVEN** comparison is on and the dialog is open
- **WHEN** a block of rows is read
- **THEN** the previous window is asked for those rows by name
- **AND** a row it does not answer for states no delta

### Requirement: Only the dialog and its blocks issue further requests

`View all`, a scroll to the next block, and a term typed into the dialog's search SHALL be the only
interactions on this table that issue a request.

#### Scenario: Reading the table issues nothing beyond its blocks

- **GIVEN** the dialog is closed
- **WHEN** the reader opens a row detail panel and dismisses it
- **THEN** no request is issued

### Requirement: A row opens a side panel detailing that row

Activating a row SHALL open a side panel for it, stating the dimension value as its title and
carrying: the row's calls, its share of the window, the request method where the dimension has a
single one, a requests-over-time chart for that row over the current window, and a list of the
row's child entities with their calls and share — routes for a deployment, tools for an MCP server,
models for a project.

The panel's share SHALL use the same normalization as the table's column, so the two never disagree
about one row's share.

Where the row's child dimension carries more than one method, the panel SHALL state the methods
rather than a single one, because a row with both a read and a write method has no single method to
name. The panel SHALL be dismissible, and dismissing it SHALL leave the table's tab and scroll
position unchanged.

#### Scenario: Panel opens with the row's figures

- **WHEN** the user activates a row
- **THEN** a side panel opens titled with the row's dimension value
- **AND** states its calls, its share, a requests-over-time chart and its child entities

#### Scenario: Panel share matches the table

- **WHEN** the panel is open
- **THEN** the share it states equals the share the row states in the table

#### Scenario: Multiple methods are stated as multiple

- **GIVEN** a row's calls span more than one request method
- **WHEN** the panel renders
- **THEN** it states the methods rather than naming one

#### Scenario: Dismissing preserves table state

- **GIVEN** the user has switched tab before opening a row
- **WHEN** the panel is dismissed
- **THEN** the tab is unchanged

### Requirement: A tool row names the MCP servers it aggregates

A tool name is not unique across servers — the same `get_me` lives on dozens of toolsets — so a row
on the `Tools` tab SHALL state which server its calls were made on, under the tool's own name. One
server SHALL be named outright; several SHALL be counted, with the names the response carried
available in a tooltip.

The names SHALL be read as part of the tab's own request rather than a second one, and SHALL be
capped, with the total taken separately: a capped list cannot say how many it left out.

A name SHALL be shown as a reader can take it in — without the `toolsets/` prefix, which the column
already implies, and with Core's own percent-escapes decoded. A name that is not valid encoding SHALL
be shown as it stands rather than dropped.

#### Scenario: One server is named

- **GIVEN** a tool was called on a single MCP server
- **WHEN** the row renders
- **THEN** that server's name is stated under the tool's

#### Scenario: Several servers are counted

- **GIVEN** a tool was called on more than one server
- **WHEN** the row renders
- **THEN** the count of servers is stated under the tool's name
- **AND** the names the response carried are available in a tooltip

#### Scenario: Other tabs state no server

- **GIVEN** the `MCP Servers` tab, whose dimension is the server itself
- **WHEN** a row renders
- **THEN** it states no second name

### Requirement: Missing dimension values carry the shared fallback labels

A row whose dimension value is missing — falsy or the literal string `undefined` — SHALL render its
dimension's fallback label: `No Project` on the `Projects` tab, for a call made outside any project,
`Direct call` on the `Applications` tab, for a call with no calling deployment, and `Other methods`
on the `Tools` tab, for an MCP call that names no tool. Each SHALL carry a tooltip stating the
cause, and the `Direct call` tooltip SHALL be specific to the active view, because an LLM call with
no parent was made against the model directly while an MCP call with no parent came from a try-out.

The `Tools` fallback is not a rare row: the MCP transport logs a protocol method — `initialize`,
`tools/list`, a notification — the same way it logs `tools/call`, and those outnumber the tool calls
by roughly three to one. It is labelled rather than filtered out, because the tab's share is
normalized against the window total and dropping the rows from the tab alone would leave the
percentages summing to a fraction of the window. It SHALL instead be pinned below the ranked rows,
so the bucket nobody came for does not take the head of the page, and its tooltip SHALL point at
`View all` for the full list. On every other tab a fallback row SHALL keep its ranked place.

Both labels SHALL be localized, SHALL be presentational — the underlying value is unchanged — and
SHALL be what a copied cell carries. The literal text `undefined` SHALL never be rendered, on any
tab, in the side panel, or in a copied cell.

#### Scenario: Missing project renders No Project

- **WHEN** a row on the `Projects` tab has no project value
- **THEN** the cell renders `No Project` with its tooltip

#### Scenario: Missing parent deployment renders Direct call

- **WHEN** a row on the `Applications` tab has no calling deployment value
- **THEN** the cell renders `Direct call` with the tooltip its view defines

#### Scenario: An MCP call naming no tool renders Other methods, last

- **GIVEN** the MCP view's `Tools` tab
- **WHEN** a row has no tool-call name, because its calls are protocol methods
- **THEN** the cell renders `Other methods` with a tooltip naming those methods and pointing at
  `View all`
- **AND** the row sits below every ranked tool, whatever its calls

#### Scenario: A fallback row on another tab keeps its rank

- **GIVEN** the `Applications` tab, whose fallback bucket outranks every named row
- **WHEN** the table renders
- **THEN** `Direct call` sits in its ranked place

#### Scenario: Side panel uses the same fallback

- **WHEN** a row carrying a fallback label is opened
- **THEN** the panel's title carries the same label
- **AND** the literal text `undefined` is not shown
