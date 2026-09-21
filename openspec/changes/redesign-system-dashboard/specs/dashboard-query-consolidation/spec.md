## Purpose

Defines how many requests the usage page is allowed to issue and what each one answers, replacing
the per-widget fetch-and-poll model of the existing dashboard with one request per data shape per
window, and a manual refresh.

## ADDED Requirements

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
6. a **spend-periods** request truncated to a calendar unit, issued only while the spend plot is
   the one showing;
7. a **heatmap** request bucketed hourly over the heatmap's own week, independent of the page
   period.

Shapes 1, 2 and 4 SHALL be issued once per window, so comparison adds one request each. The others
SHALL be issued once regardless of comparison.

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

This says nothing about the existing dashboard, which keeps its interval selector — see
[[dashboard-redesign-gating]].

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
