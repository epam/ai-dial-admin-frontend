# eval-system-health Specification

## Purpose

The Evaluation System Health page gives an admin a platform-wide view of how much of what is deployed
— models, applications and toolsets — has been evaluated, and how much evaluation activity there has been
this month. It holds the coverage cards and the first two activity cards.

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
