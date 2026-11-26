# eval-system-health Specification

## Purpose

The Evaluation System Health page gives an admin a platform-wide view of how much of what is deployed
— models, applications, toolsets and routes — has been evaluated, and how much evaluation activity there has been
this month and what it cost, and how the evaluated test suites are trending and how healthy they are week by
week. It holds the coverage cards, the activity cards (test suites run, test suites added, and eval cost), the
run-trends table, and beside it the weekly health distribution chart.

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

The System Health page SHALL show five coverage cards: **Total Evaluatees**, **Total Models**, **Total
Applications**, **Total Toolsets** and **Total Routes**. Total Evaluatees SHALL be the first card of the key
figures row at the top of the page; the other four SHALL form the block beside the health distribution chart,
in the order Total Models, Total Applications, Total Toolsets, Total Routes. Each coverage card SHALL show its
coverage percentage, a progress bar of that percentage beneath it, and a caption of the form
`N total · M uncovered`. The progress bar SHALL expose the percentage and the card title as its accessible
value and name.

#### Scenario: Four cards in order

- **WHEN** the operator opens the System Health page
- **THEN** the four coverage cards beside the chart are titled Total Models, Total Applications, Total
  Toolsets and Total Routes, in that order

#### Scenario: A card shows percentage, bar and caption

- **WHEN** 118 models are deployed and 112 of them are covered
- **THEN** the Total Models card shows `94.9%`
- **AND** its progress bar is filled to 94.9%
- **AND** its caption reads `118 total · 6 uncovered`

#### Scenario: The Total Routes card

- **WHEN** 14 routes exist and 11 of them are covered
- **THEN** the Total Routes card shows `78.6%`
- **AND** its caption reads `14 total · 3 uncovered`

#### Scenario: Total Evaluatees is in the key figures row

- **WHEN** the operator opens the System Health page
- **THEN** the Total Evaluatees card is the first card of the key figures row
- **AND** it is not among the cards beside the chart

### Requirement: Coverage definition

An evaluatee is either a deployment of one of three kinds, told apart by the type its listing entry reports —
a **model** (`dial-model`), an **application** (`dial-application`) or a **toolset** (`dial-toolset`) — or a
**route**. An application that also exposes the MCP interface is an application, not a toolset. The page SHALL
read the deployments with one listing request and split them into the three kinds itself, and SHALL read the
routes with one further request to the platform route listing, counting its items and not its folders. A route
is not a deployment and SHALL NOT be looked for in the deployment listing.

An evaluatee SHALL be **covered** when at least one test suite run targeting it started within the last
30 days, counting back from the current time, and the suite that produced the run still exists. A deployment
SHALL be matched by its deployment id whichever of the suite's deployment reference or MCP
deployment reference carries it, so an application that a suite reaches through an MCP tool is covered just
as one the suite calls directly. A route SHALL be matched by its name through the suite's route reference,
however the name is written: the suite stores it with the platform route prefix and the listing does not, and
the two SHALL count as the same route. A route reference SHALL cover only a route, and a deployment reference
only a deployment. The covered count of a kind SHALL count each evaluatee once, however many suites or runs
target it, and SHALL count only evaluatees that still exist. The uncovered count SHALL be the total minus the
covered count, and the percentage SHALL be covered divided by total.

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

#### Scenario: A route targeted by a suite is covered

- **WHEN** a route named `echo` is listed and a run started 5 days ago belongs to a suite whose route
  reference names `routes/platform/echo`
- **THEN** that route is counted as covered in Total Routes

#### Scenario: Many runs on one route count once

- **WHEN** one route has three runs in the last 30 days, from two different suites
- **THEN** that route adds one to the Total Routes covered count

#### Scenario: A route's runs older than 30 days do not cover

- **WHEN** a route's only run started 31 days ago
- **THEN** that route is counted as uncovered

#### Scenario: A deleted suite's runs do not cover a route

- **WHEN** a route's only run in the last 30 days belongs to a test suite that has since been deleted
- **THEN** that route is counted as uncovered

#### Scenario: A route that no longer exists is not counted

- **WHEN** a run in the last 30 days targets a route that no longer appears in the route listing
- **THEN** neither the total nor the covered count of Total Routes includes it

#### Scenario: Folders are not routes

- **WHEN** the route listing holds 9 items and 2 folders
- **THEN** the Total Routes card counts 9

#### Scenario: A route is not looked for among deployments

- **WHEN** the deployment listing holds no entry that stands for a route
- **THEN** the Total Routes card still counts the routes the route listing holds

### Requirement: Total Evaluatees aggregates the kinds

The Total Evaluatees card SHALL be computed over the union of the four kinds: its total SHALL be the sum
of the model, application, toolset and route totals, and its covered count the sum of their covered counts.
The card SHALL carry an info control whose tooltip states the coverage rule: an evaluatee is covered if at
least one test suite has run on it in the last 30 days, and an uncovered evaluatee has no quality signal.
The tooltip SHALL be reachable by keyboard focus as well as hover.

#### Scenario: Totals are summed

- **WHEN** there are 118 models, 224 applications, 45 toolsets and 12 routes, with 6, 11, 7 and 2 uncovered
- **THEN** the Total Evaluatees card shows `399 total · 26 uncovered` and `93.5%`

#### Scenario: Routes alone make up the evaluatees

- **WHEN** no model, application or toolset is deployed, and 4 routes exist with 1 uncovered
- **THEN** the Total Evaluatees card shows `4 total · 1 uncovered` and `75%`

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
role if its data failed to load. A card depends on the sources that feed its figures, and SHALL be in the
error state as soon as any of them has failed and otherwise in the loading state until all have returned. The
three sources are the deployment listing, the route listing and the coverage query. Total Models, Total
Applications and Total Toolsets depend on the deployment listing and the coverage query; Total Routes on the
route listing and the coverage query; Total Evaluatees on all three, since without each it cannot state its
total and covered count. A card SHALL NOT wait for, or be put in error by, a source it does not depend on.

#### Scenario: Loading

- **WHEN** the page has just opened and no data has returned
- **THEN** every card shows a loading indicator and no percentage

#### Scenario: Only one source has returned

- **WHEN** the deployment listing has returned and the coverage query has not
- **THEN** every card still shows a loading indicator

#### Scenario: The route listing is the last to return

- **WHEN** the deployment listing and the coverage query have returned and the route listing has not
- **THEN** Total Models, Total Applications and Total Toolsets show their figures
- **AND** Total Routes and Total Evaluatees still show a loading indicator

#### Scenario: The deployment listing fails

- **WHEN** the deployment listing fails
- **THEN** Total Models, Total Applications, Total Toolsets and Total Evaluatees show an error message
- **AND** Total Routes shows its figure once the route listing and the coverage query have returned

#### Scenario: The route listing fails

- **WHEN** the route listing fails
- **THEN** Total Routes and Total Evaluatees show an error message
- **AND** Total Models, Total Applications and Total Toolsets show their figures

#### Scenario: The coverage query fails

- **WHEN** the coverage query fails
- **THEN** all five cards show an error message

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

### Requirement: Test suites added counts evaluatees including routes

The **Test suites added this month** card SHALL show the number of test suites created in the current
period. Its caption SHALL state across how many evaluatees they are: the number of distinct models,
applications, toolsets and routes that those test suites target, each counted once. Its delta SHALL be the
count minus the number of test suites created in the previous period.

#### Scenario: Count and evaluatees

- **WHEN** 47 test suites were created in the current period and together they target 31 distinct
  deployments
- **THEN** the card shows `47`
- **AND** its caption reads `across 31 evaluatees`

#### Scenario: Singular caption

- **WHEN** the test suites created in the current period target one deployment
- **THEN** the caption reads `across 1 evaluatee`

#### Scenario: A route-targeted suite adds an evaluatee

- **WHEN** a test suite created in the current period targets a route
- **THEN** it adds one to the count and one to the number of evaluatees

#### Scenario: Suites on one route count it once

- **WHEN** three test suites created in the current period target the same route
- **THEN** they add three to the count and one to the number of evaluatees

#### Scenario: Routes and deployments are counted together

- **WHEN** test suites created in the current period target 2 models, 1 toolset and 3 routes
- **THEN** the caption reads `across 6 evaluatees`

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

### Requirement: Eval cost this month

The Eval cost card SHALL show the cost of all evaluation traffic over the current period, as US dollars with
thousands grouping, whole dollars when the amount has no cents and two decimals otherwise (`$4,218`,
`$4,218.50`). The cost is the platform-wide total of test-case execution and metric-evaluation judge calls,
over every deployment, with a request nested under an application counted once. The current and previous
periods SHALL be those of the other activity cards.

Beneath the total the card SHALL show the split as `<amount> evaluatees · <amount> judges`, the first being
the cost of running test cases against the evaluatees and the second the cost of the judge calls that score
them. An amount the backend did not report SHALL be shown as an em dash. When the period has no recorded cost
at all, the card SHALL show an em dash in place of the total and SHALL NOT show the split or a delta badge,
because no usage recorded is not the same as a measured zero.

#### Scenario: Cost recorded

- **WHEN** the current period's total is 4218, of which 2840 is test cases and 1378 judges
- **THEN** the card shows `$4,218`
- **AND** beneath it `$2,840 evaluatees · $1,378 judges`

#### Scenario: Cents

- **WHEN** the current period's total is 12.5
- **THEN** the card shows `$12.50`

#### Scenario: A phase with no usage

- **WHEN** the backend reports a total with a judge cost of 0
- **THEN** the split reads `$0 judges` for that part, not an em dash

#### Scenario: No cost recorded

- **WHEN** the backend reports no cost for the current period
- **THEN** the card shows an em dash instead of a total
- **AND** no split and no delta badge are shown

### Requirement: Eval cost delta badge

The Eval cost card SHALL show a badge with the signed difference between the current period's total and the
previous period's, in dollars formatted like the total, followed by `vs prev. period` (`+$342 vs prev.
period`). Because spending less is the better outcome, an increase SHALL be shown in the error colour and a
decrease in the success colour, the reverse of the count cards. No badge SHALL be shown when the difference
rounds to no change at the displayed precision of a cent, or when either period has no recorded cost. The
badge's periods SHALL be available to assistive technology as text naming the current and previous periods.

#### Scenario: Cost rose

- **WHEN** the current total is 4218 and the previous period's was 3876
- **THEN** an error-coloured badge reads `+$342 vs prev. period`

#### Scenario: Cost fell

- **WHEN** the current total is 3000 and the previous period's was 3214
- **THEN** a success-coloured badge reads `-$214 vs prev. period`

#### Scenario: Less than a cent of change

- **WHEN** the two totals differ by 0.003
- **THEN** no delta badge is shown

#### Scenario: Previous period has no cost

- **WHEN** the previous period has no recorded cost and the current one does
- **THEN** the current total is shown and no delta badge is shown

### Requirement: Eval cost loading and error states

The Eval cost card SHALL show a loading indicator while its figures are pending and an error message with an
alert role when either period's cost could not be loaded; it SHALL NOT show a total computed from only one of
the two periods, nor treat a failed period as a cost of zero. The card's state SHALL depend only on its own
cost request: a failure there SHALL NOT put a count card or a coverage card into the error state, and a failed
count query SHALL NOT put this card into the error state.

#### Scenario: Loading

- **WHEN** the page has just opened and the cost request has not returned
- **THEN** the Eval cost card shows a loading indicator and no total

#### Scenario: The cost request fails

- **WHEN** the cost request for the previous period fails and the one for the current period succeeds
- **THEN** the Eval cost card shows an error message
- **AND** both count cards show their counts

#### Scenario: A count query fails

- **WHEN** a count query of an activity card fails and the cost request succeeds
- **THEN** the Eval cost card shows its total

### Requirement: Figures follow the calendar while the page is open

The page SHALL reload its coverage, activity and eval cost figures when the local calendar day changes while
it stays open, deriving the 30-day coverage window and the month periods from the new day, and showing each
card's loading state until the figures return. It SHALL NOT reload while the day stays the same.

#### Scenario: The page stays open across a month boundary

- **WHEN** the page is open at 23:59 on 30 November and the clock passes midnight
- **THEN** the activity cards and the Eval cost card load again for 1 December against 1 November
- **AND** the coverage cards load again with their window counted back from the new time

#### Scenario: The day does not change

- **WHEN** the page stays open for an hour within one day
- **THEN** no figures are loaded again

### Requirement: Run trends table

The System Health page SHALL show an **Evaluation Run Trends** table below the summary cards and the health
distribution chart, at the full width of the page. Each row
SHALL stand for one test suite that has at least one recorded completed run, and SHALL show, in order, the
**Test suite**, the **Evaluatee** it targets, the **Run trends - 10 runs** bars of its recent pass rate, the
**Latest** pass rate, and the **Δ prev** change. There SHALL be no separate Type column: the evaluatee's type
is part of the Evaluatee cell. The table SHALL read its rows from the evaluation analytics endpoint
`GET /api/v1/analytics/test-suites/run-trends`, and SHALL NOT offer sorting or filtering.

#### Scenario: Columns and heading

- **WHEN** the page has loaded run trends
- **THEN** a table headed Evaluation Run Trends is shown below the summary cards and the chart
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

The Evaluation Run Trends table SHALL take the full width of the page, on a row of its own below the summary
cards and the Test suite health distribution chart, on every screen width.

#### Scenario: Standard screen

- **WHEN** the page is shown on a standard-width screen
- **THEN** the Evaluation Run Trends table takes the full width of the page
- **AND** the summary cards and the Test suite health distribution chart are above it, not beside it

#### Scenario: Small screen

- **WHEN** the page is shown on a screen narrower than the standard width
- **THEN** the Evaluation Run Trends table takes the full width
- **AND** it is shown below the chart

### Requirement: Health distribution chart

The System Health page SHALL show a **Test suite health distribution - N weeks** chart, N being the number of
weeks selected. By default it SHALL read the five most recent UTC weeks, the current week included, from the
evaluation analytics endpoint `GET /api/v1/analytics/test-suites/health-distribution` with a threshold of 0.75,
and SHALL send no filter. It SHALL draw one bar per week, oldest week first and the current week last, each bar
split into a **Healthy** band for the test suites whose weekly pass rate is at or above the threshold and a
**Fail** band for those below it. A bar SHALL be scaled to the week's own suites, so every bar with data
reaches the same height and the bands show shares rather than counts. A week the endpoint reports with no
counted suite SHALL show no bar. The Healthy band SHALL use the success colour and the Fail band the error
colour of the active theme.

#### Scenario: Five weeks, current week last

- **WHEN** the endpoint returns five weeks
- **THEN** the chart shows five bars in the order the endpoint returned them, the oldest first
- **AND** the request asked for 5 weeks at a threshold of 0.75 and no filter

#### Scenario: Bars are shares

- **WHEN** one week has 6 healthy and 2 failing suites and another has 30 healthy and 10 failing
- **THEN** both bars reach the full height of the chart
- **AND** in each the Healthy band takes 75% of the bar and the Fail band 25%

#### Scenario: A week with no suites

- **WHEN** a week is reported with 0 healthy and 0 failing suites
- **THEN** its place on the x-axis is kept and no bar is drawn for it

### Requirement: Health distribution controls

The header of the chart section SHALL carry two controls beside the title: a **Weeks** select and a **Healthy ≥**
percentage field. The Weeks select SHALL offer 5, 8 and 12 weeks and start at 5. The percentage field SHALL
accept a whole number from 0 to 100 and start at 75, and the chart SHALL send it to the endpoint as a fraction of 1
(75 as 0.75). Picking a number of weeks SHALL request the chart at once. The percentage SHALL be applied when the
user presses Enter or leaves the field, not on each keystroke; a typed value outside 0 to 100 SHALL be clamped to
it, and an empty field SHALL revert to the percentage last applied. A request SHALL NOT be made when the applied
value did not change. A **Reset** control SHALL appear only while either value differs from its default and SHALL
restore both. The controls SHALL stay usable while the chart is loading or has failed, and each SHALL have an
accessible name; the title, the legend, the explanation tooltip and the hidden table SHALL follow the applied values.
A request that a newer change has superseded SHALL NOT replace the chart.

#### Scenario: Defaults

- **WHEN** the page is first shown
- **THEN** the Weeks select shows 5 and the percentage field 75
- **AND** no Reset control is shown

#### Scenario: Changing the weeks

- **WHEN** the user picks 12 weeks
- **THEN** the chart is requested at once for 12 weeks at the applied threshold
- **AND** the title reads `Test suite health distribution - 12 weeks`
- **AND** a Reset control appears

#### Scenario: Changing the threshold

- **WHEN** the user types 90 in the percentage field and presses Enter, or leaves the field
- **THEN** the chart is requested with a threshold of 0.9
- **AND** the legend reads `Healthy ≥ 0.9` and `Fail < 0.9`

#### Scenario: Typing does not request

- **WHEN** the user is typing in the percentage field and has not pressed Enter or left it
- **THEN** no request is made

#### Scenario: Unusable value

- **WHEN** the user empties the percentage field and leaves it
- **THEN** the field shows the percentage last applied and no request is made

#### Scenario: Reset

- **WHEN** the user activates Reset
- **THEN** the controls return to 5 weeks and 75%, and the chart is requested with those values

### Requirement: Health distribution week labels and legend

Each bar SHALL be labelled on the x-axis with its week's start date, a Monday in UTC, as a short month and
day such as `Nov 3`. A legend SHALL name the two bands with the threshold the endpoint reports, as
`Healthy ≥ <threshold>` and `Fail < <threshold>`, each beside a swatch of its band's colour. The legend
SHALL be plain text, not a control.

#### Scenario: Week label

- **WHEN** a week starts at Monday 3 November 00:00 UTC
- **THEN** its bar is labelled `Nov 3`, whatever the viewer's time zone

#### Scenario: Legend states the threshold

- **WHEN** the endpoint reports a threshold of 0.75
- **THEN** the legend reads `Healthy ≥ 0.75` and `Fail < 0.75`, each beside a swatch in its band's colour

### Requirement: Health distribution tooltip

No percentage or count SHALL be drawn on a bar. Hovering a bar SHALL show a tooltip naming the week and, for
Healthy and for Fail, the number of test suites and its share of the week's suites as a percentage with one
decimal place, such as `Healthy 21 suites · 65.8%`. The shares of one week SHALL add up to 100%. A week with
no counted suite SHALL offer no tooltip.

#### Scenario: Tooltip on a bar

- **WHEN** a week has 21 healthy and 11 failing suites and the user hovers its bar
- **THEN** a tooltip names the week
- **AND** shows `Healthy` with 21 suites and 65.6%, and `Fail` with 11 suites and 34.4%

#### Scenario: Nothing on the bars

- **WHEN** the chart is shown
- **THEN** no percentage or count is drawn inside or above any bar

### Requirement: Health distribution explanation

An info control SHALL sit beside the chart's title. Hovering it, and moving keyboard focus to it, SHALL show a
tooltip that explains the chart: that each bar shows the share of the test suites that ran in that week which
were healthy and which failed; that a test suite is healthy when its pass rate across all its runs that week
is at or above the threshold the legend states, and fails when it is below; that a suite counts only in the
weeks it ran; and that one evaluatee can have several test suites, so the chart is more granular than
evaluatee-level health. The tooltip SHALL name only the two bands the chart draws. The control SHALL have an
accessible name.

#### Scenario: Tooltip on hover

- **WHEN** the user hovers the info control beside the chart title
- **THEN** a tooltip explains what a bar shows and when a test suite is healthy, naming the threshold

#### Scenario: Tooltip on keyboard focus

- **WHEN** the user moves keyboard focus to the info control
- **THEN** the same tooltip is shown

#### Scenario: Only two bands

- **WHEN** the tooltip is shown
- **THEN** it describes Healthy and Fail only, and names no third band

### Requirement: Health distribution is available to assistive technology

The drawn bars SHALL be hidden from assistive technology, and the chart SHALL be accompanied by a visually
hidden table with a row per week, giving the week's start date, its healthy and failing suite counts and
their shares. The table SHALL carry the section's title as its accessible name.

#### Scenario: Hidden table

- **WHEN** the chart has loaded five weeks
- **THEN** a table named after the section has five rows
- **AND** each row states the week, the healthy count, the failing count and the shares

### Requirement: Health distribution loading, empty and error states

The chart SHALL have its own states, independent of the cards and the run-trends table. While the request is
in flight it SHALL show a loading indicator. When every returned week has no counted suite it SHALL show an
empty state saying a week fills in once test suite runs are recorded. When the request fails it SHALL show an
error message announced as an alert, with a retry control that requests the chart again.

#### Scenario: Loading

- **WHEN** the health distribution request is in flight
- **THEN** the chart area shows a loading indicator

#### Scenario: No recorded runs

- **WHEN** the endpoint returns five weeks that all have 0 healthy and 0 failing suites
- **THEN** the chart area shows an empty state saying a week fills in once test suite runs are recorded
- **AND** no bars or legend are shown

#### Scenario: The request fails

- **WHEN** the health distribution request fails
- **THEN** the chart area shows an error message announced as an alert
- **AND** the cards and the run-trends table are unaffected

#### Scenario: Retry

- **WHEN** the user activates retry after a failure
- **THEN** the chart is requested again
- **AND** it shows the loading indicator until the response returns

### Requirement: Key figures row

The first row of the page SHALL hold four cards, in this order: **Total Evaluatees**, **Test suites run this
month**, **Test suites added this month** and **Eval cost this month**. Each activity card SHALL show its
figure, a line beneath it, and a delta badge against the previous period. On a standard screen the four cards
SHALL share one line. As the screen narrows they SHALL be laid out three to a line, then two, then one.

#### Scenario: Four cards in order

- **WHEN** the operator opens the System Health page
- **THEN** the first row holds four cards, titled Total Evaluatees, Test suites run this month, Test suites
  added this month and Eval cost this month, in that order

#### Scenario: One line on a standard screen

- **WHEN** the page is shown on a standard-width screen
- **THEN** the four cards of the first row share one line

#### Scenario: Fewer to a line as the screen narrows

- **WHEN** the screen is narrower than the standard width but still wide
- **THEN** the first row shows three cards to a line, and the fourth alone on the next
- **AND** on a narrower screen two cards to a line, and on a phone-width screen one

### Requirement: Coverage cards beside the health distribution chart

Below the key figures row the page SHALL render a block of four coverage cards — **Total Models**, **Total
Applications**, **Total Toolsets** and **Total Routes** — beside the Test suite health distribution chart. On a
standard screen the block SHALL take the left half of the row, two cards wide and two lines tall, read left to
right and top to bottom, and the chart the right half; the two lines SHALL stretch so that the block is as tall
as the chart. On a narrower screen the chart SHALL take the full width, below the block, and the block's cards
SHALL be laid out three to a line, then two, then one, as the screen narrows.

#### Scenario: Two cards to a line

- **WHEN** the page is shown on a standard-width screen
- **THEN** Total Models and Total Applications share the first line of the block
- **AND** Total Toolsets and Total Routes share the second

#### Scenario: Block and chart share a row

- **WHEN** the page is shown on a standard-width screen
- **THEN** the block takes the left half of its row
- **AND** the Test suite health distribution chart takes the right half
- **AND** the block is as tall as the chart

#### Scenario: Narrower screen

- **WHEN** the page is shown on a screen narrower than the standard width
- **THEN** the Test suite health distribution chart takes the full width, below the block
- **AND** the block's cards are three to a line, then two, then one as the screen narrows
