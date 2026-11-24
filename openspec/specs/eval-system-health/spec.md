# eval-system-health Specification

## Purpose

The Evaluation System Health page gives an admin a platform-wide view of how much of what is deployed
— models, applications and toolsets — has been evaluated, and how much evaluation activity there has been
this month, and how the evaluated test suites are trending. It holds the coverage cards, the first two
activity cards, and the run-trends table beside a placeholder for the health distribution chart.

## Requirements

### Requirement: System Health menu entry and route

The Evaluation menu group SHALL contain a **System Health** item, after Datasets, linking to
`/system-health` and carrying the `Preview` badge and the activity icon. The item SHALL be present exactly
when the Evaluation group is present, so it is hidden when `featureFlags.evaluationEnabled` is `false`. The
page SHALL show a breadcrumb naming it, as the other Evaluation pages do.

#### Scenario: Item shown with a Preview badge

- **WHEN** the menu configuration is built with `featureFlags.evaluationEnabled` `true`
- **THEN** the Evaluation group contains a System Health item linking to `/system-health`
- **AND** that item's `badge` is `MenuBadge.Preview`
- **AND** the Test Suites, Runs and Datasets items carry no badge

#### Scenario: Item shown with its icon

- **WHEN** the menu renders the System Health item
- **THEN** it shows the activity icon beside its label

#### Scenario: Breadcrumb

- **WHEN** the operator opens the System Health page
- **THEN** the header breadcrumb shows System Health

#### Scenario: Hidden with the Evaluation group

- **WHEN** the menu configuration is built with `featureFlags.evaluationEnabled` `false`
- **THEN** no System Health item is present

### Requirement: Coverage card row

The System Health page SHALL render one row of four coverage cards, in this order: **Total Evaluatees**,
**Total Models**, **Total Applications**, **Total Toolsets**. Each card SHALL show its coverage percentage,
a progress bar of that percentage beneath it, and a caption of the form `N total · M uncovered`. The
progress bar SHALL expose the percentage and the card title as its accessible value and name.

#### Scenario: Four cards in order

- **WHEN** the operator opens the System Health page
- **THEN** four cards are present, titled Total Evaluatees, Total Models, Total Applications and Total
  Toolsets, in that order

#### Scenario: A card shows percentage, bar and caption

- **WHEN** 118 models are deployed and 112 of them are covered
- **THEN** the Total Models card shows `94.9%`
- **AND** its progress bar is filled to 94.9%
- **AND** its caption reads `118 total · 6 uncovered`

### Requirement: Coverage definition

An evaluatee is a deployment of one of three kinds, told apart by the type its listing entry reports: a
**model** (`dial-model`), an **application** (`dial-application`) or a **toolset** (`dial-toolset`). An
application that also exposes the MCP interface is an application, not a toolset. The page SHALL read the
deployments with one listing request and split them into the three kinds itself.

An evaluatee SHALL be **covered** when at least one test suite run targeting it started within the last
30 days, counting back from the current time, and the suite that produced the run still exists. An
evaluatee SHALL be matched by its deployment id whichever of the suite's deployment reference or MCP
deployment reference carries it, so an application that a suite reaches through an MCP tool is covered just
as one the suite calls directly. The covered
count of a kind SHALL count each evaluatee once, however many suites or runs target it, and SHALL count
only evaluatees that are still deployed. The uncovered count SHALL be the total minus the covered count,
and the percentage SHALL be covered divided by total.

#### Scenario: Many runs on one evaluatee count once

- **WHEN** one model has three runs in the last 30 days, from two different suites
- **THEN** that model adds one to the Total Models covered count

#### Scenario: Runs older than 30 days do not cover

- **WHEN** a model's only run started 31 days ago
- **THEN** that model is counted as uncovered

#### Scenario: A deleted suite's runs do not cover

- **WHEN** a model's only run in the last 30 days belongs to a test suite that has since been deleted
- **THEN** that model is counted as uncovered

#### Scenario: An evaluatee that is no longer deployed is not counted

- **WHEN** a run in the last 30 days targets a model that no longer appears in the deployment listing
- **THEN** neither the total nor the covered count of Total Models includes it

#### Scenario: Evaluatees are split by the type the listing reports

- **WHEN** the one deployment listing holds 425 `dial-model`, 1572 `dial-application` and 490 `dial-toolset` entries
- **THEN** the Total Models card counts 425, Total Applications 1572 and Total Toolsets 490

#### Scenario: An application that exposes MCP is not counted as a toolset

- **WHEN** a `dial-application` entry also exposes the MCP interface
- **THEN** it is counted once, as an application, and not in Total Toolsets

#### Scenario: An application reached through an MCP tool is covered

- **WHEN** a `dial-application` entry exposes the MCP interface, and its only run in the last 30 days belongs
  to a suite that targets it through an MCP tool
- **THEN** that application is counted as covered in Total Applications

### Requirement: Total Evaluatees aggregates the kinds

The Total Evaluatees card SHALL be computed over the union of the three kinds: its total SHALL be the sum
of the model, application and toolset totals, and its covered count the sum of their covered counts. The
card SHALL carry an info control whose tooltip states the coverage rule: an evaluatee is covered if at
least one test suite has run on it in the last 30 days, and an uncovered evaluatee has no quality signal.
The tooltip SHALL be reachable by keyboard focus as well as hover.

#### Scenario: Totals are summed

- **WHEN** there are 118 models, 224 applications and 45 toolsets, with 6, 11 and 7 uncovered
- **THEN** the Total Evaluatees card shows `387 total · 24 uncovered` and `93.8%`

#### Scenario: Tooltip explains coverage

- **WHEN** the operator hovers or focuses the info control on the Total Evaluatees card
- **THEN** a tooltip states that an evaluatee is covered if at least one test suite has run on it in the
  last 30 days

### Requirement: Zero totals

A card whose total is zero SHALL show an empty-value indicator in place of a percentage, no filled bar,
and the caption `0 total · 0 uncovered`. It SHALL NOT show `NaN%` or `0%`.

#### Scenario: No toolsets deployed

- **WHEN** no toolset is deployed
- **THEN** the Total Toolsets card shows an empty-value indicator instead of a percentage
- **AND** its caption reads `0 total · 0 uncovered`

### Requirement: Card loading and error states

Each card SHALL show a loading indicator while its data is pending, and an error message with an alert
role if its data failed to load. Every card depends on the same two sources — the deployment listing and
the coverage query — so the four cards SHALL share one state: loading until both have returned, and in
the error state as soon as either has failed, since without both none can state its total and covered count.

#### Scenario: Loading

- **WHEN** the page has just opened and no data has returned
- **THEN** every card shows a loading indicator and no percentage

#### Scenario: Only one source has returned

- **WHEN** the deployment listing has returned and the coverage query has not
- **THEN** every card still shows a loading indicator

#### Scenario: The deployment listing fails

- **WHEN** the deployment listing fails
- **THEN** all four cards show an error message

#### Scenario: The coverage query fails

- **WHEN** the coverage query fails
- **THEN** all four cards show an error message

### Requirement: Activity card row

Below the coverage cards the page SHALL render a second row with two activity cards, in this order: **Test
suites run this month** and **Test suites added this month**. Each card SHALL show its count, a caption
beneath it, and a delta badge against the previous period. The two cards SHALL share the grid of the four
coverage columns and sit in its first two columns.

#### Scenario: Two cards in order

- **WHEN** the operator opens the System Health page
- **THEN** a second row holds two cards, titled Test suites run this month and Test suites added this month,
  in that order, below the four coverage cards

### Requirement: Month periods

Both activity cards SHALL count over the **current period**: the local calendar month from its first
instant to the end of the current day. Their delta SHALL compare against the **previous period**: the same
span of the previous local calendar month, from its first instant to the end of the same day-of-month, with
that day clamped to the last day of the previous month when it does not exist there. The delta SHALL NOT
compare against the whole previous month.

#### Scenario: Mid-month

- **WHEN** the current date is 18 November
- **THEN** the current period is 1–18 November and the previous period is 1–18 October

#### Scenario: First day of the month

- **WHEN** the current date is 1 December
- **THEN** the current period is 1 December only and the previous period is 1 November only

#### Scenario: The day does not exist last month

- **WHEN** the current date is 31 March
- **THEN** the previous period ends on the last day of February

### Requirement: Test suites run this month

The **Test suites run this month** card SHALL show the number of distinct test suites with at least one run
that started in the current period, counting only test suites that still exist. Its caption SHALL read
`of N total · P`, where N is the number of existing test suites and P is the count divided by N as a
percentage. Its delta SHALL be the count minus the same count over the previous period. A suite run several
times in the period SHALL count once.

#### Scenario: Count, total and percentage

- **WHEN** 1,284 of 1,847 test suites have a run in the current period
- **THEN** the card shows `1,284`
- **AND** its caption reads `of 1,847 total · 69.5%`

#### Scenario: A suite with many runs counts once

- **WHEN** one test suite has five runs in the current period
- **THEN** it adds one to the count

#### Scenario: Runs of a deleted suite do not count

- **WHEN** the only run in the current period belongs to a test suite that has since been deleted
- **THEN** that run adds nothing to the count

#### Scenario: Delta against the previous period

- **WHEN** the current count is 1,284 and the previous period's count was 1,201
- **THEN** the delta badge reads `+83 vs prev. period`

#### Scenario: No test suites

- **WHEN** no test suite exists
- **THEN** the caption reads `of 0 total · —` and shows no percentage

### Requirement: Test suites added this month

The **Test suites added this month** card SHALL show the number of test suites created in the current
period. Its caption SHALL state across how many evaluatees they are: the number of distinct models,
applications and toolsets that those test suites target, each counted once. A test suite that targets a
route targets no evaluatee. Its delta SHALL be the count minus the number of test suites created in the
previous period.

#### Scenario: Count and evaluatees

- **WHEN** 47 test suites were created in the current period and together they target 31 distinct
  deployments
- **THEN** the card shows `47`
- **AND** its caption reads `across 31 evaluatees`

#### Scenario: Singular caption

- **WHEN** the test suites created in the current period target one deployment
- **THEN** the caption reads `across 1 evaluatee`

#### Scenario: A route-targeted suite adds no evaluatee

- **WHEN** a test suite created in the current period targets a route
- **THEN** it adds one to the count and nothing to the number of evaluatees

#### Scenario: Delta against the previous period

- **WHEN** 47 test suites were created in the current period and 38 in the previous period
- **THEN** the delta badge reads `+9 vs prev. period`

### Requirement: Activity delta badge

A delta badge SHALL show the signed whole-number difference followed by `vs prev. period`. A positive delta
SHALL be shown in the success colour and a negative delta in the error colour, since more suites run or added
is the better outcome. No badge SHALL be shown when the difference is zero. The badge's period SHALL be
available to assistive technology as text naming the current and previous periods.

#### Scenario: Increase

- **WHEN** the count rose by 83
- **THEN** a success-coloured badge reads `+83 vs prev. period`

#### Scenario: Decrease

- **WHEN** the count fell by 12
- **THEN** an error-coloured badge reads `-12 vs prev. period`

#### Scenario: No change

- **WHEN** the count equals the previous period's count
- **THEN** no delta badge is shown

### Requirement: Activity card loading and error states

Each activity card SHALL show a loading indicator while its data is pending and an error message with an
alert role when its data failed to load. A card's state SHALL depend only on the queries it reads: the run
card on the test suite total, the run count of each period; the added card on the created count of each
period. A failed query of one card SHALL NOT put the other card, or any coverage card, into the error state.

#### Scenario: Loading

- **WHEN** the page has just opened and the activity data has not returned
- **THEN** both activity cards show a loading indicator and no count

#### Scenario: One card's query fails

- **WHEN** the query for test suites created in the previous period fails and the other queries succeed
- **THEN** the Test suites added this month card shows an error message
- **AND** the Test suites run this month card shows its count

### Requirement: Figures follow the calendar while the page is open

The page SHALL reload its coverage and activity figures when the local calendar day changes while it stays
open, deriving the 30-day coverage window and both month periods from the new day, and showing each card's
loading state until the figures return. It SHALL NOT reload while the day stays the same.

#### Scenario: The page stays open across a month boundary

- **WHEN** the page is open at 23:59 on 30 November and the clock passes midnight
- **THEN** the activity cards load again for 1 December against 1 November
- **AND** the coverage cards load again with their window counted back from the new time

#### Scenario: The day does not change

- **WHEN** the page stays open for an hour within one day
- **THEN** no figures are loaded again

### Requirement: Run trends table

The System Health page SHALL show an **Evaluation Run Trends** table below the activity card row. Each row
SHALL stand for one test suite that has at least one recorded completed run, and SHALL show, in order, the
**Test suite**, the **Evaluatee** it targets, the **Run trends - 10 runs** bars of its recent pass rate, the
**Latest** pass rate, and the **Δ prev** change. There SHALL be no separate Type column: the evaluatee's type
is part of the Evaluatee cell. The table SHALL read its rows from the evaluation analytics endpoint
`GET /api/v1/analytics/test-suites/run-trends`, and SHALL NOT offer sorting or filtering.

#### Scenario: Columns and heading

- **WHEN** the page has loaded run trends
- **THEN** a table headed Evaluation Run Trends is shown below the activity cards
- **AND** its columns are Test suite, Evaluatee, Run trends - 10 runs, Latest and Δ prev, in that order

#### Scenario: Backend order is kept

- **WHEN** the endpoint returns suites ordered by latest pass rate ascending
- **THEN** the rows appear in that order, the lowest latest pass rate first
- **AND** a suite with no latest pass rate appears after those that have one
- **AND** no column can be sorted

### Requirement: Run trends row content

The **Test suite** cell SHALL show the suite's name with the suite's id on a second line, as the runs table
shows a run's name with the run's id. The **Evaluatee** cell SHALL show the name of the evaluatee the suite
targets with its type on a second line, as the runs table's Target column does. The type SHALL read Model,
Application or Toolset from the evaluatee's deployment type, and Route for a route-targeted suite; when the
evaluatee has a name but no deployment type this table has a label for, it SHALL fall back to the suite's own
type. A field the backend omits SHALL be left out rather than shown empty. An evaluatee with no name SHALL
show its id in the name's place, and one with neither SHALL show a dash with no second line.

#### Scenario: A model suite

- **WHEN** a suite named `Docs regression` with id `suite-1` targets the model `GPT-4o` and the evaluatee's type is `dial-model`
- **THEN** its Test suite cell shows `Docs regression` with `suite-1` on the line below
- **AND** its Evaluatee cell shows `GPT-4o` with Model on the line below

#### Scenario: An MCP tool suite

- **WHEN** a suite targets the tool `search` of the toolset `docs-toolset` and the evaluatee's type is `dial-toolset`
- **THEN** its Evaluatee cell shows the toolset's name with Toolset on the line below

#### Scenario: A route suite

- **WHEN** a suite's type is route and its evaluatee carries only a name
- **THEN** its Evaluatee cell shows the route name with Route on the line below

#### Scenario: A suite with no reference

- **WHEN** a suite's evaluatee is empty
- **THEN** its Evaluatee cell shows a dash with no second line
- **AND** its Test suite cell is unaffected

#### Scenario: The suite name opens the suite

- **WHEN** the user activates the suite's name in a row
- **THEN** the suite opens at its own page


### Requirement: Latest pass rate and change

The **Latest** cell SHALL show the newest run's pass rate as a whole percentage with a thin progress bar,
and the **Δ prev** cell SHALL show the change in percentage points against the run before it as a signed
badge, increases coloured as good and decreases as bad. Each cell SHALL show a dash when the backend gives
no figure: no latest pass rate when the newest run had no test cases, no change when there is only one run
or either run has no rate. A change that rounds to zero SHALL show the dash too.

#### Scenario: Latest rate with a drop

- **WHEN** a suite's latest pass rate is 0.8 and the previous is 0.9
- **THEN** its Latest cell reads 80% with a bar at 80%
- **AND** its Δ prev cell reads -10% as a decrease

#### Scenario: A rise

- **WHEN** a suite's latest pass rate is 0.9 and the previous is 0.8
- **THEN** its Δ prev cell reads +10% as an increase

#### Scenario: A single run

- **WHEN** a suite has one completed run
- **THEN** its Latest cell shows that run's rate
- **AND** its Δ prev cell shows a dash

#### Scenario: The newest run had no test cases

- **WHEN** the newest run's total test case count is 0
- **THEN** its Latest and Δ prev cells show a dash


### Requirement: Run trend bars

The **Run trends - 10 runs** cell SHALL draw one vertical bar per run of the suite that has a pass rate,
oldest on the left and newest on the right, at most ten. Each bar's height SHALL be its pass rate on a fixed
0–100% scale shared by every row, and its colour SHALL follow the pass-rate band the Latest bar uses (green,
yellow, red). A run without a pass rate SHALL be left out. A row with no bar to draw SHALL leave the cell
empty. The bars are decorative; the cell SHALL carry a text equivalent naming the rates, oldest to newest, for
assistive technology.

#### Scenario: Ten runs

- **WHEN** a suite returns ten runs with pass rates
- **THEN** the cell shows ten bars, the oldest on the left
- **AND** each bar's height is its pass rate against the same 0–100% scale as every other row's

#### Scenario: Colour follows the band

- **WHEN** a suite's runs have pass rates 0.9, 0.5 and 0.2
- **THEN** their bars are drawn green, yellow and red

#### Scenario: A run without a rate

- **WHEN** one of a suite's runs has no test cases
- **THEN** the cell leaves that run out

#### Scenario: Text equivalent

- **WHEN** a screen reader reaches a Run trends cell
- **THEN** it reads the pass rates of the drawn runs in order, oldest first


### Requirement: Run trends paging

The table SHALL load 10 suites at a time and SHALL offer previous and next controls with a label giving the
current page and the page count. The controls SHALL be disabled at the first and last page and while a page
is loading. The page count SHALL follow the total reported by the backend, not the number of rows received,
because a page may hold fewer rows than requested.

#### Scenario: More than one page

- **WHEN** the backend reports 25 suites
- **THEN** the pager reads page 1 of 3 and next is enabled while previous is disabled

#### Scenario: Next page

- **WHEN** the user activates next
- **THEN** the second page of 10 suites is requested and shown
- **AND** the pager reads page 2 of 3

#### Scenario: A short page

- **WHEN** the backend returns fewer rows than requested for a page but reports more pages
- **THEN** the table shows the rows it got
- **AND** the pager still follows the reported page count

#### Scenario: One page only

- **WHEN** the backend reports 4 suites
- **THEN** the pager is not shown

### Requirement: Run trends loading, empty and error states

The table SHALL have its own states, independent of the cards above it. While a page is loading it SHALL
show a loading indicator and no stale rows. When no suite has a recorded completed run it SHALL show an
empty state saying runs appear here once their results are recorded. When the request fails it SHALL show an
error message announced as an alert, with a retry control that requests the same page again.

#### Scenario: Loading

- **WHEN** the run trends request is in flight
- **THEN** the table area shows a loading indicator

#### Scenario: No recorded runs

- **WHEN** the endpoint returns an empty page and a total of 0
- **THEN** the table shows an empty state saying a run appears once its results are recorded

#### Scenario: The request fails

- **WHEN** the run trends request fails
- **THEN** the table area shows an error message announced as an alert
- **AND** the cards above it are unaffected

#### Scenario: Retry

- **WHEN** the user activates retry after a failure
- **THEN** the same page is requested again
- **AND** it shows the loading indicator until the page returns

### Requirement: Run trends placement

The Evaluation Run Trends table SHALL share a row with a placeholder for the Test Suite Health Distribution
chart. On a standard screen (the width at which the card rows switch to four columns, and wider) the table
SHALL take the left half of the row and the placeholder the right half. On a narrower screen they SHALL stack
at full width, the table first. The placeholder SHALL show its title and a loading-style skeleton, and SHALL
carry no data.

#### Scenario: Standard screen

- **WHEN** the page is shown on a standard-width screen
- **THEN** the Evaluation Run Trends table takes the left half of its row
- **AND** a placeholder titled Test suite health distribution takes the right half, showing a skeleton

#### Scenario: Small screen

- **WHEN** the page is shown on a screen narrower than the standard width
- **THEN** the Evaluation Run Trends table takes the full width
- **AND** the placeholder is shown below it, also at full width
